
const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid').v4
const qs = require('querystring')
const { getRedisConnection } = require('./redis')

module.exports = async (req, res, next) => {
  try {
    const url = req.query.url

    const redis = getRedisConnection()
    
    const state = `google:${uuidv4()}`
    // 유효기긴 5분
    await redis.set(state, 'Y', 'EX', 300, 'NX')
    await redis.set(state+':url', url, 'EX', 300, 'NX')

    res.status(200).json({
      message: 'ok',
      url: 'https://accounts.google.com/o/oauth2/v2/auth?' + qs.stringify({
        response_type: 'code',
        state,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        client_id: process.env.GOOGLE_CLIENT_ID,
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' '),
        prompt: 'select_account',
      })
    })
  } catch (err) {
    // error(err)
    next(err)
  }
}