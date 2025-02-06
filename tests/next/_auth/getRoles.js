
const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid').v4
const qs = require('querystring')

module.exports = async (req) => {
  const db = await req.resource('mysql.sample')

  const rows = await db.query('SELECT * FROM AdminUser WHERE id = ? AND revoked_at IS NULL', [req.session.id])
  const user = rows[0]

  if (!user) throw new Error('user not found')  
  
  user.role ??= []

	return {
    user: {
      name: user.name,
      email: user.email,
    },
    roles: [
      {
        user_id: user.id,
        name: 'view',
        group_json: user.role,
        // property_json: [],
        // profile_name: '',
      }
    ]
  }
}