const redis = require('ioredis')

let sub = null
let pub = null

module.exports.init = async () => {
  try {
    pub = redis.createClient({
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST,
      db: process.env.REDIS_DB,
      keyPrefix: process.env.NODE_ENV + ':',
    })
    pub.on('error', e => {
      console.error(e)
    })
  } catch (e) {
    console.error(e)
  }
}

module.exports.init()

module.exports.getRedisConnection = (name = null) => {
  if (name == 'pub') return pub
  if (name === null) return pub
}