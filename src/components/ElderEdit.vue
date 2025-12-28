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
                  <el-input-number v-model="elderForm.age" :min="60" :max="120" style="width: 100%"></el-input-number>
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
import axios from 'axios';

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
      const token = localStorage.getItem('userToken');
      try {
        const res = await this.$http.get(`/manager-api/Resident/${this.elderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.elderForm = {
          name: res.data.name,
          age: res.data.age,
          rfid_uid: res.data.rfid_uid, // 對接 API 欄位
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
      const token = localStorage.getItem('userToken');
      
      // 使用 FormData 處理檔案上傳
      const formData = new FormData();
      formData.append('Name', this.elderForm.name);
      formData.append('Age', this.elderForm.age);
      formData.append('RfidUid', this.elderForm.rfid_uid); // RFID 序號
      formData.append('Remark', this.elderForm.remark);
      if (this.selectedFile) {
        formData.append('Avatar', this.selectedFile); // 大頭照檔案
      }

      try {
        const url = this.isEdit 
          ? `https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net/manager-api/Resident/${this.elderId}`
          : `https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net/manager-api/Resident`;
        
        const method = this.isEdit ? 'put' : 'post';
        
        await axios({
          method: method,
          url: url,
          data: formData,
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        this.$message.success(this.isEdit ? '資料更新成功' : '入園登記成功');
        this.$emit('go-back');
      } catch (err) {
        this.$message.error('系統儲存失敗');
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
/* 樣式保持不變 */
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