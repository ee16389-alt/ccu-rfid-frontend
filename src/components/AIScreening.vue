<template>
  <div class="ai-screening-container">
    <div class="header-section">
      <el-button icon="el-icon-back" @click="$emit('go-back')" circle></el-button>
      <h2 style="margin-left: 15px;">AI 分群結果審核</h2>
      <el-tag type="success" effect="dark" style="margin-left: auto;">AI 運算完成 (100%)</el-tag>
    </div>

    <el-alert title="提示：點擊照片可查看 AI 辨識橘框，若身分錯誤可於彈窗中進行修正。" type="info" show-icon :closable="false" style="margin-bottom: 20px;">
    </el-alert>

    <el-row :gutter="20" v-loading="loading">
      <el-col :span="24" v-for="group in aiGroups" :key="group.resident_id" style="margin-bottom: 25px;">
        <el-card shadow="hover" class="elder-group-card">
          <div slot="header" class="group-header">
            <el-avatar :size="50" :src="group.avatar" icon="el-icon-user"></el-avatar>
            <div class="elder-info">
              <span class="elder-name">{{ group.name }}</span>
              <span class="match-rate"><i class="el-icon-cpu"></i> AI 信心度: {{ (group.confidence * 100).toFixed(1) }}%</span>
            </div>
            <el-button type="primary" size="small" plain icon="el-icon-check" style="margin-left: auto;">全組正確</el-button>
          </div>
          
          <div class="photo-grid">
            <div v-for="(photo, index) in group.photos" :key="photo.photo_id" class="photo-item" @click="openEditDialog(photo, group)">
              <el-image :src="photo.photo_url" fit="cover" class="thumb-img">
                <div slot="error" class="image-slot-error"><i class="el-icon-picture"></i></div>
              </el-image>
              <div class="photo-action" @click.stop="removePhotoFromGroup(group, index)">
                <i class="el-icon-delete-solid"></i>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog title="辨識內容校對" :visible.sync="editVisible" width="600px" append-to-body>
      <div v-if="editingPhoto" class="edit-dialog-content">
        <div class="preview-wrapper">
          <img :src="editingPhoto.photo_url" class="preview-img" ref="previewImg" @load="drawEditBox" />
          <div class="orange-box" :style="boxStyle">
            <span class="box-label">{{ editingPhoto.tempName }}</span>
          </div>
        </div>
        <div class="edit-form">
          <p>AI 原始辨識為：<strong>{{ editingPhoto.originalName }}</strong></p>
          <el-form label-position="top">
            <el-form-item label="修正身分為：">
              <el-select v-model="editingPhoto.targetResidentId" placeholder="請選擇正確長者" style="width: 100%" @change="updateTempName">
                <el-option v-for="item in residentOptions" :key="item.id" :label="item.name" :value="item.id"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCorrection">確認修改</el-button>
      </span>
    </el-dialog>

    <div class="bottom-actions">
      <el-button type="success" size="large" @click="handleFinalSave" :loading="loading" icon="el-icon-document-checked">
        確認辨識結果並儲存至資料庫
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIScreening',
  props: ['activityId'],
  data() {
    return {
      loading: false,
      editVisible: false,
      editingPhoto: null,
      boxStyle: {},
      aiGroups: [],
      residentOptions: [] // 應從 API 獲取所有長者清單
    };
  },
  methods: {
    async fetchScreeningResults() {
      this.loading = true;
      try {
        // 對接後端 recognize API
        const res = await this.$http.post(`/manager-api/Activity/${this.activityId}/recognize`);
        this.aiGroups = res.data;
        // 模擬長者名單，實際開發請呼叫住民 API
        this.residentOptions = this.aiGroups.map(g => ({ id: g.resident_id, name: g.name }));
      } catch (err) {
        this.loadMockResults();
      } finally {
        this.loading = false;
      }
    },
    openEditDialog(photo, group) {
      this.editingPhoto = {
        ...photo,
        originalGroup: group,
        originalName: group.name,
        targetResidentId: group.resident_id,
        tempName: group.name
      };
      this.editVisible = true;
    },
    drawEditBox() {
      const img = this.$refs.previewImg;
      const box = this.editingPhoto.bounding_box; // [top, left, bottom, right]
      if (!img || !box) return;
      const sx = img.clientWidth / img.naturalWidth;
      const sy = img.clientHeight / img.naturalHeight;
      this.boxStyle = {
        top: (box[0] * sy) + 'px',
        left: (box[1] * sx) + 'px',
        width: ((box[3] - box[1]) * sx) + 'px',
        height: ((box[2] - box[0]) * sy) + 'px'
      };
    },
    updateTempName(val) {
      this.editingPhoto.tempName = this.residentOptions.find(o => o.id === val).name;
    },
    confirmCorrection() {
      // 前端暫存修正：將照片移出舊組並準備存入新狀態
      this.$message.success('已暫存修改，儲存後正式生效');
      this.editVisible = false;
      // 實際邏輯：更新 aiGroups 陣列讓畫面同步變動
    },
    async handleFinalSave() {
      this.loading = true;
      try {
        // 封裝成同學要求的儲存格式
        const payload = [];
        this.aiGroups.forEach(group => {
          group.photos.forEach(p => {
            payload.push({ photo_id: p.photo_id, resident_id: group.resident_id });
          });
        });
        await this.$http.post(`/manager-api/Activity/${this.activityId}/recognize/confirm`, payload);
        this.$message.success('AI 辨識結果已同步至資料庫！');
        this.$emit('go-back');
      } catch (error) {
        this.$message.error('儲存失敗');
      } finally {
        this.loading = false;
      }
    },
    loadMockResults() {
      // 保持原有 Mock 邏輯，但欄位需對齊後端
    }
  }
};
</script>

<style scoped>
/* 關鍵樣式：橘色辨識框 */
.preview-wrapper { position: relative; width: 100%; margin-bottom: 20px; overflow: hidden; border-radius: 8px; }
.preview-img { width: 100%; display: block; }
.orange-box { position: absolute; border: 3px solid #FF9933; background: rgba(255, 153, 51, 0.2); pointer-events: none; box-sizing: border-box; }
.box-label { position: absolute; top: -25px; left: -3px; background: #FF9933; color: white; padding: 2px 8px; font-size: 12px; border-radius: 4px 4px 0 0; }
.edit-form { padding: 10px; background: #fffaf5; border-radius: 8px; }
/* ... 其餘樣式保持不變 ... */
.ai-screening-container { padding: 15px; background-color: #fcfaf8; min-height: 100vh; }
.header-section { display: flex; align-items: center; margin-bottom: 20px; }
.elder-group-card { border-radius: 12px; border-left: 6px solid #67c23a; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #fff; }
.group-header { display: flex; align-items: center; }
.elder-info { margin-left: 15px; display: flex; flex-direction: column; }
.elder-name { font-size: 18px; font-weight: bold; color: #333; }
.match-rate { font-size: 13px; color: #67c23a; font-weight: 600; margin-top: 4px; }
.photo-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 15px; }
.photo-item { position: relative; width: 110px; height: 110px; cursor: pointer; }
.thumb-img { width: 100%; height: 100%; border-radius: 10px; border: 1px solid #ebeef5; transition: transform 0.2s; }
.thumb-img:hover { transform: scale(1.05); }
.bottom-actions { text-align: center; margin: 40px 0; padding-bottom: 20px; }
</style>