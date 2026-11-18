import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import '@fontsource-variable/golos-text'
import '@fontsource-variable/playfair-display'
import './styles.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
