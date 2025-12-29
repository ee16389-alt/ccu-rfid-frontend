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
                  <el-input v-model="elderForm.rfid_uid" placeholder="請填寫或感應卡片">
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
        // 使用相對路徑，配合 main.js 的 baseURL
        const res = await this.$http.get(`/Resident/${this.elderId}`);
        this.elderForm = {
          name: res.data.name || '',
          age: res.data.age || 80,
          rfid_uid: res.data.rfid_uid || '',
          remark: res.data.remark || ''
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
      
      // 核心修正：封裝 FormData 並確保 Key 名稱首字母大寫以對接 Swagger
      const formData = new FormData();
      formData.append('Name', String(this.elderForm.name));
      formData.append('Age', Number(this.elderForm.age)); // 確保為數字型別
      formData.append('RfidUid', this.elderForm.rfid_uid ? String(this.elderForm.rfid_uid) : ''); 
      formData.append('Remark', this.elderForm.remark ? String(this.elderForm.remark) : '');
      
      // 檔案上傳處理：只有在有選擇新照片時才 append
      if (this.selectedFile) {
        formData.append('Avatar', this.selectedFile); 
      }

      try {
        const url = this.isEdit ? `/Resident/${this.elderId}` : `/Resident`;
        const method = this.isEdit ? 'put' : 'post';
        
        // 發送請求：headers 保持為空，讓 axios 自動補齊帶有 boundary 的 Content-Type
        await this.$http({
          method: method,
          url: url,
          data: formData,
          headers: {} 
        });

        this.$message.success(this.isEdit ? '資料更新成功' : '新增登記成功');
        this.$emit('go-back');
      } catch (err) {
        console.error('API Error:', err.response);
        const msg = err.response?.data?.message || '資料格式錯誤 (415) 或連線逾時';
        this.$message.error(`儲存失敗：${msg}`);
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