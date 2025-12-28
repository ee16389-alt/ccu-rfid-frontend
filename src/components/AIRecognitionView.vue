<template>
  <div class="ai-view">
    <div class="header">
      <el-button icon="el-icon-back" circle @click="$emit('go-back')"></el-button>
      <h2 style="margin-left: 15px;">
        AI 辨識結果預覽 
        <el-tag v-if="isDemoMode" type="warning" size="mini" style="margin-left: 10px;">示範模式</el-tag>
      </h2>
    </div>

    <el-card v-if="loading" v-loading="true" style="height: 400px; display: flex; align-items: center; justify-content: center;">
      <div style="text-align: center; color: #909399;">
        <i class="el-icon-cpu" style="font-size: 48px; margin-bottom: 15px;"></i>
        <p>系統正在分析影像特徵並進行人臉比對...</p>
      </div>
    </el-card>

    <div v-else class="results-container">
      <div v-for="photo in processedPhotos" :key="photo.photo_id" class="photo-card">
        <div class="img-wrapper">
          <img 
            :src="photo.photo_url" 
            :ref="'img-' + photo.photo_id"
            @load="drawBoxes(photo.photo_id)"
            class="main-img"
          />
          
          <div 
            v-for="(det, idx) in photo.detections" 
            :key="idx" 
            class="face-box clickable" 
            :style="det.boxStyle"
            @click="openCorrectionDialog(det)"
          >
            <div class="name-tag-container">
              <span class="name-tag" :class="{ 'is-edited': det.isEdited }">
                {{ det.resident_name }} {{ det.isEdited ? '(已修正)' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-if="processedPhotos.length === 0" description="目前該活動尚未有辨識資料"></el-empty>
    </div>

    <div class="footer-action" v-if="processedPhotos.length > 0">
      <p class="hint-text">＊提示：若辨識有誤，可直接點擊照片上的橘框進行手動修正。</p>
      <el-button type="success" size="large" @click="handleConfirm" icon="el-icon-circle-check" :loading="submitting">
        確認辨識結果並正式存檔
      </el-button>
    </div>

    <el-dialog title="手動身分校正" :visible.sync="dialogVisible" width="30%" append-to-body>
      <div style="margin-bottom: 20px; text-align: center;">
        <p>當前選定辨識對象：<strong>{{ currentDet.resident_name }}</strong></p>
      </div>
      <el-select v-model="selectedResidentId" placeholder="請選擇正確的長者姓名" filterable style="width: 100%;">
        <el-option
          v-for="item in allResidents"
          :key="item.id"
          :label="item.name"
          :value="item.id">
        </el-option>
      </el-select>
      <span slot="footer" class="dialog-footer">
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
      // 彈窗相關
      dialogVisible: false,
      allResidents: [],
      currentDet: {},
      selectedResidentId: ''
    };
  },
  methods: {
    async fetchAIResults() {
      this.loading = true;
      this.isDemoMode = false;
      const token = localStorage.getItem('userToken');
      try {
        const response = await this.$http.post(`/manager-api/Activity/${this.activityId}/recognize`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data && response.data.length > 0) {
          this.rawResults = response.data;
        } else {
          this.loadMockData(); 
        }
      } catch (err) {
        this.loadMockData(); 
      } finally {
        this.processData();
        this.loading = false;
      }
    },

    loadMockData() {
      this.isDemoMode = true;
      const baseUrl = process.env.BASE_URL;
      this.rawResults = [{
        "resident_id": "26",
        "resident_name": "孫秋香",
        "confidence": 0.71,
        "photos": [{
          "photo_id": 54,
          "photo_url": `${baseUrl}slideshow/activity2.png`, 
          "bounding_box": [511, 116, 666, 270] 
        }]
      }];
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
            isEdited: false // 初始狀態未編輯
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

    // --- 彈窗校正邏輯 ---
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
        const token = localStorage.getItem('userToken');
        const res = await this.$http.get('/manager-api/Resident', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
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

    // --- 最終整批儲存 ---
    async handleConfirm() {
      try {
        await this.$confirm('確認目前所有辨識結果正確並正式同步至資料庫嗎？', '人工審核確認', {
          confirmButtonText: '確定存檔',
          type: 'success'
        });

        this.submitting = true;
        const payload = [];
        this.processedPhotos.forEach(photo => {
          photo.detections.forEach(det => {
            payload.push({
              photo_id: photo.photo_id,
              resident_id: det.resident_id
            });
          });
        });

        const token = localStorage.getItem('userToken');
        await this.$http.post(`/manager-api/Activity/${this.activityId}/recognize/confirm`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        this.$message.success('辨識結果已正式入庫！');
        this.$emit('go-back');
      } catch (error) {
        if (error !== 'cancel') this.$message.error('儲存失敗');
      } finally {
        this.submitting = false;
      }
    },

    refreshBoxes() {
      this.processedPhotos.forEach(p => this.drawBoxes(p.photo_id));
    }
  },
  mounted() {
    this.fetchAIResults();
    window.addEventListener('resize', this.refreshBoxes);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.refreshBoxes);
  }
};
</script>

<style scoped>
.ai-view { padding: 20px; background-color: #fcfaf8; min-height: 100vh; }
.header { display: flex; align-items: center; margin-bottom: 25px; }
.results-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 30px; }
.photo-card { background: white; padding: 15px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: relative; }
.img-wrapper { position: relative; width: 100%; border-radius: 10px; overflow: hidden; line-height: 0; }
.main-img { width: 100%; height: auto; display: block; }

/* 橘框點擊樣式 */
.face-box { 
  position: absolute; 
  border: 2px solid #FF9933; 
  background: rgba(255, 153, 51, 0.15); 
  box-sizing: border-box; 
  z-index: 5; 
  transition: all 0.2s; 
}
.face-box.clickable {
  cursor: pointer;
}
.face-box.clickable:hover {
  background: rgba(255, 153, 51, 0.3);
  border-width: 3px;
}

.name-tag { 
  background: #FF9933; 
  color: white; 
  padding: 2px 8px; 
  font-size: 11px; 
  font-weight: bold; 
  border-radius: 4px 4px 0 0; 
  position: absolute; 
  top: -21px; 
  left: -2px; 
  white-space: nowrap; 
}
.name-tag.is-edited {
  background: #67C23A; /* 修正後變綠色 */
}

.footer-action { margin-top: 50px; text-align: center; padding: 40px 0; border-top: 2px dashed #e9e0d6; }
.hint-text { color: #909399; font-size: 13px; margin-bottom: 15px; }
</style>