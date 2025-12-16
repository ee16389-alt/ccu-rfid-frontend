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
        v-for="elder in elderList" 
        :key="elder.id" 
        shadow="hover" 
        class="elder-item-card"
      >
        <el-row type="flex" align="middle" justify="space-between">
          <el-col :span="18">
            <div class="elder-info">
              <div class="avatar-placeholder" :style="{ backgroundColor: elder.avatarColor }">
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
      
      <p v-if="elderList.length === 0" style="text-align: center; color: #999; padding: 20px;">
        目前沒有長者記錄。
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
      // 初始設為空陣列，等待 API 載入
      elderList: [] 
    };
  },
  mounted() {
    this.fetchElders();
  },
  methods: {
    fetchElders() {
      // 呼叫 Swagger 中的居民清單 API
      this.$http.get('/manager-api/Resident')
        .then(response => {
          // 對應 ResidentModel 欄位：name, rfid, age, avatar
          this.elderList = response.data.map(item => ({
            id: item.id,
            name: item.name || '未命名',
            rfid: item.rfid || '尚未配卡',
            age: item.age || 0,
            status: '啟用中',
            statusType: 'success',
            avatar: item.avatar || '' // 如果有頭像網址則載入
          }));
        })
        .catch(error => {
          console.error("載入長者清單失敗:", error);
          // 暫不報錯，以免影響 Demo
        });
    },
    handleAddElder() {
      this.$message.info('新增長者功能');
    },
    handleEdit(elder) {
      this.$message.success(`正在編輯長者：${elder.name}`);
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
  transition: all 0.2s;
  cursor: pointer;
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

.edit-button {
  color: #FF9933;
  font-weight: 500;
}
</style>