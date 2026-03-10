import { supabase } from '../supabaseClient.js'

const animalService = {
  async getAnimals(req, res) {
    try {
      const { data: animals, error } = await supabase
        .from('animals')
        .select('*')
        .order('animal_code')

      if (error) throw error

      return res.json({ animals })
    } catch (error) {
      console.error('Get animals error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async getAnimalAssessments(req, res) {
    try {
      const { id } = req.params

      const { data: assessments, error } = await supabase
        .from('assessments')
        .select(`
          *,
          staff:staff_id(name),
          animal:animal_id(animal_code)
        `)
        .eq('animal_id', id)
        .order('assessed_at', { ascending: false })

      if (error) throw error

      return res.json({ assessments })
    } catch (error) {
      console.error('Get assessments error:', error)
      return res.status(500).json({ error: error.message })
    }
  },

  async searchAnimal(req, res) {
    try {
      const { code } = req.params

      const { data: animal, error } = await supabase
        .from('animals')
        .select('*')
        .eq('animal_code', code.toUpperCase())
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return res.json({ animal })
    } catch (error) {
      console.error('Search animal error:', error)
      return res.status(500).json({ error: error.message })
    }
  },
}

export default animalService
