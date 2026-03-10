import { useState, useEffect } from 'react'
import { fetchAnimals, fetchAnimalAssessments } from '../../api'
import Navbar from '../../components/Navbar'
import './Animal.css'

function Animal({ user, onNavigate, onLogout }) {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [assessments, setAssessments] = useState([])

  useEffect(() => {
    loadAnimals()
  }, [])

  const loadAnimals = async () => {
    try {
      const { animals: list, error: fetchError } = await fetchAnimals()
      if (fetchError) throw fetchError
      setAnimals(list || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch animals')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssessments = async (animalId) => {
    try {
      const { assessments: list, error: fetchError } = await fetchAnimalAssessments(animalId)
      if (fetchError) throw fetchError
      // newest first (backend already orders by assessed_at desc, but guard anyway)
      const sorted = (list || []).slice().sort((a, b) => {
        const da = a.assessed_at ? new Date(a.assessed_at).getTime() : 0
        const db = b.assessed_at ? new Date(b.assessed_at).getTime() : 0
        return db - da
      })
      setAssessments(sorted)
    } catch (err) {
      setError(err.message || 'Failed to fetch assessments')
    }
  }

  const handleSelectAnimal = (animal) => {
    setSelectedAnimal(animal)
    fetchAssessments(animal.id)
  }

  const handleBack = () => {
    setSelectedAnimal(null)
    setAssessments([])
  }

  return (
    <div className="animal-page">
      <Navbar user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="animal-container">
        {!selectedAnimal ? (
          <>
            <h1>Animals</h1>
            
            {error && <div className="error-message">{error}</div>}
            
            {loading ? (
              <div className="loading">Loading animals...</div>
            ) : (
              <div className="animal-grid">
                {animals.map((animal) => (
                  <div key={animal.id} className="animal-card" onClick={() => handleSelectAnimal(animal)}>
                    <div className="animal-image">
                      {animal.image_url ? (
                        <img src={animal.image_url} alt={animal.animal_code} />
                      ) : (
                        <div className="image-placeholder">🐾</div>
                      )}
                    </div>
                    <h3>{animal.animal_code}</h3>
                    <p>{animal.species} - {animal.breed}</p>
                    <p className="gender">{animal.gender}</p>
                    <button className="view-btn">View Assessments →</button>
                  </div>
                ))}
              </div>
            )}

            <button className="back-btn" onClick={() => onNavigate('home')}>
              ← Back to Home
            </button>
          </>
        ) : (
          <>
            <h1>Assessments for {selectedAnimal.animal_code}</h1>
            
            <div className="assessments-list">
              {assessments.length === 0 ? (
                <p className="no-assessments">No assessments found for this animal</p>
              ) : (
                assessments.map((assessment) => (
                  <div key={assessment.id} className="assessment-item">
                    <div className="assessment-info">
                      <h3>Assessment #{assessment.id.slice(0, 8)}</h3>
                      <p>
                        <strong>Animal ID:</strong> {selectedAnimal.animal_code}{' '}
                        <span className="muted">
                          ({selectedAnimal.species || 'Animal'})
                        </span>
                      </p>
                      <p>
                        <strong>Staff:</strong> {assessment.staff_id}{' '}
                        <span className="muted">
                          {assessment.staff?.name ? `- ${assessment.staff.name}` : ''}
                        </span>
                      </p>
                      <p>
                        <strong>Date:</strong>{' '}
                        {assessment.assessed_at
                          ? new Date(assessment.assessed_at).toLocaleString()
                          : 'N/A'}
                      </p>
                      <p>
                        <strong>Behavior score:</strong>{' '}
                        {typeof assessment.behavioral_score === 'number'
                          ? assessment.behavioral_score
                          : 'N/A'}
                      </p>
                      <p>
                        <strong>Health score:</strong>{' '}
                        {typeof assessment.health_score === 'number'
                          ? assessment.health_score
                          : 'N/A'}
                      </p>
                      <p>
                        <strong>Past score:</strong>{' '}
                        {typeof assessment.past_score === 'number'
                          ? assessment.past_score
                          : 'N/A'}
                      </p>
                      <p>
                        <strong>Placement:</strong> {assessment.recommendation || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className="back-btn" onClick={handleBack}>
              ← Back to Animals
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Animal
