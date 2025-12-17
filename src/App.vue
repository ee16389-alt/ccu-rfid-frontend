<template>
  <div id="app">
    <div v-if="debugMode" class="debug-toolbar">
      <el-tag type="info" size="small">開發者工具</el-tag>
      <el-button @click="currentView = 'RFIDLanding'" size="mini" type="success">長者端(0)</el-button>
      <el-button @click="currentView = 'Login'" size="mini" type="primary">管理端(4)</el-button>
      <el-button @click="debugMode = false" size="mini">隱藏</el-button>
    </div>

    <div class="container">
      <RFIDLanding 
        v-if="currentView === 'RFIDLanding'" 
        @scan-success="onScanSuccess" 
      />

      <ActivityMenu 
        v-else-if="currentView === 'ActivityMenu'" 
        :residentId="selectedResidentId"
        @select-activity="onSelectActivity"
        @go-back="currentView = 'RFIDLanding'"
      />

      <Slideshow 
        v-else-if="currentView === 'Slideshow'" 
        :residentId="selectedResidentId"
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
        @add-activity="currentView = 'ActivityManage'"
      />

      <ActivityManage 
        v-else-if="currentView === 'ActivityManage'" 
        :selectedActivity="activeActivityObject"
        @go-back="currentView = 'ActivityList'"
        @go-screening="currentView = 'AIScreening'"
      />

      <AIScreening 
        v-else-if="currentView === 'AIScreening'" 
        :activityId="selectedActivityId"
        @go-back="currentView = 'ActivityManage'"
      />

      <ElderList 
        v-else-if="currentView === 'ElderList'" 
        @edit-elder="onEditElder"
      />

      <ElderEdit 
        v-else-if="currentView === 'ElderEdit'" 
        :elderId="selectedResidentId"
        @go-back="currentView = 'ElderList'"
      />
      
      <p v-else style="text-align: center;">系統載入中...</p>
    </div>

    <div v-if="isAdminView" class="admin-nav">
      <el-button @click="currentView = 'ActivityList'" icon="el-icon-s-order">活動</el-button>
      <el-button @click="currentView = 'ElderList'" icon="el-icon-user-solid">長者</el-button>
      <el-button @click="logout" type="text" style="color: #909399;">登出</el-button>
    </div>
  </div>
</template>

<script>
// 引入所有組件
import RFIDLanding from './components/RFIDLanding.vue';
import ActivityMenu from './components/ActivityMenu.vue';
import Slideshow from './components/Slideshow.vue';
import Login from './components/Login.vue';
import ActivityList from './components/ActivityList.vue';
import ElderList from './components/ElderList.vue';
import ElderEdit from './components/ElderEdit.vue';
import AIScreening from './components/AIScreening.vue';
import ActivityManage from './components/ActivityManage.vue';

export default {
  name: 'App',
  components: {
    RFIDLanding, ActivityMenu, Slideshow, Login,
    ActivityList, ElderList, ElderEdit, AIScreening, ActivityManage
  },
  data() {
    return {
      currentView: 'RFIDLanding',
      debugMode: true,
      selectedResidentId: null, // 暫存長者 ID
      selectedActivityId: null, // 暫存活動 ID
      activeActivityObject: null // 傳遞給管理頁面的物件
    };
  },
  computed: {
    // 判斷目前是否在後台管理頁面
    isAdminView() {
      const adminPages = ['ActivityList', 'ElderList', 'ActivityManage', 'ElderEdit', 'AIScreening'];
      return adminPages.includes(this.currentView);
    }
  },
  methods: {
    // 處理長者感應成功
    onScanSuccess(id) {
      this.selectedResidentId = id;
      this.currentView = 'ActivityMenu';
    },
    // 處理選擇播放活動
    onSelectActivity(id) {
      this.selectedActivityId = id;
      this.currentView = 'Slideshow';
    },
    // 處理點擊活動管理
    onManageActivity(id) {
      this.selectedActivityId = id;
      this.activeActivityObject = { id: id, name: '載入中...' };
      this.currentView = 'ActivityManage';
    },
    // 處理點擊編輯長者
    onEditElder(id) {
      this.selectedResidentId = id;
      this.currentView = 'ElderEdit';
    },
    // 登出並清除 Token
    logout() {
      localStorage.removeItem('userToken');
      this.currentView = 'Login';
    }
  }
};
</script>

<style>
#app {
  font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
  min-height: 100vh;
  background-color: #f7f3ed;
}

.debug-toolbar {
  padding: 8px;
  background: #333;
  display: flex;
  gap: 10px;
  align-items: center;
  overflow-x: auto;
}

.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  background: #ffffff;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 1000;
}

/* 移除 Element UI 預設按鈕間距 */
.admin-nav .el-button + .el-button {
  margin-left: 0;
}
</style>