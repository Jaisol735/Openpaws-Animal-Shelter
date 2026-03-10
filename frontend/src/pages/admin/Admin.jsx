import { useState } from 'react'
import Navbar from '../../components/Navbar'
import './Admin.css'
import AdminUsers from './AdminUsers'
import AdminAnimals from './AdminAnimals'
import AdminForms from './AdminForms'
import AdminPlacementRules from './AdminPlacementRules'

function Admin({ user, onNavigate, onLogout }) {
  const [section, setSection] = useState('users') // users, animals, forms, rules

  return (
    <div className="admin-page">
      <Navbar user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="admin-container">
        <h1>Admin Controls</h1>
        
        <div className="admin-tabs">
          <button
            className={`tab-btn ${section === 'users' ? 'active' : ''}`}
            onClick={() => setSection('users')}
          >
            A. Users
          </button>
          <button
            className={`tab-btn ${section === 'animals' ? 'active' : ''}`}
            onClick={() => setSection('animals')}
          >
            B. Animals
          </button>
          <button
            className={`tab-btn ${section === 'forms' ? 'active' : ''}`}
            onClick={() => setSection('forms')}
          >
            C. Forms
          </button>
          <button
            className={`tab-btn ${section === 'rules' ? 'active' : ''}`}
            onClick={() => setSection('rules')}
          >
            D. Placement Rules
          </button>
        </div>

        {section === 'users' && <AdminUsers />}
        {section === 'animals' && <AdminAnimals />}
        {section === 'forms' && <AdminForms />}
        {section === 'rules' && <AdminPlacementRules />}

        <button className="back-btn" onClick={() => onNavigate('home')}>
          ← Back to Home
        </button>
      </div>
    </div>
  )
}

export default Admin
