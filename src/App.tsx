/**
 * Wallet Pass Demo
 *
 * 演示如何通过 H5 页面将卡券一键添加到 Apple Wallet（iOS）和 Google Wallet（Android）。
 *
 * Apple Wallet：
 *   - 随机从 3 个 .pkpass 文件中选一个，用 window.location.href 触发 iOS PassKit 下载
 *   - 仅 iOS Safari / iOS Chrome 支持；微信等 App 内浏览器需引导用户在 Safari 中打开
 *
 * Google Wallet：
 *   - 随机从 3 个 JWT URL 中选一个，跳转 Google Wallet 确认页
 *   - 适用 Android Chrome、微信 Android、桌面 Chrome 等
 */

import { useCallback } from 'react'

// ── Apple Wallet：用 Vite ?url 导入，构建时自动处理文件哈希 ──
import bayroastPassUrl from './pass/BayroastCoffee.pkpass?url'
import benignoPassUrl from './pass/BenignoAlbertoEsparzaInzunza.pkpass?url'
import nwordPassUrl from './pass/N_Word.pkpass?url'
import pkpassesUrl from './pass/pkpasses.pkpasses?url'

// ── Apple Wallet pass 文件列表（随机选一个） ──
const APPLE_PASSES = [
  { url: bayroastPassUrl, name: 'BayroastCoffee.pkpass' },
  { url: benignoPassUrl, name: 'BenignoAlbertoEsparzaInzunza.pkpass' },
  { url: nwordPassUrl, name: 'N_Word.pkpass' },
  { url: pkpassesUrl, name: 'pkpasses.pkpasses' },
] as const

