// thin wrapper around backend API so that frontend components never talk to Supabase directly
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  return res.json();
}

export function login(name, password) {
  return request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
}

export function fetchAnimals() {
  return request('/api/animals');
}

export function fetchAnimalAssessments(animalId) {
  return request(`/api/animals/${animalId}/assessments`);
}

export function searchAnimal(code) {
  return request(`/api/animals/search/${code}`);
}

export function getLastAssessment(animalId) {
  return request(`/api/animals/${animalId}/last-assessment`);
}

export function unlockAssessment(id) {
  return request(`/api/assessments/${id}/unlock`, { method: 'PUT' });
}

export function getLatestForm() {
  return request('/api/forms/latest');
}

export function submitAssessment(body) {
  // body should include animal_id, staff_id, answers and form_type
  return request('/api/assessments/submit', { method: 'POST', body: JSON.stringify(body) });
}

// continue adding helpers for other endpoints
export function getStaff() {
  return request('/api/organization/staff');
}

export function createAssessment(body) {
  return request('/api/assessments', { method: 'POST', body: JSON.stringify(body) });
}

// Admin helpers
export function adminFetchStaff() {
  return request('/api/admin/staff');
}

export function adminCreateStaff(body) {
  return request('/api/admin/staff', { method: 'POST', body: JSON.stringify(body) });
}

export function adminUpdateStaff(id, body) {
  return request(`/api/admin/staff/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function adminDeleteStaff(id) {
  return request(`/api/admin/staff/${id}`, { method: 'DELETE' });
}

export function adminFetchAnimals() {
  return request('/api/admin/animals');
}

export function adminCreateAnimal(body) {
  return request('/api/admin/animals', { method: 'POST', body: JSON.stringify(body) });
}

export function adminUpdateAnimal(id, body) {
  return request(`/api/admin/animals/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function adminDeleteAnimal(id) {
  return request(`/api/admin/animals/${id}`, { method: 'DELETE' });
}

export function adminFetchForms() {
  return request('/api/admin/forms');
}

export function adminCreateForm(body) {
  return request('/api/admin/forms', { method: 'POST', body: JSON.stringify(body) });
}

export function adminUpdateForm(id, body) {
  return request(`/api/admin/forms/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function adminDeleteForm(id) {
  return request(`/api/admin/forms/${id}`, { method: 'DELETE' });
}

export function adminFetchPlacementRules() {
  return request('/api/admin/rules');
}

export function adminCreatePlacementRule(body) {
  return request('/api/admin/rules', { method: 'POST', body: JSON.stringify(body) });
}

export function adminUpdatePlacementRule(id, body) {
  return request(`/api/admin/rules/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function adminFetchPlacements() {
  return request('/api/admin/placements');
}

export function adminCreatePlacement(body) {
  return request('/api/admin/placements', { method: 'POST', body: JSON.stringify(body) });
}

export function adminFetchRisks() {
  return request('/api/admin/risks');
}
