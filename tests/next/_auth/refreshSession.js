
const jwt = require('jsonwebtoken')

// const { neon } = require("@neondatabase/serverless");

// const sql = neon(process.env.ADMIN_DB_URL);

module.exports = async (req, res, next) => {
  try {
    console.log('>>>>>>>>>>>', req.session)

    const profile = {
      email: 'jhlee@selectfromuser.com',
      id: 1000,
      scope: [`tid:${global.__TEAM.id}:admin`],
    }

    req.session = {
      email: 'jhlee@selectfromuser.com',
      id: 1000,
      scope: [`tid:${global.__TEAM.id}:admin`],
    }

    
    const key = process.env.SECRET_ACCESS_TOKEN || 'secretAccessToken'
    const sso_token = jwt.sign(req.session, key, {
      // expiresIn: global.config.get('policy.session_expire')
    })

    res.status(200).json({
      message: 'ok',
      // token,
      sso_token,
      // domain_token: "a",
      session: Object.assign(req.session, {
        email: profile.email,
        name: profile.name,
        // roles: [`tid:${global.__TEAM.id}:admin`],
        roles: [],
        google_sheet_config: {
          email: '',
        },
        flag: profile.flag_config || {},
        phone: profile.phone,
        channelTalkHash: null,
        hash: null,
      }),
      // intercom,
    })
  } catch (error) {
    next(error)
  }
}