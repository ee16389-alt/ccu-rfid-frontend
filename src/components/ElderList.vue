<template>
  <div class="elder-list-container">
    <div class="header-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <h2 style="font-weight: 600; color: #5d5146;">長者住民管理</h2>
      <el-button 
        type="primary" 
        @click="$emit('add-elder')" 
        class="add-button"
        icon="el-icon-plus"
        style="background-color: #FF9933; border-color: #FF9933; font-weight: bold;"
      >
        新增長者住民
      </el-button>
    </div>

    <div class="list-wrapper" v-loading="loading">
      <el-table :data="elderList" style="width: 100%" stripe>
        <el-table-column label="頭像" width="100" align="center">
          <template slot-scope="scope">
            <el-avatar 
              :size="50"
              :src="scope.row.avatar || getDefaultAvatar()"
              style="border: 2px solid #f0e6da; background-color: #eee;"
            >
              {{ scope.row.name ? scope.row.name.charAt(0) : 'U' }}
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="姓名" width="160">
          <template slot-scope="scope">
            <span style="font-weight: bold; color: #333;">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年齡" width="100" align="center"></el-table-column>
        
        <el-table-column prop="rfid_uid" label="RFID 卡號 (辨識 ID)" min-width="150">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.rfid_uid" size="medium" type="success" effect="plain">
              <i class="el-icon-postcard"></i> {{ scope.row.rfid_uid }}
            </el-tag>
            <el-tag v-else size="medium" type="info" effect="plain">尚未綁定</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button 
              size="mini" 
              type="text" 
              @click="$emit('edit-elder', scope.row.id)" 
              style="color: #FF9933; font-weight: bold;"
            >
              <i class="el-icon-edit"></i> 編輯資料
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="elderList.length === 0 && !loading" class="empty-placeholder">
        <i class="el-icon-user-solid" style="font-size: 48px; color: #E4E7ED; margin-bottom: 15px;"></i>
        <p>目前尚無長者登記資料</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElderList',
  data() {
    return {
      loading: false,
      elderList: []
    };
  },
  mounted() {
    this.fetchElders();
  },
  methods: {
    getDefaultAvatar() {
      return 'https://images.unsplash.com/photo-1472393365320-dc77242e6ea2?auto=format&fit=crop&w=150&q=80';
    },

    async fetchElders() {
      this.loading = true;
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        this.setMockData();
        this.loading = false;
        return;
      }

      try {
        const res = await this.$http.get('/manager-api/Resident', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data && res.data.length > 0) {
          // 修改點：映射後端回傳的 rfid_uid 欄位
          this.elderList = res.data.map(item => ({
            id: item.id,
            name: item.name,
            age: item.age,
            rfid_uid: item.rfid_uid, // 同步後端屬性名稱
            avatar: item.avatar_url 
          }));
        } else {
          this.setMockData();
        }
      } catch (err) {
        console.warn('API 連線失敗，載入展示模式');
        this.setMockData(); 
      } finally {
        this.loading = false;
      }
    },
    
    setMockData() {
      // 示範資料對齊後端 RFID
      this.elderList = [
        { 
          id: 'm1', 
          name: 'James Wilson', 
          age: 82, 
          rfid_uid: '116A2434', // 對比同學截圖中的 RFID
          avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=150&q=80' 
        },
        { 
          id: 'm2', 
          name: '唐伯虎', 
          age: 75, 
          rfid_uid: '8A303053', // 對應新增活動的 RFID 範例
          avatar: 'https://images.unsplash.com/photo-1544144433-d50aff500b91?auto=format&fit=crop&w=150&q=80' 
        }
      ];
    }
  }
};
</script>

<style scoped>
.elder-list-container { padding: 10px; background-color: #fcfaf8; min-height: 80vh; }
.header-section h2 { margin: 0; font-size: 24px; }
.list-wrapper { 
  background: #fff; 
  padding: 25px; 
  border-radius: 16px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.05); 
  border: 1px solid #f0e6da;
}
.empty-placeholder { text-align: center; padding: 60px 0; color: #909399; }
/deep/ .el-table { border-radius: 8px; overflow: hidden; }
/deep/ .el-table th { background-color: #fcfaf8 !important; color: #5d5146; font-weight: bold; }
</style>