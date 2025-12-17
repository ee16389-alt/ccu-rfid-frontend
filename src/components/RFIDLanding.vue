<template>
  <div class="landing-container">
    
    <h1 class="main-title">請感應您的照片卡</h1>

    <div class="rfid-icon-wrapper">
      <div class="rfid-icon">
        <i class="el-icon-picture-outline" style="font-size: 60px;"></i>
        <i class="el-icon-refresh-right rfid-waves"></i>
      </div>
    </div>
    
    <p class="prompt-text">
      將卡片放置於感應區域
    </p>

    <el-button 
      type="warning" 
      @click="handleStart"
      class="start-button"
    >
      開始
    </el-button>

    <p class="footer-text">RFID 回憶錄 | Demo 版本</p>
  </div>
</template>

<script>
export default {
  name: 'RFIDLanding',
  methods: {
    handleStart() {
      // 1. 先確認是否有管理員 Token
      const token = localStorage.getItem('userToken');
      if (!token) {
        this.$message.error('系統尚未初始化，請先由行政端登入');
        return;
      }

      // 這裡假設感應到的卡片 ID 為 "A001"
      const cardUid = "A001"; 

      // 2. 呼叫 RFID 驗證 API 並帶上 Token
      this.$http.get(`/api/Rfid/${cardUid}`, {
        headers: {
          'Authorization': `Bearer ${token}` //
        }
      })
        .then(response => {
          // 回傳的是 ResidentModel 資訊
          const resident = response.data;
          this.$message({
            message: `歡迎回來，${resident.name} 先生/女士！`,
            type: 'success',
            duration: 2000
          });

          // 成功後，將長者 ID 傳給 App.vue，以便進入「回憶照片牆」
          this.$emit('scan-success', resident.id);
        })
        .catch(error => {
          console.error("RFID 驗證失敗:", error);
          // 3. 判斷是否為 CORS 或權限問題
          if (error.response && error.response.status === 401) {
            this.$message.error('授權已過期，請重新登入管理端');
          } else {
            this.$message.error('感應失敗：卡片未註冊或網路連線錯誤');
          }
        });
    }
  }
};
</script>

<style scoped>
.landing-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90vh;
    background-color: #fffaf5; /* 增加背景色使其更溫暖 */
}

.main-title {
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 50px;
    color: #303133;
}

.rfid-icon-wrapper {
    background-color: #FF9933;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    margin-bottom: 30px;
    box-shadow: 0 10px 20px rgba(255, 153, 51, 0.3); /* 增加陰影感 */
}

.rfid-icon {
    color: white;
    position: relative;
}

.rfid-waves {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%) rotate(90deg);
    font-size: 30px;
    opacity: 0.8;
}

.prompt-text {
    font-size: 20px;
    color: #606266;
    margin-bottom: 40px;
    font-weight: 500;
}

.start-button {
    background-color: #FF9933;
    border-color: #FF9933;
    width: 250px;
    height: 60px;
    font-size: 24px;
    font-weight: bold;
    border-radius: 30px; /* 圓角更適合長者介面 */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.footer-text {
    position: absolute;
    bottom: 20px;
    font-size: 14px;
    color: #909399;
}
</style>