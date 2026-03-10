import { useState, useEffect } from 'react'
import { getStaff } from '../../api'
import Navbar from '../../components/Navbar'
import './Organization.css'

function Organization({ user, onNavigate, onLogout }) {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const { staff, error: fetchError } = await getStaff()
      if (fetchError) throw fetchError
      setStaff(staff || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch staff')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="organization-page">
      <Navbar user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="organization-container">
        <h1>Organization Staff</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading staff...</div>
        ) : (
          <div className="staff-grid">
            {staff.map((member) => (
              <div key={member.id} className="staff-card">
                <div className="staff-image">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} />
                  ) : (
                    <div className="image-placeholder">👤</div>
                  )}
                </div>
                <h3>{member.name}</h3>
                <p className={`role ${member.role}`}>{member.role}</p>
                <p className="email">{member.email}</p>
              </div>
            ))}
          </div>
        )}

        <button className="back-btn" onClick={() => onNavigate('home')}>
          ← Back to Home
        </button>
      </div>
    </div>
  )
}

export default Organization
