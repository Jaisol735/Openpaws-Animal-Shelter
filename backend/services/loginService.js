import { supabase } from '../supabaseClient.js'
import bcrypt from 'bcrypt'

const loginService = {
  async login(req, res) {
    try {
      const { name, password } = req.body

      if (!name || !password) {
        return res.status(400).json({ error: 'Name and password are required' })
      }

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)

      if (error) throw error

      if (!users || users.length === 0) {
        return res.status(401).json({ error: 'User not found' })
      }

      const user = users[0]

      // compare plaintext password with bcrypt hash stored in PostgreSQL
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        return res.status(401).json({ error: 'Invalid password' })
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image_url: user.image_url,
        },
      })
    } catch (error) {
      console.error('Login error:', error)
      return res.status(500).json({ error: error.message })
    }
  },
}

export default loginService
