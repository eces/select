const debug = require('debug')('select:log')
const { getConnection } = require('typeorm')

const EventEmitter = require('events')

class LogEventEmitter extends EventEmitter {}

const ee = new LogEventEmitter()

ee.on('query source', async ({team_id, teamrow_id, user_id, json}) => {
  try {
    debug('query source', {team_id, teamrow_id, user_id, json})
  } catch (error) {
    debug(error.stack)
  }
})

ee.on('query run', async ({team_id, teamrow_id, user_id, json}) => {
  try {
    debug('query run', {team_id, teamrow_id, user_id, json})
  } catch (error) {
    debug(error.stack)
  }
})

ee.on('query profile', async ({team_id, teamrow_id, user_id, json}) => {
  try {
    debug('query profile', {team_id, teamrow_id, user_id, json})
  } catch (error) {
    debug(error.stack)
  }
})

ee.on('query error', async ({team_id, teamrow_id, user_id, json}) => {
  try {
    debug('query error', {team_id, teamrow_id, user_id, json})
  } catch (error) {
    debug(error.stack)
  }
})

{
  const name = 'connection new'
  ee.on(name, async (opt) => {
    const {team_id, teamrow_id, json} = opt
    debug(name, opt)
  })
}

{
  const name = 'connection pool'
  ee.on(name, async (opt) => {
    const {team_id, teamrow_id, json} = opt
    debug(name, opt)
  })
}

{
  const name = 'connection failed'
  ee.on(name, async (opt) => {
    const {team_id, teamrow_id, json} = opt
    debug(name, opt)
  })
}

{
  const name = 'connection server error'
  ee.on(name, async (opt) => {
    const {team_id, teamrow_id, json} = opt
    debug(name, opt)
  })
}

{
  const name = 'connection test error'
  ee.on(name, async (opt) => {
    const {team_id, user_id, json} = opt
    debug(name, opt)
  })
}

{
  const name = 'init connections error'
  ee.on(name, async (opt) => {
    const {json} = opt
    debug(name, opt)
  })
}

module.exports = ee