const jwt = require('jsonwebtoken')

module.exports = async (req, res, next) => {
  try {
    const db = await req.resource('mysql.sample')

    const rows = await db.query('SELECT * FROM AdminUser WHERE id = ? AND revoked_at IS NULL', [req.session.id])
    const user = rows[0]
    
    if (!user) throw new Error('user not found')

    req.session = {
      id: req.session.id,
      scope: [`tid:${req.team.id}:view`],
      
      // initial_ts: req.session.initial_ts,
      // initial_tid: req.session.initial_tid,
      // refresh_ts: Date.now(),
      // method: req.session.method,
    }
    
    const key = process.env.SECRET_ACCESS_TOKEN || 'secretAccessToken'
    const token = jwt.sign(req.session, key, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || 259200
    })
    
    user.role ??= []

    res.status(200).json({
      message: 'ok',
      token,
      sso_token: token,
      session: Object.assign(req.session, {
        email: user.email,
        name: user.name,

        // roles: [`email::${user.email}`, ...user.role]
        roles: user.role.map(role => {
          return {
            user_id: user.id,
            team_id: req.team.id,
            name: role,
          }
        }),
      }),
    })
  } catch (error) {
    next(error)
  }
}