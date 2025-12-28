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
            class="face-box" 
            :style="det.boxStyle"
          >
            <div class="name-tag-container">
              <span class="name-tag">
                {{ det.resident_name }} ({{ (det.confidence * 100).toFixed(0) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <el-empty v-if="processedPhotos.length === 0" description="目前該活動尚未有辨識資料"></el-empty>
    </div>

    <div class="footer-action" v-if="processedPhotos.length > 0">
      <p class="hint-text">＊以上為 AI 系統自動辨識之初步結果，請管理員核對後正式同步至長者個人檔案。</p>
      <el-button type="success" size="large" @click="handleConfirm" icon="el-icon-circle-check" :loading="submitting">
        確認辨識結果並正式存檔
      </el-button>
    </div>
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
      processedPhotos: []
    };
  },
  methods: {
    async fetchAIResults() {
      this.loading = true;
      this.isDemoMode = false;
      const token = localStorage.getItem('userToken');
      
      try {
        // 對接後端 AI 辨識 API
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
      // 模擬後端回傳格式
      this.rawResults = [
        {
          "resident_id": "26",
          "resident_name": "孫秋香",
          "confidence": 0.71,
          "photos": [{
            "photo_id": 54,
            "photo_url": `${baseUrl}slideshow/activity2.png`, 
            "bounding_box": [511, 116, 666, 270] 
          }]
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
            resident_id: person.resident_id, // 為了後續儲存需要 ID
            resident_name: person.resident_name,
            confidence: person.confidence,
            rawBox: pic.bounding_box, // [top, left, bottom, right]
            boxStyle: {}
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

        // 計算圖片縮放比例，確保座標精準
        const sx = img.clientWidth / img.naturalWidth;
        const sy = img.clientHeight / img.naturalHeight;

        photo.detections.forEach(d => {
          // 對接後端 [top, left, bottom, right] 格式
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

    async handleConfirm() {
      try {
        await this.$confirm('確認辨識結果正確並同步存檔嗎？', '人工審核', {
          confirmButtonText: '確定存檔',
          type: 'success'
        });

        this.submitting = true;

        // 封裝成同學要求的回傳格式
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
        // 呼叫新的 confirm API
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
    }
  },
  mounted() {
    this.fetchAIResults();
    window.addEventListener('resize', this.refreshBoxes);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.refreshBoxes);
  },
  methods: {
    // ... 其他 methods 保持不變 ...
    refreshBoxes() {
      this.processedPhotos.forEach(p => this.drawBoxes(p.photo_id));
    }
  }
};
</script>

<style scoped>
/* 樣式保持專業感 */
.ai-view { padding: 20px; background-color: #fcfaf8; min-height: 100vh; }
.header { display: flex; align-items: center; margin-bottom: 25px; }
.results-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 30px; }
.photo-card { background: white; padding: 15px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: relative; }
.img-wrapper { position: relative; width: 100%; border-radius: 10px; overflow: hidden; line-height: 0; }
.main-img { width: 100%; height: auto; display: block; }
.face-box { position: absolute; border: 2px solid #FF9933; pointer-events: none; background: rgba(255, 153, 51, 0.15); box-sizing: border-box; z-index: 5; transition: all 0.2s; }
.name-tag { background: #FF9933; color: white; padding: 2px 8px; font-size: 12px; font-weight: bold; border-radius: 4px 4px 0 0; position: absolute; top: -22px; left: -2px; white-space: nowrap; }
.footer-action { margin-top: 50px; text-align: center; padding: 40px 0; border-top: 2px dashed #e9e0d6; }
</style>