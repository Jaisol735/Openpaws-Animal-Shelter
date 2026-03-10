import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import loginService from './services/loginService.js'
import organizationService from './services/organizationService.js'
import animalService from './services/animalService.js'
import assessmentService from './services/assessmentService.js'
import adminService from './services/adminService.js'
import scoringService from './services/scoringService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// allow our frontend to call the API with cookies/credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Login Routes
app.post('/api/login', loginService.login)

// Organization Routes
app.get('/api/organization/staff', organizationService.getStaff)

// Animal Routes
app.get('/api/animals', animalService.getAnimals)
app.get('/api/animals/:id/assessments', animalService.getAnimalAssessments)
app.get('/api/animals/search/:code', animalService.searchAnimal)

// Assessment Routes
app.post('/api/assessments', assessmentService.createAssessment)
app.get('/api/assessments/:id', assessmentService.getAssessment)
app.post('/api/assessments/:id/answers', assessmentService.saveAnswers)
app.put('/api/assessments/:id/lock', assessmentService.lockAssessment)
app.put('/api/assessments/:id/unlock', assessmentService.unlockAssessment)
app.get('/api/animals/:animalId/last-assessment', assessmentService.getLastAssessment)
app.post('/api/assessments/submit', assessmentService.submitAssessment)

// Admin Routes
app.get('/api/admin/staff', adminService.listStaff)
app.post('/api/admin/staff', adminService.createStaff)
app.put('/api/admin/staff/:id', adminService.updateStaff)
app.delete('/api/admin/staff/:id', adminService.deleteStaff)
app.get('/api/admin/animals', adminService.listAnimals)
app.post('/api/admin/animals', adminService.createAnimal)
app.put('/api/admin/animals/:id', adminService.updateAnimal)
app.delete('/api/admin/animals/:id', adminService.deleteAnimal)
app.get('/api/admin/forms', adminService.listForms)
app.post('/api/admin/forms', adminService.createForm)
app.put('/api/admin/forms/:id', adminService.updateForm)
app.delete('/api/admin/forms/:id', adminService.deleteForm)
app.get('/api/admin/rules', adminService.listPlacementRules)
app.post('/api/admin/rules', adminService.createRule)
app.put('/api/admin/rules/:id', adminService.updateRule)
app.get('/api/admin/placements', adminService.listPlacements)
app.post('/api/admin/placements', adminService.createPlacement)
app.get('/api/admin/risks', adminService.listRisks)
app.get('/api/forms/latest', adminService.getLatestForm)

// Scoring Routes
app.post('/api/scoring/calculate', scoringService.calculateScore)
app.post('/api/scoring/placement', scoringService.generatePlacement)

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

server.on('error', (err) => {
  console.error('HTTP server error:', err)
})

server.on('close', () => {
  console.log('HTTP server closed')
})

// Keep the process alive in environments that may "unref" handles.
// (Normally the HTTP server keeps Node alive by itself.)
setInterval(() => {}, 60 * 60 * 1000)

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`)
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
