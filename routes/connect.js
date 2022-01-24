const debug = require('debug')('select:api')
const only = require(__absolute + '/models/only')
const { getRedisConnection } = require(__absolute + '/models/redis')
const crypto = require('crypto')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const { getConnection, TableExclusion } = require('typeorm')
const uuidv4 = require('uuid').v4
const qs = require('querystring')
const rp = require('request-promise')

const router = require('express').Router()

router.use((req, res, next) => {
  req._json = true
  next()
})

router.get('/google', async (req, res, next) => {
  try {
    const enabled = global.config.get('select-configuration.integrations.google-sso.enabled')
    // if (String(enabled) != 'true') throw StatusError(500, '구글 로그인 설정이 비활성화 되어있습니다.')

    const redis = getRedisConnection()
    const state = `google:${uuidv4()}`
    // 유효기긴 5분
    await redis.set(state, 'Y', 'EX', 300, 'NX')

    res.status(200).json({
      message: 'ok',
      url: 'https://accounts.google.com/o/oauth2/v2/auth?' + qs.stringify({
        response_type: 'code',
        state,
        redirect_uri: global.config.get('google.redirect_uri'),
        client_id: global.config.get('google.client_id'),
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' '),
        prompt: 'select_account',
      })
    })
  } catch (error) {
    next(error)
  }
})

router.get('/google/callback', async (req, res, next) => {
  try {
    const {error, state, code, scope, authuser, hd, prompt} = req.query
    if (error) {
      throw new Error(error)
    }

    const redis = getRedisConnection()
    const value = await redis.get(state)
    if (value === null) throw new Error('로그인실패: 유효기간(5분)만료. 다시시도해주세요.')

    const r = await rp.post({
      url: 'https://oauth2.googleapis.com/token',
      qs: {
        client_id: global.config.get('google.client_id'),
        client_secret: global.config.get('google.client_secret'),
        redirect_uri: global.config.get('google.redirect_uri'),
        grant_type: 'authorization_code',
        code,
      },
      json: true,
    })
    const {access_token} = r
    if (!access_token) throw new Error('access_token error')

    const p = await rp.get({
      url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
      headers: {
        'Authorization': 'Bearer ' + access_token,
      },
      json: true,
    })
    if (!p.id) throw new Error('로그인실패: 구글 ID가 없습니다.')
    if (!p.verified_email) throw new Error('로그인실패: 메일인증 미완료 계정입니다.')

    const users = global.config.get('select-configuration.users')

    const user = users.filter(e => {
      return e.id == p.email
    })[0]
    if (!user) {
      throw new Error('로그인실패: 해당 이메일은 권한이 없습니다.')
    }

    const id = uuidv4()
    const key = `UserProfile:${id}`
    const json = {
      email: p.email,
      name: p.name,
      signed_at: () => 'NOW()',
      google_config: JSON.stringify(p),
      google_id: p.id,
      picture_url: p.picture,
    }
    await redis.set(key, JSON.stringify(json))
    
    const session = {
      id: user.id,
      uuid: id,
      initial_ts: Date.now(),
    }
    const token = jwt.sign(session, global.config.get('secret.access_token'), {
      expiresIn: global.config.get('policy.session_expire')
    })

    res.redirect(`${global.config.get('web.base_url')}/login/process#token=${token}`)
  } catch (error) {
    res.redirect(`${global.config.get('web.base_url')}/login/process#result=${error.message}`)
  }
})

router.get('/google/spreadsheet', [only.id()], async (req, res, next) => {
  try {
    const redis = getRedisConnection()
    const state = `google:${uuidv4()}`
    // 유효기긴 5분
    await redis.set(state, JSON.stringify(Object.assign({}, req.session, {
      
    })), 'EX', 300, 'NX')

    res.status(200).json({
      message: 'ok',
      url: 'https://accounts.google.com/o/oauth2/v2/auth?' + qs.stringify({
        response_type: 'code',
        state,
        redirect_uri: global.config.get('google_sheet.redirect_uri'),
        client_id: global.config.get('google_sheet.client_id'),
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          // 'https://www.googleapis.com/auth/spreadsheets',
          // 'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
        ].join(' '),
        // prompt: 'select_account',
        prompt: 'consent',
        access_type: 'offline',
      })
    })
  } catch (error) {
    next(error)
  }
})

