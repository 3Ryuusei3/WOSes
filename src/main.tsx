/* import { StrictMode } from 'react' */
import { createRoot } from 'react-dom/client'
import './index.scss'
import './i18n/config'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <App />
)
