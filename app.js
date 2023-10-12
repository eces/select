/**
 * @license
 * Copyright(c) 2021-2023 Selectfromuser Inc.
 * All rights reserved.
 * https://www.selectfromuser.com
 * {team, support, jhlee}@selectfromuser.com, eces92@gmail.com
 * Commercial Licensed. Grant use for paid permitted user only.
 */

global.StatusError = require('http-errors')
global._ = require('lodash').noConflict()

const express = require('express')
const path = require('path')
const cors = require('cors')
const morgan = require('morgan')
const serveStatic = require('serve-static')
const serveFavicon = require('serve-favicon')

const {debug, info, error} = require('./log.js')('select:app')

const routes = require('./routes/index.js')

const app = express()

app.set('port', process.env.PORT || 9300)
// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'pug')
app.set('trust proxy', true)

// app.use(serveFavicon(path.join(__dirname, 'public', 'favicon.ico')))

if (!process.env.NODE_ENV || process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'))
  app.disable('etag')
  app.set('json spaces', 2)
} else {
  morgan.token('uid', (req) => {
    return req.session && req.session.id || 0
  })
  app.use(morgan(':method :status :url - :response-time ms [u:uid]', {
    skip: (req, res) => {
      url = req.originalUrl || req.url
      if (url.startsWith('/healthcheck')) {
        return true
      }
      return false
    }
  }))
}

app.use(express.json({limit: '1MB', type: 'application/json'}));
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: true }))

app.use('/', routes);

app.use(function(req, res, next) {
  req._json = true
  next(StatusError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (req._json) {
    if (err.name == 'QueryFailedError') {
      res.status(200).json({
        status: err.status,
        message: err.reason || '캐시 오류',
        data: err.data,
      })
    }
    if (res.locals.error) {
      debug(res.locals.error.stack || res.locals.error)
    }
    res
      .status(200)
      .json({
        status: err.status,
        message: err.message,
        data: err.data,
      })
  } else {
    res.status(err.status || 500);
    res.send(`<h1>${error.name}</h1><p>${error.message}</p>`)
  }
});

process.on('SIGINT', () => {
  debug('SIGINT = true')
  global.SIGINT = true

  setTimeout( () => {
    process.exit(0)
  }, 100)
})

module.exports = app;

module.exports.prehook = async (next) => {
  try {
    const selectConfig = require('./models/selectConfig')
    await selectConfig.refresh_team_all()
    selectConfig.watch()

    const db = require('./models/db')
    // await db.init()
    
    // online teams (queue에서 받아야함 election)
    // await db.init_team_resource(1)
    info('config[db] connected')
    
    await db.init_team_resource_all()
    // await redis.init_team_resource_all()
    
    const livereload = require('livereload')
    global.__livereload_server = livereload.createServer({
      port: 35729 + 33,
    });
    

    // info('resources[db] connected')

    // const axios = require('axios')
    const ip = require('ip')  
    global.PRIVATE_IP = ip.address()
    // if (process.env.ONPREM) {
    // } else {
    //   if (process.env.NODE_ENV == 'production') {
    //     const r = await axios.get('http://169.254.169.254/latest/meta-data/local-ipv4')
    //     global.PRIVATE_IP = r.data
    //   }
    // }

    process.send && process.send('ready')
    info('api connected')


    next()
  } catch (e) {
    debug(e.stack)
    error(e)
  }
}

module.exports.posthook = async () => {
  // debug(`REGION=${process.env.REGION_CURRENT || 'seoul'} ${global.PRIVATE_IP}`)

}

// test4
