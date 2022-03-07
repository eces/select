global.StatusError = require('http-errors')
global._ = require('lodash').noConflict()

const express = require('express')
const Sentry = require('@sentry/node')
const chalk = require('chalk')
const path = require('path')
const cors = require('cors')
const morgan = require('morgan')
const serveStatic = require('serve-static')
const serveFavicon = require('serve-favicon')
const {debug, info, error} = require(__absolute + '/log')('select:app')

const routes = require('./routes')

const app = express()

app.set('port', process.env.PORT || 9400)

app.use(serveFavicon(path.join(__dirname, 'public', 'favicon.ico')))

if (global.__IS_CLI) {
  app.disable('etag')
  app.set('json spaces', 2)
} else if (!process.env.NODE_ENV || process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'))
  app.disable('etag')
  app.set('json spaces', 2)
} else {
  morgan.token('uid', (req) => {
    return req.session && req.session.id || 0
  })
  app.use(morgan(':method :status :url - :response-time ms [u::uid]', {
    skip: (req, res) => {
      url = req.originalUrl || req.url
      if (url.startsWith('/healthcheck') || url.startsWith('/css') || url.startsWith('/js')) {
        return true
      }
      return false
    }
  }))
}

app.use(express.json({limit: '1MB', type: 'application/json'}));
app.use(express.urlencoded({ extended: false }));
app.use(cors())

if (process.env.NODE_ENV == 'production') {
  let integrations = []
  if (process.env.NO_TRACE === undefined) {
    const Tracing = require("@sentry/tracing")
    integrations = [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ]
  }
  Sentry.init({
    dsn: "https://059e1abaeff240b79c218a15f6f431d3@o1100664.ingest.sentry.io/6246113",
    integrations,
  
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
  
  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
}

app.use('/', routes);
app.use(serveStatic(path.join(__dirname, 'dist')))
app.get('/:path(*)', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.use(function(req, res, next) {
  req._json = true
  next(StatusError(404));
});

app.use(Sentry.Handlers.errorHandler());

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
  
  try {
    const c = global.config.get('select-configuration')
    console.log(chalk.bgCyan.white(` INFO `), chalk.cyan(`version ${global.CLI_VERSION}`)) 
  
    const names = global.config.util.getConfigSources().map(e => {
      return e.name
    })
    console.log(chalk.bgCyan.white(` INFO `), chalk.cyan(`configuration from ${ names }`)) 
    console.log(chalk.green(`  ✓`), `NODE_CONFIG_DIR = ${chalk.bold( path.join(__absolute, process.env.NODE_CONFIG_DIR))}`)
    console.log(chalk.green(`  ✓`), `DEBUG = ${chalk.bold( process.env.DEBUG || "(FALSE)" )}`)
    console.log(chalk.green(`  ✓`), `PORT = ${chalk.bold( process.env.PORT || 9400 )}`)
    console.log(chalk.green(`  ✓`), `LICENSE_KEY = ${chalk.bold( process.env.LICENSE_KEY ? chalk.green('YES') : 'Free Plan 무료버전' )}`)
    
    global.config.get('redis.master.host')
    global.config.get('redis.master.port')
    global.config.get('redis.master.db')
    global.config.get('web.base_url')
    global.config.get('secret.access_token')
    global.config.get('policy.session_expire')
    // global.config.get('google.client_id')
    // global.config.get('google.redirect_uri')
    // global.config.get('google.client_secret')
    // global.config.get('google_sheet.client_id')
    // global.config.get('google_sheet.redirect_uri')
    // global.config.get('google_sheet.client_secret')
    global.config.get('select-configuration.title')
    global.config.get('select-configuration.menus')
    global.config.get('select-configuration.users')
    global.config.get('select-configuration.pages')
    global.config.get('select-configuration.resources')

    console.log(chalk.green(`  ✓`), `config[title] = ${chalk.bold(c.title)}`)
    console.log(chalk.green(`  ✓`), `config[menus] = ${chalk.bold(c.menus.length)} item(s)`)
    console.log(chalk.green(`  ✓`), `config[users] = ${chalk.bold(c.users.length)} item(s)`)
    console.log(chalk.green(`  ✓`), `config[pages] = ${chalk.bold(c.pages.length)} item(s)`)

    console.log('')

    console.log(chalk.cyan(`  select:admin `), 'config[redis] connecting...')
    const redis = require(__absolute + '/models/redis')
    await redis.init()
    console.log(chalk.cyan(`  select:admin `), 'config[redis] connected')

    console.log(chalk.cyan(`  select:admin `), 'config[resources] connecting...')
    const db = require(__absolute + '/models/db')
    await db.init()
    console.log(chalk.cyan(`  select:admin `), 'config[resources] connected')

    process.send && process.send('ready')
    console.log(chalk.cyan(`  select:admin `), 'api connected')

    next()
  } catch (e) {
    console.log(chalk.cyan(`  select:admin `), chalk.red('ERROR'), e.message)
    if (global.config.util.getConfigSources().length === 0) {
      console.log(chalk.cyan(`  select:admin `), chalk.red('ERROR'), `설정 파일이 없습니다. default.yml, ${process.env.NODE_ENV || 'development'}.yml local.yaml`)
    }
  }
}

module.exports.posthook = async () => {
  console.log(
    chalk.cyan(`  select:admin `), 
    chalk.bold(`ready on`),
    chalk.bold.underline(`http://localhost:${ (process.env.PORT || 9400) }`),
  )

  try {
    const axios = require('axios')
    const os = require('os')
    hostname = os.hostname()

    const c = global.config.get('select-configuration')
    const count_menu = (c.menus && c.menus.length) || 0
    const count_user = (c.users && c.users.length) || 0
    const count_page = (c.pages && c.pages.length) || 0
    const count_resource = (c.resources && c.resources.length) || 0
    let count_block = 0
    if (count_page) {
      for (const page of c.pages) {
        count_block += (page.blocks && page.blocks.length) || 0
      }
    }

    await axios.post('https://api.selectfromuser.com/api/license/2022-01-26', {
      key: global.config['license-key'] || '',
      json: {
        version: global.CLI_VERSION,
        env: process.env.NODE_ENV,
        hostname,
        count_menu,
        count_user,
        count_page,
        count_resource,
        count_block,
      }
    })
  } catch (error) {
    console.log(error.message)
  }

}
