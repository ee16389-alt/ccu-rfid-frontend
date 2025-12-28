<template>
  <div class="activity-menu-container">
    <div class="header-playback">
      <h1 class="main-title">回憶照片牆</h1>
      <el-tag v-if="residentName" type="warning" effect="dark" class="identity-tag">
        <i class="el-icon-user"></i> 歡迎：{{ residentName }}
      </el-tag>
      <el-button type="warning" @click="handleBack" class="back-button">返回</el-button>
    </div>

    <p class="prompt-text">點選活動封面即可開始播放您的精彩回憶</p>

    <el-row :gutter="30" v-loading="loading">
      <el-col :span="8" v-for="activity in activityList" :key="activity.id" class="activity-col">
        <el-card shadow="hover" class="activity-card" @click.native="handleSelectActivity(activity)">
          <div class="activity-content">
            <el-image 
              :src="activity.cover || getDefaultCover()" 
              class="activity-image"
              fit="cover"
            >
              </el-image>
            <div class="activity-info">
              <p class="activity-name">{{ activity.name }}</p>
              <p class="activity-date">
                <i class="el-icon-date"></i> {{ activity.date }} 
                <span v-if="activity.photoCount"> ({{ activity.photoCount }}張)</span>
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'ActivityMenu',
  props: ['rfid_uid'], // 改為接收 RFID 序號以供 API 查詢
  data() {
    return {
      loading: false,
      residentName: '', // 用來儲存長輩姓名
      activityList: []
    };
  },
  mounted() {
    if (this.rfid_uid) {
      this.fetchDataByRfid();
    } else {
      this.loadMockActivities();
    }
  },
  methods: {
    getDefaultCover() {
      return 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=600';
    },

    // 核心對接：使用同學調整後的 api/rfid/{rfid}
    async fetchDataByRfid() {
      this.loading = true;
      try {
        const response = await this.$http.get(`/api/rfid/${this.rfid_uid}`);
        
        // 1. 處理 match 陣列資訊
        if (response.data.match && response.data.match.length > 0) {
          const matchInfo = response.data.match[0];
          this.residentName = matchInfo.name; // 取得長輩姓名
        }

        // 2. 渲染 activitys 清單
        if (response.data.activitys && response.data.activitys.length > 0) {
          this.activityList = response.data.activitys.map(item => ({
            id: item.id,
            name: item.title,
            date: item.activity_at,
            cover: item.cover,
            photoCount: item.photo_count
          }));
        } else {
          this.$message.info('目前尚無相關活動照片');
        }
      } catch (error) {
        console.error("RFID 查詢失敗", error);
        this.loadMockActivities();
      } finally {
        this.loading = false;
      }
    },

    loadMockActivities() {
      this.activityList = [
        { id: '2', name: '象棋大賽', date: '2025-12-18', photoCount: 6, cover: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600' },
        { id: '7', name: '話劇表演', date: '2025-12-24', photoCount: 2, cover: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600' }
      ];
    },

    handleSelectActivity(activity) {
      // 傳遞活動 ID 以及當前的 RFID 序號，以便下一頁過濾照片
      this.$emit('select-activity', {
        activityId: activity.id,
        rfid: this.rfid_uid
      });
    },
    handleBack() {
      this.$emit('go-back');
    }
  }
};
</script>

<style scoped>
/* 樣式部分微調：加入身分標籤樣式 */
.identity-tag { font-size: 18px; padding: 10px 20px; border-radius: 15px; margin-right: auto; margin-left: 20px; }
/* ... 其餘樣式保持不變 ... */
.activity-menu-container { padding: 40px; background-color: #fffaf5; min-height: 100vh; }
.header-playback { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #f0e6da; padding-bottom: 20px; }
.main-title { font-size: 32px; color: #5d5146; font-weight: bold; }
.prompt-text { color: #8c7e71; font-size: 18px; margin-bottom: 40px; }
.activity-card { border-radius: 24px; cursor: pointer; transition: all 0.3s ease; border: none; overflow: hidden; background: white; }
.activity-card:hover { transform: translateY(-12px); box-shadow: 0 15px 30px rgba(255, 153, 51, 0.15); }
.activity-image { width: 100%; height: 240px; border-bottom: 1px solid #eee; }
.activity-info { padding: 20px; text-align: center; }
.activity-name { font-size: 20px; font-weight: bold; color: #333; margin: 0 0 8px 0; }
.activity-date { font-size: 16px; color: #909399; margin: 0; }
.back-button { background-color: #FF9933; border-color: #FF9933; color: white; font-weight: bold; padding: 12px 30px; border-radius: 25px; font-size: 18px; }
</style>