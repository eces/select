global.StatusError = require('http-errors')
global._ = require('lodash').noConflict()

const express = require('express')
const chalk = require('chalk')
const path = require('path')
const cors = require('cors')
const morgan = require('morgan')
const serveStatic = require('serve-static')
const serveFavicon = require('serve-favicon')
const debug = require('debug')('select:app')

const routes = require('./routes')

const app = express()

app.set('port', process.env.PORT || 9400)

app.use(serveFavicon(path.join(__dirname, 'public', 'favicon.ico')))

if (!process.env.NODE_ENV || process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'))
  app.disable('etag')
  app.set('json spaces', 2)
} else {
  morgan.token('uid', (req) => {
    return req.session && req.session.id || 0
  })
  app.use(morgan(':method :status - :response-time ms [u:uid]', {
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

app.use(cors())
app.use('/', routes);
app.use(serveStatic(path.join(__dirname, 'dist')))
app.get('/:path(*)', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.use(function(req, res, next) {
  req._json = true
  next(StatusError(404));
});

if (process.env.NODE_ENV == 'production') {
  app.use(Sentry.Handlers.errorHandler());
}

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (err.name == 'QueryFailedError') {
    res.status(200).json({
      status: err.status,
      message: err.reason || 'QueryFailedError',
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
  const c = global.config.get('select-configuration')
  console.log(chalk.cyan(`  select:admin `), chalk.bold('start'))
  console.log(`NODE_CONFIG_DIR = ${chalk.bold( process.env.NODE_CONFIG_DIR )}`)
  console.log(`DEBUG = ${chalk.bold( process.env.DEBUG )}`)
  console.log(`PORT = ${chalk.bold( process.env.PORT || 9400 )}`)
  console.log(`config[title] = ${chalk.bold(c.title)}`)
  console.log(`config[menus] = ${chalk.bold(c.menus.length)} item(s)`)
  console.log(`config[users] = ${chalk.bold(c.users.length)} item(s)`)
  console.log(`config[pages] = ${chalk.bold(c.pages.length)} item(s)`)

  try {
    debug('config[resources] connecting')
    const db = require(__absolute + '/models/db')
    await db.init()
    debug('config[resources] connected')

    process.send && process.send('ready')
    debug('api connected')

    next()
  } catch (error) {
    debug(error)
  }
}

module.exports.posthook = async () => {
  console.log(
    chalk.cyan(`  select:admin `), 
    chalk.bold(`ready on http://localhost:${ (process.env.PORT || 9400) }`),
  )
}
