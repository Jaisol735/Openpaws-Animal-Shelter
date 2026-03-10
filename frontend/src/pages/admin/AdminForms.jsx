import { useEffect, useState } from 'react'
import { adminFetchForms, adminUpdateForm } from '../../api'

function AdminForms() {
  const [type, setType] = useState('behavioral') // behavioral | health
  const [mode, setMode] = useState('new') // new | update
  const [forms, setForms] = useState([])
  const [schema, setSchema] = useState(null)
  const [newQuestion, setNewQuestion] = useState({
    id: '',
    text: '',
    required: true,
  })
  const [selectedQuestionId, setSelectedQuestionId] = useState('')
  const [editText, setEditText] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadForms()
  }, [])

  useEffect(() => {
    pickSchema()
  }, [forms, type])

  const loadForms = async () => {
    try {
      const { forms: list, error } = await adminFetchForms()
      if (error) throw error
      setForms(list || [])
    } catch (err) {
      setError(err.message || 'Failed to load forms')
    }
  }

  const pickSchema = () => {
    const match = (forms || []).find((f) => f.schema?.type === type)
    setSchema(match || null)
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!schema) return
    setError('')
    setMessage('')
    try {
      const updated = {
        ...schema,
        schema: {
          ...(schema.schema || {}),
          type,
          questions: [
            ...(schema.schema?.questions || []),
            {
              id: newQuestion.id,
              text: newQuestion.text,
              required: newQuestion.required,
              options: [],
            },
          ],
        },
      }
      await adminUpdateForm(schema.id, { form_name: updated.form_name, schema: updated.schema })
      await loadForms()
      setNewQuestion({ id: '', text: '', required: true })
      setMessage('Question added.')
    } catch (err) {
      setError(err.message || 'Failed to add question')
    }
  }

  const handleUpdateQuestion = async (e) => {
    e.preventDefault()
    if (!schema || !selectedQuestionId) return
    setError('')
    setMessage('')
    try {
      const updatedQuestions = (schema.schema?.questions || []).map((q) =>
        q.id === selectedQuestionId ? { ...q, text: editText } : q,
      )
      const updatedSchema = { ...(schema.schema || {}), questions: updatedQuestions }
      await adminUpdateForm(schema.id, { form_name: schema.form_name, schema: updatedSchema })
      await loadForms()
      setMessage('Question updated.')
    } catch (err) {
      setError(err.message || 'Failed to update question')
    }
  }

  const questions = schema?.schema?.questions || []

  return (
    <div className="admin-section">
      <h2>Option C: Forms</h2>

      <div className="sub-options">
        <button className={type === 'behavioral' ? 'sub-btn active' : 'sub-btn'} onClick={() => setType('behavioral')}>
          Behavioral
        </button>
        <button className={type === 'health' ? 'sub-btn active' : 'sub-btn'} onClick={() => setType('health')}>
          Health
        </button>
      </div>

      <div className="sub-options">
        <button className={mode === 'new' ? 'sub-btn active' : 'sub-btn'} onClick={() => setMode('new')}>
          New Question
        </button>
        <button className={mode === 'update' ? 'sub-btn active' : 'sub-btn'} onClick={() => setMode('update')}>
          Update Question
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {!schema && <p className="muted">No form schema found for this type yet.</p>}

      {schema && mode === 'new' && (
        <form className="admin-form" onSubmit={handleAddQuestion}>
          <div className="form-row">
            <label>Question ID</label>
            <input
              value={newQuestion.id}
              onChange={(e) => setNewQuestion((prev) => ({ ...prev, id: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>Question Text</label>
            <input
              value={newQuestion.text}
              onChange={(e) => setNewQuestion((prev) => ({ ...prev, text: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="primary-btn">
            Add Question
          </button>
        </form>
      )}

      {schema && mode === 'update' && (
        <form className="admin-form" onSubmit={handleUpdateQuestion}>
          <div className="form-row">
            <label>Select Question</label>
            <select
              value={selectedQuestionId}
              onChange={(e) => {
                const id = e.target.value
                setSelectedQuestionId(id)
                const q = questions.find((qq) => qq.id === id)
                setEditText(q?.text || '')
              }}
              required
            >
              <option value="">Select...</option>
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.id} - {q.text}
                </option>
              ))}
            </select>
          </div>
          {selectedQuestionId && (
            <>
              <div className="form-row">
                <label>Question Text</label>
                <input value={editText} onChange={(e) => setEditText(e.target.value)} required />
              </div>
              <button type="submit" className="primary-btn">
                Update Question
              </button>
            </>
          )}
        </form>
      )}
    </div>
  )
}

export default AdminForms

