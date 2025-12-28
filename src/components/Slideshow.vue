<template>
  <div class="slideshow-container">
    <div class="header-playback">
      <div class="title-group">
        <h1 class="main-title">回憶播放中</h1>
        <span class="activity-info" v-if="activityName">
          <i class="el-icon-collection-tag"></i> {{ activityName }}
        </span>
      </div>
      <el-button type="warning" @click="handleBack" class="back-button" icon="el-icon-close">結束放映</el-button>
    </div>

    <el-card shadow="always" class="slideshow-area">
      <div class="photo-display">
        <div class="nav-arrow left-arrow" @click="prevPhoto" v-if="photoList.length > 1">
          <i class="el-icon-arrow-left"></i>
        </div>
        
        <div class="current-photo-container">
          <transition name="photo-fade" mode="out-in">
            <el-image 
              :key="currentPhotoIndex"
              v-if="photoList.length > 0"
              :src="photoList[currentPhotoIndex].url" 
              fit="contain"
              class="main-photo"
            >
              <div slot="placeholder" class="image-loading">
                <i class="el-icon-loading"></i> 正在翻開您的回憶錄...
              </div>
              <div slot="error" class="image-error">
                <i class="el-icon-picture-outline"></i> 哎呀，這段記憶暫時跑掉了
              </div>
            </el-image>
            <div v-else-if="loading" class="current-photo-placeholder">
              <i class="el-icon-loading"></i> 正在開啟時光機...
            </div>
            <div v-else class="current-photo-placeholder">目前此活動尚無相關照片</div>
          </transition>
        </div>

        <div class="nav-arrow right-arrow" @click="nextPhoto" v-if="photoList.length > 1">
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
    </el-card>

    <div class="controls-bar">
      <div class="control-panel">
        <el-button 
          :type="isPlaying ? 'info' : 'warning'" 
          @click="togglePlay" 
          circle 
          class="play-btn" 
          :icon="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"
        ></el-button>
        <div class="counter-badge">
          <span class="current">{{ photoList.length > 0 ? currentPhotoIndex + 1 : 0 }}</span>
          <span class="separator">/</span>
          <span class="total">{{ photoList.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Slideshow',
  // 接收活動 ID 與 RFID 序號以供統一路徑查詢
  props: ['activityId', 'rfid_uid'],
  data() {
    return {
      loading: false,
      isPlaying: true,
      currentPhotoIndex: 0,
      photoList: [],
      activityName: '',
      timer: null
    };
  },
  mounted() {
    this.fetchPhotos();
    this.startTimer();
  },
  beforeDestroy() {
    this.stopTimer();
  },
  methods: {
    // 核心對接：統一呼叫帶有 rfid 的 API
    async fetchPhotos() {
      this.loading = true;
      const token = localStorage.getItem('userToken');
      
      try {
        // 使用 Query String 格式：/activities/{id}/photos?rfid={rfid}
        const res = await this.$http.get(`/manager-api/activities/${this.activityId}/photos`, {
          params: { rfid: this.rfid_uid }, // axios 會自動處理成 ?rfid=...
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // 檢查 API 回傳的照片欄位
        if (res.data.photos && res.data.photos.length > 0) {
          this.photoList = res.data.photos.map(p => ({
            id: p.id || p.photo_id,
            url: p.image_url || p.photo_url, // 對接後端 image_url 欄位
            taken_at: p.taken_at
          }));
          this.activityName = res.data.activity_title || `活動編號 #${this.activityId}`;
        } else {
          this.loadMockPhotos(); 
        }
      } catch (err) {
        console.warn('照片抓取失敗，啟動示範模式');
        this.loadMockPhotos(); 
      } finally {
        this.loading = false;
      }
    },

    loadMockPhotos() {
      this.activityName = '時光記憶精選 (示範模式)';
      const baseUrl = process.env.BASE_URL;
      this.photoList = [
        { url: `${baseUrl}slideshow/activity1.png` }, 
        { url: `${baseUrl}slideshow/activity2.png` }, 
        { url: `${baseUrl}slideshow/activity3.png` }, 
        { url: `${baseUrl}slideshow/activity4.png` }
      ];
    },

    startTimer() {
      this.timer = setInterval(() => {
        if (this.isPlaying && this.photoList.length > 1) {
          this.nextPhoto();
        }
      }, 6000); // 每一張照片停留 6 秒，適合長者觀賞速度
    },
    stopTimer() {
      if (this.timer) clearInterval(this.timer);
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying;
    },
    prevPhoto() {
      this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.photoList.length) % this.photoList.length;
    },
    nextPhoto() {
      this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photoList.length;
    },
    handleBack() {
      this.$emit('go-back');
    }
  }
};
</script>

<style scoped>
/* 沉浸式播放樣式 */
.slideshow-container { padding: 40px 20px; max-width: 1200px; margin: 0 auto; background-color: #fffaf5; min-height: 100vh; }
.header-playback { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 25px; }
.main-title { font-size: 36px; color: #5d5146; font-weight: 800; margin: 0; }
.activity-info { font-size: 20px; color: #9a8c7d; margin-top: 8px; display: block; }
.activity-info i { color: #FF9933; margin-right: 8px; }

.slideshow-area {
  height: 650px; border-radius: 40px; background-color: #1a1a1a; 
  display: flex; align-items: center; border: 12px solid #fff;
  box-shadow: 0 30px 60px rgba(93, 81, 70, 0.2) !important; overflow: hidden;
}

.photo-display { width: 100%; height: 100%; position: relative; }
.current-photo-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.main-photo { width: 100%; height: 100%; }

/* 照片淡入淡出動畫 */
.photo-fade-enter-active, .photo-fade-leave-active { transition: opacity 1.2s ease; }
.photo-fade-enter, .photo-fade-leave-to { opacity: 0; }

.nav-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.2); color: white; width: 80px; height: 80px;
  border-radius: 50%; display: flex; justify-content: center; align-items: center;
  font-size: 40px; cursor: pointer; z-index: 10; transition: 0.4s;
}
.nav-arrow:hover { background-color: #FF9933; transform: translateY(-50%) scale(1.1); }
.left-arrow { left: 30px; }
.right-arrow { right: 30px; }

.controls-bar { margin-top: 40px; display: flex; justify-content: center; }
.control-panel { 
  background: white; padding: 15px 40px; border-radius: 60px;
  display: flex; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}
.play-btn { font-size: 30px; height: 60px; width: 60px; }
.counter-badge { margin-left: 25px; font-weight: bold; }
.current { font-size: 32px; color: #FF9933; }
.separator { margin: 0 15px; color: #dcdfe6; font-size: 24px; }
.total { font-size: 24px; color: #909399; }

.back-button { 
  background-color: #fff; border: 1px solid #dcdfe6; color: #606266;
  font-weight: bold; padding: 12px 30px; border-radius: 20px; font-size: 18px;
}
.back-button:hover { background-color: #f56c6c; color: white; border-color: #f56c6c; }
.image-loading, .image-error, .current-photo-placeholder { color: #fff; font-size: 20px; text-align: center; }
</style>