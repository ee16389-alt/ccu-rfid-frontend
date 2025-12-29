methods: {
  async fetchScreeningResults() {
    this.loading = true;
    try {
      // 修正點 1：路徑統一使用簡潔相對路徑，讓攔截器處理前綴
      // 發送 POST 至 .../manager-api/Activity/{id}/recognize
      const res = await this.$http.post(`/Activity/${this.activityId}/recognize`, {}, {
        timeout: 30000 // 應對 Azure 冷啟動延遲
      });
      
      this.aiGroups = res.data;
      // 確保獲取長者選項時使用的是對應後端的欄位名稱
      this.residentOptions = this.aiGroups.map(g => ({ 
        id: g.resident_id, 
        name: g.resident_name // 確保使用正確的 Key 名稱
      }));
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
      // 封裝成 JSON 格式發送，徹底排除 415 錯誤
      const payload = [];
      this.aiGroups.forEach(group => {
        group.photos.forEach(p => {
          payload.push({ 
            photo_id: p.photo_id, 
            resident_id: group.resident_id 
          });
        });
      });

      // 修正點 2：發送至 .../manager-api/Activity/{id}/recognize/confirm
      await this.$http.post(`/Activity/${this.activityId}/recognize/confirm`, payload);
      
      this.$message.success('AI 辨識結果已正式同步！');
      this.$emit('go-back');
    } catch (error) {
      console.error('Save Error:', error.response);
      this.$message.error('儲存失敗，請確認欄位格式或網路連線');
    } finally {
      this.loading = false;
    }
  },
  
  // 繪製邏輯：根據圖片縮放比例計算 Bounding Box 的 CSS 樣式
  drawEditBox() {
    this.$nextTick(() => {
      const img = this.$refs.previewImg;
      const box = this.editingPhoto.bounding_box; 
      if (!img || !box || img.naturalWidth === 0) return;
      
      // 計算實際渲染與原始圖片的比例
      const sx = img.clientWidth / img.naturalWidth;
      const sy = img.clientHeight / img.naturalHeight;
      
      // 依序為 [Top, Left, Bottom, Right]
      this.boxStyle = {
        top: (box[0] * sy) + 'px',
        left: (box[1] * sx) + 'px',
        width: ((box[3] - box[1]) * sx) + 'px',
        height: ((box[2] - box[0]) * sy) + 'px'
      };
    });
  }
}