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

    <div class="slideshow-area">
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
    </div>

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
  props: ['activityId', 'rfid'],
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
    async fetchPhotos() {
      this.loading = true;
      try {
        const res = await this.$http.get(`/activities/${this.activityId}/photos`, {
          params: { rfid: this.rfid }
        });

        if (res.data.photos && res.data.photos.length > 0) {
          this.photoList = res.data.photos.map(p => ({
            id: p.id || p.photo_id,
            url: p.image_url || p.photo_url, 
            taken_at: p.taken_at
          }));
          this.activityName = res.data.activity_title || `活動編號 #${this.activityId}`;
        } else {
          this.loadMockPhotos(); 
        }
      } catch (err) {
        console.warn('API 抓取失敗，啟動示範模式');
        this.loadMockPhotos(); 
      } finally {
        this.loading = false;
      }
    },

    loadMockPhotos() {
      this.activityName = '時光記憶精選 (示範模式)';
      const baseUrl = "https://ee16389-alt.github.io/ccu-rfid-frontend/slideshow/";
      this.photoList = [
        { url: `${baseUrl}activity1.png` }, 
        { url: `${baseUrl}activity2.png` }, 
        { url: `${baseUrl}activity3.png` }, 
        { url: `${baseUrl}activity4.png` }
      ];
    },

    startTimer() {
      this.timer = setInterval(() => {
        if (this.isPlaying && this.photoList.length > 1) {
          this.nextPhoto();
        }
      }, 6000); 
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
.slideshow-container { padding: 30px; background-color: #333; min-height: 100vh; color: white; box-sizing: border-box; }
.header-playback { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.main-title { font-size: 28px; margin: 0; color: #FF9933; }

/* 修正 3：定義明確的播放區域，確保背景全黑且不裁切 */
.slideshow-area { 
  background-color: #000; 
  position: relative; 
  height: 75vh; 
  width: 100%;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  overflow: hidden;
  border-radius: 12px;
}

.photo-display { 
  position: relative; 
  width: 100%; 
  height: 100%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}

/* 修正 4：確保圖片容器與圖片本身都以 contain 模式呈現 */
.current-photo-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-photo { 
  width: 100%; 
  height: 100%; 
  /* fit="contain" 已在 template 設定，確保不裁切且留黑邊 */
}

.nav-arrow { 
  position: absolute; 
  top: 50%; 
  transform: translateY(-50%); 
  font-size: 50px; 
  color: rgba(255,255,255,0.4); 
  cursor: pointer; 
  z-index: 10; 
  transition: 0.3s; 
}
.nav-arrow:hover { color: #FF9933; scale: 1.2; }
.left-arrow { left: 20px; }
.right-arrow { right: 20px; }

.controls-bar { margin-top: 30px; text-align: center; }
.control-panel { display: inline-flex; align-items: center; background: rgba(255,255,255,0.1); padding: 10px 30px; border-radius: 40px; }
.play-btn { font-size: 30px; margin-right: 20px; }
.counter-badge { font-size: 24px; font-family: monospace; }
.current { color: #FF9933; font-weight: bold; }

/* 過渡動畫 */
.photo-fade-enter-active, .photo-fade-leave-active {
  transition: opacity 0.5s ease;
}
.photo-fade-enter, .photo-fade-leave-to {
  opacity: 0;
}
</style>