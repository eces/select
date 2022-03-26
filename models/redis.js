const redis = require('ioredis')
const {debug, info, error} = require(__absolute + '/log')('select:db')

let sub = null
let pub = null

module.exports.init = async () => {
  try {
    const port = process.env.REDIS_MASTER_PORT || global.config.get('redis.master.port')
    const host = process.env.REDIS_MASTER_HOST || global.config.get('redis.master.host')
    const db = process.env.REDIS_MASTER_DB || global.config.get('redis.master.db')
    sub = redis.createClient({
      port,
      host,
      db,
      keyPrefix: process.env.NODE_ENV + ':',
    })
    sub.on('error', e => {
      error(e)
    })
    pub = redis.createClient({
      port,
      host,
      db,
      keyPrefix: process.env.NODE_ENV + ':',
    })
    pub.on('error', e => {
      error(e)
    })
  } catch (e) {
    error(e)
  }
}

module.exports.getRedisConnection = (name) => {
  if (name == 'sub') return sub
  if (name == 'pub') return pub
  return pub
}