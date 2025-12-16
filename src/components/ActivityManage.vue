<template>
  <div class="activity-manage-container">
    <div class="header-section">
      <h2 style="font-weight: 500;">活動管理</h2>
      <span class="activity-name-display">社區歌唱日</span>
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
          <p>活動名稱: <span class="info-detail">社區歌唱日</span></p>
          <p>日期: <span class="info-detail">2025-11-01</span></p>
          <p>地點: <span class="info-detail">XX社區活動中心</span></p>
          <p>目前照片: <span class="info-detail">48 張</span></p>
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
            action="#"
            multiple
            :auto-upload="false"
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
  data() {
    return {
      totalCount: 48,
      analyzedCount: 36,
    };
  },
  computed: {
    progressPercentage() {
      return Math.floor((this.analyzedCount / this.totalCount) * 100);
    }
  },
  methods: {
    handleBack() {
      this.$message.info('切版完成，點擊返回 (需實作頁面導航)');
    },
    handleSave() {
      this.$message.success('切版完成，點擊儲存設定 (需實作儲存邏輯)');
    }
  }
};
</script>

<style scoped>
/* 省略其他樣式... */
.header-section {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}
.activity-name-display {
    font-size: 20px;
    color: #909399;
    flex-grow: 1;
}

.back-button {
  background-color: #FF9933;
  border-color: #FF9933;
}

.info-card {
  border-radius: 12px;
  border: 1px solid #f0e6da;
  box-shadow: none;
  background-color: #fcf6ee;
}

.upload-box /deep/ .el-upload-dragger {
    background-color: #fcf6ee;
    border: 1px dashed #FF9933;
    border-radius: 10px;
    height: 300px;
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