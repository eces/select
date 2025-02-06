
const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid').v4
const qs = require('querystring')
const { getRedisConnection } = require('./redis')

module.exports = async (req) => {
  const db = await req.resource('mysql.sample')

  const user = await db.query('SELECT * FROM AdminUser WHERE id = ? AND revoked_at IS NULL', [req.session.id])

  if (!user) throw new Error('user not found')  
  
	return {
    user: {
      name: user.name,
      email: user.email,
    },
    roles: user.role.map(role => {
      return {
        user_id: user.id,
        name: role,
      }
    }),
  }
}