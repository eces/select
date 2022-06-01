const chalk = require('chalk')
const {createConnection, getConnection, Connection} = require('typeorm')
const debug = require('debug')('select:db')

module.exports.init = async () => {
  const select_config = global.config.get('select-configuration')
  if (!select_config.resources || select_config.resources.length == 0) {
    // throw new Error('server error: no resources configured.')
    return console.log(chalk.cyan(`  select:admin `), chalk.red.bold('server warning: no resources configured.'))
  }

  for (const r of select_config.resources) {
    if (r.type == 'mysql') {
      await createConnection({
        name: r.key,
        type: 'mysql',
        host: r.host,
        port: r.port || 3306,
        username: r.username,
        password: Buffer.from(r.password, 'base64').toString('utf-8'),
        database: r.database,
        synchronize: false,
        logging: process.env.NODE_ENV == 'development' ? true : false,
        requestTimeout: 60*1000,
        timezone: r.timezone || '+00:00',
        dateStrings: true,
        extra: {
          charset: (r.extra && r.extra.charset) || r.charset || "utf8mb4_general_ci",
        },
      })
    } else if (r.type == 'postgres') {
      let connectionAttributes;

      if (r.url) {
        connectionAttributes = { url: r.url }
      } else {
        connectionAttributes = {
          host: r.host,
          port: r.port || 5432,
          username: r.username,
          password: Buffer.from(r.password, 'base64').toString('utf-8'),
          database: r.database,
        }
      }

      await createConnection({
        name: r.key,
        type: 'postgres',
        synchronize: false,
        logging: process.env.NODE_ENV == 'development' ? true : false,
        connectTimeoutMS: Math.max(10*1000, r.connectTimeoutMS || 10*1000),
        timezone: r.timezone || '+00:00',
        ssl: r.ssl,
        ...connectionAttributes
      })
    } else {
      throw new Error('server error: not supported resource[type].')
    }
  }
}