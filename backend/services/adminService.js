import { supabase } from '../supabaseClient.js'
import bcrypt from 'bcrypt'

const adminService = {
  // Utility: generic list helpers
  async listStaff(req, res) {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return res.json({ staff: data || [] })
    } catch (error) {
      console.error('List staff error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async listAnimals(req, res) {
    try {
      const { data, error } = await supabase.from('animals').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return res.json({ animals: data || [] })
    } catch (error) {
      console.error('List animals error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async listForms(req, res) {
    try {
      const { data, error } = await supabase.from('form_schemas').select('*').order('created_at', {
        ascending: false,
      })
      if (error) throw error
      return res.json({ forms: data || [] })
    } catch (error) {
      console.error('List forms error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async listPlacementRules(req, res) {
    try {
      const { data, error } = await supabase
        .from('placement_rules')
        .select('*')
        .order('rule_type', { ascending: true })
        .order('min_score', { ascending: true })
      if (error) throw error
      return res.json({ rules: data || [] })
    } catch (error) {
      console.error('List placement rules error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async listPlacements(req, res) {
    try {
      const { data, error } = await supabase
        .from('placement_lookup')
        .select('*')
        .order('importance', { ascending: true })
      if (error) throw error
      return res.json({ placements: data || [] })
    } catch (error) {
      console.error('List placements error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async createPlacement(req, res) {
    try {
      const { placement, description } = req.body
      const { data, error } = await supabase
        .from('placement_lookup')
        .insert({
          placement,
          description: description || null,
          importance: 0,
        })
        .select()
        .single()
      if (error) throw error
      return res.json({ placement: data })
    } catch (error) {
      console.error('Create placement error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async listRisks(req, res) {
    try {
      const { data, error } = await supabase.from('risk_lookup').select('*').order('weight', { ascending: true })
      if (error) throw error
      return res.json({ risks: data || [] })
    } catch (error) {
      console.error('List risks error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  // Staff management
  async createStaff(req, res) {
    try {
      const { name, email, password, role } = req.body

      if (!password) {
        return res.status(400).json({ error: 'Password is required' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const { data: staff, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          password: hashedPassword,
          role: role || 'staff',
        })
        .select()
        .single()

      if (error) throw error

      return res.json({ staff })
    } catch (error) {
      console.error('Create staff error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async updateStaff(req, res) {
    try {
      const { id } = req.params
      const { name, email, role } = req.body

      const { data: staff, error } = await supabase
        .from('users')
        .update({ name, email, role })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return res.json({ staff })
    } catch (error) {
      console.error('Update staff error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async deleteStaff(req, res) {
    try {
      const { id } = req.params

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.json({ success: true })
    } catch (error) {
      console.error('Delete staff error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  // Animal management
  async createAnimal(req, res) {
    try {
      const { animal_code, species, breed, gender } = req.body

      const { data: animal, error } = await supabase
        .from('animals')
        .insert({
          animal_code,
          species,
          breed,
          gender,
        })
        .select()
        .single()

      if (error) throw error

      return res.json({ animal })
    } catch (error) {
      console.error('Create animal error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async updateAnimal(req, res) {
    try {
      const { id } = req.params
      const { species, breed, gender } = req.body

      const { data: animal, error } = await supabase
        .from('animals')
        .update({ species, breed, gender })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return res.json({ animal })
    } catch (error) {
      console.error('Update animal error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async deleteAnimal(req, res) {
    try {
      const { id } = req.params

      const { error } = await supabase
        .from('animals')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.json({ success: true })
    } catch (error) {
      console.error('Delete animal error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  // Form management
  async createForm(req, res) {
    try {
      const { form_name, schema } = req.body

      const { data: form, error } = await supabase
        .from('form_schemas')
        .insert({
          form_name,
          schema,
          version: 1,
        })
        .select()
        .single()

      if (error) throw error

      return res.json({ form })
    } catch (error) {
      console.error('Create form error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async updateForm(req, res) {
    try {
      const { id } = req.params
      const { form_name, schema } = req.body

      const { data: form, error } = await supabase
        .from('form_schemas')
        .update({ form_name, schema })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return res.json({ form })
    } catch (error) {
      console.error('Update form error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async deleteForm(req, res) {
    try {
      const { id } = req.params

      const { error } = await supabase
        .from('form_schemas')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.json({ success: true })
    } catch (error) {
      console.error('Delete form error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  // Rule management
  async createRule(req, res) {
    try {
      const { rule_type, min_score, max_score, placement, risk_level, action_required, monitoring_level } = req.body

      const { data: rule, error } = await supabase
        .from('placement_rules')
        .insert({
          rule_type,
          min_score,
          max_score,
          placement,
          risk_level,
          action_required: action_required || null,
          monitoring_level: monitoring_level || null,
        })
        .select()
        .single()

      if (error) throw error

      return res.json({ rule })
    } catch (error) {
      console.error('Create rule error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async updateRule(req, res) {
    try {
      const { id } = req.params
      const { rule_type, min_score, max_score, placement, risk_level, action_required, monitoring_level } = req.body

      const { data: rule, error } = await supabase
        .from('placement_rules')
        .update({
          rule_type,
          min_score,
          max_score,
          placement,
          risk_level,
          action_required: action_required || null,
          monitoring_level: monitoring_level || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return res.json({ rule })
    } catch (error) {
      console.error('Update rule error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async getLatestForm(req, res) {
    try {
      const { data: form, error } = await supabase
        .from('form_schemas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return res.json({ form })
    } catch (error) {
      console.error('Get latest form error:', error)
      return res.status(500).json({ error: error.message })
    }
  },
}

export default adminService
