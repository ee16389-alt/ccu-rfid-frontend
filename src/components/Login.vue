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
          <el-input type="password" v-model="loginForm.password" placeholder="請輸入密碼"></el-input>
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
        username: '', // 對應頁面輸入框
        password: ''
      }
    };
  },
  methods: {
    handleLogin() {
      // 構建符合 LoginRequest 結構的 Payload
      const payload = {
        account: this.loginForm.username, // 欄位須為 account
        password: this.loginForm.password  // 欄位須為 password
      };

      // 呼叫登入 API
      this.$http.post('/manager-api/Admin/login', payload)
        .then(response => {
          this.$message.success('行政管理端登入成功！');
          
          // 如果 API 回傳 Token，我們將其存入全域 Header
          // 這樣之後呼叫其他 API 就不會再出現 401 錯誤了
          if (response.data && response.data.token) {
            this.$http.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          }

          // 通知父元件登入成功，切換畫面
          this.$emit('login-success');
        })
        .catch(error => {
          console.error("登入失敗:", error);
          this.$message.error('帳號或密碼錯誤，請重新輸入');
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