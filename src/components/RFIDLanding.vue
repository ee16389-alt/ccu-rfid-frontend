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
      // 這裡假設感應到的卡片 ID 為 "A001"
      const cardUid = "A001"; 

      this.$http.get(`/api/Rfid/${cardUid}`)
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
          this.$message.error('感應失敗：卡片未註冊');
          console.error("RFID 驗證失敗:", error);
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
    min-height: 90vh; /* 確保內容垂直置中 */
}

.main-title {
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 50px;
    color: #303133;
}

.rfid-icon-wrapper {
    background-color: #FF9933; /* 橘色圓形背景 */
    width: 200px;
    height: 200px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    margin-bottom: 30px;
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
}

.footer-text {
    position: absolute;
    bottom: 20px;
    font-size: 12px;
    color: #909399;
}
</style>