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
  props: ['residentId'],
  data() {
    return {
      // 統一使用 activityList 以對應 template
      activityList: []
    };
  },
  mounted() {
    this.fetchResidentActivities();
  },
  methods: {
    fetchResidentActivities() {
      // 1. 從 localStorage 提取登入時存入的 Token
      const token = localStorage.getItem('userToken');

      if (!token) {
        this.$message.warning('尚未偵測到登入憑證，請先登入');
        return;
      }

      // 2. 呼叫活動 API，並在 Header 帶上 Authorization
      // 提示：若後端支援，可改為 `/manager-api/Activity?residentId=${this.residentId}`
      this.$http.get('/manager-api/Activity', {
        headers: {
          'Authorization': `Bearer ${token}` // 標準 JWT 格式
        }
      })
        .then(response => {
          // 3. 將 API 回傳資料映射至前端顯示格式
          this.activityList = response.data.map(item => ({
            id: item.id,
            name: item.title || '精彩活動',
            date: item.activity_at ? item.activity_at.split('T')[0] : '無日期',
            photoCount: item.photo_count || 0
          }));
          this.$message.success('照片牆載入成功');
        })
        .catch(error => {
          console.error("載入照片牆失敗:", error);
          // 4. 針對 CORS 或 401 進行錯誤提示
          if (error.response && error.response.status === 401) {
            this.$message.error('驗證失敗，請重新登入');
          } else {
            this.$message.error('無法取得活動資料，請確認 API 連線與 CORS 設定');
          }
        });
    },
    // 修正：方法名稱與 template 的 @click.native 保持一致
    handleSelectActivity(activity) {
      this.$message.success(`即將播放：${activity.name}`);
      // 發送事件給父元件切換至 Frame 3 (Slideshow)
      this.$emit('select-activity', activity.id);
    },
    handleBack() {
      // 發送回上一頁的事件
      this.$emit('go-back');
    }
  }
};
</script>

<style scoped>
.activity-menu-container {
    padding: 20px;
    background-color: #fffaf5; /* 輕微背景色提升質感 */
    min-height: 100vh;
}

.header-playback {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #f0e6da;
    padding-bottom: 15px;
}

.main-title {
    font-size: 24px;
    color: #5a5a5a;
    margin: 0;
}

.prompt-text {
    color: #909399;
    margin-bottom: 20px;
}

.activity-col {
    margin-bottom: 25px;
}

.activity-card {
    border-radius: 15px;
    border: 1px solid #f0e6da;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    background-color: #ffffff;
}

.activity-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(255, 153, 51, 0.2);
    border-color: #FF9933;
}

.image-placeholder {
    width: 100%;
    padding-top: 60%;
    background-color: #f0e6da;
    background-image: linear-gradient(45deg, #f0e6da 25%, #f7f0e8 25%, #f7f0e8 50%, #f0e6da 50%, #f0e6da 75%, #f7f0e8 75%, #f7f0e8 100%);
    background-size: 20px 20px;
    border-radius: 10px;
    margin-bottom: 15px;
}

.activity-name {
    text-align: center;
    font-weight: bold;
    color: #606266;
    margin: 10px 0;
}

.back-button {
    background-color: #FF9933;
    border-color: #FF9933;
    color: white;
    font-weight: bold;
}
</style>