// ── Google Wallet JWT URL 列表（随机选一个） ──
// JWT 1 & 2：包含 offerObjects（优惠券）
// JWT 3 & 4：包含 loyaltyObjects（会员卡）
const GOOGLE_WALLET_URLS = [
  'https://pay.google.com/gp/v/save/eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJnb29nbGUiLCJpYXQiOjE3ODc5Nzc1NTcsImlzcyI6ImV1LXBhc3NraXQtaW9AcGFzc2tpdC1pby5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsIm9yaWdpbnMiOlsicHViMS5wc2t0LmlvIl0sInBheWxvYWQiOnsib2ZmZXJPYmplY3RzIjpbeyJpZCI6IjMzODgwMDAwMDAwMDM2NTg4OTEuMURvMFVBTDMwajZ0ekVGc1MzWEI0UCJ9XX0sInR5cCI6InNhdmV0b2FuZHJvaWRwYXkifQ.DhDPawNY7ncDjtLqWlez9iFU9gPwcWjUxHR8JYlqtLZu_Y7ei-iKH61MzXmXq0IS48R-lAVSJca5RHa5h16qyFkMQPtkww4y7VEWofbJdfTsCdR5Ec7QkVapA_od89LttnSjdSFZ1yZOKq_5PkWTVx9F7h6s7rs9t4MXzV5NGq9WdcvPLvcKoR3Y_ZtokVrQS6nb32nCc5RqUNWjaFj_M1AolWClmtZNLkbp-tb2hkBDLN_kwF83acStS70tlEIqym9i72RAQCzYoq-sawCfrHHFLLFG8Q6vchITXOFjShAh_uvGLSJkGp2Z4Auh-GOfZbavpYi_lMvLYmxSc6I-ng',
  'https://pay.google.com/gp/v/save/eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJnb29nbGUiLCJpYXQiOjE3ODc5Nzc1NTcsImlzcyI6ImV1LXBhc3NraXQtaW9AcGFzc2tpdC1pby5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsIm9yaWdpbnMiOlsicHViMS5wc2t0LmlvIl0sInBheWxvYWQiOnsib2ZmZXJPYmplY3RzIjpbeyJpZCI6IjMzODgwMDAwMDAwMDM2NTg4OTEuMURvMFVBTDMwajZ0ekVGc1MzWEI0UCJ9XX0sInR5cCI6InNhdmV0b2FuZHJvaWRwYXkifQ.DhDPawNY7ncDjtLqWlez9iFU9gPwcWjUxHR8JYlqtLZu_Y7ei-iKH61MzXmXq0IS48R-lAVSJca5RHa5h16qyFkMQPtkww4y7VEWofbJdfTsCdR5Ec7QkVapA_od89LttnSjdSFZ1yZOKq_5PkWTVx9F7h6s7rs9t4MXzV5NGq9WdcvPLvcKoR3Y_ZtokVrQS6nb32nCc5RqUNWjaFj_M1AolWClmtZNLkbp-tb2hkBDLN_kwF83acStS70tlEIqym9i72RAQCzYoq-sawCfrHHFLLFG8Q6vchITXOFjShAh_uvGLSJkGp2Z4Auh-GOfZbavpYi_lMvLYmxSc6I-ng',
  'https://pay.google.com/gp/v/save/eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJnb29nbGUiLCJpYXQiOjE3ODc5Nzc4MzgsImlzcyI6ImV1LXBhc3NraXQtaW9AcGFzc2tpdC1pby5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsIm9yaWdpbnMiOlsicHViMS5wc2t0LmlvIl0sInBheWxvYWQiOnsibG95YWx0eU9iamVjdHMiOlt7ImlkIjoiMzM4ODAwMDAwMDAwMzY1ODg5MS41dlNKWDZsYzNjNXhzUUdMWVR0aFhVIn1dfSwidHlwIjoic2F2ZXRvYW5kcm9pZHBheSJ9.P0A12aP2VQVFp1LklEHDkHs0zl-c7mzGxsW0yyOeKGZp1S5YUwYfWQ3wsqSN28ONz3nKeFJowx-8Aks1VU-KiZ4AaqyTx1po8IIr_siJrvnRQAtXDcNffU-jHJXgkgQi8jUD9CM6wvXtZt5fPHBAj9_znsEAB1CEkUuJB_rKYTL6FaK-yzpN2oMcPMb_WWYsjn77TjG38tc7qwIy2WsKd-gWAu2TWczaYLpXMUEsql0xvg3TlVplUZQpfULAC9H34zGWp6wHfbN9XIIrFf_uRZyQ8AChgSHSWdSX-ZddEKOuwWa8fJJyFlErrGss3wDg6ZusOgAHVTPISa43HuNVLA',
  'https://pay.google.com/gp/v/save/eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJnb29nbGUiLCJpYXQiOjE3ODc5NzgxODIsImlzcyI6ImV1LXBhc3NraXQtaW9AcGFzc2tpdC1pby5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsIm9yaWdpbnMiOlsicHViMS5wc2t0LmlvIl0sInBheWxvYWQiOnsibG95YWx0eU9iamVjdHMiOlt7ImlkIjoiMzM4ODAwMDAwMDAwMzY1ODg5MS43OVFJWU9RejBlMFMwaDFzdEZBc3REIn1dfSwidHlwIjoic2F2ZXRvYW5kcm9pZHBheSJ9.va8HKGMF6vouqbxKkdbvZ038ZBGMknyZkKVV4xrClYA0GiPaddW1wD5Of5M31P1lXctSuRmnjnL7n1-MI23Wl0H-1AW-xd5_wKqz9hTG-lzX0gFXSa0-45x2S2W0oY8HlDJ-OrhNwwyJIeCWqzRqs20cXCSvhZ-5cpVTDW0KDtslpg7PgNVDUwZM0ZdDZB3FyBDsgku6ja3gc5W35PxZv5Re4Txu4PRoUL4fcIcHCCEELPmnV_mCp85N2VOY1jBKFGIicPGAVW9lYIiJWWe_2wxAhKc1eCcS6u9hvr8xs3rs96VvUeJePnps-Y9olYKxSqRy53IYj0UL7oGyWbiVOw',
] as const

