import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 让 Vite 把 .pkpass / .pkpasses 当作静态资源处理（支持 ?url 导入）
  assetsInclude: ['**/*.pkpass', '**/*.pkpasses'],

  plugins: [
    react(),
    // 为开发服务器的 .pkpass / .pkpasses 请求设置正确的 MIME type
    // iOS Safari 依赖 Content-Type 来触发 PassKit 弹框
    {
      name: 'pass-mime-types',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? ''
          if (/\.pkpass(\?|$)/.test(url)) {
            res.setHeader('Content-Type', 'application/vnd.apple.pkpass')
          } else if (/\.pkpasses(\?|$)/.test(url)) {
            res.setHeader('Content-Type', 'application/vnd.apple.pkpasses')
          }
          next()
        })
      },
    },
  ],
})
