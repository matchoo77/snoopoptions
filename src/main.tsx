import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { bootstrapSupabaseConfig } from './lib/supabase'

const root = createRoot(document.getElementById('root')!)

// Try to bootstrap Supabase config from an Edge Function before rendering
bootstrapSupabaseConfig()
  .catch(() => {})
  .finally(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })