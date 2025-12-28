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
  // 接收活動 ID 與來自感應頁面的 RFID 序號
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
    // 核心對接：優先測試同學提供的 /api/ 路徑
    async fetchPhotos() {
      this.loading = true;
      const token = localStorage.getItem('userToken');
      
      try {
        // 解決 404 問題：測試 /api/ 路徑並帶入 RFID 參數
        const res = await this.$http.get(`/api/activities/${this.activityId}/photos`, {
          params: { rfid: this.rfid_uid }, // 精準篩選長輩照片
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // 欄位容錯映射
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
        // 若出現 404 (Not Found) 則記錄警告並進入示範模式
        console.warn('API 抓取照片失敗 (測試 /api/ 路徑)，啟動示範模式');
        this.loadMockPhotos(); 
      } finally {
        this.loading = false;
      }
    },

    loadMockPhotos() {
      this.activityName = '時光記憶精選 (示範模式)';
      const baseUrl = process.env.BASE_URL || './';
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
      }, 6000); // 長者觀賞建議停留 6 秒
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