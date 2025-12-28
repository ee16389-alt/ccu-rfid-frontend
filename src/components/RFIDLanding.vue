<template>
  <div class="rfid-landing">
    <el-card class="landing-card" shadow="always">
      <div slot="header" class="header-content">
        <i class="el-icon-user-solid"></i>
        <span>長者端感應入口</span>
      </div>
      
      <div class="content">
        <div class="scan-icon-wrapper">
          <i class="el-icon-postcard pulse-animation"></i>
        </div>
        
        <h2>歡迎使用回憶錄系統</h2>
        
        <div class="status-box">
          <p v-if="!hasToken" class="error-text">
            <i class="el-icon-warning"></i> 系統未授權，請先由管理端登入
          </p>
          <p v-else class="success-text">
            <i class="el-icon-success"></i> 系統已就緒，請感應識別卡
          </p>
        </div>
        
        <el-button 
          type="primary" 
          size="medium" 
          :loading="loading" 
          :disabled="!hasToken"
          @click="handleStart"
          class="action-button"
        >
          模擬卡片感應
        </el-button>
        
        <p class="hint">測試卡號：116A2434</p>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RFIDLanding',
  data() {
    return {
      loading: false,
      // 初始檢查本地是否有 token
      hasToken: !!localStorage.getItem('userToken')
    };
  },
  methods: {
    async handleStart() {
      // 1. 安全性檢查：確保行政端已登入
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        this.$message({
          message: '【系統未授權】請先由行政管理端完成登入驗證',
          type: 'error',
          duration: 4000
        });
        return;
      }

      this.loading = true;
      // 使用同學截圖中的測試卡號
      const cardUid = "116A2434"; 

      try {
        // 2. 呼叫後端 RFID 查詢 API，使用完整 Azure 路徑
        const response = await axios.get(`https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net/manager-api/rfid/${cardUid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // 3. 解析同學提供的數據格式：response.data.match
        if (response.data.match && response.data.match.length > 0) {
          const target = response.data.match[0]; // 取得第一個匹配對象
          
          this.$notify({
            title: '感應成功',
            message: `${target.name} 您好，正在開啟您的精彩回憶！`,
            type: 'success',
            position: 'top-left'
          });

          // 延遲跳轉，將 RFID 序號傳給父組件以進入 ActivityMenu
          setTimeout(() => {
            this.$emit('scan-success', cardUid);
          }, 1000);
        } else {
          this.$message.warning('查無此卡片資料，請聯絡管理員登記');
        }
      } catch (error) {
        // 4. Demo 模式：當後端未啟動或連線失敗時使用
        console.warn("API 未連線，啟動示範模式", error);
        this.$message({
          message: '【Demo 模式】歡迎回來，唐伯虎先生！',
          type: 'warning'
        });
        
        setTimeout(() => {
          this.$emit('scan-success', '8A303053'); // 使用另一組測試卡號進行 Demo
        }, 1500);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* 簡單的美化樣式 */
.rfid-landing {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  background-color: #f5f7fa;
}

.landing-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
}

.header-content {
  font-weight: bold;
  font-size: 18px;
  color: #303133;
}

.content {
  text-align: center;
  padding: 20px 0;
}

.scan-icon-wrapper {
  margin-bottom: 20px;
}

.el-icon-postcard {
  font-size: 100px;
  color: #409EFF;
}

.status-box {
  margin: 20px 0;
  min-height: 24px;
}

.error-text { color: #F56C6C; font-weight: bold; }
.success-text { color: #67C23A; }

.action-button {
  width: 200px;
  font-size: 16px;
}

.hint {
  font-size: 12px;
  color: #909399;
  margin-top: 15px;
}

/* 讓圖示有微弱閃爍感，像是感應器的感覺 */
.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
</style>