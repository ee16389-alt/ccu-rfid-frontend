<template>
  <div class="login-wrapper">
    <div class="login-box">
      <div class="login-image-side">
        <div class="side-bg"></div>
        <div class="overlay">
          <h3>智慧回憶錄</h3>
          <p>用科技守護每一份珍貴的長者記憶</p>
        </div>
      </div>

      <el-card class="login-card" shadow="never">
        <div slot="header" class="login-header">
          <img src="https://img.icons8.com/color/96/elderly-person.png" class="login-logo" alt="logo">
          <h2>行政管理系統</h2>
          <p class="subtitle">請輸入您的管理員憑證</p>
        </div>
        
        <el-form :model="loginForm" label-position="top">
          <el-form-item label="管理員帳號">
            <el-input 
              v-model="loginForm.account" 
              placeholder="請輸入帳號 (ccu)" 
              prefix-icon="el-icon-user"
              clearable
            ></el-input>
          </el-form-item>
          
          <el-form-item label="管理密碼">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="請輸入密碼 (123)" 
              prefix-icon="el-icon-lock" 
              show-password
              @keyup.enter.native="handleLogin"
            ></el-input>
          </el-form-item>

          <el-button 
            type="primary" 
            class="submit-btn" 
            @click="handleLogin" 
            :loading="loading"
          >
            啟動管理平台
          </el-button>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      loginForm: { account: 'ccu', password: '123' },
      loading: false
    };
  },
  methods: {
    async handleLogin() {
      // 驗證欄位是否填寫
      if (!this.loginForm.account || !this.loginForm.password) {
        this.$message.warning('請完整輸入帳號密碼');
        return;
      }

      this.loading = true;
      try {
        // 修正：發送相對路徑請求，攔截器會自動注入 baseURL
        const res = await this.$http.post('/Admin/login', this.loginForm);

        if (res.data && res.data.access_token) {
          // 儲存 Token 供全域攔截器使用
          localStorage.setItem('userToken', res.data.access_token);
          
          this.$message({
            message: '身份驗證成功，歡迎進入管理系統',
            type: 'success',
            duration: 2000
          });
          
          // 通知 App.vue 切換至主畫面
          this.$emit('login-success');
        }
      } catch (err) {
        console.error('Login Error:', err);
        const status = err.response ? err.response.status : null;
        
        if (status === 401) {
          this.$message.error('帳號或密碼錯誤，請重新輸入');
        } else {
          // 配合 main.js 處理冷啟動逾時
          this.$message.error('連線失敗：伺服器啟動中或網路異常');
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* 保持原有美觀樣式 */
.login-wrapper { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f7f3ed; }
.login-box { display: flex; width: 900px; min-height: 580px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
.login-image-side { flex: 1.2; position: relative; background-color: #f0e6da; }
.side-bg { 
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
  background-image: url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop');
  background-size: cover; background-position: center; z-index: 1;
}
.overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white; z-index: 2; text-align: left; }
.overlay h3 { font-size: 28px; margin-bottom: 10px; }
.login-card { flex: 1; border: none !important; padding: 30px; display: flex; flex-direction: column; justify-content: center; }
.login-header { text-align: center; margin-bottom: 30px; }
.login-logo { width: 64px; margin-bottom: 15px; }
.subtitle { color: #909399; font-size: 14px; margin-top: 8px; }
.submit-btn { width: 100%; background-color: #FF9933; border-color: #FF9933; border-radius: 10px; font-weight: bold; font-size: 16px; padding: 12px; margin-top: 10px; }
@media (max-width: 768px) { .login-image-side { display: none; } .login-box { width: 90%; } }
</style>