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
                  <i class="el-icon-user avatar-uploader-icon" style="font-size: 40px; color: #dcdfe6;"></i>
                  <br>
                  <span style="color: #909399; font-size: 14px;">上傳大頭照</span>
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
                  <el-input v-model="elderForm.rfid" placeholder="請填寫或感應卡片">
                    <i slot="prefix" class="el-icon-postcard"></i>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="住民健康與生活備註">
              <el-input type="textarea" v-model="elderForm.remark" rows="5" placeholder="例如：患有高血壓，需定時服藥..."></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-actions">
          <el-button type="success" @click="submitForm" :loading="submitting" icon="el-icon-folder-checked" style="background-color: #67c23a; border-color: #67c23a;">
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
      elderForm: { name: '', age: 80, rfid: '', remark: '' },
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
      const azureBase = 'https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net';
      try {
        const res = await this.$http.get(`/Resident/${this.elderId}`);
        this.elderForm = {
          name: res.data.name || '',
          age: res.data.age || 80,
          // 修正：欄位名稱對齊同學提到的修改建議
          rfid: res.data.rfid || '', 
          remark: res.data.remark || ''
        };
        
        if (res.data.avatar) { // 修正：對齊 item.avatar
          this.imageUrl = res.data.avatar.startsWith('http') 
            ? res.data.avatar 
            : `${azureBase}${res.data.avatar}?t=${new Date().getTime()}`;
        }
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

      try {
        // --- 階段 1: 更新基本資料 (使用 JSON 格式發送) ---
        // 將資料封裝為純物件，Axios 會自動以 application/json 發送，避開 415 錯誤
        const residentPayload = {
          name: String(this.elderForm.name),
          age: Number(this.elderForm.age),
          remark: this.elderForm.remark || "",
          rfid: this.elderForm.rfid || "" // 修正：使用 rfid
        };

        const residentUrl = this.isEdit ? `/Resident/${this.elderId}` : `/Resident`;
        const residentMethod = this.isEdit ? 'put' : 'post';

        const res = await this.$http({
          method: residentMethod,
          url: residentUrl,
          data: residentPayload
        });

        const targetId = this.isEdit ? this.elderId : res.data.id;

        // --- 階段 2: 照片處理 (單獨發送 FormData) ---
        if (this.selectedFile && targetId) {
          const avatarFormData = new FormData();
          // 同學建議欄位為 avatar
          avatarFormData.append('file', this.selectedFile); 

          await this.$http({
            method: 'post',
            url: `/Resident/${targetId}/UploadAvatar`,
            data: avatarFormData,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

        this.$message.success(this.isEdit ? '資料與照片更新成功' : '新增登記成功');
        
        setTimeout(() => {
          this.$emit('go-back');
        }, 1000);

      } catch (err) {
        console.error('Submit Error:', err.response);
        const errorMsg = err.response?.data?.message || '儲存失敗，請確認資料格式或網路連線';
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
.avatar-mask {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); color: #fff;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  opacity: 0; transition: opacity 0.3s;
}
.avatar-uploader:hover .avatar-mask { opacity: 1; }
.upload-guide { margin-top: 20px; text-align: center; }
.guide-text { font-size: 12px; color: #909399; margin-top: 8px; }
.form-actions { margin-top: 40px; text-align: center; padding-top: 30px; border-top: 1px dashed #e9e0d6; }
</style>