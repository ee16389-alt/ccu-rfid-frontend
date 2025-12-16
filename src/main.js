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
  timeout: 10000, // 考慮到網路延遲，設定 10 秒超時
});

// 將 axios 掛載到 Vue 實例，之後用 this.$http 就能呼叫
Vue.prototype.$http = instance;

new Vue({
  render: h => h(App),
}).$mount('#app')