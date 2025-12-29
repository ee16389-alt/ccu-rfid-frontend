<template>
  <div class="ai-recognition-container">
    <div class="header-section">
      <el-page-header @back="$emit('go-back')" content="AI 辨識結果預覽"></el-page-header>
      <el-tag v-if="isDemoMode" type="warning" effect="dark" class="demo-badge">示範模式 (API 逾時)</el-tag>
    </div>

    <el-card v-loading="loading" class="main-card">
      <div v-if="processedPhotos.length > 0" class="photo-grid">
        <div v-for="photo in processedPhotos" :key="photo.photo_id" class="photo-item">
          <div class="image-wrapper">
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
                {{ det.resident_name }} ({{ (det.confidence * 100).toFixed(0) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="!loading" class="empty-state">
        <el-empty description="目前該活動尚未有辨識資料"></el-empty>
      </div>

      <div class="action-bar">
        <el-button type="success" size="large" icon="el-icon-check" :loading="submitting" @click="handleConfirm">
          確認並正式存檔
        </el-button>
      </div>
    </el-card>

    <el-dialog title="修正辨識結果" :visible.sync="dialogVisible" width="30%">
      <el-form label-width="80px">
        <el-form-item label="正確長者">
          <el-select v-model="selectedResidentId" filterable placeholder="請選擇長者">
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
      selectedResidentId: ''
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.fetchAIResults();
    });
    window.addEventListener('resize', this.refreshBoxes);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.refreshBoxes);
  },
  methods: {
    async fetchAIResults() {
      this.loading = true;
      this.isDemoMode = false;
      try {
        // 修正點：配合 main.js baseURL，使用簡潔路徑
        // 發送 POST 至 .../manager-api/Activity/{id}/recognize
        const response = await this.$http.post(`/Activity/${this.activityId}/recognize`, {}, {
          timeout: 45000 // 辨識通常較慢，此處額外設定 45 秒
        });
        
        if (response.data && response.data.length > 0) {
          this.rawResults = response.data;
        } else {
          this.loadMockData(); 
        }
      } catch (err) {
        console.warn('AI API 抓取失敗，啟動示範模式', err);
        this.loadMockData(); 
      } finally {
        this.processData();
        this.loading = false;
      }
    },

    loadMockData() {
      this.isDemoMode = true;
      const stableImageUrl = "https://ee16389-alt.github.io/ccu-rfid-frontend/slideshow/activity2.png";
      
      this.rawResults = [
        {
          "resident_id": "3",
          "resident_name": "唐伯虎",
          "confidence": 0.92,
          "photos": [
            { "photo_id": 999, "photo_url": stableImageUrl, "bounding_box": [150, 200, 450, 500] }
          ]
        },
        {
          "resident_id": "5",
          "resident_name": "秋香",
          "confidence": 0.88,
          "photos": [
            { "photo_id": 888, "photo_url": "https://picsum.photos/id/1025/800/600", "bounding_box": [100, 300, 400, 600] }
          ]
        }
      ];
    },

    processData() {
      const map = {};
      this.rawResults.forEach(person => {
        person.photos.forEach(pic => {
          if (!map[pic.photo_id]) {
            map[pic.photo_id] = { photo_id: pic.photo_id, photo_url: pic.photo_url, detections: [] };
          }
          map[pic.photo_id].detections.push({
            resident_id: person.resident_id,
            resident_name: person.resident_name,
            confidence: person.confidence,
            rawBox: pic.bounding_box,
            boxStyle: {},
            isEdited: false 
          });
        });
      });
      this.processedPhotos = Object.values(map);
    },

    drawBoxes(id) {
      this.$nextTick(() => {
        const imgRef = this.$refs['img-' + id];
        const img = Array.isArray(imgRef) ? imgRef[0] : imgRef;
        const photo = this.processedPhotos.find(p => p.photo_id === id);
        
        if (!img || !photo || img.naturalWidth === 0) return;

        // 計算圖片縮放比例，確保紅框位置精確
        const sx = img.clientWidth / img.naturalWidth;
        const sy = img.clientHeight / img.naturalHeight;

        photo.detections.forEach(d => {
          const [t, l, b, r] = d.rawBox;
          d.boxStyle = {
            top: (t * sy) + 'px',
            left: (l * sx) + 'px',
            width: ((r - l) * sx) + 'px',
            height: ((b - t) * sy) + 'px'
          };
        });
        this.$forceUpdate();
      });
    },

    refreshBoxes() {
      setTimeout(() => {
        this.processedPhotos.forEach(p => this.drawBoxes(p.photo_id));
      }, 200);
    },

    async openCorrectionDialog(det) {
      this.currentDet = det;
      this.selectedResidentId = det.resident_id;
      this.dialogVisible = true;
      if (this.allResidents.length === 0) {
        await this.fetchAllResidents();
      }
    },

    async fetchAllResidents() {
      try {
        // 修正點：使用相對路徑，讓攔截器自動處理 Token
        const res = await this.$http.get('/Resident');
        this.allResidents = res.data;
      } catch (err) {
        this.$message.error('無法獲取長者清單');
      }
    },

    saveTempCorrection() {
      const selected = this.allResidents.find(r => r.id === this.selectedResidentId);
      if (selected) {
        this.currentDet.resident_id = selected.id;
        this.currentDet.resident_name = selected.name;
        this.currentDet.isEdited = true;
        this.$message({ message: '修改已暫存', type: 'info', duration: 1500 });
      }
      this.dialogVisible = false;
    },

    async handleConfirm() {
      try {
        await this.$confirm('確認所有辨識結果正確嗎？', '存檔確認', { type: 'success' });
        this.submitting = true;
        
        // 封裝同步至後端的資料
        const payload = [];
        this.processedPhotos.forEach(photo => {
          photo.detections.forEach(det => {
            payload.push({ photo_id: photo.photo_id, resident_id: det.resident_id });
          });
        });

        // 發送確認至 .../manager-api/Activity/{id}/recognize/confirm
        await this.$http.post(`/Activity/${this.activityId}/recognize/confirm`, payload);
        
        this.$message.success('辨識結果已同步！');
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
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; margin-top: 20px; }
.image-wrapper { position: relative; display: inline-block; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.recognition-image { width: 100%; display: block; }
.face-box { position: absolute; border: 3px solid #FF9933; background-color: rgba(255, 153, 51, 0.1); cursor: pointer; transition: all 0.3s; }
.face-box:hover { border-color: #f56c6c; background-color: rgba(245, 108, 108, 0.2); }
.name-label { position: absolute; top: -28px; left: -3px; background: #FF9933; color: white; padding: 2px 8px; font-size: 12px; white-space: nowrap; border-radius: 4px 4px 0 0; }
.name-label.is-edited { background: #409EFF; }
.action-bar { margin-top: 30px; text-align: center; }
.demo-badge { margin-left: 20px; }
</style>