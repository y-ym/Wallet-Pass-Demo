import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径：部署在任意子目录（如 /demo/）时资源路径均正确
  base: './',

  // 让 Vite 把 .pkpass / .pkpasses 当作静态资源处理（支持 ?url 导入）
  assetsInclude: ['**/*.pkpass', '**/*.pkpasses'],

  plugins: [
    react(),

    // 为开发服务器的 .pkpass / .pkpasses 请求设置 MIME type
    // iOS Safari 依赖 Content-Type 来触发 PassKit 弹框
    // 默认返回正确的 MIME；若 URL 带 ?mime=xxx 参数，则故意返回该值（用于实测错误的 Content-Type）
    {
      name: 'pass-mime-types',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? ''
          const mimeOverride = /[?&]mime=([^&]+)/.exec(url)?.[1]
          const contentType = mimeOverride
            ? decodeURIComponent(mimeOverride)
            : undefined
          if (/\.pkpass(\?|$)/.test(url)) {
            res.setHeader(
              'Content-Type',
              contentType ?? 'application/vnd.apple.pkpass',
            )
          } else if (/\.pkpasses(\?|$)/.test(url)) {
            res.setHeader(
              'Content-Type',
              contentType ?? 'application/vnd.apple.pkpasses',
            )
          }
          next()
        })
      },
    },
  ],
})
