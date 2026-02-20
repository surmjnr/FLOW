import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DocumentProvider } from './context/DocumentContext'
import { ConfigProvider } from './context/ConfigContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Layout from './components/Layout'
import SendPage from './pages/SendPage'
import ReceivePage from './pages/ReceivePage'
import RecordsPage from './pages/RecordsPage'
import Configuration from './pages/Configuration'
import './App.css'

function HomeRedirect() {
  const { canRecord, isAdmin } = useAuth()
  if (isAdmin()) return <Navigate to="/records" replace />
  return <Navigate to={canRecord() ? '/send' : '/receive'} replace />
}

function App() {
  useEffect(() => {
    if (window.location.hostname !== 'surmjnr.github.io') {
      window.location.href = 'https://surmjnr.github.io/FLOW';
    }
  }, []);

  return (
    <AuthProvider>
      <DocumentProvider>
        <ConfigProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<HomeRedirect />} />
                <Route path="send" element={<SendPage />} />
                <Route path="receive" element={<ReceivePage />} />
                <Route path="records" element={<RecordsPage />} />
                <Route path="configuration/forms" element={<Configuration />} />
                <Route path="configuration/link" element={<Configuration />} />
                <Route path="configuration/users" element={<Configuration />} />
                <Route path="configuration" element={<Configuration />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ConfigProvider>
      </DocumentProvider>
    </AuthProvider>
  )
}

export default App
