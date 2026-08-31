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
// import bayroastPassUrl from './pass/BayroastCoffee.pkpass?url'
// import benignoPassUrl from './pass/BenignoAlbertoEsparzaInzunza.pkpass?url'
// import nwordPassUrl from './pass/N_Word.pkpass?url'
import pkpassesUrl from './pass/pkpasses.pkpasses?url'

// ── Apple Wallet pass 文件列表（随机选一个） ──
const APPLE_PASSES = [
  // { url: bayroastPassUrl, name: 'BayroastCoffee.pkpass' },
  // { url: benignoPassUrl, name: 'BenignoAlbertoEsparzaInzunza.pkpass' },
  // { url: nwordPassUrl, name: 'N_Word.pkpass' },
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
  // iOS Safari 识别：含 Safari/ 且不含第三方浏览器标识
  // CriOS=Chrome, FxiOS=Firefox, EdgiOS=Edge, OPiOS=Opera, GSA=Google App
  const isIOSSafari =
    isIOS &&
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua) &&
    !isInApp
  // iOS 非 Safari（需要引导用户在 Safari 中打开）
  const isIOSNonSafari = isIOS && !isIOSSafari
  return { ua, isIOS, isAndroid, isInApp, isIOSSafari, isIOSNonSafari }
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

// ── iOS 非 Safari 引导页 ──

function SafariGuide() {
  return (
    <div style={sg.wrap}>
      {/* Safari 图标 */}
      <div style={sg.iconWrap}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect width="72" height="72" rx="16" fill="url(#safariGrad)" />
          {/* 指南针外圆 */}
          <circle cx="36" cy="36" r="22" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
          {/* 指针 */}
          <polygon points="36,16 40,36 36,32 32,36" fill="white" />
          <polygon points="36,56 32,36 36,40 40,36" fill="white" opacity="0.5" />
          {/* 中心点 */}
          <circle cx="36" cy="36" r="2.5" fill="white" />
          <defs>
            <linearGradient id="safariGrad" x1="0" y1="0" x2="72" y2="72">
              <stop offset="0%" stopColor="#1fa7f8" />
              <stop offset="100%" stopColor="#0d6efd" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h2 style={sg.title}>请在 Safari 中打开</h2>
      <p style={sg.subtitle}>
        添加卡券到 Apple Wallet 仅支持 Safari 浏览器
      </p>

      {/* 步骤说明 */}
      <div style={sg.stepsCard}>
        <div style={sg.step}>
          <span style={sg.stepNum}>1</span>
          <span style={sg.stepText}>
            点击底部工具栏的
            <span style={sg.highlight}>「分享」</span>按钮
            <ShareIcon />
          </span>
        </div>
        <div style={sg.divider} />
        <div style={sg.step}>
          <span style={sg.stepNum}>2</span>
          <span style={sg.stepText}>
            在弹出菜单中选择
            <span style={sg.highlight}>「在 Safari 中打开」</span>
          </span>
        </div>
      </div>

      <p style={sg.tip}>
        * 如使用微信，请点击右上角 ··· 菜单后选择「在 Safari 中打开」
      </p>
    </div>
  )
}

/** iOS 分享按钮图标 */
function ShareIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 3 }}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

/** SafariGuide 专用样式 */
const sg: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100svh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: '#f2f2f7',
    textAlign: 'center',
  },
  iconWrap: {
    marginBottom: 24,
    filter: 'drop-shadow(0 8px 16px rgba(0,122,255,.25))',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: '0 0 10px',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#6e6e73',
    margin: '0 0 32px',
    lineHeight: 1.5,
  },
  stepsCard: {
    width: '100%',
    maxWidth: 340,
    background: '#fff',
    borderRadius: 14,
    padding: '4px 0',
    boxShadow: '0 1px 4px rgba(0,0,0,.08)',
    marginBottom: 20,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 20px',
    textAlign: 'left',
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#007aff',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  stepText: {
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 1.5,
  },
  highlight: {
    color: '#007aff',
    fontWeight: 600,
  },
  divider: {
    height: 1,
    background: '#f2f2f7',
    margin: '0 20px',
  },
  tip: {
    fontSize: 12,
    color: '#aeaeb2',
    maxWidth: 300,
    lineHeight: 1.6,
    margin: 0,
  },
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
  const { ua, isIOS, isAndroid, isIOSNonSafari } = detectEnv()

  const handleAppleWallet = useCallback(() => {
    window.location.href = randomItem(APPLE_PASSES).url
  }, [])

  const handleGoogleWallet = useCallback(() => {
    window.location.href = randomItem(GOOGLE_WALLET_URLS)
  }, [])

  // iOS 非 Safari：整页替换为引导页，不展示任何功能内容
  if (isIOSNonSafari) {
    return <SafariGuide />
  }

  // 设备标签显示
  let deviceLabel = 'PC / Desktop'
  let deviceColor = '#8c8c8c'
  if (isIOS) {
    deviceLabel = 'iOS · Safari'
    deviceColor = '#007aff'
  } else if (isAndroid) {
    deviceLabel = 'Android'
    deviceColor = '#34a853'
  }

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

      {/* ── Apple Wallet 区域 ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>🍎 Apple Wallet</div>
        <button style={s.appleBtn} onClick={handleAppleWallet}>
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