/** 从数组中随机取一个元素 */
function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 设备 & 浏览器环境检测 */
function detectEnv() {
  const ua = navigator.userAgent
  // iOS：iPhone / iPad / iPod；兼容 iOS 13+ iPad 伪装 MacIntel 的情况
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(ua)
  // 微信 / 微博 / QQ / Facebook / Instagram / Line / TikTok 等 App 内置 WebView
  const isInApp =
    /MicroMessenger|weibo|QQ\/|FBAV|FBAN|Instagram|Line\/|TikTok/i.test(ua)
  return { ua, isIOS, isAndroid, isInApp }
}

// ── 图标组件 ──

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-154.4-116.9C179.5 698 128 582.3 128 471.5c0-170.1 111.4-260 214.8-260 85.5 0 139.1 56.3 193.8 56.3 52.1 0 116.4-59.9 207.2-59.9 33.1 0 135.9 3.2 213.9 97.6zm-141.5-128.9c-32 28.5-81.5 50.1-130.4 50.1-5.8 0-11.6-.3-17.4-1.3-.7-4.7-1-9.5-1-14.5 0-52.5 25.8-108 73.6-147.7 25.4-20.8 71.8-43.2 115.1-43.2 5.1 0 10.2.3 15.3.9 1 5.5 1.3 11.2 1.3 16.6 0 52.5-23.2 107.3-56.5 139.1z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 533.5 544.3">
      <path
        d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"
        fill="#4285f4"
      />
      <path
        d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"
        fill="#34a853"
      />
      <path
        d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z"
        fill="#fbbc04"
      />
      <path
        d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z"
        fill="#ea4335"
      />
    </svg>
  )
}

// ── 工具小组件 ──

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{children}</span>
    </div>
  )
}

function DeviceTag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 5,
        background: color + '18',
        color,
        fontSize: 13,
        fontWeight: 600,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  )
}

// ── 主组件 ──

function App() {
  const { ua, isIOS, isAndroid, isInApp } = detectEnv()

  /**
   * 点击 Apple Wallet 按钮：随机选一个 .pkpass，用 window.location.href 触发下载。
   * ⚠️ 必须用 window.location.href，不能用 fetch + blob URL：
   *    iOS 对 blob URL 的 MIME 处理不可靠，直接赋值 href 才能让 Safari 弹出 PassKit 框。
   */
  const handleAppleWallet = useCallback(() => {
    window.location.href = randomItem(APPLE_PASSES).url
  }, [])

  /**
   * 点击 Google Wallet 按钮：随机选一个 JWT URL，跳转到 Google Wallet 确认页。
   */
  const handleGoogleWallet = useCallback(() => {
    window.location.href = randomItem(GOOGLE_WALLET_URLS)
  }, [])

  // 设备标签显示
  let deviceLabel = 'PC / Desktop'
  let deviceColor = '#8c8c8c'
  if (isIOS && isInApp) {
    deviceLabel = 'iOS · App 内浏览器'
    deviceColor = '#e6a817'
  } else if (isIOS) {
    deviceLabel = 'iOS · Safari / Chrome'
    deviceColor = '#007aff'
  } else if (isAndroid) {
    deviceLabel = 'Android'
    deviceColor = '#34a853'
  }

  // Apple Wallet 按钮在 iOS App 内浏览器中禁用（需引导跳 Safari）
  const appleDisabled = isIOS && isInApp

  return (
    <div style={s.page}>
      <h1 style={s.pageTitle}>🎫 Wallet Pass Demo</h1>

      {/* ── 设备信息卡片 ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>📱 设备检测</div>
        <InfoRow label="当前环境">
          <DeviceTag color={deviceColor}>{deviceLabel}</DeviceTag>
        </InfoRow>
        <InfoRow label="User Agent">
          <span style={{ fontSize: 11, wordBreak: 'break-all', color: '#666' }}>
            {ua.slice(0, 110)}
            {ua.length > 110 ? '…' : ''}
          </span>
        </InfoRow>
      </div>

      {/* ── iOS App 内浏览器警告（微信 / FB 等） ── */}
      {isIOS && isInApp && (
        <div style={{ ...s.card, background: '#fffbe6', borderLeft: '4px solid #faad14' }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8 }}>
            ⚠️ <strong>检测到 iOS App 内置浏览器</strong>
            <br />
            Apple Wallet 仅在 <strong>Safari</strong> 中可用。
            <br />
            请点击右上角菜单 →「<strong>在 Safari 中打开</strong>」后再添加。
          </p>
        </div>
      )}

      {/* ── Apple Wallet 区域 ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>🍎 Apple Wallet</div>
        <button
          style={{
            ...s.appleBtn,
            ...(appleDisabled ? s.disabledBtn : {}),
          }}
          onClick={handleAppleWallet}
          disabled={appleDisabled}
        >
          <AppleIcon />
          Add to Apple Wallet
        </button>
      </div>

      {/* ── Google Wallet 区域 ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>🤖 Google Wallet</div>
        <button style={s.googleBtn} onClick={handleGoogleWallet}>
          <GoogleIcon />
          Add to Google Wallet
        </button>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 2.2, color: '#555' }}>
          <li>
            <strong>提示</strong>：点击没反应请检查一下当前网络能不能打开Google
          </li>
          </ul>
      </div>

      {/* ── 注意事项 ── */}
      <div style={{ ...s.card, background: '#f6f8fa' }}>
        <div style={s.cardTitle}>💡 注意事项</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 2.2, color: '#555' }}>
          <li>
            <strong>Apple Wallet</strong>：.pkpass 需由 Apple 颁发的证书签名才能真正添加；
            测试文件为示例，iOS 可能提示「无效证书」
          </li>
          <li>
            <strong>Google Wallet</strong>：JWT 需在 Google Wallet Console
            预注册 Class/Object，点击按钮后会跳转 Google 确认页
          </li>
          <li>
            <strong>生产场景</strong>：按设备分流，iOS 只展示 Apple 按钮，Android 只展示
            Google 按钮；Demo 中两个按钮同时展示方便调试
          </li>
          <li>
            <strong>微信 iOS</strong>：点击 Apple Wallet 按钮后需在 Safari 中打开才能完成添加
          </li>
        </ul>
      </div>
    </div>
  )
}

