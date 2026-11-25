/* import { StrictMode } from 'react' */
import { createRoot } from 'react-dom/client'
// Font bundled with the app (no request to Google, also works offline)
import '@fontsource/lilita-one/latin-400.css'
import './index.scss'
import './i18n/config'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <App />
)
