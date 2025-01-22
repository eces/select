const { getRedisConnection } = require('./redis')

module.exports = async (req, res, next) => {
  try {
    const redis = getRedisConnection()
    const state = req.body.state
    if (!state.startsWith('google:')) throw StatusError(400, 'invalid google state')
    const v = await redis.getdel(`${state}:token`)
    if (!v) throw StatusError(400, 'google login failed')
    res.status(200).json({
      message: 'ok',
      token: v,
    })
  } catch (error) {
    next(error)
  }
}