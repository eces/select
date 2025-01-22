const jwt = require('jsonwebtoken')
const crypto = require('crypto')

module.exports = async (req, res, next) => {
	try {
		const email = req.body.email
		const password = req.body.password

    const hashKey = process.env.SECRET_HASH || 'secretHash'
    const p1 = crypto.createHmac('sha256', hashKey)
      .update(Buffer.from(password, 'base64').toString('utf8'))
      .digest('hex')
    
    // jhlee@selectfromuser.com
    const p2 = '7bd8c8edc868afc50e7662a8792b6b48cf6ae5f1253b637ed32aff31819fccb6'

    console.log({p1, p2}, password)

    if (p1 != p2) throw StatusError(400, '사용자를 찾을 수 없습니다.')


    const session = {
      id: 1000,
      initial_ts: Date.now(),
    }
		const key = process.env.SECRET_ACCESS_TOKEN || 'secretAccessToken'
    const token = jwt.sign(session, key, {
      // expiresIn: global.config.get('policy.session_expire')
    })
		
    res.status(200).json({
      message: 'ok',
      token,
      // session,
    }) 
	} catch (error) {
		next(error)
	}
}