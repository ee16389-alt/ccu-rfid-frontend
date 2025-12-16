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
            <el-tag :type="scope.row.tagType" size="small" effect="dark">
              {{ scope.row.status }}
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
      activityList: [], // 初始設為空，等待 API 資料
      headerCellStyle: {
        backgroundColor: '#fbead1', 
        color: '#606266',
        fontWeight: 'bold'
      }
    };
  },
  // 當畫面載入時，立即呼叫 API
  mounted() {
    this.fetchActivities();
  },
  methods: {
    fetchActivities() {
      // 呼叫 Swagger 中的活動 API 路徑
      this.$http.get('/manager-api/Activity')
        .then(response => {
          // 對應 ActivityModel 欄位：title, activity_at, photo_count
          this.activityList = response.data.map(item => ({
            id: item.id,
            name: item.title || '未命名活動',
            date: item.activity_at ? item.activity_at.split('T')[0] : '無日期',
            photoCount: item.photo_count || 0,
            status: '已儲存',
            tagType: 'success' 
          }));
          this.$message.success('活動資料載入成功！');
        })
        .catch(error => {
          console.error("API 錯誤:", error);
          this.$message.error('無法連線至 API 伺服器');
        });
    },
    handleAddActivity() {
      this.$message.info('新增活動功能');
    },
    handleManage(activity) {
      this.$message.success(`正在管理活動：${activity.name}`);
    }
  }
};
</script>

<style scoped>
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

.el-tag--warning.is-dark {
  background-color: #ff9933;
  border-color: #ff9933;
  color: white;
}
</style>