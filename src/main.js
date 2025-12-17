// src/main.js
import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

// 引入 axios
import axios from 'axios';

Vue.config.productionTip = false
Vue.use(ElementUI);

// 設定 Axios 基礎資訊
const instance = axios.create({
  // 指向您提供的 Azure Domain
  baseURL: 'https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net',
  timeout: 10000, 
  // 核心修改 1：允許攜帶憑證 (配合後端的 Access-Control-Allow-Credentials)
  withCredentials: false // 如果後端是純 JWT 驗證，維持 false 即可；若後端有用到 Cookie 則設為 true
});

// 核心修改 2：加入請求攔截器 (Request Interceptor)
// 這是為了確保「即使您某頁忘了寫 headers」，這裡也會幫您補上最後一道防線
instance.interceptors.request.use(
  config => {
    // 從 localStorage 讀取您在 Login.vue 存下的鑰匙
    const token = localStorage.getItem('userToken');
    if (token) {
      // 自動注入 Authorization Header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 核心修改 3：加入回應攔截器 (Response Interceptor)
// 當後端回傳 401 代表 Token 過期了，直接踢回登入頁
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      ElementUI.Message.error('登入已過期，請重新登入');
      localStorage.removeItem('userToken'); // 清除無效鑰匙
      // 如果有用到 router 可以跳轉：router.push('/login');
    }
    return Promise.reject(error);
  }
);

// 將 axios 掛載到 Vue 實例
Vue.prototype.$http = instance;

new Vue({
  render: h => h(App),
}).$mount('#app')