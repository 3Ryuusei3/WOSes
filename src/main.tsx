/* import { StrictMode } from 'react' */
import { createRoot } from 'react-dom/client'
// Fonts bundled with the app (no request to Google, also work offline)
import '@fontsource/lilita-one/latin-400.css'
import '@fontsource/m-plus-rounded-1c/latin-500.css'
import '@fontsource/m-plus-rounded-1c/latin-700.css'
import '@fontsource/m-plus-rounded-1c/latin-800.css'
import '@fontsource/m-plus-rounded-1c/latin-900.css'
import './index.scss'
import './i18n/config'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <App />
)
