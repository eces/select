const debug = require('debug')('select:monitor')
const { getConnection } = require('typeorm')
const crypto = require('crypto')
const moment = require('moment')
// const { getRedisConnection } = require('../models/redis')

// const publish = (next) => {
//   const pub = getRedisConnection('pub')
//   const { Emitter } = require('@socket.io/redis-emitter')
//   const io = new Emitter(pub)
//   next(io)
// }

const EventEmitter = require('events')

class MonitorEventEmitter extends EventEmitter {}

const ee = new MonitorEventEmitter()

ee.on('query', async ({team_id, resource_uuid, query}) => {
  
})
ee.on('query:count', async ({team_id, hash}) => {
  
})
ee.on('query profile', async ({team_id, query, ms}) => {
  
})
ee.on('activity', async (opt) => {
  
})

// allow run
const get_confirm_status = async ({team_id, resource_uuid, query}) => {
  return ''
}

module.exports = ee
module.exports.get_confirm_status = get_confirm_status