const debug = require('debug')('select:only')
const jwt = require('jsonwebtoken')

const id = () => {
  return function (req, res, next) {
    const parts = (req.get('authorization') || '').split(' ')
    const token = parts.length > 1 && parts[1]
    if (!token) {
      return next(new StatusError(403, '로그인이 필요합니다. #1000'))
    }
    try {
      req.session = jwt.verify(token, global.config.has('secret.access_token') ? global.config.get('secret.access_token') : global.DEFAULT_SECRET_ACCESS_TOKEN)

      next()
    } catch (error) {
      return next(new StatusError(403, `세션 오류 #1100`))
    }
  }
}

const scope = (scope) => {
  return function (req, res, next) {
    const parts = (req.get('authorization') || '').split(' ')
    const token = parts.length > 1 && parts[1]
    if (!token) {
      return next(new StatusError(403, '로그인이 필요합니다. #1000'))
    }
    try {
      req.session = jwt.verify(token, global.config.has('secret.access_token') ? global.config.get('secret.access_token') : global.DEFAULT_SECRET_ACCESS_TOKEN)

      if (!req.session.scope || !req.session.scope.includes(scope)) 
        throw new Error('scope required')
      
      next()
    } catch (error) {
      return next(new StatusError(403, `권한이 없습니다. Name=${scope} #2000`))
    }
  }
}

module.exports = {
  scope, id,
}