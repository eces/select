
const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid').v4
const qs = require('querystring')
const axios = require('axios')
const { getRedisConnection } = require('./redis')

module.exports = async (req, res, next) => {
  let state_origin = ''
  let state_url = ''
  try {
    const {error, state, code, scope, authuser, hd, prompt} = req.query
    if (error) {
      throw new Error(error)
    }

    const redis = getRedisConnection()
    const value = await redis.get(state)
    if (value === null) throw new Error('로그인실패: 유효기간(5분)만료. 다시시도해주세요.')

    state_origin = await redis.get(state+':origin')
    state_url = await redis.get(state+':url')

    console.log('>>>>>>>>.state_url', {value, state_origin, state_url})

    const r = await axios.post('https://oauth2.googleapis.com/token', {}, {
      params: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
        code,
      },
      json: true,
    })
    console.log('>>>>>>>>', r.data)
    const {access_token} = r.data
    if (!access_token) throw new Error('access_token error')

    const p = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        'Authorization': 'Bearer ' + access_token,
      },
    })
    if (!p?.data?.id) throw new Error('로그인실패: 구글 ID가 없습니다.')
    if (!p?.data?.verified_email) throw new Error('로그인실패: 메일인증 미완료 계정입니다.')

    // const master = await getConnection('mysql.master')
    // const user = await master.createQueryBuilder()
    //   .select('*')
    //   .from('UserProfile')
    //   .where('email = :email', {
    //     email: p.email,
    //   })
    //   .getRawOne()

    let user_id = 1000;
    // if (!user || !user.id) {
    //   const inserted = await master.createQueryBuilder()
    //     .insert().into('UserProfile')
    //     .values({
    //       email: p.email,
    //       name: p.name,
    //       created_at: () => 'NOW()',
    //       signed_at: () => 'NOW()',
    //       google_config: JSON.stringify(p),
    //       google_id: p.id,
    //       picture_url: p.picture,
    //     })
    //     .execute()
    //   user_id = inserted.raw.insertId
    // } else {
    //   await master.createQueryBuilder()
    //     .update('UserProfile')
    //     .set({
    //       // email: p.email,
    //       // name: p.name,
    //       signed_at: () => 'NOW()',
    //       google_config: JSON.stringify(p),
    //       picture_url: p.picture,
    //     })
    //     .where('id = :id', { id: user.id })
    //     .execute()
    //   user_id = user.id
    // }


    const session = {
      id: user_id,
      initial_ts: Date.now(),
      // origin: state_origin,
      require_reissue: true,
      method: 'google',
      state,
    }
    
    const key = process.env.SECRET_ACCESS_TOKEN || 'secretAccessToken'
    const token = jwt.sign(session, key, {
      // expiresIn: global.config.get('policy.session_expire'),
    })

    await redis.set(state+':token', token, 'EX', 300, 'NX')

    console.log('>>>>>>>>>>>state_url', state_url)
    if (state_url) {
      return res.redirect(`${state_url}#TOKEN=${state}`)
    }

    // res.redirect(`${global.config.get('web.base_url')}/login/process#token=${token}`)
    res.redirect(`${state_origin}/login/process#token=${token}`)
  } catch (error) {
    console.log(error.stack)
    if (state_url) {
      return res.redirect(`${state_url}#ERROR=${error.message}`)
    }
    // res.redirect(`${global.config.get('web.base_url')}/login/process#result=${error.message}`)
    res.redirect(`${state_origin}/login/process#result=${error.message}`)
  }
}