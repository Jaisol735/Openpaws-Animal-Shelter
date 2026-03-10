import { supabase } from '../supabaseClient.js'

const organizationService = {
  async getStaff(req, res) {
    try {
      const { data: staff, error } = await supabase
        .from('users')
        .select('id, name, role, email, image_url, created_at')
        .order('name')

      if (error) throw error

      return res.json({ staff })
    } catch (error) {
      console.error('Get staff error:', error)
      return res.status(500).json({ error: error.message })
    }
  },
}

export default organizationService
