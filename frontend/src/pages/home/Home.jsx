import Navbar from '../../components/Navbar'
import './Home.css'

function Home({ user, onNavigate, onLogout }) {
  return (
    <div className="home-page">
      <Navbar user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="home-container">
        <h1>Welcome, {user?.name}!</h1>
        <p>Select an option to continue</p>
        
        <div className="options-grid">
          <div className="option-card" onClick={() => onNavigate('animal')}>
            <div className="option-icon">🐾</div>
            <h2>Review Animals</h2>
            <p>View and manage animals in the system</p>
          </div>
          
          <div className="option-card" onClick={() => onNavigate('assessment')}>
            <div className="option-icon">📋</div>
            <h2>New Assessment</h2>
            <p>Create a new animal assessment</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
