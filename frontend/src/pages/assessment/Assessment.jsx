import { useState } from 'react'
import { searchAnimal, getLastAssessment, unlockAssessment, getLatestForm, submitAssessment } from '../../api'
import './Assessment.css'

function Assessment({ user, onNavigate }) {
  const [step, setStep] = useState(1)
  const [animalCode, setAnimalCode] = useState('')
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [form, setForm] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [formPart, setFormPart] = useState(1)
  const [behaviorScore, setBehaviorScore] = useState(0)
  const [healthScore, setHealthScore] = useState(0)
  const [pastScore, setPastScore] = useState(0)

  const handleSearchAnimal = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { animal, error: fetchError } = await searchAnimal(animalCode.toUpperCase())
      if (fetchError) throw fetchError
      
      setSelectedAnimal(animal)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Animal not found')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockAssessment = async () => {
    if (!selectedAnimal) return
    
    setLoading(true)
    setError('')
    
    try {
      // unlock is tracked on the animal row (animals.status)
      if (String(selectedAnimal.status || '').toLowerCase() === 'locked') {
        await unlockAssessment(selectedAnimal.id)
      } else {
        // still try to unlock (idempotent) in case status is stale
        await unlockAssessment(selectedAnimal.id)
      }

      const { form, error: formError } = await getLatestForm()
      if (formError && formError !== 'Not found') throw formError

      setForm(form)
      setFormPart(1)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Failed to unlock assessment')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, value, isMultiple = false) => {
    setAnswers((prev) => {
      if (isMultiple) {
        const current = prev[questionId] || []
        if (current.includes(value)) {
          return { ...prev, [questionId]: current.filter(v => v !== value) }
        } else {
          return { ...prev, [questionId]: [...current, value] }
        }
      } else {
        return { ...prev, [questionId]: value }
      }
    })
  }

  const getSectionQuestions = (type) => {
    const questions = form?.schema?.questions || []
    if (!questions.length) return []
    const normalizedType = type.toLowerCase()
    const filtered = questions.filter((q) => {
      const qType = (q.type || q.category || '').toLowerCase()
      if (!qType) return false
      if (normalizedType === 'behavior') {
        return qType === 'behavior' || qType === 'behaviour' || qType === 'behavioral'
      }
      if (normalizedType === 'health') {
        return qType === 'health'
      }
      return false
    })
    if (filtered.length) return filtered
    if (normalizedType === 'behavior') {
      return questions.slice(0, Math.ceil(questions.length / 2))
    }
    return questions.slice(Math.ceil(questions.length / 2))
  }

  const allAnsweredForSection = (sectionQuestions) => {
    if (!sectionQuestions.length) return false
    return sectionQuestions.every((q) => {
      if (!q.required) return true
      const value = answers[q.id]
      if (q.multiple) {
        return Array.isArray(value) && value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    })
  }

  const calculateScoreForSection = (sectionQuestions) => {
    let total = 0
    sectionQuestions.forEach((q) => {
      const value = answers[q.id]
      if (!q.options || value === undefined || value === null) return
      if (Array.isArray(value)) {
        value.forEach((val) => {
          const opt = q.options.find((o) => o.label === val)
          if (opt && typeof opt.score === 'number') total += opt.score
        })
      } else {
        const opt = q.options.find((o) => o.label === value)
        if (opt && typeof opt.score === 'number') total += opt.score
      }
    })
    return total
  }

  const handleNextBehavior = () => {
    const behaviorQuestions = getSectionQuestions('behavior')
    const score = calculateScoreForSection(behaviorQuestions)
    setBehaviorScore(score)
    setFormPart(2)
  }

  const handleNextHealth = () => {
    const healthQuestions = getSectionQuestions('health')
    const score = calculateScoreForSection(healthQuestions)
    setHealthScore(score)
    setFormPart(3)
  }

  const handlePastScoreChange = (value) => {
    setPastScore(value)
    setAnswers((prev) => ({
      ...prev,
      past_score: value,
    }))
  }

  const handleSubmitAssessment = async () => {
    setLoading(true)
    setError('')
    
    try {
      // convert answers object into array for backend
      const payloadAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))

      const response = await submitAssessment({
        animal_id: selectedAnimal.id,
        staff_id: user.id,
        answers: Object.fromEntries(payloadAnswers.map((a) => [a.questionId, a.answer])),
        behaviorScore,
        healthScore,
        pastScore,
      })

      setResult({
        behaviorScore: response.behaviorScore,
        healthScore: response.healthScore,
        pastScore: response.pastScore,
        placement: response.placement,
        risk: response.risk_level,
        reason:
          response.rule && (response.rule.action_required || response.rule.monitoring_level)
            ? `${response.rule.action_required || ''} ${response.rule.monitoring_level || ''}`.trim()
            : '',
      })

      setStep(4)
    } catch (err) {
      setError(err.message || 'Failed to submit assessment')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteAssessment = () => {
    onNavigate('home')
  }

  return (
    <div className="assessment-page">
      <div className="assessment-container">
        {step === 1 && (
          <div className="assessment-step">
            <h1>New Assessment</h1>
            <p>Step 1: Select Animal</p>
            
            <form onSubmit={handleSearchAnimal}>
              <div className="form-group">
                <label>Animal Code</label>
                <input
                  type="text"
                  value={animalCode}
                  onChange={(e) => setAnimalCode(e.target.value.toUpperCase())}
                  placeholder="Enter animal code"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && selectedAnimal && (
          <div className="assessment-step">
            <h1>Confirm Animal</h1>
            <p>Step 2: Review & Unlock</p>
            
            <div className="animal-details">
              <p><strong>Code:</strong> {selectedAnimal.animal_code}</p>
              <p><strong>Species:</strong> {selectedAnimal.species}</p>
              <p><strong>Breed:</strong> {selectedAnimal.breed}</p>
              <p><strong>Gender:</strong> {selectedAnimal.gender}</p>
              <p><strong>Behavioral score:</strong> {selectedAnimal.behavioral_score ?? 'N/A'}</p>
              <p><strong>Health score:</strong> {selectedAnimal.health_score ?? 'N/A'}</p>
              <p><strong>Past score:</strong> {selectedAnimal.past_score ?? 'N/A'}</p>
              <p><strong>Status:</strong> {selectedAnimal.status ?? 'unknown'}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button onClick={handleUnlockAssessment} disabled={loading}>
              {loading ? 'Unlocking...' : 'Unlock & Start Assessment'}
            </button>
          </div>
        )}

        {step === 3 && form && (
          <div className="assessment-step">
            <h1>Assessment Form</h1>
            <p>Step 3: Complete Assessment</p>

            {formPart === 1 && (
              <>
                <h2>Part 1: Behavioral Questions</h2>
                <div className="form-questions">
                  {getSectionQuestions('behavior').map((question) => (
                    <div key={question.id} className="question-item">
                      <label>{question.text}</label>
                      {question.multiple ? (
                        <div className="options-group">
                          {question.options?.map((opt, optIndex) => (
                            <label key={optIndex} className="option-item">
                              <input
                                type="checkbox"
                                checked={(answers[question.id] || []).includes(opt.label)}
                                onChange={() => handleAnswerChange(question.id, opt.label, true)}
                              />
                              {opt.label}
                              <br />
                            </label>
                          ))}
                        </div>
                      ) : question.options ? (
                        <div className="options-group">
                          {question.options?.map((opt, optIndex) => (
                            <label key={optIndex} className="option-item">
                              <input
                                type="radio"
                                name={question.id}
                                value={opt.label}
                                checked={answers[question.id] === opt.label}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              />
                              {opt.label}
                              <br />
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Enter your answer"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleNextBehavior}
                  disabled={!allAnsweredForSection(getSectionQuestions('behavior')) || loading}
                >
                  Next (Behavior)
                </button>
              </>
            )}

            {formPart === 2 && (
              <>
                <h2>Part 2: Health Questions</h2>
                <div className="form-questions">
                  {getSectionQuestions('health').map((question) => (
                    <div key={question.id} className="question-item">
                      <label>{question.text}</label>
                      {question.multiple ? (
                        <div className="options-group">
                          {question.options?.map((opt, optIndex) => (
                            <label key={optIndex} className="option-item">
                              <input
                                type="checkbox"
                                checked={(answers[question.id] || []).includes(opt.label)}
                                onChange={() => handleAnswerChange(question.id, opt.label, true)}
                              />
                              {opt.label}
                              <br />
                            </label>
                          ))}
                        </div>
                      ) : question.options ? (
                        <div className="options-group">
                          {question.options?.map((opt, optIndex) => (
                            <label key={optIndex} className="option-item">
                              <input
                                type="radio"
                                name={question.id}
                                value={opt.label}
                                checked={answers[question.id] === opt.label}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              />
                              {opt.label}
                              <br />
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Enter your answer"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleNextHealth}
                  disabled={!allAnsweredForSection(getSectionQuestions('health')) || loading}
                >
                  Next (Health)
                </button>
              </>
            )}

            {formPart === 3 && (
              <>
                <h2>Part 3: Past Score</h2>
                <div className="form-questions">
                  <div className="question-item">
                    <label>Past behavior / health issue indicator</label>
                    <div className="options-group">
                      <label className="option-item">
                        <input
                          type="radio"
                          name="past_score"
                          value={0}
                          checked={pastScore === 0}
                          onChange={() => handlePastScoreChange(0)}
                        />
                        0 - No issue
                      </label>
                      <label className="option-item">
                        <input
                          type="radio"
                          name="past_score"
                          value={1}
                          checked={pastScore === 1}
                          onChange={() => handlePastScoreChange(1)}
                        />
                        1 - Behavioral issue
                      </label>
                      <label className="option-item">
                        <input
                          type="radio"
                          name="past_score"
                          value={2}
                          checked={pastScore === 2}
                          onChange={() => handlePastScoreChange(2)}
                        />
                        2 - Health issue
                      </label>
                      <label className="option-item">
                        <input
                          type="radio"
                          name="past_score"
                          value={3}
                          checked={pastScore === 3}
                          onChange={() => handlePastScoreChange(3)}
                        />
                        3 - Both issues
                      </label>
                    </div>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button onClick={handleSubmitAssessment} disabled={loading || pastScore === null}>
                  {loading ? 'Submitting...' : 'Submit Assessment'}
                </button>
              </>
            )}
          </div>
        )}

        {step === 4 && result && (
          <div className="assessment-step result-step">
            <h1>Assessment Complete</h1>
            <p>Step 4: Results</p>
            
            <div className="result-box">
              <h2>Behavioral score: {result.behaviorScore}</h2>
              <h2>Health score: {result.healthScore}</h2>
              <h2>Past score: {result.pastScore}</h2>
              <p><strong>Placement:</strong> {result.placement}</p>
              {result.risk && <p><strong>Risk Level:</strong> {result.risk}</p>}
              <p><strong>Reason:</strong> {result.reason}</p>
            </div>

            <button onClick={handleCompleteAssessment}>
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Assessment
