<template>
  <div class="screening-container">
    <div class="header-section">
      <h2 style="font-weight: 500;">AI 分群結果審核</h2>
      <span class="activity-info-display">活動：{{ activityName }} • {{ screeningList.length }} 張待審核</span>
      <el-button 
        type="warning" 
        @click="handleBack"
        class="back-button"
      >
        返回
      </el-button>
    </div>

    <p class="prompt-text">
      請確認每張照片中辨識到的長者是否正確，勾選後即可儲存。
    </p>

    <el-row :gutter="20">
      <el-col :span="8" v-for="photo in screeningList" :key="photo.id" style="margin-bottom: 20px;">
        <el-card shadow="never" class="screening-card">
          <el-row :gutter="20">
            <el-col :span="10">
              <div class="photo-container">
                <el-image 
                  :src="photo.url" 
                  fit="cover" 
                  class="actual-photo"
                >
                  <div slot="error" class="image-slot">
                    <i class="el-icon-picture-outline"></i>
                  </div>
                </el-image>
              </div>
            </el-col>

            <el-col :span="14">
              <h4 class="match-title">辨識結果</h4>
              <el-checkbox-group v-model="photo.matchedElders">
                <el-checkbox 
                  v-for="elder in photo.candidates" 
                  :key="elder.id" 
                  :label="elder.id" 
                  class="elder-checkbox"
                >
                  {{ elder.name }}
                </el-checkbox>
              </el-checkbox-group>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <div v-if="screeningList.length === 0" style="text-align: center; margin: 50px 0; color: #909399;">
      目前暫無待審核的照片。
    </div>

    <div style="text-align: right; margin-top: 30px;">
      <el-button 
        type="warning" 
        @click="handleSave"
        class="save-button"
      >
        儲存審核
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIScreening',
  props: ['activityId'], // 由路由或父組件傳入活動 ID
  data() {
    return {
      activityName: '載入中...',
      screeningList: []
    };
  },
  mounted() {
    this.fetchScreeningData();
  },
  methods: {
    fetchScreeningData() {
      // 1. 取得 Token
      const token = localStorage.getItem('userToken');
      if (!token) return;

      // 2. 呼叫 AI 分類結果 API
      this.$http.get(`/manager-api/Activity/${this.activityId}/Screening`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        // 假設 API 回傳格式包含照片 URL、候選人與初步辨識結果
        this.screeningList = res.data.map(item => ({
          id: item.photo_id,
          url: item.photo_url,
          candidates: item.all_elders, // 該活動所有可能的長者
          matchedElders: item.recognized_elder_ids || [] // AI 初步認出的長者
        }));
        this.activityName = res.data.activity_title || '社區活動';
      })
      .catch(err => {
        console.error("讀取 AI 資料失敗", err);
        this.$message.error('無法連線至 AI 伺服器，請確認 CORS 設定');
      });
    },
    handleBack() {
      this.$emit('go-back');
    },
    handleSave() {
      const token = localStorage.getItem('userToken');
      
      // 3. 將審核後的結果傳回後端
      this.$http.post(`/manager-api/Activity/${this.activityId}/Screening/Save`, {
        results: this.screeningList.map(p => ({
          photo_id: p.id,
          resident_ids: p.matchedElders
        }))
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(() => {
        this.$message.success('審核結果已儲存！');
        this.handleBack();
      })
      .catch(err => {
        this.$message.error('儲存失敗，請確認登入狀態');
      });
    }
  }
};
</script>

<style scoped>
/* 基本樣式繼承您原本的設計，加入照片容器優化 */
.header-section {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.activity-info-display {
    font-size: 16px;
    color: #909399;
    flex-grow: 1;
    margin-left: 15px;
}
.back-button {
  background-color: #FF9933;
  border-color: #FF9933;
  color: white;
}
.photo-container {
    width: 100%;
    height: 120px;
    background-color: white;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #e0c8b0;
}
.actual-photo {
    width: 100%;
    height: 100%;
}
.screening-card {
    border-radius: 12px;
    border: 1px solid #f0e6da;
    background-color: #fcf6ee;
}
.elder-checkbox {
    display: block;
    margin-bottom: 8px;
}
.save-button {
  background-color: #FF9933;
  border-color: #FF9933;
  color: white;
  padding: 12px 30px;
}
</style>