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

// --- 1. 設定路由表 ---
// 使用 hash 模式以確保在 GitHub Pages 上重新整理不會出現 404
const routes = [
  {
    path: '/activity/:activityId/ai',
    name: 'AIRecognition',
    component: AIRecognitionView,
    props: true 
  }
];

const router = new VueRouter({
  mode: 'hash', 
  base: process.env.BASE_URL, 
  routes
});

// --- 2. Axios 實例配置 ---
const instance = axios.create({
  // 將 /manager-api 直接加入 baseURL，避免組件內路徑重複
  baseURL: 'https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net/manager-api',
  // 延長逾時時間至 30 秒，應對 Azure 冷啟動延遲
  timeout: 30000, 
  withCredentials: false 
});

// --- 3. 請求攔截器：自動帶入 Authorization Token ---
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// --- 4. 回應攔截器：處理連線逾時與身份失效 ---
instance.interceptors.response.use(
  response => response,
  error => {
    // 處理請求逾時提示
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      ElementUI.Message.error('伺服器回應過慢，請稍後再試（Azure 啟動中）');
    }
    // 處理 401 Token 過期
    else if (error.response && error.response.status === 401) {
      ElementUI.Message.warning('登入已逾時，請重新登入');
      localStorage.removeItem('userToken');
      // 如果有 App.vue 的事件控制，可在此觸發跳轉
    }
    // 處理 404 路徑錯誤提示
    else if (error.response && error.response.status === 404) {
      console.error('API 路徑錯誤，請檢查是否重複拼接了 manager-api');
    }
    return Promise.reject(error);
  }
);

// --- 5. 全域掛載 ---
// 讓組件內可以使用 this.$http 調用 API
Vue.prototype.$http = instance;

new Vue({
  router, 
  render: h => h(App),
}).$mount('#app')