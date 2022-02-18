const fs = require('fs')
const path = require('path')
const __package = path.join(process.cwd(), 'package.json')

global.__IS_CLI = fs.existsSync(__package) === false

if(!global.__IS_CLI){
  require('debugs/init')
}

// const { program } = require('commander');
const ___package = require('./package.json')
// program.name('selectfromuser')
// program.version(___package.version, '-v, --version, -version, -V')
// program.option('-w, --watch', 'watch config yaml files')

// const opts = program.opts()
// if (opts.watch) {
//   const nodemon = require('nodemon')
//   nodemon('-e "yml" ./bin/select')
//   return
// }

// program.parse()


global.__absolute = __dirname
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || '.'
global.config = require('config')
global.DEFAULT_SECRET_HASH = '+x3VR4Fn<y3U6T&G'
global.DEFAULT_SECRET_ACCESS_TOKEN = 'h{.V(eWpSbpU35J4'
global.DEFAULT_POLICY_SESSION_EXPIRE = 43200
global.CLI_VERSION = ___package.version


setTimeout(async () => {
  try {
    const boxen = (await import('boxen')).default
    const chalk = require('chalk')
    const pj = require('package-json')
    const latest = await pj('selectfromuser')
    if (latest.version != ___package.version) {
      console.log(boxen(`Update available ${___package.version} -> ${ chalk.bold(latest.version)}\nRun ${ chalk.cyan('npm i -g selectfromuser') } to update`, {
        padding: 1,
        margin: 1,
        borderColor: 'yellow',
        // textAlignment: 'center',
        title: '업데이트 알림',
        titleAlignment: 'center',
      }))
    }
  } catch (error) {
    console.error(error)
  }
}, 0)

const os = require('os');
global.__hostname = os.hostname()
const winston = require('winston');
// require('winston-syslog');

if (process.env.NODE_ENV == 'production') {
  global.logger = winston.createLogger({
    // format: winston.format.simple(),
    format: winston.format.json(),
    levels: winston.config.syslog.levels,
    transports: [
      new winston.transports.Console({
        
      })
    ],
  });
} else {
  global.logger = winston.createLogger({
    // format: winston.format.simple(),
    format: winston.format.printf(info => info.message),
    levels: winston.config.syslog.levels,
    transports: [
      new winston.transports.Console({
        
      })
    ],
  });
}

module.exports = {
  app: require('./app.js'),
}