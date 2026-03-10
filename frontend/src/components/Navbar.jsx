import './Navbar.css'

function Navbar({ user, onNavigate, onLogout, isAssessment = false }) {
  if (isAssessment) {
    return null
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-logo">🐾 Open Paws</h1>
      </div>
      
      <div className="navbar-right">
        <button className="nav-btn" onClick={() => onNavigate('account')}>
          👤 Account
        </button>
        <button className="nav-btn" onClick={() => onNavigate('organization')}>
          👥 Organization
        </button>
        <button className="nav-btn" onClick={() => onNavigate('animal')}>
          🐾 Animals
        </button>
        {user?.role === 'admin' && (
          <button className="nav-btn admin-btn" onClick={() => onNavigate('admin')}>
            ⚙️ Admin
          </button>
        )}
        <button className="nav-btn logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
