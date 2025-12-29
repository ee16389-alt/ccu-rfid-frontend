<template>
  <div id="app">
    <div v-if="debugMode" class="debug-toolbar">
      <el-tag type="info" size="small">開發者工具</el-tag>
      <el-button @click="currentView = 'RFIDLanding'" size="mini" type="success">長者端 (首頁)</el-button>
      <el-button @click="currentView = 'Login'" size="mini" type="primary">行政管理端</el-button>
      <el-button @click="debugMode = false" size="mini">隱藏工具列</el-button>
    </div>

    <div class="container">
      <RFIDLanding 
        v-if="currentView === 'RFIDLanding'" 
        @scan-success="onScanSuccess" 
      />

      <ActivityMenu 
        v-else-if="currentView === 'ActivityMenu'" 
        :rfid_uid="selectedRfid"
        @select-activity="onSelectActivity"
        @go-back="currentView = 'RFIDLanding'"
      />

      <Slideshow 
        v-else-if="currentView === 'Slideshow'" 
        :rfid_uid="selectedRfid" 
        :activityId="selectedActivityId"
        @go-back="currentView = 'ActivityMenu'"
      />

      <Login 
        v-else-if="currentView === 'Login'" 
        @login-success="currentView = 'ActivityList'" 
      />

      <ActivityList 
        v-else-if="currentView === 'ActivityList'" 
        @manage-activity="onManageActivity"
        @add-activity="onAddActivity" 
      />

      <ActivityManage 
        v-else-if="currentView === 'ActivityManage'" 
        :selectedActivity="activeActivityObject"
        @go-back="currentView = 'ActivityList'"
        @go-screening="currentView = 'AIScreening'" 
        @go-recognition="currentView = 'AIRecognition'"
      />

      <AIRecognitionView 
        v-else-if="currentView === 'AIRecognition'" 
        :activityId="selectedActivityId"
        @go-back="currentView = 'ActivityManage'"
      />

      <AIScreening 
        v-else-if="currentView === 'AIScreening'" 
        :activityId="selectedActivityId"
        @go-back="currentView = 'ActivityManage'"
      />

      <ElderList 
        v-else-if="currentView === 'ElderList'" 
        @edit-elder="onEditElder"
        @add-elder="onAddElder"
      />

      <ElderEdit 
        v-else-if="currentView === 'ElderEdit'" 
        :elderId="selectedResidentId"
        @go-back="currentView = 'ElderList'"
      />
      
      <p v-else style="text-align: center; margin-top: 50px;">
        <i class="el-icon-loading"></i> 系統正在準備中...
      </p>
    </div>

    <div v-if="isAdminView" class="admin-nav">
      <el-button @click="currentView = 'ActivityList'" icon="el-icon-s-order">活動列表</el-button>
      <el-button @click="currentView = 'ElderList'" icon="el-icon-user-solid">長者管理</el-button>
      <el-button @click="logout" type="text" style="color: #F56C6C;">安全登出</el-button>
    </div>
  </div>
</template>

<script>
import RFIDLanding from './components/RFIDLanding.vue';
import ActivityMenu from './components/ActivityMenu.vue';
import Slideshow from './components/Slideshow.vue';
import Login from './components/Login.vue';
import ActivityList from './components/ActivityList.vue';
import ElderList from './components/ElderList.vue';
import ElderEdit from './components/ElderEdit.vue';
import AIScreening from './components/AIScreening.vue';
import ActivityManage from './components/ActivityManage.vue';
import AIRecognitionView from './components/AIRecognitionView.vue';

export default {
  name: 'App',
  components: {
    RFIDLanding, ActivityMenu, Slideshow, Login,
    ActivityList, ElderList, ElderEdit, AIScreening, ActivityManage,
    AIRecognitionView
  },
  data() {
    return {
      currentView: 'RFIDLanding',
      debugMode: true,
      selectedRfid: null, 
      selectedResidentId: null,
      selectedActivityId: null,
      activeActivityObject: null 
    };
  },
  computed: {
    // --- 修正後的 isAdminView ---
isAdminView() {
  const adminPages = [
    'ActivityList', 
    'ElderList', 
    'ActivityManage', 
    'ElderEdit', 
    'AIScreening', 
    'AIRecognition' // 確保這裡對應到 currentView 設定的字串
  ];
  return adminPages.includes(this.currentView);
}
  },
  methods: {
    // 核心調整：智慧跳轉邏輯
    onScanSuccess(payload) {
      // payload 格式: { rfid: '...', match: {...}, activities: [...] }
      this.selectedRfid = payload.rfid;
      
      // 判斷 RFID 類型
      if (payload.match && payload.match.type === 'activity') {
        // 活動卡：直接鎖定該活動 ID 並播放
        this.selectedActivityId = payload.match.id;
        this.currentView = 'Slideshow';
      } else {
        // 長輩卡：跳轉至活動選擇牆
        this.currentView = 'ActivityMenu';
      }
    },

    // 照片牆點擊跳轉
    onSelectActivity(payload) {
      // payload 格式: { activityId: '...', rfid: '...' }
      this.selectedActivityId = payload.activityId;
      this.selectedRfid = payload.rfid; 
      this.currentView = 'Slideshow';
    },

    // 行政管理邏輯 (保持對接 Swagger 路徑)
    onManageActivity(id) {
      this.selectedActivityId = id;
      this.activeActivityObject = { id: id }; 
      this.currentView = 'ActivityManage';
    },

    onAddActivity() {
      this.selectedActivityId = null;
      this.activeActivityObject = null; 
      this.currentView = 'ActivityManage';
    },

    onEditElder(id) {
      this.selectedResidentId = id;
      this.currentView = 'ElderEdit';
    },

    onAddElder() {
      this.selectedResidentId = null;
      this.currentView = 'ElderEdit';
    },

    logout() {
      localStorage.removeItem('userToken'); // 配合 main.js 攔截器
      this.currentView = 'Login';
      this.$message.info('已安全登出');
    }
  }
};
</script>

<style>
/* 全域基本樣式 */
body { margin: 0; font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Arial",sans-serif; }
.debug-toolbar { 
  position: fixed; top: 0; width: 100%; z-index: 9999; background: #333; 
  padding: 5px 20px; display: flex; align-items: center; gap: 10px;
}
.admin-nav {
  position: fixed; bottom: 0; width: 100%; background: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05); display: flex;
  justify-content: center; padding: 10px; z-index: 1000;
}
.container { min-height: 100vh; padding-bottom: 60px; }
</style>