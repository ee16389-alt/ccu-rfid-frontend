<template>
  <div class="activity-manage-container">
    <div class="header-section">
      <el-button icon="el-icon-back" circle @click="$emit('go-back')"></el-button>
      <h2 style="margin-left: 15px;">{{ isNewActivity ? '建立活動檔案' : '管理活動內容' }}</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="never" class="info-card" v-loading="submitting">
          <div slot="header" class="info-card-header">
            <span><i class="el-icon-collection-tag"></i> 活動基本設定</span>
          </div>
          
          <el-form :model="activityForm" label-position="top">
            <el-form-item label="活動名稱">
              <el-input 
                v-model="activityForm.title" 
                placeholder="例如：12月象棋大賽"
                :disabled="!isNewActivity"
              ></el-input>
            </el-form-item>

            <el-form-item label="RFID 實體卡綁定">
              <el-input 
                v-model="activityForm.rfid" 
                placeholder="請掃描或輸入 RFID 序號"
                :disabled="!isNewActivity"
                clearable
              >
                <i slot="prefix" class="el-icon-postcard"></i>
              </el-input>
              <div class="form-tip">綁定後，長者掃描此卡可直接進入該活動相簿</div>
            </el-form-item>

            <el-form-item label="活動日期">
              <el-date-picker
                v-model="activityForm.activity_at"
                type="date"
                placeholder="選擇活動日期"
                style="width: 100%"
                value-format="yyyy-MM-dd"
                :disabled="!isNewActivity"
              ></el-date-picker>
            </el-form-item>
            <el-form-item label="活動地點">
              <el-input 
                v-model="activityForm.location" 
                placeholder="例如：社區交誼廳"
                :disabled="!isNewActivity"
              ></el-input>
            </el-form-item>
            
            <el-button 
              v-if="isNewActivity" 
              type="primary" 
              style="width: 100%; margin-top: 10px;" 
              @click="handleCreateActivity"
            >建立活動並開始上傳</el-button>
          </el-form>

          <div v-if="!isNewActivity" class="progress-section">
            <el-divider></el-divider>
            <p class="progress-text">
              <i class="el-icon-cpu"></i> AI 人臉特徵掃描：{{ analyzedCount }} / {{ activityForm.photoCount }}
            </p>
            <el-progress 
              :percentage="progressPercentage" 
              :stroke-width="18"
              :color="customColors"
              striped
              striped-flow
            ></el-progress>
            
            <div v-if="progressPercentage === 100 && activityForm.photoCount > 0" class="ai-guide-box">
              <el-alert 
                title="掃描完成！AI 已自動識別長者身分" 
                type="success" 
                :closable="false" 
                show-icon
              ></el-alert>
              
              <div class="button-group">
                <el-button 
                  type="success" 
                  class="pulse-btn" 
                  icon="el-icon-picture" 
                  @click="$emit('go-recognition')"
                >查看 AI 辨識成果</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="never" class="upload-card" :class="{ 'disabled-overlay': isNewActivity }">
          <div slot="header" class="upload-header">
            <span><i class="el-icon-upload"></i> 批次照片上傳 (支援拖拽)</span>
            <el-tag v-if="isNewActivity" type="warning" size="small">請先於左側儲存資訊</el-tag>
          </div>
          
          <el-upload
            v-if="!isNewActivity"
            :action="getUploadUrl"
            name="Files"
            :headers="uploadHeaders"
            multiple
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
          
          <div v-else class="upload-placeholder">
            <div class="placeholder-icon-wrap">
              <i class="el-icon-picture-outline" style="font-size: 60px;"></i>
            </div>
            <h3>等待建立活動</h3>
            <p>請先完成左側活動基本資訊，即可開啟雲端 AI 上傳通道</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'ActivityManage',
  props: ['selectedActivity'], 
  data() {
    return {
      submitting: false,
      isNewActivity: !this.selectedActivity?.id,
      activityForm: {
        id: this.selectedActivity?.id || null,
        title: this.selectedActivity?.title || '',
        activity_at: this.selectedActivity?.activity_at || '',
        location: this.selectedActivity?.location || '',
        rfid: this.selectedActivity?.rfid || '', 
        photoCount: this.selectedActivity?.photoCount || 0
      },
      analyzedCount: this.selectedActivity?.photoCount || 0,
      customColors: [
        { color: '#f56c6c', percentage: 20 },
        { color: '#67c23a', percentage: 100 }
      ]
    };
  },
  computed: {
    progressPercentage() {
      if (this.activityForm.photoCount === 0) return 0;
      return Math.floor((this.analyzedCount / this.activityForm.photoCount) * 100);
    },
    getUploadUrl() {
      const baseUrl = this.$http.defaults.baseURL;
      // 自動對齊 API 端點路徑
      return `${baseUrl}/Activity/${this.activityForm.id}/UploadBatch`;
    },
    uploadHeaders() {
      return {
        'Authorization': `Bearer ${localStorage.getItem('userToken')}`
      };
    }
  },
  methods: {
    async handleCreateActivity() {
      if (!this.activityForm.title) {
        this.$message.warning('請輸入活動名稱');
        return;
      }
      this.submitting = true;
      try {
        // 使用相對路徑與 JSON 格式，避開 415 錯誤
        const res = await this.$http.post('/Activity', this.activityForm);
        
        this.activityForm.id = res.data.id;
        this.isNewActivity = false;
        this.$message.success('活動檔案已建立，且已綁定 RFID');
      } catch (err) {
        console.error('Create Activity Error:', err.response);
        this.$message.error('活動建立失敗，請檢查欄位格式或連線狀態');
      } finally {
        this.submitting = false;
      }
    },
    handleUploadSuccess() {
      this.$message.success('照片上傳成功');
      this.activityForm.photoCount++;
      // 模擬 AI 進度更新
      setTimeout(() => { this.analyzedCount++; }, 1500);
    },
    handleUploadError(err) {
      console.error('Upload Error:', err);
      this.$message.error('上傳失敗，請確認檔案大小或伺服器狀態');
    }
  }
};
</script>

<style scoped>
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.4; }
.activity-manage-container { padding: 15px; background-color: #fcfaf8; min-height: 80vh; }
.header-section { display: flex; align-items: center; margin-bottom: 25px; }
.header-section h2 { margin: 0; color: #5d5146; font-size: 22px; }
.info-card { border-radius: 12px; border: 1px solid #e9e0d6; }
.info-card-header { font-weight: bold; color: #5d5146; }
.progress-section { margin-top: 25px; padding: 15px; background: #fff; border-radius: 8px; border: 1px solid #ebeef5; }
.progress-text { font-size: 14px; color: #606266; margin-bottom: 12px; font-weight: 500; }
.upload-card { border-radius: 12px; min-height: 500px; }
.upload-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.disabled-overlay { opacity: 0.6; pointer-events: none; background-color: #f9f9f9; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px; color: #909399; }
.placeholder-icon-wrap { width: 120px; height: 120px; background: #f0f2f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #c0c4cc; }
.button-group { margin-top: 18px; display: flex; flex-direction: column; gap: 12px; }
@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.6); transform: scale(1); }
  50% { box-shadow: 0 0 0 10px rgba(103, 194, 58, 0); transform: scale(1.02); }
  100% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0); transform: scale(1); }
}
.pulse-btn { width: 100%; font-weight: bold; font-size: 16px; animation: pulse-green 2.5s infinite; margin-left: 0 !important; }
.ai-guide-box { margin-top: 15px; }
</style>