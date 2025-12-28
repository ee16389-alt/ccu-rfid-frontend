<script>
import axios from 'axios';

export default {
  name: 'RFIDLanding',
  data() {
    return {
      loading: false,
      hasToken: !!localStorage.getItem('userToken')
    };
  },
  methods: {
    async handleStart() {
      // 1. 安全性檢查：確保行政端已登入
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        this.$message({
          message: '【系統未授權】請先由行政管理端完成登入驗證',
          type: 'error',
          duration: 4000
        });
        return;
      }

      this.loading = true;
      // 使用同學截圖中的測試卡號
      const cardUid = "116A2434"; 

      try {
        // 2. 呼叫後端 RFID 查詢 API
        // 修正為完整 Azure API 路徑
        const response = await axios.get(`https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net/manager-api/rfid/${cardUid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // 3. 解析同學提供的 match 格式
        if (response.data.match && response.data.match.length > 0) {
          const target = response.data.match[0]; // 取得第一個匹配對象
          
          this.$notify({
            title: '感應成功',
            message: `${target.name} 您好，正在開啟您的精彩回憶！`,
            type: 'success',
            position: 'top-left'
          });

          // 延遲跳轉，將 RFID 序號傳給父組件以進入 ActivityMenu
          setTimeout(() => {
            this.$emit('scan-success', cardUid);
          }, 1000);
        } else {
          this.$message.warning('查無此卡片資料，請聯絡管理員登記');
        }
      } catch (error) {
        // 4. Demo 模式：當後端未啟動時使用
        console.warn("API 未連線，啟動示範模式", error);
        this.$message({
          message: '【Demo 模式】歡迎回來，唐伯虎先生！',
          type: 'warning'
        });
        
        setTimeout(() => {
          this.$emit('scan-success', '8A303053'); // 使用另一組測試卡號 Demo
        }, 1500);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>