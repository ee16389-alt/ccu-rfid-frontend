<template>
  <div class="slideshow-container">
    <div class="header-playback">
      <h1 class="main-title">回憶播放</h1>
      <span class="activity-info">活動：{{ activityName }}</span>
      <el-button 
        type="warning" 
        @click="handleBack"
        class="back-button"
      >
        返回
      </el-button>
    </div>

    <el-card shadow="never" class="slideshow-area">
      <div class="photo-display">
        <div class="nav-arrow left-arrow" @click="prevPhoto">
          <i class="el-icon-arrow-left"></i>
        </div>
        
        <div class="current-photo-container">
          <el-image 
            v-if="photoList.length > 0"
            :src="photoList[currentPhotoIndex].url" 
            fit="contain"
            class="main-photo"
          >
            <div slot="placeholder" class="image-loading">載入回憶中...</div>
          </el-image>
          <div v-else class="current-photo-placeholder">
            正在準備您的珍貴回憶...
          </div>
        </div>

        <div class="nav-arrow right-arrow" @click="nextPhoto">
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
    </el-card>

    <div class="controls-bar">
      <el-button 
        :type="isPlaying ? 'info' : 'warning'" 
        @click="togglePlay"
        class="control-button"
      >
        {{ isPlaying ? '暫停播放' : '繼續播放' }}
      </el-button>
      
      <span class="photo-counter">
        {{ photoList.length > 0 ? currentPhotoIndex + 1 : 0 }} / {{ photoList.length }} 張
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Slideshow',
  props: ['residentId', 'activityId'], // 接收從選單頁傳來的參數
  data() {
    return {
      isPlaying: true,
      currentPhotoIndex: 0,
      photoList: [],
      activityName: '載入中...',
      timer: null
    };
  },
  mounted() {
    this.fetchPhotos();
    this.startTimer();
  },
  beforeDestroy() {
    this.stopTimer(); // 離開頁面時務必停止計時器
  },
  methods: {
    fetchPhotos() {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      // 呼叫 API 取得該長者在特定活動的照片清單
      // 假設路徑：/api/Resident/{rid}/Activity/{aid}/Photos
      this.$http.get(`/api/Resident/${this.residentId}/Activity/${this.activityId}/Photos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        this.photoList = res.data.photos.map(p => ({ url: p.photo_url }));
        this.activityName = res.data.activity_title || '精選活動';
      })
      .catch(err => {
        console.error("照片載入失敗", err);
        this.$message.error('無法讀取照片，請確認連線或 CORS 設定');
      });
    },
    startTimer() {
      this.timer = setInterval(() => {
        if (this.isPlaying) {
          this.nextPhoto();
        }
      }, 3000); // 每 3 秒切換一張
    },
    stopTimer() {
      if (this.timer) clearInterval(this.timer);
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying;
    },
    prevPhoto() {
      if (this.photoList.length === 0) return;
      this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.photoList.length) % this.photoList.length;
    },
    nextPhoto() {
      if (this.photoList.length === 0) return;
      this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photoList.length;
    },
    handleBack() {
      this.$emit('go-back');
    }
  }
};
</script>

<style scoped>
/* 保持原本樣式並優化照片顯示 */
.slideshow-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}
.header-playback {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.activity-info {
  font-size: 18px;
  color: #606266;
}
.current-photo-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000; /* 黑底讓照片更突出 */
}
.main-photo {
  width: 100%;
  height: 100%;
}
.nav-arrow {
  z-index: 100;
}
.left-arrow { left: 20px; }
.right-arrow { right: 20px; }
.controls-bar {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-counter {
  margin-left: 20px;
  font-size: 18px