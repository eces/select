const logger = require(__absolute + '/models/logger')
const debug = require('debug')('select:api')
const only = require(__absolute + '/models/only')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { getRedisConnection } = require(__absolute + '/models/redis')

const router = require('express').Router()

router.use((req, res, next) => {
  req._json = true
  next()
})

router.post('/authorize', async (req, res, next) => {
  try {
    const id = String(req.body.id || '').trim().slice(0, 50)
    const pw = String(req.body.pw || '').trim().slice(0, 50)
    
    if (!id) throw StatusError(400, '이메일 또는 아이디를 입력해주세요.')
    if (!pw) throw StatusError(400, '비밀번호를 입력해주세요.')

    const pw_hash = crypto.createHmac('sha256', global.config.has('secret.hash') ? global.config.get('secret.hash') : global.DEFAULT_SECRET_HASH)
      .update(pw)
      .digest('hex')

    const select_config = global.config.get('select-configuration')

    if (!select_config.users || select_config.users.length == 0) throw StatusError(500, 'select-configuration.users 설정 오류')
    const matched_users = select_config.users.filter(e => {
      return (e.id == id)
    })
    if (matched_users.length === 0) throw StatusError(400, '사용자를 찾을 수 없습니다.')
    if (matched_users.length > 1) throw StatusError(400, 'select-configuration.users 아이디가 중복됩니다. 설정 오류')

    const redis = getRedisConnection()
    const reattempt = await redis.set(`ReattemptCount:${id}`, 1, 'EX', 60, 'NX')
    
    let reattempt_count = 1
    if (reattempt == 'ok') {
      
    } else {
      const c = await redis.incr(`ReattemptCount:${id}`)
      if (+c >= 5) {
        throw StatusError(400, '60초 뒤에 다시 시도해주세요.')
      }
      reattempt_count = c
    }

    const u = matched_users[0]
    const u_pw_hash = crypto.createHmac('sha256', global.config.has('secret.hash') ? global.config.get('secret.hash') : global.DEFAULT_SECRET_HASH)
      .update(Buffer.from(u.pw, 'base64').toString('utf8'))
      .digest('hex')
    if (u_pw_hash != pw_hash) throw StatusError(400, `비밀번호가 틀립니다. (${reattempt_count}/5)`)

    const session = {
      id: u.id,
      initial_ts: Date.now(),
    }
    const token = jwt.sign(session, global.config.has('secret.access_token') ? global.config.get('secret.access_token') : global.DEFAULT_SECRET_ACCESS_TOKEN, {
      expiresIn: global.config.has('policy.session_expire') ? global.config.get('policy.session_expire') : global.DEFAULT_POLICY_SESSION_EXPIRE
    })

    logger.emit('session activity', {
      email: u.id,
      response_type: 'session:id start',
    })

    res.status(200).json({
      message: 'ok',
      token,
      // session,
    })
  } catch (e) {
    next(e)
  }
})

router.get('/me', [only.id()], async (req, res, next) => {
  try {
    const select_config = global.config.get('select-configuration')
    if (!select_config.users || select_config.users.length == 0) throw StatusError(500, 'server error: no users configured')
    const user = select_config.users.filter(e => {
      return (e.id == req.session.id)
    })[0]
    if (!user) throw StatusError(400, 'user not found')


    const redis = getRedisConnection()
    const key = `UserProfile:${req.session.uuid}`
    let userdata = await redis.get(key)

    const session = {
      id: req.session.id,
      initial_ts: req.session.initial_ts,
    }

    if (userdata) {
      debug({userdata})
      userdata = JSON.parse(userdata)
    }

    const token = jwt.sign(session, global.config.has('secret.access_token') ? global.config.get('secret.access_token') : global.DEFAULT_SECRET_ACCESS_TOKEN, {
      expiresIn: global.config.has('policy.session_expire') ? global.config.get('policy.session_expire') : global.DEFAULT_POLICY_SESSION_EXPIRE
    })

    logger.emit('session activity', {
      email: user.id,
      response_type: 'session refresh',
    })

    res.status(200).json({
      message: 'ok',
      token,
      session: Object.assign(req.session, {
        email: user.id,
        roles: user.roles
      }, userdata || {}),
      env: process.env.NODE_ENV,
      hostname: global.__hostname,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router