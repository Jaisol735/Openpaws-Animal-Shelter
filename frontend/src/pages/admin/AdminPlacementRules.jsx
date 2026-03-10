import { useEffect, useState } from 'react'
import {
  adminFetchPlacementRules,
  adminCreatePlacementRule,
  adminUpdatePlacementRule,
  adminFetchPlacements,
  adminCreatePlacement,
  adminFetchRisks,
} from '../../api'

function AdminPlacementRules() {
  const [mode, setMode] = useState('new') // new | update
  const [rules, setRules] = useState([])
  const [placements, setPlacements] = useState([])
  const [risks, setRisks] = useState([])
  const [ruleType, setRuleType] = useState('behavioral')
  const [form, setForm] = useState({
    min_score: '',
    max_score: '',
    placement: '',
    risk_level: '',
  })
  const [selectedRuleId, setSelectedRuleId] = useState('')
  const [newPlacement, setNewPlacement] = useState({ placement: '', description: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [{ rules: r }, { placements: p }, { risks: rs }] = await Promise.all([
        adminFetchPlacementRules(),
        adminFetchPlacements(),
        adminFetchRisks(),
      ])
      setRules(r || [])
      setPlacements(p || [])
      setRisks(rs || [])
    } catch (err) {
      setError(err.message || 'Failed to load placement rules')
    }
  }

  const handleRuleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddPlacement = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await adminCreatePlacement(newPlacement)
      setNewPlacement({ placement: '', description: '' })
      const { placements: p } = await adminFetchPlacements()
      setPlacements(p || [])
      setMessage('Placement added.')
    } catch (err) {
      setError(err.message || 'Failed to add placement')
    }
  }

  const handleCreateRule = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await adminCreatePlacementRule({
        rule_type: ruleType,
        min_score: Number(form.min_score),
        max_score: Number(form.max_score),
        placement: form.placement,
        risk_level: form.risk_level,
      })
      setForm({ min_score: '', max_score: '', placement: '', risk_level: '' })
      await loadAll()
      setMessage('Rule created.')
    } catch (err) {
      setError(err.message || 'Failed to create rule')
    }
  }

  const handleSelectRule = (id) => {
    setSelectedRuleId(id)
    const r = rules.find((rr) => rr.id === id)
    if (r) {
      setRuleType(r.rule_type || 'behavioral')
      setForm({
        min_score: r.min_score ?? '',
        max_score: r.max_score ?? '',
        placement: r.placement || '',
        risk_level: r.risk_level || '',
      })
    }
  }

  const handleUpdateRule = async (e) => {
    e.preventDefault()
    if (!selectedRuleId) return
    setError('')
    setMessage('')
    try {
      await adminUpdatePlacementRule(selectedRuleId, {
        rule_type: ruleType,
        min_score: Number(form.min_score),
        max_score: Number(form.max_score),
        placement: form.placement,
        risk_level: form.risk_level,
      })
      await loadAll()
      setMessage('Rule updated.')
    } catch (err) {
      setError(err.message || 'Failed to update rule')
    }
  }

  const displayPlacementName = (rule) => rule.placement || ''

  return (
    <div className="admin-section">
      <h2>Option D: Placement Rules</h2>

      <div className="sub-options">
        <button className={mode === 'new' ? 'sub-btn active' : 'sub-btn'} onClick={() => setMode('new')}>
          New Rule
        </button>
        <button className={mode === 'update' ? 'sub-btn active' : 'sub-btn'} onClick={() => setMode('update')}>
          Update Rule
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {mode === 'new' && (
        <>
          <div className="sub-options">
            <button
              className={ruleType === 'behavioral' ? 'sub-btn active' : 'sub-btn'}
              onClick={() => setRuleType('behavioral')}
            >
              Behavior Rule
            </button>
            <button
              className={ruleType === 'health' ? 'sub-btn active' : 'sub-btn'}
              onClick={() => setRuleType('health')}
            >
              Health Rule
            </button>
          </div>

          <form className="admin-form" onSubmit={handleCreateRule}>
            <div className="form-row">
              <label>Minimum Score</label>
              <input
                type="number"
                name="min_score"
                value={form.min_score}
                onChange={handleRuleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <label>Maximum Score</label>
              <input
                type="number"
                name="max_score"
                value={form.max_score}
                onChange={handleRuleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <label>Placement</label>
              <select
                name="placement"
                value={form.placement}
                onChange={handleRuleFormChange}
                required
              >
                <option value="">Select...</option>
                {placements.map((p) => (
                  <option key={p.placement} value={p.placement}>
                    {p.placement}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="small-btn"
                onClick={() => {
                  setNewPlacement({ placement: '', description: '' })
                }}
              >
                + Add Placement
              </button>
            </div>
            {newPlacement && (
              <form className="inline-form" onSubmit={handleAddPlacement}>
                <div className="form-row">
                  <label>Placement Name</label>
                  <input
                    value={newPlacement.placement}
                    onChange={(e) => setNewPlacement((prev) => ({ ...prev, placement: e.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <label>Description (optional)</label>
                  <input
                    value={newPlacement.description}
                    onChange={(e) => setNewPlacement((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <button type="submit" className="secondary-btn">
                  Save Placement
                </button>
              </form>
            )}
            <div className="form-row">
              <label>Risk Level</label>
              <select
                name="risk_level"
                value={form.risk_level}
                onChange={handleRuleFormChange}
                required
              >
                <option value="">Select...</option>
                {risks.map((r) => (
                  <option key={r.risk_level} value={r.risk_level}>
                    {r.risk_level}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="primary-btn">
              Create Rule
            </button>
          </form>
        </>
      )}

      {mode === 'update' && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rule Type</th>
                  <th>Min Score</th>
                  <th>Max Score</th>
                  <th>Placement</th>
                  <th>Risk Level</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>{r.rule_type}</td>
                    <td>{r.min_score}</td>
                    <td>{r.max_score}</td>
                    <td>{displayPlacementName(r)}</td>
                    <td>{r.risk_level}</td>
                    <td>
                      <button type="button" className="action-btn edit" onClick={() => handleSelectRule(r.id)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRuleId && (
            <form className="admin-form" onSubmit={handleUpdateRule}>
              <div className="form-row">
                <label>Rule Type</label>
                <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
                  <option value="behavioral">Behavior</option>
                  <option value="health">Health</option>
                </select>
              </div>
              <div className="form-row">
                <label>Minimum Score</label>
                <input
                  type="number"
                  name="min_score"
                  value={form.min_score}
                  onChange={handleRuleFormChange}
                  required
                />
              </div>
              <div className="form-row">
                <label>Maximum Score</label>
                <input
                  type="number"
                  name="max_score"
                  value={form.max_score}
                  onChange={handleRuleFormChange}
                  required
                />
              </div>
              <div className="form-row">
                <label>Placement</label>
                <select
                  name="placement"
                  value={form.placement}
                  onChange={handleRuleFormChange}
                  required
                >
                  <option value="">Select...</option>
                  {placements.map((p) => (
                    <option key={p.placement} value={p.placement}>
                      {p.placement}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Risk Level</label>
                <select
                  name="risk_level"
                  value={form.risk_level}
                  onChange={handleRuleFormChange}
                  required
                >
                  <option value="">Select...</option>
                  {risks.map((r) => (
                    <option key={r.risk_level} value={r.risk_level}>
                      {r.risk_level}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="primary-btn">
                Update Rule
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}

export default AdminPlacementRules

