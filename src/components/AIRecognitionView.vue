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
                {{ det.resident_name }} ({{ det.confidence.toFixed(0) }}%)
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
      const azureBase = 'https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net';
      
      try {
        const response = await this.$http.post(`/Activity/${this.activityId}/recognize`, {}, {
          timeout: 120000 
        });
        
        if (response.data && response.data.length > 0) {
          this.rawResults = response.data.map(person => {
            person.photos = person.photos.map(pic => {
              if (pic.photo_url && !pic.photo_url.startsWith('http')) {
                const cleanPath = pic.photo_url.replace(/^\/+/, '');
                pic.photo_url = `${azureBase}/${cleanPath}?t=${new Date().getTime()}`;
              }
              return pic;
            });
            return person;
          });
        } else {
          this.loadMockResults(); 
        }
      } catch (err) {
        console.warn('AI API 獲取失敗，啟動示範模式', err);
        this.loadMockResults(); 
      } finally {
        this.processData();
        this.loading = false;
      }
    },

    loadMockResults() {
      this.isDemoMode = true;
      const stableImageUrl = "https://ee16389-alt.github.io/ccu-rfid-frontend/slideshow/activity2.png";
      this.rawResults = [
        {
          "id": "3",
          "name": "江小信 (範例)",
          "confidence": 95,
          "photos": [
            { "photo_id": 999, "photo_url": stableImageUrl, "bounding_box": [150, 300, 450, 600] }
          ]
        }
      ];
    },

    processData() {
      const map = {};
      this.rawResults.forEach(person => {
        // 修正點 1：對應後端 JSON 欄位名稱
        const resId = person.id;   
        const resName = person.name; 

        person.photos.forEach(pic => {
          if (!map[pic.photo_id]) {
            map[pic.photo_id] = { photo_id: pic.photo_id, photo_url: pic.photo_url, detections: [] };
          }
          map[pic.photo_id].detections.push({
            resident_id: resId,
            resident_name: resName,
            confidence: person.confidence,
            rawBox: pic.bounding_box,
            boxStyle: {},
            isEdited: false 
          });
        });
      });
      
      // 修正點 2：只顯示最新上傳的一張照片
      const sortedPhotos = Object.values(map).sort((a, b) => b.photo_id - a.photo_id);
      this.processedPhotos = sortedPhotos.length > 0 ? [sortedPhotos[0]] : [];
    },

    drawBoxes(id) {
      this.$nextTick(() => {
        const imgRef = this.$refs['img-' + id];
        const img = Array.isArray(imgRef) ? imgRef[0] : imgRef;
        const photo = this.processedPhotos.find(p => p.photo_id === id);
        
        if (!img || !photo || img.naturalWidth === 0) return;

        const sx = img.clientWidth / img.naturalWidth;
        const sy = img.clientHeight / img.naturalHeight;
        const computedStyle = window.getComputedStyle(img);
        const objectFit = computedStyle.getPropertyValue('object-fit');

        photo.detections.forEach(d => {
          const [t, l, b, r] = d.rawBox;
          let topOffset = 0;
          let leftOffset = 0;

          if (objectFit === 'cover') {
            const renderRatio = img.clientWidth / img.clientHeight;
            const naturalRatio = img.naturalWidth / img.naturalHeight;
            if (renderRatio > naturalRatio) {
              const scaledHeight = img.naturalHeight * sx;
              topOffset = (img.clientHeight - scaledHeight) / 2;
            } else {
              const scaledWidth = img.naturalWidth * sy;
              leftOffset = (img.clientWidth - scaledWidth) / 2;
            }
          }

          d.boxStyle = {
            top: (t * (objectFit === 'cover' && leftOffset !== 0 ? sy : sy) + topOffset) + 'px',
            left: (l * (objectFit === 'cover' && topOffset !== 0 ? sx : sx) + leftOffset) + 'px',
            width: ((r - l) * (leftOffset !== 0 ? sy : sx)) + 'px',
            height: ((b - t) * (topOffset !== 0 ? sx : sy)) + 'px'
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
        
        const payload = [];
        this.processedPhotos.forEach(photo => {
          photo.detections.forEach(det => {
            // 提交時同樣使用 resident_id 以符合 API 期待
            payload.push({ photo_id: photo.photo_id, resident_id: det.resident_id });
          });
        });

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
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; margin-top: 20px; }
.image-wrapper { position: relative; display: inline-block; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.recognition-image { width: 100%; display: block; object-fit: cover; aspect-ratio: 4 / 3; }
.face-box { position: absolute; border: 3px solid #FF9933; background-color: rgba(255, 153, 51, 0.1); cursor: pointer; transition: all 0.3s; z-index: 10; }
.face-box:hover { border-color: #f56c6c; background-color: rgba(245, 108, 108, 0.2); }
.name-label { position: absolute; top: -28px; left: -3px; background: #FF9933; color: white; padding: 2px 8px; font-size: 12px; white-space: nowrap; border-radius: 4px 4px 0 0; }
.name-label.is-edited { background: #409EFF; }
.action-bar { margin-top: 30px; text-align: center; }
.demo-badge { margin-left: 20px; }
</style>