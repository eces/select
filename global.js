require('dotenv').config()

process.env.DEBUGS && require('debugs/init')

// console.log('ONPREMISE=', process.env.ONPREM)
// global.ONPREM = process.env.ONPREM
// console.log('LICENSE_KEY=', process.env.LICENSE_KEY)
console.log('SELFHOST=', process.env.SELFHOST)
console.log('DEBUG=', process.env.DEBUG)
console.log('NODE_ENV=', process.env.NODE_ENV)

// if (process.env.ONPREM) {
//   const required = ['VITE_API_URL', 'VITE_WS_URL', 'VITE_APP_HOSTNAME', 'LICENSE_KEY', 'SECRET_ACCESS_TOKEN', 
//   'SECRET_AES_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_REDIRECT_URI', 'GOOGLE_CLIENT_SECRET',
//   'GOOGLE_SHEET_CLIENT_ID', 'GOOGLE_SHEET_REDIRECT_URI', 'GOOGLE_SHEET_CLIENT_SECRET',
//   'WEB_BASE_URL', 'SENDGRID_API_KEY', 'SENDGRID_FROM',
//   'MYSQL_MASTER_HOST', 'MYSQL_MASTER_PORT', 'MYSQL_MASTER_USER', 'MYSQL_MASTER_PASSWORD', 'MYSQL_MASTER_DATABASE', 
//   'REDIS_MASTER_HOST', 'REDIS_MASTER_PORT', 'REDIS_MASTER_DB']
  
//   const chalk = require('chalk')
//   let count_missing = 0
//   for (const key of required) {
//     if (!process.env[key]) {
//       if (count_missing == 0) {
//         console.log()
//         console.log(chalk.yellow('Required:'))
//       }
//       console.log(`  ${key}=?`)
//       count_missing++
//     }
//   }
//   if (count_missing) {
//     console.log()
//     console.log(chalk.green('Please make sure your .env file OR correct environment variables.'))
//     console.log(`Link: ${ process.cwd()}/.env`)
//     process.exit()
//   }
// }

// global.__absolute = __dirname
// require('./ormconfig.js')
// global.config = require('config')
// global.LICENSE = {}
const debug = require('debug')('select:app')

const os = require('os');
const winston = require('winston');
// require('winston-syslog');


if (process.env.NODE_ENV == 'production') {
  global.logger = winston.createLogger({
    // level: 'info',
    exitOnError: false,
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: process.env.LOG_PATH || `./select.log` }),
    ],
  })
} else {
  global.logger = winston.createLogger({
    format: winston.format.simple(),
    // format: winston.format.printf(info => info.message),
    // format: winston.format.json(),
    // levels: winston.config.syslog.levels,
    transports: [
      new winston.transports.Console({
      
      })
    ],
  });
}