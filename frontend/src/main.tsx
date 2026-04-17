import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

declare global {
  interface Window {
    __pwaInstallPrompt: Event | null
  }
}

// beforeinstallprompt는 React 마운트 전에 발화될 수 있어서 전역으로 미리 캡처
window.__pwaInstallPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__pwaInstallPrompt = e
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
