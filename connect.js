/**
 * @license
 * Copyright(c) 2021-2025 Selectfromuser Inc.
 * All rights reserved.
 * https://www.selectfromuser.com
 * {team, support, jhlee}@selectfromuser.com
 */

require('./global')

global._ = require('lodash').noConflict()

const {debug, info, error} = require('./log.js')('select:app')
const db = require('./models/db')
const path = require('path')
const fs = require('fs')

const external_axios = require('axios').create({
  timeout: process.env.DEFAULT_HTTP_TIMEOUT || 15000,
  headers: {
    'User-Agent': 'SelectAdmin',
  },
})

const { io } = require('socket.io-client')

const state = {
  connected: false,
}

module.exports.createServer = () => {
  module.exports.prehook(async () => {
    await module.exports.server()
    await module.exports.posthook()
  })
}

module.exports.server = async () => {
  info('ws[server]')

  let socket = io(global.__WS_BASE, {
    path: '/select.websocket/',
  })

  socket.on('connect', () => {
    state.connected = true
    
    socket.emit('server:enter', {
      token: global.__CONFIG_TOKEN,
      team_id: global.__TEAM.id,
      namespace: process.env.NAMESPACE || '',
    })

  })
  socket.on('disconnected', () => {
    state.connected = false
  })

  socket.on('ask', async (opt) => {
    // socket.emit(`pool:respond`, {
    //   id: opt.id,
    //   tid: opt.tid,
    //   data: {
    //     message: 'ok',
    //     rows: [
    //       {a: 'hey'}
    //     ]
    //   }
    // })
    try {
      const block = opt.block
      const url = new URL(block.url)
      if (url.pathname == '/query') {
        // built in query
        
        if (!block.data.resource) throw new Error('axios.data.resource empty')
        if (!block.data.resource) throw new Error('axios.data.sql empty')
        
        const resource = await db.get_internal_resource(block.data.resource)

        let [ escaped_bind_sql, escaped_bind_params ] = resource.driver
          .escapeQueryWithParameters(block.data.sql, block.data.params, {})

        const r = await resource.query(escaped_bind_sql, escaped_bind_params)

        socket.emit(`pool:respond`, {
          id: opt.id,
          tid: opt.tid,
          data: {
            message: 'ok',
            rows: r,
          }
        })
      }
      else if (url.pathname == '/http') {
        // built in http

        const r = await external_axios(block.data)
        socket.emit(`pool:respond`, {
          id: opt.id,
          tid: opt.tid,
          data: {
            message: 'ok',
            data: r.data,
          }
        })
      }
      else if (url.pathname.startsWith('/api')) {
        // call _api

        const filename = _.camelCase(url.pathname.slice(4))
        const p = path.join(process.env.CWD || process.cwd(), '_api', `${filename}.js`)
        if (!fs.existsSync(p)) {
          throw new Error(`_api/${filename}.js not found`)
        } else {
          const f = require(p)
          const req = {
            team: global.__TEAM,
            resource: db.get_internal_resource,
          }
          const r = await f(req)
          socket.emit(`pool:respond`, {
            id: opt.id,
            tid: opt.tid,
            data: r,
          })
        }
      }
      else {
        throw new Error('invalid request')
      }
      
    } catch (error) {
      const resp = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        body: error.response?.body,
        message: error?.message,
      }
      socket.emit(`pool:respond`, {
        id: opt.id,
        tid: opt.tid,
        data: {
          message: error.message,
          response: resp,
        }
      })
    }
  })

  const shutdown = async () => {
    try {
      await module.exports.posthook()

      socket.emit('leave')
      state.connected = false

      setTimeout(() => {
        process.exit(0)
      }, 300)
    } catch (error) {
      console.error(error.stack)
      process.exit(1)
    }
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

module.exports.prehook = async (next) => {
  try {
    const selectConfig = require('./models/selectConfig')
    await selectConfig.refresh_team_all()
    
    const db = require('./models/db')
    info('config[db] connected')
    
    await db.init_team_resource_all()
    // await redis.init_team_resource_all()
    
    info('resources[db] connected')

    process.send && process.send('ready')
    info('api connected')

    next()
  } catch (e) {
    debug(e.stack)
    error(e)
  }
}

module.exports.posthook = async () => {
   
}