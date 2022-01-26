const {debug, info, error} = require(__absolute + '/log')('select:app')
const { getConnection } = require('typeorm')
const axios = require('axios').create({
  timeout: 5000,
})

const EventEmitter = require('events')

class LogEventEmitter extends EventEmitter {}

const ee = new LogEventEmitter()

ee.on('query run', async ({team_id, teamrow_id, user_id, json}) => {
  info('query run', team_id, teamrow_id, user_id, json)
})

ee.on('query error', async ({team_id, teamrow_id, user_id, json}) => {
  error('query error', team_id, teamrow_id, user_id, json)
})

{
  const name = 'connection new'
  ee.on(name, async (opt) => {
    const {team_id, teamrow_id, json} = opt
    info(name, team_id, teamrow_id, json)
  })
}

{
  const name = 'connection pool'
  ee.on(name, async (opt) => {
    const {team_id, teamrow_id, json} = opt
    info(name, team_id, teamrow_id, json)
  })
}

{
  const name = 'connection failed'
  ee.on(name, async (opt) => {
    const {team_id, teamrow_id, json} = opt
    error(name, team_id, teamrow_id, json)
  })
}

{
  const name = 'connection server error'
  ee.on(name, async (opt) => {
    const {team_id, teamrow_id, json} = opt
    error(name, team_id, teamrow_id, json)
  })
}

{
  const name = 'connection test error'
  ee.on(name, async (opt) => {
    const {team_id, user_id, json} = opt
    error(name, team_id, teamrow_id, json)
  })
}

{
  const name = 'session activity'
  ee.on(name, async (opt) => {
    try {
      await axios.post('https://api.selectfromuser.com/api/license/2022-01-26/session-activity', {
        key: global.config['license-key'] || '',
        email: opt.email,
        sql_type: opt.sql_type,
        http_method: opt.http_method,
        block_name: opt.block_name,
        response_type: opt.response_type,
      })
    } catch (e) {
      error(e)
    }
  })
}

module.exports = ee