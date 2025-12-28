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
  // 生命週期勾子
  mounted() {
    // 使用 nextTick 確保組件實例已完全就緒
    this.$nextTick(() => {
      this.fetchAIResults();
    });
    window.addEventListener('resize', this.refreshBoxes);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.refreshBoxes);
  },
  methods: { // <--- 確保所有方法都寫在這個 methods 物件內
    // 1. 核心辨識結果抓取：對接 /manager-api/ 路徑
    async fetchAIResults() {
      this.loading = true;
      this.isDemoMode = false;
      const token = localStorage.getItem('userToken');
      try {
        // 對接後端正式環境路徑，並延長逾時時間至 30 秒以應對 Azure 冷啟動
        const response = await this.$http.post(`/manager-api/Activity/${this.activityId}/recognize`, {}, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 30000 
        });
        
        // 修正邏輯：若回傳空資料或失敗，則自動啟動 Demo 模式
        if (response.data && response.data.length > 0) {
          this.rawResults = response.data;
        } else {
          this.loadMockData(); 
        }
      } catch (err) {
        console.warn('API 抓取失敗或逾時，進入示範模式', err);
        this.loadMockData(); 
      } finally {
        this.processData();
        this.loading = false;
      }
    },

    loadMockData() {
      this.isDemoMode = true;
      const baseUrl = process.env.BASE_URL || './';
      // 使用穩定圖源進行示範，確保容器能撐開並正確顯示橘框
      this.rawResults = [{
        "resident_id": "3",
        "resident_name": "唐伯虎",
        "confidence": 0.56,
        "photos": [{
          "photo_id": 999,
          // 若本地圖片 activity2.png 抓不到，改用線上穩定圖源測試
          "photo_url": "https://picsum.photos/id/237/800/600", 
          "bounding_box": [150, 200, 450, 500] // [top, left, bottom, right]
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
            rawBox: pic.bounding_box, // [top, left, bottom, right] 格式
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

        // 精準座標縮放計算
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
  } // <--- methods 結束
}; // <--- export default 結束
</script>