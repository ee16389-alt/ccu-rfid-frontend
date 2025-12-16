<template>
  <div class="activity-menu-container">
    <div class="header-playback">
      <h1 class="main-title">回憶照片牆</h1>
      <el-button 
        type="warning" 
        @click="handleBack"
        class="back-button"
      >
        返回
      </el-button>
    </div>

    <p class="prompt-text">點選照片即可開始播放</p>

    <el-row :gutter="20">
      <el-col 
        :span="8" 
        v-for="activity in activityList" 
        :key="activity.id" 
        class="activity-col"
      >
        <el-card 
          shadow="hover" 
          class="activity-card" 
          @click.native="handleSelectActivity(activity)"
        >
          <div class="activity-content">
            <div class="image-placeholder">
              </div>
            <p class="activity-name">{{ activity.name }} • {{ activity.date }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'ActivityMenu',
  // 接收從 RFIDLanding 傳遞過來的長者 ID
  props: ['residentId'],
  data() {
    return {
      // 存放該長者的活動清單
      activities: []
    };
  },
  mounted() {
    this.fetchResidentActivities();
  },
  methods: {
    fetchResidentActivities() {
      // 呼叫活動 API
      // 這裡我們先獲取所有活動，實務上後端通常會根據 residentId 過濾
      this.$http.get('/manager-api/Activity')
        .then(response => {
          // 對應 ActivityModel：title, photo_count, activity_at
          this.activities = response.data.map(item => ({
            id: item.id,
            title: item.title || '精彩活動',
            date: item.activity_at ? item.activity_at.split('T')[0] : '',
            photoCount: item.photo_count || 0
          }));
        })
        .catch(error => {
          console.error("載入照片牆失敗:", error);
        });
    },
    handleActivityClick(activity) {
      this.$message.success(`即將播放：${activity.title}`);
      // 點擊後跳轉至投影片播放 (Frame 3)
      this.$emit('select-activity', activity.id);
    }
  }
};
</script>

<style scoped>
.activity-menu-container {
    padding: 20px;
}
/* 省略其他樣式... */
.header-playback {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.back-button {
    background-color: #FF9933;
    border-color: #FF9933;
    color: white;
}

.activity-card {
    border-radius: 15px;
    border: 1px solid #f0e6da;
    cursor: pointer;
    box-shadow: none;
    transition: all 0.2s;
    height: 100%;
    background-color: #fcf6ee;
}

.activity-card:hover {
    box-shadow: 0 6px 15px rgba(255, 153, 51, 0.3);
}

.image-placeholder {
    width: 100%;
    padding-top: 65%;
    background-color: #f0e6da;
    border-radius: 8px;
    margin-bottom: 15px;
}
</style>