// ── 内联样式 ──
const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 540,
    margin: '0 auto',
    padding: '32px 16px 72px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    color: '#1d1d1f',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: 14,
    padding: '18px 20px 14px',
    marginBottom: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,.05)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: '#1d1d1f',
  },
  infoRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '6px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  infoLabel: {
    minWidth: 76,
    fontSize: 12,
    color: '#aaa',
    flexShrink: 0,
    paddingTop: 3,
  },
  infoValue: {
    fontSize: 13,
    flex: 1,
  },
  desc: {
    fontSize: 13,
    color: '#555',
    marginTop: 0,
    marginBottom: 14,
    lineHeight: 1.7,
  },
  // Apple Wallet 按钮：黑底白字（Apple 官方配色）
  appleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '14px 20px',
    borderRadius: 10,
    background: '#000',
    color: '#fff',
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 10,
    letterSpacing: 0.1,
    transition: 'opacity .15s',
  },
  // Google Wallet 按钮：白底深色字（Google 官方配色）
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '14px 20px',
    borderRadius: 10,
    background: '#fff',
    color: '#3c4043',
    border: '1.5px solid #dadce0',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 10,
    letterSpacing: 0.1,
    boxShadow: '0 1px 3px rgba(0,0,0,.08)',
  },
  disabledBtn: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  logLine: {
    fontSize: 12,
    color: '#389e0d',
    fontWeight: 600,
    marginBottom: 10,
    padding: '4px 10px',
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: 6,
  },
  fileList: {
    marginTop: 10,
    borderTop: '1px solid #f5f5f5',
    paddingTop: 8,
  },
  fileItem: {
    fontSize: 12,
    color: '#999',
    padding: '2px 0',
    fontFamily: '"SF Mono", "Fira Mono", ui-monospace, monospace',
  },
}

export default App