router.get('/google/spreadsheet/callback', [], async (req, res, next) => {
  try {
    const {error, state, code, scope, authuser, hd, prompt} = req.query
    if (error) {
      throw new Error(error)
    }
    if (!scope.includes('https://www.googleapis.com/auth/drive.file')) {
      throw new Error('🍀권한을 확인해주세요.\n🍀구글드라이브에서 어드민이 생성한 파일만 조회/수정하는 권한이 필요합니다.\n🍀구글스프레드시트로 내보내기에 이용됩니다.')
    }

    const redis = getRedisConnection()
    const value = await redis.get(state)
    if (value === null) throw new Error('로그인실패: 유효기간(5분)만료. 다시시도해주세요.')
    const session = JSON.parse(value)

    const r = await rp.post({
      url: 'https://oauth2.googleapis.com/token',
      qs: {
        client_id: global.config.get('google_sheet.client_id'),
        client_secret: global.config.get('google_sheet.client_secret'),
        redirect_uri: global.config.get('google_sheet.redirect_uri'),
        grant_type: 'authorization_code',
        code,
        // access_type: 'offline',
      },
      json: true,
    })
    const {access_token} = r
    debug(r)
    if (!access_token) throw new Error('access_token error')

    const p = await rp.get({
      url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
      headers: {
        'Authorization': 'Bearer ' + access_token,
      },
      json: true,
    })
    if (!p.id) throw new Error('로그인실패: 구글 ID가 없습니다.')
    if (!p.verified_email) throw new Error('로그인실패: 메일인증 미완료 계정입니다.')
    if (global.config.has('select-configuration.integrations.google-spreadsheets.restrict-domain')) {
      const hd = global.config.get('select-configuration.integrations.google-spreadsheets.restrict-domain')
      if (hd != p.hd) throw new Error('도메인 제한을 확인해주세요. select-configuration.integrations.google-spreadsheets.restrict-domain')
    }
    debug(p)
    // update current session

    const id = session.uuid
    const key = `UserProfile:${id}:GoogleSheet`
    const _user = await redis.get(key)
    const user = _user ? JSON.parse(_user) : {}
    
    const user_next = Object.assign(user, {
      google_sheet_access_token: access_token,
      google_sheet_config: JSON.stringify(Object.assign({}, r, p)),
      google_sheet_updated_at: moment().format(),
    })
    await redis.set(key, JSON.stringify(user_next))

    res.redirect(`${global.config.get('web.base_url')}/connect/process#ok`)
  } catch (error) {
    res.redirect(`${global.config.get('web.base_url')}/connect/process#result=${error.message}`)
  }
})

router.get('/google/spreadsheet/refresh', [only.id()], async (req, res, next) => {
  try {
    const redis = getRedisConnection()

    const id = req.session.uuid
    const key = `UserProfile:${id}:GoogleSheet`
    const _user = await redis.get(key)
    const user = _user ? JSON.parse(_user) : {}
    
    // if (!user) throw StatusError(400, 'profile not found')
    if (!user || !user.google_sheet_access_token) throw StatusError(400, 'not connected')
    const has_expired = moment(user.google_sheet_updated_at).isBefore(moment().add(-59, 'minute'), 'minute')
    if (!user.google_sheet_updated_at || has_expired) {
      const r = await rp.post({
        url: 'https://oauth2.googleapis.com/token',
        qs: {
          client_id: global.config.get('google_sheet.client_id'),
          client_secret: global.config.get('google_sheet.client_secret'),
          grant_type: 'refresh_token',
          refresh_token: user.google_sheet_config.refresh_token,
        },
        json: true,
      })
      
      const user_next = Object.assign(user, {
        google_sheet_access_token: access_token,
        google_sheet_config: JSON.stringify(Object.assign(user.google_sheet_config, r)),
        google_sheet_updated_at: moment().format(),
      })
      await redis.set(key, JSON.stringify(user_next))
    }

    res.status(200).json({
      message: 'ok',
    })
  } catch (error) {
    // debug(error.stack)
    next(error)
  }
})

router.delete('/google/spreadsheet', [only.id()], async (req, res, next) => {
  try {
    const redis = getRedisConnection()

    const id = req.session.uuid
    const key = `UserProfile:${id}:GoogleSheet`
    await redis.del(key)
    
    res.status(200).json({
      message: 'ok',
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router