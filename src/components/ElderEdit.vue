<template>
  <div class="elder-edit-container">
    <div class="header-section">
      <h2 style="font-weight: 500;">編輯長者資料</h2>
      <span class="elder-info-display">陳阿嬤 • A001</span>
      <el-button 
        type="warning" 
        @click="handleBack"
        class="back-button"
      >
        返回
      </el-button>
    </div>

    <el-card shadow="never" class="main-card">
      <el-row :gutter="30">
        
        <el-col :span="10">
          <el-card shadow="never" class="photo-info-card">
            <div class="photo-placeholder">照片</div>
            <div class="info-details">
              <p>RFID : <span class="info-detail-text">A001</span></p>
              <p>狀態: <span class="info-detail-text status-active">啟用中</span></p>
            </div>
            <el-button type="primary" @click="handlePhotoUpload" class="upload-button">
              上傳照片
            </el-button>
          </el-card>
        </el-col>

        <el-col :span="14">
          <el-form :model="elderForm" label-position="top">
            <el-form-item label="姓名">
              <el-input v-model="elderForm.name" class="form-input"></el-input>
            </el-form-item>
            <el-form-item label="年齡">
              <el-input v-model="elderForm.age" class="form-input" style="width: 150px;"></el-input>
            </el-form-item>
            <el-form-item label="備註">
              <el-input type="textarea" v-model="elderForm.notes" :rows="4" class="form-textarea"></el-input>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </el-card>

    <div style="text-align: right; margin-top: 30px;">
      <el-button 
        type="warning" 
        @click="handleSave"
        class="save-button"
      >
        儲存
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElderEdit',
  data() {
    return {
      elderForm: {
        name: '陳阿嬤',
        age: 80,
        notes: '長期需人協助'
      }
    };
  },
  methods: {
    handleBack() {
      this.$message.info('點擊返回 ');
    },
    handlePhotoUpload() {
      this.$message.info('點擊上傳照片 ');
    },
    handleSave() {
      this.$message.success('點擊儲存');
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
.elder-info-display {
    font-size: 20px;
    color: #909399;
    flex-grow: 1;
}
.back-button {
  background-color: #FF9933;
  border-color: #FF9933;
}
.main-card {
    border-radius: 12px;
    border: 1px solid #f0e6da;
    box-shadow: none;
    background-color: #fcf6ee;
    padding: 20px;
}
.photo-info-card {
    border-radius: 12px;
    border: 1px solid #e0c8b0;
    box-shadow: none;
    background-color: white;
    padding: 20px;
}
.photo-placeholder {
    width: 100%;
    padding-top: 60%;
    background-color: #f0f0f0;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    color: #909399;
}
.upload-button {
    background-color: #FF9933;
    border-color: #FF9933;
    width: 100%;
    margin-top: 15px;
}
.info-detail-text {
    font-weight: 600;
    color: #303133;
}
.status-active {
    color: #67c23a; /* 啟用中顯示綠色 */
}
.form-input /deep/ .el-input__inner,
.form-textarea /deep/ .el-textarea__inner {
    border-radius: 8px;
    background-color: white;
    border-color: #e0c8b0;
}
.save-button {
  background-color: #FF9933;
  border-color: #FF9933;
  font-size: 16px;
}
</style>