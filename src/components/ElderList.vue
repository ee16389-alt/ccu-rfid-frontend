<template>
  <div class="elder-list-container">
    <div class="header-section">
      <h2 style="font-weight: 500;">長者清單</h2>
      <el-button 
        type="primary" 
        @click="handleAddElder"
        class="add-button"
      >
        新增長者
      </el-button>
    </div>

    <div style="margin-bottom: 25px;">
      <el-input 
        v-model="searchQuery" 
        placeholder="搜尋姓名..."
        style="width: 300px;"
      >
        <i slot="prefix" class="el-input__icon el-icon-search"></i>
      </el-input>
    </div>

    <div class="list-wrapper">
      <el-card 
        v-for="elder in filteredList" 
        :key="elder.id" 
        shadow="hover" 
        class="elder-item-card"
      >
        <el-row type="flex" align="middle" justify="space-between">
          <el-col :span="18">
            <div class="elder-info">
              <div class="avatar-placeholder" :style="{ backgroundColor: elder.avatarColor || '#FF9933' }">
                {{ elder.name.charAt(0) }}
              </div>
              <div>
                <h3 class="elder-name">{{ elder.name }}</h3>
                <p class="elder-details">
                  RFID: {{ elder.rfid }} • {{ elder.age }} 歲
                </p>
              </div>
            </div>
          </el-col>
          
          <el-col :span="6" style="text-align: right;">
            <el-tag 
              :type="elder.statusType" 
              size="small" 
              effect="plain" 
              style="margin-right: 15px;"
            >
              {{ elder.status }}
            </el-tag>
            
            <el-button 
              @click="handleEdit(elder)" 
              type="text" 
              size="small" 
              class="edit-button"
            >
              編輯
            </el-button>
          </el-col>
        </el-row>
      </el-card>
      
      <p v-if="filteredList.length === 0" style="text-align: center; color: #999; padding: 20px;">
        目前沒有符合條件的長者記錄。
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElderList',
  data() {
    return {
      searchQuery: '',
      elderList: [] 
    };
  },
  computed: {
    // 實作搜尋篩選功能
    filteredList() {
      return this.elderList.filter(elder => 
        elder.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  mounted() {
    this.fetchElders();
  },
  methods: {
    fetchElders() {
      // 1. 取得 Token
      const token = localStorage.getItem('userToken');

      if (!token) {
        this.$message.warning('尚未登入，請先進行行政登入');
        return;
      }

      // 2. 呼叫居民清單 API 並帶上 Token
      this.$http.get('/manager-api/Resident', {
        headers: {
          'Authorization': `Bearer ${token}` //
        }
      })
        .then(response => {
          // 3. 欄位映射：後端為 rfid_code, remark 等
          this.elderList = response.data.map(item => ({
            id: item.id,
            name: item.name || '未命名',
            rfid: item.rfid_code || '尚未配卡',
            age: item.age || 0,
            status: '啟用中',
            statusType: 'success',
            avatarColor: this.getRandomColor() // 產生隨機頭像顏色
          }));
        })
        .catch(error => {
          console.error("載入長者清單失敗:", error);
          if (error.response && error.response.status === 401) {
            this.$message.error('登入逾時，請重新登入');
          } else {
            this.$message.error('無法連線至 API，請確認後端 CORS 設定'); //
          }
        });
    },
    getRandomColor() {
      const colors = ['#FF9933', '#409EFF', '#67C23A', '#E6A23C', '#F56C6C'];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    handleAddElder() {
      this.$message.info('跳轉至新增長者功能');
    },
    handleEdit(elder) {
      // 通知父組件切換至編輯 Frame
      this.$emit('edit-elder', elder.id);
      this.$message.success(`正在編輯：${elder.name}`);
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
.elder-item-card {
  margin-bottom: 15px;
  border-radius: 12px;
  border: 1px solid #f0e6da;
  box-shadow: none;
  background-color: #fcf6ee; /* 符合您的暖色調設計 */
}
.elder-info {
  display: flex;
  align-items: center;
}
.avatar-placeholder {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  color: white;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}
.elder-name {
  margin: 0;
  font-size: 18px;
  color: #303133;
}
.elder-details {
  margin: 5px 0 0;
  color: #909399;
  font-size: 14px;
}
.edit-button {
  color: #FF9933;
  font-weight: 500;
}
</style>