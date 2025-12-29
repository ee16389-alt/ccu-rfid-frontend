<template>
  <div id="app">
    <div v-if="debugMode" class="side-debug-trigger" @click="drawerVisible = true">
      <i class="el-icon-setting"></i>
      <span>快速切換</span>
    </div>

    <el-drawer
      title="開發者控制台"
      :visible.sync="drawerVisible"
      direction="ltr"
      size="220px"
      custom-class="debug-drawer"
    >
      <div class="drawer-content">
        <el-divider content-position="left">頁面切換</el-divider>
        <div class="drawer-buttons">
          <el-button @click="switchView('RFIDLanding')" size="small" type="success" plain icon="el-icon-s-home">長者端 (首頁)</el-button>
          <el-button @click="switchView('Login')" size="small" type="primary" plain icon="el-icon-s-custom">行政管理端</el-button>
          <el-button @click="debugMode = false" size="small" type="info" plain icon="el-icon-view">徹底隱藏工具</el-button>
        </div>
        
        <el-divider content-position="left">系統狀態</el-divider>
        <ul class="status-list">
          <li>目前視圖: {{ currentView }}</li>
          <li>活動 ID: {{ selectedActivityId || '無' }}</li>
        </ul>
      </div>
    </el-drawer>

    <div class="container">
      <RFIDLanding 
        v-if="currentView === 'RFIDLanding'" 
        @scan-success="onScanSuccess" 
      />

      <ActivityMenu 
        v-else-if="currentView === 'ActivityMenu'" 
        :rfid="selectedRfid"
        @select-activity="onSelectActivity"
        @go-back="currentView = 'RFIDLanding'"
      />

      <Slideshow 
        v-else-if="currentView === 'Slideshow'" 
        :rfid="selectedRfid" 
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
      drawerVisible: false, // 修正點：控制側邊欄開關
      selectedRfid: null, 
      selectedResidentId: null,
      selectedActivityId: null,
      activeActivityObject: null 
    };
  },
  computed: {
    isAdminView() {
      const adminPages = ['ActivityList', 'ElderList', 'ActivityManage', 'ElderEdit', 'AIScreening', 'AIRecognition'];
      return adminPages.includes(this.currentView);
    }
  },
  methods: {
    switchView(view) {
      this.currentView = view;
      this.drawerVisible = false; // 切換後自動收起
    },
    onScanSuccess(payload) {
      this.selectedRfid = payload.rfid;
      if (payload.match && payload.match.type === 'activity') {
        this.selectedActivityId = payload.match.id;
        this.currentView = 'Slideshow';
      } else {
        this.currentView = 'ActivityMenu';
      }
    },
    onSelectActivity(payload) {
      this.selectedActivityId = payload.activityId;
      this.selectedRfid = payload.rfid; 
      this.currentView = 'Slideshow';
    },
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
      localStorage.removeItem('userToken');
      this.currentView = 'Login';
      this.$message.info('已安全登出');
    }
  }
};
</script>

<style>
body { margin: 0; font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Arial",sans-serif; background-color: #f5f7fa; }

/* 修正點 3：側邊觸發按鈕樣式（垂直貼在左邊） */
.side-debug-trigger {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: #303133;
  color: white;
  padding: 12px 6px;
  border-radius: 0 10px 10px 0;
  cursor: pointer;
  z-index: 2500;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  box-shadow: 2px 0 10px rgba(0,0,0,0.2);
  opacity: 0.6;
  transition: all 0.3s;
}
.side-debug-trigger:hover {
  opacity: 1;
  padding-left: 10px;
}
.side-debug-trigger i { margin-bottom: 5px; font-size: 18px; }
.side-debug-trigger span { writing-mode: vertical-lr; letter-spacing: 2px; }

.drawer-content { padding: 0 20px; }
.drawer-buttons .el-button { width: 100%; margin-left: 0 !important; margin-bottom: 12px; }
.status-list { list-style: none; padding: 0; font-size: 13px; color: #606266; line-height: 2; }

.admin-nav {
  position: fixed; bottom: 0; width: 100%; background: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05); display: flex;
  justify-content: center; padding: 10px; z-index: 1000;
}
.container { min-height: 100vh; padding-bottom: 80px; }
</style>