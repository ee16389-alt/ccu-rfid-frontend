const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  // 1. 基本設定
  transpileDependencies: true,
  
  // 2. GitHub Pages 子路徑設定 (核心修改)
  // 根據您的 GitHub 網址：https://github.com/ee16389-alt/ccu-rfid-frontend
  // 在生產環境下，所有資源路徑都會加上 /ccu-rfid-frontend/
  publicPath: process.env.NODE_ENV === 'production'
    ? '/ccu-rfid-frontend/' 
    : '/',

  // 3. 打包輸出目錄
  outputDir: 'dist',

  // 4. 開發環境 API 代理設定
  // 解決本地開發時連線到 Azure 後端的跨域 (CORS) 問題
  devServer: {
    proxy: {
      '/manager-api': {
        target: 'https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net',
        changeOrigin: true,
        secure: false, 
      },
      '/api': {
        target: 'https://ccu-rfid-project-arhddfhugverf8dr.japanwest-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // 5. 確保打包後的索引檔案正確
  indexPath: 'index.html',
  filenameHashing: true
})