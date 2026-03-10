import { useEffect, useState } from 'react'
import { adminFetchStaff, adminCreateStaff, adminUpdateStaff, adminDeleteStaff } from '../../api'

function AdminUsers() {
  const [mode, setMode] = useState('create') // create | update | delete
  const [staff, setStaff] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadStaff()
  }, [])

  useEffect(() => {
    if (mode === 'update' || mode === 'delete') {
      setMessage('')
      setError('')
    }
  }, [mode])

  const loadStaff = async () => {
    try {
      const { staff: list, error } = await adminFetchStaff()
      if (error) throw error
      setStaff(list || [])
    } catch (err) {
      setError(err.message || 'Failed to load staff')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelect = (e) => {
    const id = e.target.value
    setSelectedId(id)
    const found = staff.find((s) => s.id === id)
    if (found) {
      setForm({ name: found.name || '', email: found.email || '', password: '', role: found.role || 'staff' })
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await adminCreateStaff(form)
      setForm({ name: '', email: '', password: '', role: 'staff' })
      await loadStaff()
      setMessage('User created successfully.')
    } catch (err) {
      setError(err.message || 'Failed to create user')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setError('')
    setMessage('')
    try {
      const payload = { name: form.name, email: form.email, role: form.role }
      await adminUpdateStaff(selectedId, payload)
      await loadStaff()
      setMessage('User updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update user')
    }
  }

  const handleDelete = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    if (!window.confirm('Delete this user?')) return
    setError('')
    setMessage('')
    try {
      await adminDeleteStaff(selectedId)
      setSelectedId('')
      await loadStaff()
      setMessage('User deleted successfully.')
    } catch (err) {
      setError(err.message || 'Failed to delete user')
    }
  }

  return (
    <div className="admin-section">
      <h2>Option A: Users (Admin)</h2>

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
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="primary-btn">
            Create User
          </button>
        </form>
      )}

      {mode === 'update' && (
        <form className="admin-form" onSubmit={handleUpdate}>
          <div className="form-row">
            <label>Select User</label>
            <select value={selectedId} onChange={handleSelect} required>
              <option value="">Select...</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>
          {selectedId && (
            <>
              <div className="form-row">
                <label>Name</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="primary-btn">
                Update User
              </button>
            </>
          )}
        </form>
      )}

      {mode === 'delete' && (
        <form className="admin-form" onSubmit={handleDelete}>
          <div className="form-row">
            <label>Select User to Delete</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required>
              <option value="">Select...</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="danger-btn">
            Delete User
          </button>
        </form>
      )}
    </div>
  )
}

export default AdminUsers

