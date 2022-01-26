global.StatusError = require('http-errors')
global._ = require('lodash').noConflict()

const express = require('express')
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

if (!process.env.NODE_ENV || process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'))
  app.disable('etag')
  app.set('json spaces', 2)
} else {
  morgan.token('uid', (req) => {
    return req.session && req.session.id || 0
  })
  app.use(morgan(':method :status - :response-time ms [u::uid]', {
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
  console.log(chalk.green(`✓`), `NODE_CONFIG_DIR = ${chalk.bold( process.env.NODE_CONFIG_DIR )}`)
  console.log(chalk.green(`✓`), `DEBUG = ${chalk.bold( process.env.DEBUG || "(FALSE)" )}`)
  console.log(chalk.green(`✓`), `PORT = ${chalk.bold( process.env.PORT || 9400 )}`)
  console.log(chalk.green(`✓`), `LICENSE_KEY = ${chalk.bold( process.env.LICENSE_KEY ? chalk.green('YES') : 'N/A' )}`)
  console.log(chalk.green(`✓`), `config[title] = ${chalk.bold(c.title)}`)
  console.log(chalk.green(`✓`), `config[menus] = ${chalk.bold(c.menus.length)} item(s)`)
  console.log(chalk.green(`✓`), `config[users] = ${chalk.bold(c.users.length)} item(s)`)
  console.log(chalk.green(`✓`), `config[pages] = ${chalk.bold(c.pages.length)} item(s)`)

  try {
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
  }
}

module.exports.posthook = async () => {
  console.log(
    chalk.cyan(`  select:admin `), 
    chalk.bold(`ready on http://localhost:${ (process.env.PORT || 9400) }`),
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
