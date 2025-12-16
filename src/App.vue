<template>
  <div id="app">
    <div style="padding: 10px; background: #f0f0f0; border-bottom: 1px solid #ddd; overflow-x: auto; white-space: nowrap;">
      
      <el-button @click="currentView = 'RFIDLanding'" size="small" type="success">RFID 感應 (Frame 0)</el-button>
      <el-button @click="currentView = 'ActivityMenu'" size="small">回憶照片牆 (Frame 1)</el-button>
      <el-button @click="currentView = 'Slideshow'" size="small">投影片播放 (Frame 3)</el-button>

      <el-button @click="currentView = 'Login'" size="small" type="primary">後台登入 (Frame 4)</el-button>
      <el-button @click="currentView = 'ActivityList'" size="small">活動清單 (Frame 5)</el-button>
      <el-button @click="currentView = 'ElderList'" size="small">長者清單 (Frame 6)</el-button>
      <el-button @click="currentView = 'ActivityManage'" size="small">活動管理 (Frame 2)</el-button>
      <el-button @click="currentView = 'AIScreening'" size="small">AI 審核 (Frame 8)</el-button>
      <el-button @click="currentView = 'ElderEdit'" size="small">編輯長者 (Frame 7)</el-button>
      
    </div>

    <div style="padding: 20px;">
      <RFIDLanding v-if="currentView === 'RFIDLanding'" />
      <Login v-else-if="currentView === 'Login'" />
      <ActivityList v-else-if="currentView === 'ActivityList'" />
      <ElderList v-else-if="currentView === 'ElderList'" />
      <ActivityMenu v-else-if="currentView === 'ActivityMenu'" />
      <ActivityManage v-else-if="currentView === 'ActivityManage'" />
      <Slideshow v-else-if="currentView === 'Slideshow'" />
      <ElderEdit v-else-if="currentView === 'ElderEdit'" />
      <AIScreening v-else-if="currentView === 'AIScreening'" />
      
      <p v-else style="text-align: center;">請選擇一個畫面開始切版</p>
    </div>
  </div>
</template>

<script>
// 引入所有 9 個畫面元件
import RFIDLanding from './components/RFIDLanding.vue'; // Frame 0
import ActivityMenu from './components/ActivityMenu.vue'; // Frame 1
import Slideshow from './components/Slideshow.vue'; // Frame 3
import Login from './components/Login.vue'; // Frame 4
import ActivityList from './components/ActivityList.vue'; // Frame 5
import ElderList from './components/ElderList.vue'; // Frame 6
import ElderEdit from './components/ElderEdit.vue'; // Frame 7
import AIScreening from './components/AIScreening.vue'; // Frame 8
import ActivityManage from './components/ActivityManage.vue'; // Frame 2

export default {
  name: 'App',
  components: {
    RFIDLanding,
    ActivityMenu,
    Slideshow,
    Login,
    ActivityList,
    ElderList,
    ElderEdit,
    AIScreening,
    ActivityManage
  },
  data() {
    return {
      // 將預設畫面設定為 RFID 感應頁 (Frame 0)，這是長者端的第一個畫面
      currentView: 'RFIDLanding' 
    };
  }
};
</script>

<style>
/* 為了讓 Element UI 圓角和背景更接近 Figma */
#app {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #2c3e50;
  min-height: 100vh;
  background-color: #f7f3ed; /* 淺黃/淺米色背景 */
}
/* 移除預設的 Vue Logo 樣式 */
.logo-container {
  display: none;
}
</style>