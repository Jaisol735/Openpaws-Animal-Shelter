import { useEffect, useState } from 'react'
import { adminFetchAnimals, adminCreateAnimal, adminUpdateAnimal, adminDeleteAnimal } from '../../api'

function AdminAnimals() {
  const [mode, setMode] = useState('create') // create | update | delete
  const [animals, setAnimals] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState({
    animal_code: '',
    species: '',
    breed: '',
    gender: '',
    image_url: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadAnimals()
  }, [])

  const loadAnimals = async () => {
    try {
      const { animals: list, error } = await adminFetchAnimals()
      if (error) throw error
      setAnimals(list || [])
    } catch (err) {
      setError(err.message || 'Failed to load animals')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelect = (e) => {
    const id = e.target.value
    setSelectedId(id)
    const found = animals.find((a) => a.id === id)
    if (found) {
      setForm({
        animal_code: found.animal_code || '',
        species: found.species || '',
        breed: found.breed || '',
        gender: found.gender || '',
        image_url: found.image_url || '',
      })
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await adminCreateAnimal(form)
      setForm({ animal_code: '', species: '', breed: '', gender: '', image_url: '' })
      await loadAnimals()
      setMessage('Animal created successfully.')
    } catch (err) {
      setError(err.message || 'Failed to create animal')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setError('')
    setMessage('')
    try {
      const payload = {
        species: form.species,
        breed: form.breed,
        gender: form.gender,
        image_url: form.image_url,
      }
      await adminUpdateAnimal(selectedId, payload)
      await loadAnimals()
      setMessage('Animal updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update animal')
    }
  }

  const handleDelete = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    if (!window.confirm('Delete this animal?')) return
    setError('')
    setMessage('')
    try {
      await adminDeleteAnimal(selectedId)
      setSelectedId('')
      await loadAnimals()
      setMessage('Animal deleted successfully.')
    } catch (err) {
      setError(err.message || 'Failed to delete animal')
    }
  }

  return (
    <div className="admin-section">
      <h2>Option B: Animals (Admin)</h2>

      <div className="sub-options">
        <button className={mode === 'create' ? 'sub-btn active' : 'sub-btn'} onClick={() => setMode('create')}>
          Create New
        </button>
        <button className={mode === 'update' ? 'sub-btn active' : 'sub-btn'} onClick={() => setMode('update')}>
          Update
        </button>
        <button className={mode === 'delete' ? 'sub-btn active' : 'sub-btn'} onClick={() => setMode('delete')}>
          Delete
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {mode === 'create' && (
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>Animal Code</label>
            <input name="animal_code" value={form.animal_code} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Species</label>
            <input name="species" value={form.species} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Breed</label>
            <input name="breed" value={form.breed} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Gender</label>
            <input name="gender" value={form.gender} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Image URL</label>
            <input name="image_url" value={form.image_url} onChange={handleChange} />
          </div>
          <button type="submit" className="primary-btn">
            Create Animal
          </button>
        </form>
      )}

      {mode === 'update' && (
        <form className="admin-form" onSubmit={handleUpdate}>
          <div className="form-row">
            <label>Select Animal</label>
            <select value={selectedId} onChange={handleSelect} required>
              <option value="">Select...</option>
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.animal_code} ({a.species})
                </option>
              ))}
            </select>
          </div>
          {selectedId && (
            <>
              <div className="form-row">
                <label>Species</label>
                <input name="species" value={form.species} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Breed</label>
                <input name="breed" value={form.breed} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Gender</label>
                <input name="gender" value={form.gender} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Image URL</label>
                <input name="image_url" value={form.image_url} onChange={handleChange} />
              </div>
              <button type="submit" className="primary-btn">
                Update Animal
              </button>
            </>
          )}
        </form>
      )}

      {mode === 'delete' && (
        <form className="admin-form" onSubmit={handleDelete}>
          <div className="form-row">
            <label>Select Animal to Delete</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required>
              <option value="">Select...</option>
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.animal_code} ({a.species})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="danger-btn">
            Delete Animal
          </button>
        </form>
      )}
    </div>
  )
}

export default AdminAnimals

