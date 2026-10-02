import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { TicketsProvider } from './context/TicketsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <TicketsProvider>
          <App />
        </TicketsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
