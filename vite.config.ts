import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 使用相对路径，确保直接双击打开 dist/index.html 时资源路径正确（file:// 协议）
  base: './',

  // 让 Vite 把 .pkpass / .pkpasses 当作静态资源处理（支持 ?url 导入）
  assetsInclude: ['**/*.pkpass', '**/*.pkpasses'],

  build: {
    rollupOptions: {
      output: {
        // 输出 IIFE 格式：生成普通 <script src> 而非 <script type="module">
        // 解决 Chrome 禁止 file:// 协议执行 ES Module 导致的白屏问题
        format: 'iife',
        // 将所有动态 import 内联到主包，避免 IIFE 模式下的模块拆分冲突
        inlineDynamicImports: true,
      },
    },
  },

  plugins: [
    react(),
    // 构建时从 index.html 移除 type="module" 和 crossorigin 属性：
    // JS 已打包为 IIFE 格式，不需要 ES Module 支持；
    // 去掉这两个属性后，dist/index.html 可直接用 file:// 协议打开而不白屏。
    {
      name: 'remove-module-type-for-file-protocol',
      transformIndexHtml(html: string) {
        return html
          .replace(/ type="module"/g, '')
          .replace(/ crossorigin/g, '')
      },
    },

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
