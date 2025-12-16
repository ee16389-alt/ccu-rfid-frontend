<template>
  <div class="slideshow-container">
    <div class="header-playback">
      <h1 class="main-title">回憶播放</h1>
      <span class="activity-info">活動：社區歌唱日</span>
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
        
        <div class="current-photo-placeholder">
          照片播放區 (示意)
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
        {{ isPlaying ? '暫停' : '播放' }}
      </el-button>
      
      <span class="photo-counter">
        {{ currentPhotoIndex + 1 }} / {{ totalPhotos }} 張
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Slideshow',
  data() {
    return {
      isPlaying: true,
      currentPhotoIndex: 11,
      totalPhotos: 48,
    };
  },
  methods: {
    handleBack() {
      this.$message.info('切版完成，點擊返回 (需實作頁面導航)');
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying;
      this.$message.info(this.isPlaying ? '開始播放' : '已暫停');
    },
    prevPhoto() {
      this.$message.info('切版完成，上一張照片');
    },
    nextPhoto() {
      this.$message.info('切版完成，下一張照片');
    }
  }
};
</script>

<style scoped>
.slideshow-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.header-playback {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}

.back-button {
  background-color: #FF9933;
  border-color: #FF9933;
}

.slideshow-area {
  border-radius: 15px;
  border: 1px solid #f0e6da;
  box-shadow: none;
  background-color: #fcf6ee;
  padding: 0;
}

.photo-display {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.current-photo-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #909399;
}

.nav-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    background-color: rgba(255, 153, 51, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    font-size: 30px;
    z-index: 10;
}

.control-button {
    background-color: #FF9933;
    border-color: #FF9933;
    margin-right: 10px;
}
.el-button--info {
    background-color: #909399;
    border-color: #909399;
}
</style>