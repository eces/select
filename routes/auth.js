const debug = require('debug')('select:api')
const only = require(__absolute + '/models/only')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const router = require('express').Router()

router.use((req, res, next) => {
  req._json = true
  next()
})

router.post('/authorize', (req, res) => {
  const id = String(req.body.id || '').trim().slice(0, 50)
  const pw = String(req.body.pw || '').trim().slice(0, 50)
  
  if (!id) throw StatusError(400, 'id empty')
  if (!pw) throw StatusError(400, 'pw empty')

  const pw_hash = crypto.createHmac('sha256', global.config.has('secret.hash') ? global.config.get('secret.hash') : global.DEFAULT_SECRET_HASH)
    .update(pw)
    .digest('hex')

  const select_config = global.config.get('select-configuration')
  debug(select_config.users)

  if (!select_config.users || select_config.users.length == 0) throw StatusError(500, 'server error: no users configured')
  const matched_users = select_config.users.filter(e => {
    return (e.id == id)
  })
  if (matched_users.length === 0) throw StatusError(400, 'user not found')
  if (matched_users.length > 1) throw StatusError(400, 'server error: user id duplicated')

  const u = matched_users[0]
  const u_pw_hash = crypto.createHmac('sha256', global.config.has('secret.hash') ? global.config.get('secret.hash') : global.DEFAULT_SECRET_HASH)
    .update(Buffer.from(u.pw, 'base64').toString('utf8'))
    .digest('hex')
  if (u_pw_hash != pw_hash) throw StatusError(400, 'password incorrect')

  const session = {
    id: u.id,
    initial_ts: Date.now(),
  }
  const token = jwt.sign(session, global.config.has('secret.access_token') ? global.config.get('secret.access_token') : global.DEFAULT_SECRET_ACCESS_TOKEN, {
    expiresIn: global.config.has('policy.session_expire') ? global.config.get('policy.session_expire') : global.DEFAULT_POLICY_SESSION_EXPIRE
  })

  res.status(200).json({
    message: 'ok',
    token,
    // session,
  })
})

router.get('/me', [only.id()], (req, res) => {
  const select_config = global.config.get('select-configuration')
  if (!select_config.users || select_config.users.length == 0) throw StatusError(500, 'server error: no users configured')
  const user = select_config.users.filter(e => {
    return (e.id == req.session.id)
  })[0]
  if (!user) throw StatusError(400, 'user not found')

  const session = {
    id: req.session.id,
    initial_ts: req.session.initial_ts,
  }

  const token = jwt.sign(session, global.config.has('secret.access_token') ? global.config.get('secret.access_token') : global.DEFAULT_SECRET_ACCESS_TOKEN, {
    expiresIn: global.config.has('policy.session_expire') ? global.config.get('policy.session_expire') : global.DEFAULT_POLICY_SESSION_EXPIRE
  })
  res.status(200).json({
    message: 'ok',
    token,
    session: Object.assign(req.session, {
      roles: user.roles
    }),
  })
})

module.exports = router