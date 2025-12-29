<template>
  <div class="activity-list-container">
    <div class="header-section">
      <h2>活動清單管理</h2>
      <el-button type="primary" icon="el-icon-plus" @click="$emit('add-activity')">新增活動</el-button>
    </div>

    <el-table :data="activities" style="width: 100%" stripe v-loading="loading">
      <el-table-column label="活動封面" width="120" align="center">
        <template slot-scope="scope">
          <el-image 
            :src="scope.row.cover || 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=300'" 
            style="width: 80px; height: 60px; border-radius: 6px; border: 1px solid #eee;"
            fit="cover"
            :preview-src-list="[scope.row.cover]"
          >
            <div slot="error" class="image-slot">
              <i class="el-icon-picture-outline"></i>
            </div>
          </el-image>
        </template>
      </el-table-column>

      <el-table-column prop="title" label="活動名稱" min-width="180"></el-table-column>
      <el-table-column prop="activity_at" label="活動日期" width="120"></el-table-column>
      
      <el-table-column label="RFID 綁定" width="130" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.rfid" type="success" size="small" effect="plain">
            <i class="el-icon-postcard"></i> {{ scope.row.rfid }}
          </el-tag>
          <el-tag v-else type="info" size="small" effect="plain">未綁定</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="location" label="地點" min-width="130"></el-table-column>
      <el-table-column prop="photo_count" label="照片數" width="90" align="center"></el-table-column>
      
      <el-table-column label="操作" width="120" align="center">
        <template slot-scope="scope">
          <el-button 
            type="warning" 
            size="mini" 
            icon="el-icon-setting"
            @click="$emit('manage-activity', scope.row.id)"
          >
            管理
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'ActivityList',
  data() {
    return {
      loading: false,
      activities: [] 
    };
  },
  mounted() {
    this.fetchActivities();
  },
  methods: {
    async fetchActivities() {
      this.loading = true;
      
      try {
        // 修正點 2: 使用簡潔相對路徑，讓 main.js 的 baseURL 處理前綴
        const response = await this.$http.get('/Activity');
        
        if (response.data && response.data.length > 0) {
          // 修正點 3: 確保對應後端的 RFID 欄位
          this.activities = response.data.map(item => ({
            ...item,
            rfid: item.rfid || '' 
          }));
        } else {
          this.loadMockData();
        }
      } catch (error) {
        console.warn('API 連線失敗，載入示範資料');
        this.loadMockData(); 
      } finally {
        this.loading = false;
      }
    },
    
    loadMockData() {
      this.activities = [
        { 
          id: 'demo_01', 
          title: '象棋大賽暨腦力激盪', 
          activity_at: '2025-12-18', 
          location: '二樓多功能活動室',
          photo_count: 24,
          rfid: '8A303053',
          cover: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500' 
        },
        { 
          id: 'demo_02', 
          title: '冬至搓湯圓暖心活動', 
          activity_at: '2025-12-21', 
          location: '一樓共餐食堂',
          photo_count: 18,
          rfid: '', 
          cover: 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=500' 
        }
      ];
    }
  }
};
</script>

<style scoped>
.activity-list-container { padding: 10px; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
h2 { font-weight: 600; color: #5d5146; margin: 0; }
.image-slot { 
  display: flex; justify-content: center; align-items: center; 
  width: 100%; height: 100%; background: #f5f7fa; color: #909399; 
  font-size: 20px;
}
</style>