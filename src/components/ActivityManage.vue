<template>
  <div class="activity-manage-container">
    <div class="header-section">
      <h2 style="font-weight: 500;">活動管理</h2>
      <span class="activity-name-display">{{ activityInfo.title }}</span>
      <el-button 
        type="warning" 
        @click="handleBack"
        class="back-button"
      >
        返回
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="10">
        <el-card shadow="never" class="info-card">
          <h3 slot="header" class="card-title">活動資訊</h3>
          <p>活動名稱: <span class="info-detail">{{ activityInfo.title }}</span></p>
          <p>日期: <span class="info-detail">{{ activityInfo.date }}</span></p>
          <p>地點: <span class="info-detail">{{ activityInfo.location }}</span></p>
          <p>目前照片: <span class="info-detail">{{ activityInfo.photoCount }} 張</span></p>
        </el-card>

        <el-card shadow="never" class="info-card" style="margin-top: 20px;">
          <h3 slot="header" class="card-title">AI 分析狀態</h3>
          <p style="margin-bottom: 15px;">已分析照片: {{ analyzedCount }} / {{ totalCount }} 張</p>
          <el-progress 
            :percentage="progressPercentage" 
            :stroke-width="15"
            :show-text="false"
            color="#FF9933"
          ></el-progress>
          <p v-if="progressPercentage === 100" style="color: #67c23a; margin-top: 10px;">分析完成，請進入 AI 分群校對頁面。</p>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card shadow="never" class="upload-card">
          <h3 slot="header" class="card-title">上傳活動照片</h3>
          <el-upload
            class="upload-box"
            drag
            :action="uploadAction"
            :headers="uploadHeaders"
            multiple
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
          >
            <i class="el-icon-upload upload-icon"></i>
            <div class="el-upload__text upload-text">
              拖曳照片到此處，或<span style="color: #FF9933;">點擊選擇檔案</span>
            </div>
          </el-upload>
          
          <div style="text-align: right; margin-top: 20px;">
            <el-button 
              type="primary" 
              @click="handleSave"
              class="save-button"
            >
              儲存設定
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'ActivityManage',
  // 接收從清單頁傳過來的活動資料或 ID
  props: ['selectedActivity'],
  data() {
    return {
      activityInfo: {
        id: '',
        title: '載入中...',
        date: '',
        location: 'XX社區活動中心',
        photoCount: 0
      },
      totalCount: 0,
      analyzedCount: 0,
      // 核心修改：從 localStorage 取得 Token 給上傳組件使用
      uploadHeaders: {
        'Authorization': `Bearer ${localStorage.getItem('userToken')}`
      }
    };
  },
  computed: {
    progressPercentage() {
      if (this.totalCount === 0) return 0;
      return Math.floor((this.analyzedCount / this.totalCount) * 100);
    },
    // 動態生成上傳網址
    uploadAction() {
      return `https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net/manager-api/Activity/${this.activityInfo.id}/Upload`;
    }
  },
  mounted() {
    if (this.selectedActivity) {
      this.initData();
    }
  },
  methods: {
    initData() {
      this.activityInfo.id = this.selectedActivity.id;
      this.activityInfo.title = this.selectedActivity.name;
      this.activityInfo.date = this.selectedActivity.date;
      this.activityInfo.photoCount = this.selectedActivity.photoCount;
      this.totalCount = this.selectedActivity.photoCount;
      this.analyzedCount = 0; // 初始值
    },
    handleBack() {
      this.$emit('go-back');
    },
    handleSave() {
      const token = localStorage.getItem('userToken'); //
      
      this.$http.put(`/manager-api/Activity/${this.activityInfo.id}`, this.activityInfo, {
        headers: {
          'Authorization': `Bearer ${token}` //
        }
      })
      .then(() => {
        this.$message.success('活動資訊儲存成功');
      })
      .catch(err => {
        console.error("儲存失敗:", err);
        this.$message.error('儲存失敗，請檢查網路連線或 CORS 設定'); //
      });
    },
    handleUploadSuccess(res) {
      this.$message.success('照片上傳成功！');
      // 上傳成功後通常需要重新刷新資料或更新照片計數
    },
    handleUploadError(err) {
      this.$message.error('上傳失敗，請確認登入狀態及 CORS 授權');
    }
  }
};
</script>

<style scoped>
.header-section {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}
.activity-name-display {
    font-size: 20px;
    color: #909399;
    flex-grow: 1;
    margin-left: 15px;
}

.back-button {
  background-color: #FF9933;
  border-color: #FF9933;
  color: white;
}

.info-card {
  border-radius: 12px;
  border: 1px solid #f0e6da;
  box-shadow: none;
  background-color: #fcf6ee;
}

.card-title {
  margin: 0;
  font-size: 16px;
  color: #606266;
}

.info-detail {
  font-weight: bold;
  color: #303133;
}

.upload-card {
  border-radius: 12px;
  border: 1px solid #f0e6da;
}

.upload-box /deep/ .el-upload-dragger {
    background-color: #fcf6ee;
    border: 1px dashed #FF9933;
    border-radius: 10px;
    height: 300px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.upload-icon {
    font-size: 60px;
    color: #FF9933;
    margin-bottom: 20px;
}

.save-button {
  background-color: #FF9933;
  border-color: #FF9933;
}
</style>