<template>
  <div class="screening-container">
    <div class="header-section">
      <h2 style="font-weight: 500;">AI 分群結果審核</h2>
      <span class="activity-info-display">活動：社區歌唱日 • 36 張已分析</span>
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
              <div class="photo-placeholder">照片</div>
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
  data() {
    return {
      screeningList: [
        {
          id: 1, 
          candidates: [{id: 1, name: '陳阿嬤'}, {id: 2, name: '李伯伯'}],
          matchedElders: [1] // 模擬已勾選陳阿嬤
        },
        {
          id: 2, 
          candidates: [{id: 3, name: '王先生'}, {id: 4, name: '林小姐'}],
          matchedElders: [3] // 模擬已勾選王先生
        },
        {
          id: 3, 
          candidates: [{id: 5, name: '劉奶奶'}],
          matchedElders: [] // 待審核
        }
      ]
    };
  },
  methods: {
    handleBack() {
      this.$message.info('點擊返回 ');
    },
    handleSave() {
      this.$message.success('點擊儲存審核');
    }
  }
};
</script>

<style scoped>
.header-section {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.activity-info-display {
    font-size: 16px;
    color: #909399;
    flex-grow: 1;
}
.back-button {
  background-color: #FF9933;
  border-color: #FF9933;
}
.prompt-text {
    font-size: 14px;
    color: #606266;
    margin-bottom: 25px;
}
.screening-card {
    border-radius: 12px;
    border: 1px solid #f0e6da;
    box-shadow: none;
    background-color: #fcf6ee;
    padding: 15px;
}
.photo-placeholder {
    width: 100%;
    padding-top: 100%;
    background-color: white;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #909399;
    font-size: 14px;
    border: 1px solid #e0c8b0;
}
.match-title {
    margin-top: 0;
    font-weight: 600;
    color: #303133;
}
.elder-checkbox {
    display: block;
    margin-bottom: 5px;
}
.save-button {
  background-color: #FF9933;
  border-color: #FF9933;
  font-size: 16px;
}
</style>