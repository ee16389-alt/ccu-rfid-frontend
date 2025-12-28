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
// 組件引入保持不變 ...
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
      selectedRfid: null, // 改為追蹤選中的 RFID 序號
      selectedResidentId: null, // 用於行政端的編輯 ID
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
    // 當 RFID 感應成功時
    onScanSuccess(rfid) {
      this.selectedRfid = rfid;
      this.currentView = 'ActivityMenu';
    },
    // 當選擇特定活動回憶時
    onSelectActivity(payload) {
      this.selectedActivityId = payload.activityId;
      this.selectedRfid = payload.rfid; // 再次確認 RFID 傳遞
      this.currentView = 'Slideshow';
    },
    // 行政端：管理活動
    onManageActivity(id) {
      this.selectedActivityId = id;
      this.activeActivityObject = { id: id }; 
      this.currentView = 'ActivityManage';
    },
    // 行政端：建立活動
    onAddActivity() {
      this.selectedActivityId = null;
      this.activeActivityObject = null; 
      this.currentView = 'ActivityManage';
    },
    // 行政端：編輯長者
    onEditElder(id) {
      this.selectedResidentId = id;
      this.currentView = 'ElderEdit';
    },
    // 行政端：新增長者
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