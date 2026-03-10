import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import './Account.css'

function Account({ user, onNavigate, onLogout }) {
  const [profileImage, setProfileImage] = useState(null)

  useEffect(() => {
    if (user?.image_url) {
      setProfileImage(user.image_url)
    }
  }, [user])

  return (
    <div className="account-page">
      <Navbar user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="account-container">
        <div className="account-card">
          <h1>Account Information</h1>
          
          <div className="profile-section">
            <div className="profile-image-container">
              {profileImage ? (
                <img src={profileImage} alt={user?.name} className="profile-image" />
              ) : (
                <div className="profile-image-placeholder">👤</div>
              )}
            </div>

            <div className="user-info">
              <div className="info-item">
                <label>Name:</label>
                <span>{user?.name}</span>
              </div>

              <div className="info-item">
                <label>Email:</label>
                <span>{user?.email}</span>
              </div>

              <div className="info-item">
                <label>Role:</label>
                <span className={`role-badge ${user?.role}`}>{user?.role}</span>
              </div>

              <div className="info-item">
                <label>Member Since:</label>
                <span>{new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <button className="back-btn" onClick={() => onNavigate('home')}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default Account
