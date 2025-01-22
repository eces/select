const jwt = require('jsonwebtoken')

module.exports = async (req, res, next) => {
  try {
    const challenge_id = req.body.challenge_id
    const code = req.body.code

    if (code != 'wow') throw StatusError(400, '실패. 인증코드를 확인해주세요.')
    
    console.log('>>>>>>>>>>>', {challenge_id, code})

    // throw StatusError(400, '인증 횟수 초과 (REATTEMPT)')


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