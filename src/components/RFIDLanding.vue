<template>
  <div class="landing-container">
    <div class="bg-glow"></div>
    
    <div class="content-box">
      <h1 class="main-title">回憶時光機</h1>
      <p class="sub-title">請輕碰感應卡，開啟您的專屬記憶</p>

      <div class="rfid-icon-wrapper" :class="{ 'scanning': loading }">
        <div class="rfid-main-circle">
          <div class="rfid-icon">
            <i class="el-icon-bank-card" style="font-size: 90px;"></i>
            <div v-if="loading" class="scan-line"></div>
          </div>
        </div>
        <div class="ripple"></div>
        <div class="ripple delay-1"></div>
      </div>
      
      <p class="status-text">
        <i :class="loading ? 'el-icon-loading' : 'el-icon-place'"></i>
        {{ loading ? '正在讀取您的珍貴回憶...' : '等待感應中' }}
      </p>

      <el-button 
        type="warning" 
        @click="handleStart" 
        class="glass-start-button"
        :loading="loading"
        :disabled="!hasToken"
      >
        {{ loading ? '讀取中' : '開始感應' }}
      </el-button>
    </div>

    <div class="footer-section">
      <div class="footer-info">
        <span class="dot"></span> 智慧 RFID 系統正在運作中 <span class="dot"></span>
      </div>
      <transition name="el-fade-in">
        <div v-if="!hasToken" class="auth-warning">
          <i class="el-icon-warning-outline"></i> 系統尚未授權，請聯絡管理員登入
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RFIDLanding',
  data() {
    return {
      loading: false,
      hasToken: !!localStorage.getItem('userToken')
    };
  },
  methods: {
    async handleStart() {
      // 1. 安全性檢查：確保行政端已登入
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        this.$message({
          message: '【權限錯誤】請先由行政管理端完成登入驗證',
          type: 'error',
          duration: 4000
        });
        return;
      }

      this.loading = true;
      // 使用同學測試用的卡號
      const cardUid = "116A2434"; 

      try {
        // 2. 呼叫後端 API，根據 Swagger 規範獲取資料
        // 此處會回傳 match 與新增的 activitys 陣列
        const response = await this.$http.get(`/manager-api/rfid/${cardUid}`);

        // 3. 解析感應結果
        if (response.data.match && response.data.match.length > 0) {
          const target = response.data.match[0];
          
          this.$notify({
            title: '感應成功',
            message: `${target.name} 您好，歡迎回到時光機！`,
            type: 'success',
            position: 'top-left'
          });

          // 延遲跳轉，並將完整的資料（含活動清單）傳給父組件
          setTimeout(() => {
            this.$emit('scan-success', {
              rfid: cardUid,
              match: target,
              activities: response.data.activitys || [] // 傳遞活動清單
            });
          }, 1000);
        } else {
          this.$message.warning('查無此卡片資料，請聯絡管理員登記');
        }
      } catch (error) {
        // 4. Demo 模式：連線失敗時啟動示範路徑
        console.warn("API 未連線，啟動示範模式", error);
        this.$message({
          message: '【Demo 模式】歡迎回來，唐伯虎先生！',
          type: 'warning'
        });
        
        setTimeout(() => {
          this.$emit('scan-success', {
            rfid: '8A303053',
            match: { type: 'subject', name: '唐伯虎', id: '9527' },
            activities: [] 
          }); 
        }, 1500);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* 樣式部分保持不變，維持精美的橘色呼吸感 */
.landing-container { 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  min-height: 100vh; background: radial-gradient(circle at center, #fffaf5 0%, #f7f1e9 100%);
  position: relative; overflow: hidden;
}

.bg-glow {
  position: absolute; width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(255,153,51,0.1) 0%, transparent 70%);
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 0;
}

.content-box { position: relative; z-index: 1; text-align: center; }
.main-title { font-size: 48px; color: #5d5146; margin: 0; font-weight: 800; letter-spacing: 4px; }
.sub-title { font-size: 20px; color: #9a8c7d; margin: 15px 0 50px 0; }

.rfid-icon-wrapper { 
  position: relative; width: 280px; height: 280px; margin: 0 auto 50px auto;
  display: flex; justify-content: center; align-items: center;
}

.rfid-main-circle {
  width: 200px; height: 200px; background: linear-gradient(135deg, #FFB366 0%, #FF9933 100%);
  border-radius: 50%; display: flex; justify-content: center; align-items: center;
  box-shadow: 0 15px 35px rgba(255, 153, 51, 0.4), inset 0 -5px 10px rgba(0,0,0,0.1);
  position: relative; z-index: 2; overflow: hidden;
}

.rfid-icon { color: white; transition: 0.3s; }

.scan-line {
  position: absolute; width: 100%; height: 4px; background: rgba(255, 255, 255, 0.6);
  filter: blur(2px); top: 0; left: 0; animation: scan-anim 2s infinite linear;
}

@keyframes scan-anim {
  0% { top: -10%; }
  100% { top: 110%; }
}

.ripple {
  position: absolute; width: 100%; height: 100%; border: 2px solid #FF9933;
  border-radius: 50%; opacity: 0; animation: ripple-anim 3s infinite linear;
}
.delay-1 { animation-delay: 1.5s; }

@keyframes ripple-anim {
  0% { transform: scale(0.7); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: scale(1.5); opacity: 0; }
}

.status-text { font-size: 20px; color: #7a6f64; margin-bottom: 40px; }

.glass-start-button {
  width: 260px; height: 75px; font-size: 28px; font-weight: bold;
  border-radius: 40px; background: #FF9933; border: none;
  box-shadow: 0 8px 20px rgba(255, 153, 51, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: white;
}
.glass-start-button:hover { transform: translateY(-5px) scale(1.05); background: #FFB366; }

.footer-section { position: absolute; bottom: 40px; width: 100%; text-align: center; }
.footer-info { font-size: 14px; color: #b5aaa0; letter-spacing: 1px; }
.dot { display: inline-block; width: 6px; height: 6px; background: #FF9933; border-radius: 50%; margin: 0 10px; opacity: 0.5; }
.auth-warning { 
  margin-top: 15px; color: #f56c6c; font-size: 14px; font-weight: bold; 
  background: rgba(245, 108, 108, 0.1); padding: 8px 20px; border-radius: 20px;
  display: inline-block;
}
</style>