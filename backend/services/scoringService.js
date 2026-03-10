import { supabase } from '../supabaseClient.js'

function firstStringValue(obj) {
  for (const v of Object.values(obj || {})) {
    if (typeof v === 'string' && v.trim()) return v
  }
  return null
}

function firstNumberValue(obj) {
  for (const v of Object.values(obj || {})) {
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return null
}

function normalizeRiskLevel(level) {
  if (!level) return 'unknown'
  const v = String(level).toLowerCase()
  if (v.includes('high')) return 'high'
  if (v.includes('med')) return 'medium'
  if (v.includes('low')) return 'low'
  return v
}

function riskRankFor(level, riskRankByLevel) {
  const normalized = normalizeRiskLevel(level)
  if (riskRankByLevel && normalized in riskRankByLevel) return riskRankByLevel[normalized]
  if (normalized === 'low') return 1
  if (normalized === 'medium') return 2
  if (normalized === 'high') return 3
  return 0
}

function resolveLookupNameById(rows, id, nameKeys) {
  if (!id) return null
  const row = (rows || []).find((r) => r?.id === id)
  if (!row) return null
  for (const k of nameKeys) {
    if (typeof row[k] === 'string' && row[k].trim()) return row[k]
  }
  return firstStringValue(row)
}

// helper used internally by both endpoints
async function choosePlacement(behaviorScore, healthScore) {
  const [behResp, healthResp, riskResp, placementResp] = await Promise.all([
    supabase
      .from('placement_rules')
      .select('*')
      .eq('rule_type', 'behavioral')
      .lte('min_score', behaviorScore)
      .gte('max_score', behaviorScore),
    supabase
      .from('placement_rules')
      .select('*')
      .eq('rule_type', 'health')
      .lte('min_score', healthScore)
      .gte('max_score', healthScore),
    supabase.from('risk_lookup').select('*'),
    supabase.from('placement_lookup').select('*'),
  ])

  const behRules = Array.isArray(behResp?.data) ? behResp.data : []
  const healthRules = Array.isArray(healthResp?.data) ? healthResp.data : []
  const riskRows = Array.isArray(riskResp?.data) ? riskResp.data : []
  const placementRows = Array.isArray(placementResp?.data) ? placementResp.data : []

  const ruleFor = (rules) => (rules && rules.length ? rules[0] : null)
  const behRule = ruleFor(behRules)
  const healthRule = ruleFor(healthRules)

  if (!behRule && !healthRule) {
    return { placement: 'No suitable placement found', risk_level: 'unknown' }
  }

  const riskRankByLevel = {}
  ;(riskRows || []).forEach((r) => {
    const lvl = normalizeRiskLevel(r?.risk_level || r?.level || firstStringValue(r))
    const w =
      (typeof r?.weight === 'number' && r.weight) ||
      (typeof r?.rank === 'number' && r.rank) ||
      (typeof r?.priority === 'number' && r.priority) ||
      firstNumberValue(r) ||
      0
    if (lvl) riskRankByLevel[lvl] = w
  })

  const placementWeightByName = {}
  ;(placementRows || []).forEach((p) => {
    const name =
      p?.placement_name ||
      p?.placement ||
      p?.name ||
      (typeof p?.placementName === 'string' ? p.placementName : null) ||
      firstStringValue(p)
    const w =
      (typeof p?.weight === 'number' && p.weight) ||
      (typeof p?.rank === 'number' && p.rank) ||
      (typeof p?.priority === 'number' && p.priority) ||
      firstNumberValue(p) ||
      0
    if (name) placementWeightByName[name] = w
  })

  const resolveRuleOutcome = (rule) => {
    if (!rule) return { placement: null, risk_level: 'unknown' }

    const placement =
      rule.placement ||
      resolveLookupNameById(placementRows, rule.placement_id, ['placement_name', 'placement', 'name'])
    const risk_level =
      normalizeRiskLevel(rule.risk_level) ||
      normalizeRiskLevel(resolveLookupNameById(riskRows, rule.risk_id, ['risk_level', 'level', 'name'])) ||
      'unknown'

    return {
      placement: placement || 'Unknown',
      risk_level,
      monitoring_level: rule.monitoring_level,
      action_required: rule.action_required,
    }
  }

  const behOutcome = resolveRuleOutcome(behRule)
  const healthOutcome = resolveRuleOutcome(healthRule)

  let chosen = behRule || healthRule
  let chosenFrom = behRule ? 'behavioral' : 'health'

  if (behRule && healthRule) {
    const behRisk = riskRankFor(behOutcome.risk_level, riskRankByLevel)
    const healthRisk = riskRankFor(healthOutcome.risk_level, riskRankByLevel)
    if (healthRisk > behRisk) {
      chosen = healthRule
      chosenFrom = 'health'
    } else if (healthRisk === behRisk) {
      const behW = placementWeightByName[behOutcome.placement] || 0
      const healthW = placementWeightByName[healthOutcome.placement] || 0
      if (healthW > behW) {
        chosen = healthRule
        chosenFrom = 'health'
      }
    }
  }

  const chosenOutcome = resolveRuleOutcome(chosen)

  return {
    placement: chosenOutcome.placement,
    risk_level: chosenOutcome.risk_level,
    monitoring_level: chosenOutcome.monitoring_level,
    action_required: chosenOutcome.action_required,
    chosenFrom,
    behavior: behOutcome,
    health: healthOutcome,
    rule: chosen,
  }
}

function scoreForAnswer(question, answerValue) {
  if (!question || !question.options) return 0
  let score = 0
  if (Array.isArray(answerValue)) {
    answerValue.forEach((val) => {
      const opt = question.options.find((o) => o.label === val)
      if (opt && typeof opt.score === 'number') {
        score += opt.score
      }
    })
  } else {
    const opt = question.options.find((o) => o.label === answerValue)
    if (opt && typeof opt.score === 'number') {
      score += opt.score
    }
  }
  return score
}

// public helper that can be called from other services
// Optional overrides let the caller pass in already-computed scores
async function scoreAssessment({ assessment_id, answers, behaviorScoreOverride, healthScoreOverride, pastScoreOverride }) {
  const { data: assessmentRow, error: assError } = await supabase
    .from('assessments')
    .select('animal_id')
    .eq('id', assessment_id)
    .single()
  if (assError) throw assError

  let behaviorScore =
    typeof behaviorScoreOverride === 'number' && Number.isFinite(behaviorScoreOverride)
      ? behaviorScoreOverride
      : 0
  let healthScore =
    typeof healthScoreOverride === 'number' && Number.isFinite(healthScoreOverride)
      ? healthScoreOverride
      : 0
  let pastScore =
    typeof pastScoreOverride === 'number' && Number.isFinite(pastScoreOverride) ? pastScoreOverride : 0

  // If caller did not provide behavior/health scores, compute them from schemas as before
  if (!(typeof behaviorScoreOverride === 'number') || !(typeof healthScoreOverride === 'number')) {
    const { data: schemaRows, error: schemaError } = await supabase
      .from('form_schemas')
      .select('schema')
      .order('created_at', { ascending: false })

    if (schemaError) throw schemaError

    const behavioralSchema = (schemaRows || []).find((r) => r.schema?.type === 'behavioral')?.schema || {}
    const healthSchema = (schemaRows || []).find((r) => r.schema?.type === 'health')?.schema || {}

    ;(answers || []).forEach((ans) => {
      if (ans.questionId === 'past_score') {
        const numeric = typeof ans.answer === 'number' ? ans.answer : parseInt(ans.answer, 10)
        if (!Number.isNaN(numeric)) {
          pastScore = numeric
        }
        return
      }

      const bQuestion = (behavioralSchema.questions || []).find((q) => q.id === ans.questionId)
      const hQuestion = (healthSchema.questions || []).find((q) => q.id === ans.questionId)

      if (bQuestion && !(typeof behaviorScoreOverride === 'number')) {
        behaviorScore += scoreForAnswer(bQuestion, ans.answer)
      } else if (hQuestion && !(typeof healthScoreOverride === 'number')) {
        healthScore += scoreForAnswer(hQuestion, ans.answer)
      }
    })
  }

  const placementResult = await choosePlacement(behaviorScore, healthScore)

  const totalScore = behaviorScore + healthScore

  // detect actual columns on assessments table to avoid column-not-exist errors
  const { data: sampleAssessments } = await supabase.from('assessments').select('*').limit(1)
  const assessmentShape = sampleAssessments && sampleAssessments.length ? sampleAssessments[0] : {}

  const assessmentUpdate = {
    behavioral_score: behaviorScore,
    health_score: healthScore,
    past_score: pastScore,
  }

  if ('total_score' in assessmentShape) {
    assessmentUpdate.total_score = totalScore
  }
  if ('recommendation' in assessmentShape) {
    assessmentUpdate.recommendation = placementResult.placement
  } else if ('placement' in assessmentShape) {
    assessmentUpdate.placement = placementResult.placement
  }

  if ('reason' in assessmentShape) {
    const b = placementResult.behavior
    const h = placementResult.health
    assessmentUpdate.reason = `Behavior: ${b?.placement || 'Unknown'} (${b?.risk_level || 'unknown'}), Health: ${
      h?.placement || 'Unknown'
    } (${h?.risk_level || 'unknown'}). Chosen: ${placementResult.chosenFrom || 'unknown'}.`
  }
  if ('risk_level' in assessmentShape) assessmentUpdate.risk_level = placementResult.risk_level

  const { data: updatedAssessment, error: updateError } = await supabase
    .from('assessments')
    .update(assessmentUpdate)
    .eq('id', assessment_id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update assessment with scores/placement:', updateError)
  }

  if (assessmentRow?.animal_id) {
    const { data: sampleAnimals } = await supabase.from('animals').select('*').limit(1)
    const animalShape = sampleAnimals && sampleAnimals.length ? sampleAnimals[0] : {}

    const animalUpdate = {
      behavioral_score: behaviorScore,
      health_score: healthScore,
      past_score: pastScore,
    }

    if ('status' in animalShape) {
      animalUpdate.status = 'locked'
    }

    // your table (screenshots) uses `placement`
    if ('placement' in animalShape) {
      animalUpdate.placement = placementResult.placement
    } else if ('placment' in animalShape) {
      animalUpdate.placment = placementResult.placement
    }

    const { error: animalUpdateError } = await supabase
      .from('animals')
      .update(animalUpdate)
      .eq('id', assessmentRow.animal_id)

    if (animalUpdateError) {
      console.error('Failed to update animal with scores/placement:', animalUpdateError)
    }
  }

  return {
    behaviorScore,
    healthScore,
    pastScore,
    placement: placementResult.placement,
    risk_level: placementResult.risk_level,
    monitoring_level: placementResult.monitoring_level,
    reason: updatedAssessment?.reason,
    assessment: updatedAssessment,
    rule: placementResult.rule,
  }
}

const scoringService = {
  async calculateScore(req, res) {
    try {
      const { assessment_id, answers } = req.body
      const result = await scoreAssessment({ assessment_id, answers })
      return res.json(result)
    } catch (error) {
      console.error('Calculate score error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async generatePlacement(req, res) {
    try {
      const { behaviorScore, healthScore } = req.body
      const result = await choosePlacement(behaviorScore || 0, healthScore || 0)
      return res.json(result)
    } catch (error) {
      console.error('Generate placement error:', error)
      return res.status(500).json({ error: error.message })
    }
  },
  scoreAssessment,
}

export default scoringService
