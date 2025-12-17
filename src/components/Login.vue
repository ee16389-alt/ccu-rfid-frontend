<template>
  <div class="login-container">
    <el-card class="login-card">
      <div style="text-align: center;">
        <h2 style="margin-bottom: 5px;">後台登入</h2>
        <p style="color: #606266; margin-bottom: 30px;">請輸入帳號與密碼</p>
      </div>

      <el-form :model="loginForm" label-position="top">
        <el-form-item label="帳號">
          <el-input v-model="loginForm.username" placeholder="請輸入帳號"></el-input>
        </el-form-item>
        <el-form-item label="密碼">
          <el-input type="password" v-model="loginForm.password" placeholder="請輸入密碼" @keyup.enter.native="handleLogin"></el-input>
        </el-form-item>
        <el-form-item style="margin-top: 40px;">
          <el-button 
            type="primary" 
            @click="handleLogin" 
            style="width: 100%; background-color: #FF9933; border-color: #FF9933; font-size: 16px;"
          >
            登入
          </el-button>
        </el-form-item>
      </el-form>

      <div style="text-align: center; margin-top: 20px; color: #909399; font-size: 12px;">
        RFID 回憶錄管理介面
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '', 
        password: ''
      }
    };
  },
  methods: {
    handleLogin() {
      // 1. 檢查輸入
      if (!this.loginForm.username || !this.loginForm.password) {
        this.$message.warning('請輸入帳號與密碼');
        return;
      }

      // 2. 構建符合 API 要求的 Payload (根據您的後端需求使用 account/password)
      const payload = {
        account: this.loginForm.username,
        password: this.loginForm.password 
      };

      // 3. 呼叫登入 API
      this.$http.post('/manager-api/Admin/login', payload)
        .then(response => {
          // 4. 取得 Token
          // 容錯處理：後端可能包在 data 裡或直接在 response.data 中
          const token = response.data.token || (response.data.data && response.data.data.token);

          if (token) {
            // --- 核心修改：永久儲存與即時生效 ---
            // 將 Token 存入 localStorage 以便跨頁面使用
            localStorage.setItem('userToken', token);
            
            // 設定 axios 的全域 Header，讓此元件接下來的請求自動帶上 Token
            this.$http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            this.$message.success('行政管理端登入成功！');
            
            // 通知父元件切換顯示狀態 (例如進入管理首頁)
            this.$emit('login-success');
          } else {
            this.$message.error('登入成功，但未取得授權碼(Token)');
          }
        })
        .catch(error => {
          console.error("登入失敗:", error);
          
          // 5. CORS 診斷處理
          if (error.message === 'Network Error') {
             this.$message.error('無法連線到伺服器，請確認後端 CORS 設定已加入您的網址');
          } else {
             const errorMsg = error.response && error.response.data && error.response.data.message 
                               ? error.response.data.message 
                               : '帳號或密碼錯誤';
             this.$message.error(errorMsg);
          }
        });
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.login-card {
  width: 400px;
  max-width: 90%;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: #FFFFFF;
}

.el-input /deep/ .el-input__inner {
    background-color: #fcf6ee;
    border: 1px solid #f0e6da;
    border-radius: 8px;
}
</style>