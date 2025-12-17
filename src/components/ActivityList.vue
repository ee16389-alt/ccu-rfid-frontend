<template>
  <div class="activity-list-container">
    <div class="header-section">
      <h2 style="font-weight: 500;">活動清單</h2>
      <el-button 
        type="primary" 
        @click="handleAddActivity"
        class="add-button"
      >
        新增活動
      </el-button>
    </div>

    <el-card shadow="never" class="list-card">
      <el-table
        :data="activityList"
        style="width: 100%"
        :header-cell-style="headerCellStyle"
        stripe 
        v-loading="loading" 
      >
        <el-table-column prop="name" label="活動名稱"></el-table-column>
        <el-table-column prop="date" label="日期" width="180"></el-table-column>
        <el-table-column prop="photoCount" label="照片數量" width="120">
          <template slot-scope="scope">
            {{ scope.row.photoCount }} 張
          </template>
        </el-table-column>
        <el-table-column prop="status" label="狀態" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.photoCount > 0 ? 'success' : 'warning'" size="small" effect="dark">
              {{ scope.row.photoCount > 0 ? '已就緒' : '待上傳' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button @click="handleManage(scope.row)" type="text" size="small" style="color: #FF9933;">
              管理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ActivityList',
  data() {
    return {
      activityList: [], 
      loading: false, // 增加 Loading 狀態，提升使用者體驗
      headerCellStyle: {
        backgroundColor: '#fbead1', 
        color: '#606266',
        fontWeight: 'bold'
      }
    };
  },
  mounted() {
    this.fetchActivities();
  },
  methods: {
    fetchActivities() {
      const token = localStorage.getItem('userToken');

      if (!token) {
        this.$message.warning('尚未登入，請先進行行政登入');
        return;
      }

      this.loading = true; // 開始載入
      this.$http.get('/manager-api/Activity', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          // 欄位對應正確：title, activity_at, photo_count
          this.activityList = response.data.map(item => ({
            id: item.id,
            name: item.title || '未命名活動',
            date: item.activity_at ? item.activity_at.split('T')[0] : '無日期',
            photoCount: item.photo_count || 0
          }));
          // 不需要每次都跳成功訊息，以免干擾操作
        })
        .catch(error => {
          console.error("API 錯誤:", error);
          if (error.response && error.response.status === 401) {
            this.$message.error('驗證失敗或登入逾時，請重新登入');
          } else {
            this.$message.error('無法取得活動清單，請確認網路與 CORS 設定');
          }
        })
        .finally(() => {
          this.loading = false; // 結束載入
        });
    },
    handleAddActivity() {
      // Demo 時建議透過 emit 通知 App.vue 切換 Frame
      this.$emit('add-activity');
    },
    handleManage(activity) {
      // 這裡非常重要：通知 App.vue 進入「管理該活動」模式，並帶入 activityId
      this.$emit('manage-activity', activity.id);
      this.$message.info(`進入活動管理：${activity.name}`);
    }
  }
};
</script>

<style scoped>
/* 原本的 CSS 已經很完美了，維持不變 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.add-button {
  background-color: #FF9933;
  border-color: #FF9933;
}

.list-card {
  border-radius: 12px;
  border: 1px solid #f0e6da;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.list-card /deep/ .el-table {
  border-radius: 12px;
}
</style>