<template>
  <div class="elder-list-container">
    <div class="header-section">
      <h2 style="font-weight: 500;">長者資料管理</h2>
      <el-button 
        type="primary" 
        @click="handleAddElder"
        class="add-button"
      >
        新增長者
      </el-button>
    </div>

    <el-card shadow="never" class="list-card">
      <el-table
        :data="elderList"
        style="width: 100%"
        :header-cell-style="headerCellStyle"
        stripe 
      >
        <el-table-column prop="rfid" label="RFID 編號" width="150"></el-table-column>
        <el-table-column prop="name" label="姓名" width="120"></el-table-column>
        <el-table-column prop="age" label="年齡" width="100"></el-table-column>
        <el-table-column prop="notes" label="備註"></el-table-column>
        <el-table-column label="操作" width="150">
          <template slot-scope="scope">
            <el-button @click="handleEdit(scope.row)" type="text" size="small" style="color: #FF9933;">
              編輯
            </el-button>
            <el-button @click="handleDelete(scope.row)" type="text" size="small" style="color: #F56C6C;">
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ElderList',
  data() {
    return {
      elderList: [], // 存放從後端抓取的長者資料
      headerCellStyle: {
        backgroundColor: '#fbead1', 
        color: '#606266',
        fontWeight: 'bold'
      }
    };
  },
  mounted() {
    this.fetchElders();
  },
  methods: {
    fetchElders() {
      // 1. 從 localStorage 提取 Token
      const token = localStorage.getItem('userToken');

      if (!token) {
        this.$message.warning('尚未登入，請先進行登入');
        return;
      }

      // 2. 呼叫長者清單 API
      this.$http.get('/manager-api/Resident', {
        headers: {
          'Authorization': `Bearer ${token}` // 帶上鑰匙
        }
      })
      .then(response => {
        // 3. 將 API 資料映射至表格欄位
        this.elderList = response.data.map(item => ({
          id: item.id,
          rfid: item.rfid_code || '未綁定',
          name: item.name,
          age: item.age,
          notes: item.remark || '無'
        }));
        this.$message.success('長者資料載入成功');
      })
      .catch(error => {
        console.error("載入失敗:", error);
        // 4. 處理 CORS 或 401 錯誤
        if (error.response && error.response.status === 401) {
          this.$message.error('驗證失敗，請重新登入');
        } else {
          this.$message.error('無法取得長者資料，請確認 CORS 設定');
        }
      });
    },
    handleAddElder() {
      this.$message.info('跳轉至新增長者頁面');
    },
    handleEdit(elder) {
      // 傳遞 ID 給編輯頁面元件
      this.$emit('edit-elder', elder.id);
      this.$message.success(`正在編輯：${elder.name}`);
    },
    handleDelete(elder) {
      const token = localStorage.getItem('userToken');
      
      this.$confirm(`確定要刪除 ${elder.name} 的資料嗎？`, '提示', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 刪除 API 呼叫
        this.$http.delete(`/manager-api/Resident/${elder.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(() => {
          this.$message.success('刪除成功');
          this.fetchElders(); // 重新整理列表
        })
        .catch(() => {
          this.$message.error('刪除失敗');
        });
      });
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
</style>