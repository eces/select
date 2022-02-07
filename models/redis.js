const redis = require('ioredis')
const {debug, info, error} = require(__absolute + '/log')('select:db')

let sub = null
let pub = null

module.exports.init = async () => {
  try {
    sub = redis.createClient({
      port: global.config.get('redis.master.port'),
      host: global.config.get('redis.master.host'),
      db: global.config.get('redis.master.db'),
      keyPrefix: process.env.NODE_ENV + ':',
    })
    sub.on('error', e => {
      error(e)
    })
    pub = redis.createClient({
      port: global.config.get('redis.master.port'),
      host: global.config.get('redis.master.host'),
      db: global.config.get('redis.master.db'),
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