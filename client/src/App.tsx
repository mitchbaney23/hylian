import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DocumentUpload from './pages/DocumentUpload'
import DocumentTemplate from './pages/DocumentTemplate'
import ContractCreate from './pages/ContractCreate'
import ContractView from './pages/ContractView'
import SignDocument from './pages/SignDocument'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sign/:contractId" element={<SignDocument />} />
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <DocumentUpload />
            </ProtectedRoute>
          } />
          <Route path="/documents/:documentId/template" element={
            <ProtectedRoute>
              <DocumentTemplate />
            </ProtectedRoute>
          } />
          <Route path="/contracts/create/:documentId" element={
            <ProtectedRoute>
              <ContractCreate />
            </ProtectedRoute>
          } />
          <Route path="/contracts/:contractId" element={
            <ProtectedRoute>
              <ContractView />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App