import { supabase } from '../supabaseClient.js'
import scoringService from './scoringService.js'

function scoreForQuestion(question, answerValue) {
  if (!question || !question.options) return 0
  if (Array.isArray(answerValue)) {
    return answerValue.reduce((sum, v) => {
      const opt = question.options.find((o) => o.label === v)
      return sum + (opt && typeof opt.score === 'number' ? opt.score : 0)
    }, 0)
  }
  const opt = question.options.find((o) => o.label === answerValue)
  return opt && typeof opt.score === 'number' ? opt.score : 0
}

async function getSchemas() {
  const { data: schemaRows, error } = await supabase
    .from('form_schemas')
    .select('schema')
    .order('created_at', { ascending: false })
  if (error) throw error
  const behavioralSchema = (schemaRows || []).find((r) => r.schema?.type === 'behavioral')?.schema || {}
  const healthSchema = (schemaRows || []).find((r) => r.schema?.type === 'health')?.schema || {}
  return { behavioralSchema, healthSchema }
}

const assessmentService = {
  async createAssessment(req, res) {
    try {
      const { animal_id, staff_id } = req.body

      const { data: assessment, error } = await supabase
        .from('assessments')
        .insert({
          animal_id,
          staff_id,
        })
        .select()
        .single()

      if (error) throw error

      return res.json({ assessment })
    } catch (error) {
      console.error('Create assessment error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async getAssessment(req, res) {
    try {
      const { id } = req.params

      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`
          *,
          answers:assessment_answers(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return res.json({ assessment })
    } catch (error) {
      console.error('Get assessment error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async saveAnswers(req, res) {
    try {
      const { id } = req.params
      const { answers } = req.body

      for (const answer of answers) {
        const { error } = await supabase
          .from('assessment_answers')
          .insert({
            assessment_id: id,
            question_id: answer.question_id,
            answer: answer.answer,
            score: answer.score,
          })

        if (error) throw error
      }

      return res.json({ success: true })
    } catch (error) {
      console.error('Save answers error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async lockAssessment(req, res) {
    try {
      const { id } = req.params

      const { data: assessmentRow, error: rowError } = await supabase
        .from('assessments')
        .select('animal_id')
        .eq('id', id)
        .single()

      if (rowError) throw rowError

      if (!assessmentRow?.animal_id) {
        return res.status(404).json({ error: 'Assessment not found' })
      }

      const { data: animal, error } = await supabase
        .from('animals')
        .update({ status: 'locked' })
        .eq('id', assessmentRow.animal_id)
        .select()
        .single()

      if (error) throw error

      return res.json({ animal })
    } catch (error) {
      console.error('Lock assessment error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async unlockAssessment(req, res) {
    try {
      const { id } = req.params

      // allow unlocking by either assessment id or directly by animal id
      const { data: assessmentRow, error: rowError } = await supabase
        .from('assessments')
        .select('animal_id')
        .eq('id', id)
        .single()

      if (rowError && rowError.code !== 'PGRST116') throw rowError

      const animalId = assessmentRow?.animal_id || id

      const { data: animal, error } = await supabase
        .from('animals')
        .update({ status: 'unlocked' })
        .eq('id', animalId)
        .select()
        .single()

      if (error) throw error

      return res.json({ animal })
    } catch (error) {
      console.error('Unlock assessment error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async getLastAssessment(req, res) {
    try {
      const { animalId } = req.params

      const { data: assessment, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('animal_id', animalId)
        .order('assessed_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return res.json({ assessment })
    } catch (error) {
      console.error('Get last assessment error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async submitAssessment(req, res) {
    try {
      const { animal_id, staff_id, answers, behaviorScore, healthScore, pastScore } = req.body

      const { behavioralSchema, healthSchema } = await getSchemas()

      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          animal_id,
          staff_id,
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      for (const [questionId, answer] of Object.entries(answers)) {
        const bQuestion = (behavioralSchema.questions || []).find((q) => q.id === questionId)
        const hQuestion = (healthSchema.questions || []).find((q) => q.id === questionId)
        const question = bQuestion || hQuestion
        const score = questionId === 'past_score' ? 0 : scoreForQuestion(question, answer)

        const row = {
          assessment_id: assessment.id,
          question_id: questionId,
          answer: Array.isArray(answer) ? JSON.stringify(answer) : String(answer),
          score,
        }

        let { error: answerError } = await supabase.from('assessment_answers').insert(row)

        // if the schema doesn't have `score`, retry without it
        if (answerError?.code === 'PGRST204' && String(answerError?.message || '').includes("'score'")) {
          const retryRow = { ...row }
          delete retryRow.score
          const retry = await supabase.from('assessment_answers').insert(retryRow)
          answerError = retry.error
        }

        if (answerError) throw answerError
      }

      const {
        behaviorScore: finalBehaviorScore,
        healthScore: finalHealthScore,
        pastScore: finalPastScore,
        placement,
        risk_level,
        monitoring_level,
        reason,
        assessment: updated,
        rule,
      } = await scoringService.scoreAssessment({
        assessment_id: assessment.id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
        behaviorScoreOverride: behaviorScore,
        healthScoreOverride: healthScore,
        pastScoreOverride: typeof pastScore === 'number' ? pastScore : undefined,
      })

      return res.json({
        assessment: updated || assessment,
        behaviorScore: finalBehaviorScore,
        healthScore: finalHealthScore,
        pastScore: finalPastScore,
        placement,
        risk_level,
        monitoring_level,
        reason,
        rule,
      })
    } catch (error) {
      console.error('Submit assessment error:', error)
      return res.status(500).json({ error: error.message })
    }
  },
}

export default assessmentService
