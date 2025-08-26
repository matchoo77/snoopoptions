import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = createRoot(document.getElementById('root')!)

// Render the app directly since Supabase is hardcoded
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)