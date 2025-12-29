<template>
  <div class="elder-edit-container">
    <div class="header-section">
      <el-button icon="el-icon-back" circle @click="$emit('go-back')"></el-button>
      <h2 style="margin-left: 15px;">{{ isEdit ? '編輯長者住民資料' : '新增長者住民入園登記' }}</h2>
    </div>

    <el-card shadow="never" class="edit-card" v-loading="submitting">
      <el-form :model="elderForm" label-position="top">
        <el-row :gutter="40">
          <el-col :span="8" class="avatar-col">
            <div class="avatar-group">
              <el-upload
                class="avatar-uploader"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleAvatarChange"
              >
                <div v-if="imageUrl" class="avatar-preview-wrapper">
                  <img :src="imageUrl" class="avatar-preview">
                  <div class="avatar-mask">
                    <i class="el-icon-edit"></i>
                    <span>更換照片</span>
                  </div>
                </div>
                <div v-else class="uploader-placeholder">
                  <i class="el-icon-user avatar-uploader-icon"></i>
                  <span>上傳大頭照</span>
                </div>
              </el-upload>
              <div class="upload-guide">
                <el-alert title="供 AI 臉部辨識基準" type="info" :closable="false" show-icon center></el-alert>
                <p class="guide-text">請確保面部清晰無遮擋</p>
              </div>
            </div>
          </el-col>

          <el-col :span="16">
            <el-form-item label="住民姓名" required>
              <el-input v-model="elderForm.name" placeholder="例如：唐伯虎"></el-input>
            </el-form-item>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="住民年齡">
                  <el-input-number v-model="elderForm.age" :min="1" :max="120" style="width: 100%"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="RFID 辨識編號">
                  <el-input v-model="elderForm.rfid_uid" placeholder="請感應卡片系統自動帶入">
                    <i slot="prefix" class="el-icon-postcard"></i>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="住民健康與生活備註">
              <el-input type="textarea" v-model="elderForm.remark" rows="5"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-actions">
          <el-button type="success" @click="submitForm" :loading="submitting" icon="el-icon-folder-checked">
            {{ isEdit ? '更新住民檔案' : '確認入園並建立檔案' }}
          </el-button>
          <el-button @click="$emit('go-back')">取消返回</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// 修正點 1：完全移除手動 axios 導入，改用掛載於 Vue 原型的 this.$http

export default {
  name: 'ElderEdit',
  props: ['elderId'],
  data() {
    return {
      elderForm: { name: '', age: 80, rfid_uid: '', remark: '' },
      imageUrl: '', 
      selectedFile: null,
      submitting: false,
      isEdit: false
    };
  },
  mounted() {
    if (this.elderId) {
      this.isEdit = true;
      this.fetchElderData();
    }
  },
  methods: {
    async fetchElderData() {
      try {
        // 修正點 2：移除 /manager-api，配合 baseURL 自動拼接
        const res = await this.$http.get(`/Resident/${this.elderId}`);
        this.elderForm = {
          name: res.data.name,
          age: res.data.age,
          rfid_uid: res.data.rfid_uid,
          remark: res.data.remark
        };
        this.imageUrl = res.data.avatar_url || '';
      } catch (err) {
        this.$message.error('讀取住民資料失敗');
      }
    },
    handleAvatarChange(file) {
      this.selectedFile = file.raw;
      this.imageUrl = URL.createObjectURL(file.raw);
    },
    async submitForm() {
      if (!this.elderForm.name) {
        this.$message.warning('請填寫住民姓名');
        return;
      }

      this.submitting = true;
      
      // 使用 FormData 處理包含檔案的請求
      const formData = new FormData();
      formData.append('Name', this.elderForm.name);
      formData.append('Age', this.elderForm.age);
      // 確保 RFID 不為空字串或 null，避免後端格式校驗失敗
      formData.append('RfidUid', this.elderForm.rfid_uid || ''); 
      formData.append('Remark', this.elderForm.remark || '');
      
      if (this.selectedFile) {
        formData.append('Avatar', this.selectedFile);
      }

      try {
        // 修正點 3：統一相對路徑路徑
        const url = this.isEdit 
          ? `/Resident/${this.elderId}`
          : `/Resident`;
        
        const method = this.isEdit ? 'put' : 'post';
        
        // 呼叫全域實例，解決 415 錯誤並享受 30s 逾時保護
        await this.$http({
          method: method,
          url: url,
          data: formData,
          headers: { 
            'Content-Type': 'multipart/form-data' // 顯式聲明以確保檔案傳輸正確
          }
        });

        this.$message.success(this.isEdit ? '資料更新成功' : '入園登記成功');
        this.$emit('go-back');
      } catch (err) {
        // 根據截圖中 415 錯誤優化報錯提示
        const errorMsg = err.response?.data?.message || '儲存失敗，請檢查資料格式或網路連線';
        this.$message.error(errorMsg);
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.elder-edit-container { padding: 15px; background-color: #fcfaf8; min-height: 80vh; }
.header-section { display: flex; align-items: center; margin-bottom: 25px; }
.avatar-col { display: flex; justify-content: center; }
.avatar-group { display: flex; flex-direction: column; align-items: center; }
.avatar-uploader {
  width: 200px; height: 200px;
  border: 2px dashed #dcdfe6; border-radius: 50%;
  cursor: pointer; position: relative; overflow: hidden;
  transition: all 0.3s; background-color: #fcfcfc;
  display: flex; justify-content: center; align-items: center;
}
.avatar-uploader /deep/ .el-upload { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.avatar-preview { width: 100%; height: 100%; object-fit: cover; display: block; }
.upload-guide { margin-top: 20px; text-align: center; }
.guide-text { font-size: 12px; color: #909399; margin-top: 8px; }
.form-actions { margin-top: 40px; text-align: center; padding-top: 30px; border-top: 1px dashed #e9e0d6; }
</style>