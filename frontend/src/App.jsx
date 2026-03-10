import { useState, useEffect } from 'react'
import Login from './pages/login/Login'
import Home from './pages/home/Home'
import Account from './pages/account/Account'
import Organization from './pages/organization/Organization'
import Animal from './pages/animal/Animal'
import Assessment from './pages/assessment/Assessment'
import Admin from './pages/admin/Admin'

function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('login')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // rehydrate from localStorage on refresh so we don't bounce back to login
    try {
      const storedUser = localStorage.getItem('openpaws_user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
        // Always start at home on refresh (don't restore last page)
        setCurrentPage('home')
        localStorage.setItem('openpaws_page', 'home')
      }
    } catch (err) {
      console.error('Error restoring session from storage:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentPage('home')
    try {
      localStorage.setItem('openpaws_user', JSON.stringify(userData))
      localStorage.setItem('openpaws_page', 'home')
    } catch (err) {
      console.error('Error saving session:', err)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentPage('login')
    try {
      localStorage.removeItem('openpaws_user')
      localStorage.removeItem('openpaws_page')
    } catch (err) {
      console.error('Error clearing session:', err)
    }
  }

  const handleNavigation = (page) => {
    setCurrentPage(page)
    try {
      localStorage.setItem('openpaws_page', page)
    } catch {
      // ignore storage errors
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
  }

  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div>
      {currentPage === 'home' && <Home user={user} onNavigate={handleNavigation} onLogout={handleLogout} />}
      {currentPage === 'account' && <Account user={user} onNavigate={handleNavigation} onLogout={handleLogout} />}
      {currentPage === 'organization' && <Organization user={user} onNavigate={handleNavigation} onLogout={handleLogout} />}
      {currentPage === 'animal' && <Animal user={user} onNavigate={handleNavigation} onLogout={handleLogout} />}
      {currentPage === 'assessment' && <Assessment user={user} onNavigate={handleNavigation} />}
      {currentPage === 'admin' && user?.role === 'admin' && <Admin user={user} onNavigate={handleNavigation} onLogout={handleLogout} />}
    </div>
  )
}

export default App
