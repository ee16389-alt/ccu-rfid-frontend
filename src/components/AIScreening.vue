<template>
  <div class="ai-screening-container">
    <div class="header-section">
      <el-page-header @back="$emit('go-back')" content="AI 辨識結果修正與確認"></el-page-header>
    </div>

    <el-card v-loading="loading" class="main-card">
      <div v-for="group in aiGroups" :key="group.resident_id" class="resident-group">
        <h3 class="resident-title">
          <i class="el-icon-user"></i> {{ group.resident_name }} 
          <el-tag size="mini" type="info">共 {{ group.photos.length }} 張</el-tag>
        </h3>
        
        <div class="photo-list">
          <div v-for="photo in group.photos" :key="photo.photo_id" class="photo-thumb-wrapper">
            <el-image 
              class="photo-thumb"
              :src="photo.photo_url"
              fit="cover"
              @click="openEditDialog(group, photo)"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </div>
        </div>
      </div>

      <div v-if="aiGroups.length === 0 && !loading" class="empty-state">
        <el-empty description="目前無辨識資料"></el-empty>
      </div>

      <div class="form-actions">
        <el-button type="primary" icon="el-icon-upload" @click="handleFinalSave" :loading="loading">
          確認無誤，同步至活動紀錄
        </el-button>
        <el-button @click="$emit('go-back')">返回</el-button>
      </div>
    </el-card>

    <el-dialog title="修正照片辨識" :visible.sync="editVisible" width="600px" @opened="drawEditBox">
      <div class="edit-preview-container" v-if="editingPhoto">
        <div class="img-box" style="position: relative; overflow: hidden;">
          <img ref="previewImg" :src="editingPhoto.photo_url" class="full-preview" @load="drawEditBox" style="width: 100%;">
          <div class="recognition-box" :style="boxStyle" style="position: absolute; border: 2px solid #f56c6c; background: rgba(245,108,108,0.2);"></div>
        </div>
        
        <el-form label-position="top" style="margin-top: 20px;">
          <el-form-item label="重新標記此人為：">
            <el-select v-model="targetResidentId" filterable style="width: 100%">
              <el-option 
                v-for="opt in residentOptions" 
                :key="opt.id" 
                :label="opt.name" 
                :value="opt.id"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer">
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPhotoCorrection">確認修正</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AIScreening',
  props: ['activityId'],
  data() {
    return {
      loading: false,
      aiGroups: [],
      residentOptions: [],
      editVisible: false,
      editingGroup: null,
      editingPhoto: null,
      targetResidentId: '',
      boxStyle: {}
    };
  },
  mounted() {
    this.fetchScreeningResults();
  },
  methods: {
    async fetchScreeningResults() {
      this.loading = true;
      const azureBase = 'https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net';
      
      try {
        // 維持 30 秒逾時
        const res = await this.$http.post(`/Activity/${this.activityId}/recognize`, {}, {
          timeout: 30000 
        });
        
        if (res.data && res.data.length > 0) {
          this.aiGroups = res.data.map(group => {
            group.photos = group.photos.map(p => {
              // 補全圖片網址路徑，解決 404 問題
              if (p.photo_url && !p.photo_url.startsWith('http')) {
                const cleanPath = p.photo_url.replace(/^\/+/, '');
                p.photo_url = `${azureBase}/${cleanPath}?t=${new Date().getTime()}`;
              }
              return p;
            });
            return group;
          });

          // 統一欄位名稱為 resident_id 與 resident_name
          this.residentOptions = this.aiGroups.map(g => ({ 
            id: g.resident_id, 
            name: g.resident_name 
          }));
        } else {
          this.loadMockResults();
        }
      } catch (err) {
        console.warn("API 逾時或獲取失敗，啟動示範模式", err);
        this.loadMockResults();
      } finally {
        this.loading = false;
      }
    },

    loadMockResults() {
      // 備援示範數據邏輯
      this.aiGroups = []; 
    },

    openEditDialog(group, photo) {
      this.editingGroup = group;
      this.editingPhoto = photo;
      this.targetResidentId = group.resident_id;
      this.editVisible = true;
    },

    confirmPhotoCorrection() {
      const newGroup = this.aiGroups.find(g => g.resident_id === this.targetResidentId);
      if (newGroup && this.editingGroup.resident_id !== this.targetResidentId) {
        this.editingGroup.photos = this.editingGroup.photos.filter(p => p.photo_id !== this.editingPhoto.photo_id);
        newGroup.photos.push(this.editingPhoto);
      }
      this.editVisible = false;
    },

    async handleFinalSave() {
      this.loading = true;
      try {
        // 封裝 JSON Payload 排除 415 錯誤
        const payload = [];
        this.aiGroups.forEach(group => {
          group.photos.forEach(p => {
            payload.push({ 
              photo_id: p.photo_id, 
              resident_id: group.resident_id 
            });
          });
        });

        await this.$http.post(`/Activity/${this.activityId}/recognize/confirm`, payload);
        this.$message.success('AI 辨識結果已同步！');
        this.$emit('go-back');
      } catch (error) {
        this.$message.error('儲存失敗');
      } finally {
        this.loading = false;
      }
    },

    drawEditBox() {
      this.$nextTick(() => {
        const img = this.$refs.previewImg;
        if (!img || !this.editingPhoto || !this.editingPhoto.bounding_box || img.naturalWidth === 0) return;
        
        const box = this.editingPhoto.bounding_box; 
        const sx = img.clientWidth / img.naturalWidth;
        const sy = img.clientHeight / img.naturalHeight;
        
        this.boxStyle = {
          top: (box[0] * sy) + 'px',
          left: (box[1] * sx) + 'px',
          width: ((box[3] - box[1]) * sx) + 'px',
          height: ((box[2] - box[0]) * sy) + 'px'
        };
      });
    }
  }
};
</script>

<style scoped>
.resident-group { margin-bottom: 30px; border-bottom: 1px solid #ebeef5; padding-bottom: 20px; }
.photo-list { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; }
.photo-thumb-wrapper { width: 120px; height: 120px; cursor: pointer; border-radius: 4px; overflow: hidden; position: relative; }
.photo-thumb { width: 100%; height: 100%; }
.image-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399; }
</style>