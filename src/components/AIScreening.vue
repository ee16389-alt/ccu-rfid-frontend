methods: {
  async fetchScreeningResults() {
    this.loading = true;
    try {
      // 修正點 1：移除 /manager-api，改用單層路徑以配合 main.js 的 baseURL
      const res = await this.$http.post(`/Activity/${this.activityId}/recognize`, {}, {
        timeout: 30000 // 延長至 30 秒以應對 Azure 冷啟動
      });
      this.aiGroups = res.data;
      this.residentOptions = this.aiGroups.map(g => ({ id: g.resident_id, name: g.name }));
    } catch (err) {
      console.warn("API 獲取失敗，啟動備援示範模式");
      this.loadMockResults();
    } finally {
      this.loading = false;
    }
  },

  async handleFinalSave() {
    this.loading = true;
    try {
      // 封裝成您與同學協議的格式：[ { photo_id, resident_id }, ... ]
      const payload = [];
      this.aiGroups.forEach(group => {
        group.photos.forEach(p => {
          payload.push({ photo_id: p.photo_id, resident_id: group.resident_id });
        });
      });

      // 修正點 2：路徑統一改為單層 /recognize/confirm
      await this.$http.post(`/Activity/${this.activityId}/recognize/confirm`, payload);
      this.$message.success('AI 辨識結果已同步至資料庫！');
      this.$emit('go-back');
    } catch (error) {
      this.$message.error('儲存失敗，請檢查網路連線');
    } finally {
      this.loading = false;
    }
  },
  
  // 優化：橘框繪製邏輯，確保在彈窗開啟時能精準計算
  drawEditBox() {
    this.$nextTick(() => {
      const img = this.$refs.previewImg;
      const box = this.editingPhoto.bounding_box; 
      if (!img || !box || img.naturalWidth === 0) return;
      
      const sx = img.clientWidth / img.naturalWidth;
      const sy = img.clientHeight / img.naturalHeight;
      
      this.boxStyle = {
        top: (box[0] * sy) + 'px',
        left: (box[1] * sx) + 'px',
        width: ((box[3] - box[1]) * sx) + 'px',
        height: ((box[2] - box[0]) * sy) + 'px'
      };
    });
  }
}