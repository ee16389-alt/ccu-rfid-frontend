<template>
  <div class="ai-recognition-container">
    <div class="header-section">
      <el-page-header @back="$emit('go-back')" content="AI 辨識結果預覽"></el-page-header>
      <el-tag v-if="isDemoMode" type="warning" effect="dark" class="demo-badge">示範模式 (使用 Mock 資料)</el-tag>
    </div>

    <el-card v-loading="loading" class="main-card">
      <div v-if="processedPhotos.length > 0" class="photo-grid">
        <div v-for="photo in processedPhotos" :key="photo.photo_id" class="photo-item">
          <div class="image-wrapper" ref="imageContainer">
            <img 
              :ref="'img-' + photo.photo_id"
              :src="photo.photo_url"
              @load="drawBoxes(photo.photo_id)" 
              class="recognition-image"
            >
            
            <div 
              v-for="(det, index) in photo.detections" 
              :key="index"
              class="face-box"
              :style="det.boxStyle"
              @click="openCorrectionDialog(det)"
            >
              <span class="name-label" :class="{ 'is-edited': det.isEdited }">
                {{ det.resident_name }} ({{ formatConfidence(det.confidence) }})
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="!loading" class="empty-state">
        <el-empty :description="emptyText"></el-empty>
      </div>

      <div class="action-bar">
        <el-button type="success" size="large" icon="el-icon-check" :loading="submitting" @click="handleConfirm">
          確認所有辨識結果並正式存檔
        </el-button>
      </div>
    </el-card>

    <el-dialog title="修正辨識結果" :visible.sync="dialogVisible" width="35%">
      <el-form label-width="100px">
        <el-form-item label="正確長者">
          <el-select v-model="selectedResidentId" filterable placeholder="請選擇長者" clearable>
            <el-option label="❌ 非住民 (不屬於任何人/背景)" value="none"></el-option>
            <el-divider v-if="allResidents.length > 0"></el-divider>
            <el-option v-for="r in allResidents" :key="r.id" :label="r.name" :value="r.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTempCorrection">暫存修改</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AIRecognitionView',
  props: ['activityId'],
  data() {
    return {
      loading: false,
      submitting: false,
      isDemoMode: false,
      rawResults: [],
      processedPhotos: [],
      dialogVisible: false,
      allResidents: [],
      currentDet: {},
      selectedResidentId: '',
      emptyText: '目前該活動尚未有辨識資料'
    };
  },
  mounted() {
    this.fetchAIResults();
    window.addEventListener('resize', this.refreshBoxes);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.refreshBoxes);
  },
  methods: {
    // 修正百分比顯示邏輯：判斷數值是否已是百分制
    formatConfidence(val) {
      if (!val && val !== 0) return '0%';
      // 如果大於 1，視為已經是百分比；否則乘以 100
      const percent = val > 1 ? val : val * 100;
      return Math.round(percent) + '%';
    },

    async fetchAIResults() {
      if (!this.activityId || this.activityId === 'null') {
        this.emptyText = '活動 ID 缺失，無法辨識';
        this.loadMockResults();
        return;
      }
      this.loading = true;
      try {
        const response = await this.$http.post(`/Activity/${this.activityId}/recognize`, {}, { timeout: 120000 });
        if (response.data && response.data.length > 0) {
          this.rawResults = response.data;
        } else {
          this.loadMockResults();
        }
      } catch (err) {
        console.warn('API 獲取失敗', err);
        this.loadMockResults();
      } finally {
        this.processData();
        this.loading = false;
      }
    },

    loadMockResults() {
      this.isDemoMode = true;
      const mockImg = "https://ee16389-alt.github.io/ccu-rfid-frontend/slideshow/activity2.png";
      this.rawResults = [{
        "id": "3", "name": "江小信 (範例)", "confidence": 0.95,
        "photos": [{ "photo_id": 999, "photo_url": mockImg, "bounding_box": [696, 139, 882, 325] }]
      }];
    },

    processData() {
      const map = {};
      this.rawResults.forEach(person => {
        // 對接後端新欄位
        const resId = person.id; 
        const resName = person.name;

        person.photos.forEach(pic => {
          if (!map[pic.photo_id]) {
            map[pic.photo_id] = { photo_id: pic.photo_id, photo_url: pic.photo_url, detections: [] };
          }
          map[pic.photo_id].detections.push({
            resident_id: resId,
            resident_name: resName,
            confidence: person.confidence || 0,
            rawBox: pic.bounding_box, // [top, left, bottom, right]
            boxStyle: {},
            isEdited: false
          });
        });
      });
      const sorted = Object.values(map).sort((a, b) => b.photo_id - a.photo_id);
      this.processedPhotos = sorted.length > 0 ? [sorted[0]] : [];
    },

    drawBoxes(photoId) {
      this.$nextTick(() => {
        const img = this.$refs['img-' + photoId][0] || this.$refs['img-' + photoId];
        const photo = this.processedPhotos.find(p => p.photo_id === photoId);
        if (!img || !photo || img.naturalWidth === 0) return;

        // 精準縮放比例計算
        const { naturalWidth: nw, naturalHeight: nh, clientWidth: cw, clientHeight: ch } = img;
        const rawRatio = nw / nh;
        const displayRatio = cw / ch;

        let scale, ox = 0, oy = 0;

        // 針對 object-fit: contain (圖片完整顯示在黑色背景內) 的偏移量補償
        if (displayRatio > rawRatio) {
          // 左右有留白
          scale = ch / nh;
          ox = (cw - nw * scale) / 2;
        } else {
          // 上下有留白
          scale = cw / nw;
          oy = (ch - nh * scale) / 2;
        }

        photo.detections.forEach(d => {
          // 嚴格對照後端格式 [Top, Left, Bottom, Right]
          const [top, left, bottom, right] = d.rawBox;
          d.boxStyle = {
            top: (top * scale + oy) + 'px',
            left: (left * scale + ox) + 'px',
            width: ((right - left) * scale) + 'px',
            height: ((bottom - top) * scale) + 'px'
          };
        });
        this.$forceUpdate();
      });
    },

    refreshBoxes() {
      this.processedPhotos.forEach(p => this.drawBoxes(p.photo_id));
    },

    async openCorrectionDialog(det) {
      this.currentDet = det;
      this.selectedResidentId = det.resident_id || 'none';
      if (this.allResidents.length === 0) await this.fetchAllResidents();
      this.dialogVisible = true;
    },

    async fetchAllResidents() {
      try {
        const res = await this.$http.get('/Resident');
        this.allResidents = res.data;
      } catch (err) {
        this.$message.error('無法讀取長者清單');
      }
    },

    saveTempCorrection() {
      if (this.selectedResidentId === 'none' || !this.selectedResidentId) {
        this.currentDet.resident_id = null;
        this.currentDet.resident_name = "非住民 (誤報)";
        this.currentDet.isEdited = true;
        this.$message({ message: '已標記為非住民', type: 'warning' });
      } else {
        const selected = this.allResidents.find(r => r.id === this.selectedResidentId);
        if (selected) {
          this.currentDet.resident_id = selected.id;
          this.currentDet.resident_name = selected.name;
          this.currentDet.isEdited = true;
          this.$message({ message: '修改已暫存', type: 'info' });
        }
      }
      this.dialogVisible = false;
    },

    async handleConfirm() {
      try {
        await this.$confirm('確認所有辨識結果正確嗎？', '存檔確認', { type: 'success' });
        this.submitting = true;
        const payload = [];
        this.processedPhotos.forEach(photo => {
          photo.detections.forEach(det => {
            if (det.resident_id) {
              payload.push({ photo_id: photo.photo_id, resident_id: det.resident_id });
            }
          });
        });
        await this.$http.post(`/Activity/${this.activityId}/recognize/confirm`, payload);
        this.$message.success('辨識紀錄已成功存檔！');
        this.$emit('go-back');
      } catch (error) {
        if (error !== 'cancel') this.$message.error('儲存失敗');
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
/* 樣式部分保持不變 */
.photo-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 20px; }
.image-wrapper { 
  position: relative; 
  display: block; 
  width: 100%; 
  max-width: 800px; 
  margin: 0 auto; 
  border-radius: 8px; 
  overflow: hidden; 
  background: #000;
}
.recognition-image { 
  width: 100%; 
  display: block; 
  object-fit: contain; /* 為了座標精準計算，建議統一使用 contain */
  aspect-ratio: 16 / 9; 
}
.face-box { 
  position: absolute; 
  border: 3px solid #67C23A; 
  background-color: rgba(103, 194, 58, 0.1); 
  cursor: pointer; 
  z-index: 10; 
  box-sizing: border-box;
}
.face-box:hover { border-color: #E6A23C; background-color: rgba(230, 162, 60, 0.2); }
.name-label { 
  position: absolute; 
  top: -30px; 
  left: -3px; 
  background: #67C23A; 
  color: white; 
  padding: 2px 8px; 
  font-size: 12px; 
  border-radius: 4px; 
  white-space: nowrap;
}
.name-label.is-edited { background: #409EFF; }
.action-bar { margin-top: 30px; text-align: center; }
</style>