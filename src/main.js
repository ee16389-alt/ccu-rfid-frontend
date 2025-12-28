import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import axios from 'axios';
import VueRouter from 'vue-router';

// 導入核心視圖組件
import AIRecognitionView from './components/AIRecognitionView.vue';

Vue.config.productionTip = false
Vue.use(ElementUI);
Vue.use(VueRouter);

// --- 設定路由表 ---
// 這裡保留彈性，讓您未來可以透過網址直接進入特定的辨識結果頁
const routes = [
  {
    path: '/activity/:activityId/ai',
    name: 'AIRecognition',
    component: AIRecognitionView,
    props: true // 允許將路徑中的 activityId 直接作為 props 傳入組件
  }
];

const router = new VueRouter({
  mode: 'hash', // GitHub Pages 必須使用 hash 模式以避免 404 錯誤
  base: process.env.BASE_URL, 
  routes
});

// --- Axios 實例配置 ---
const instance = axios.create({
  // 修正點 1：將 /manager-api 直接加入 baseURL，統一口徑
  baseURL: 'https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net/manager-api',
  // 修正點 2：延長逾時時間至 30 秒，避免 Azure 冷啟動導致連線中斷
  timeout: 30000, 
  withCredentials: false 
});

// --- 攔截器：確保每一筆請求都帶上管理員 Token ---
instance.interceptors.request.use(
  config => {
    // 從本地儲存取得 Token
    const token = localStorage.getItem('userToken');
    if (token) {
      // 為所有請求注入 Authorization Header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 全域掛載 API 請求工具，讓組件內可以使用 this.$http
Vue.prototype.$http = instance;

new Vue({
  router, 
  render: h => h(App),
}).$mount('#app')