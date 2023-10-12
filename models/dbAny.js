const {debug, info, error} = require('../log')('select:api')
const { MongoClient } = require("mongodb");
const genericPool = require('generic-pool')
const redis = require('ioredis')

class AlreadyHasActiveConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AlreadyHasActiveConnectionError';
  }
}

module.exports.connections = {}

module.exports.createConnectionAny = async (config) => {
  if (module.exports.connections[config.name]) {
    // already connected
    throw new AlreadyHasActiveConnectionError()
  }
  try {
    if (config.type == 'mongodb') {
      // const client = new MongoClient(config.uri);
      // const c = await client.connect()
      const c = await MongoClient.connect(config.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      module.exports.connections[config.name] = c.db(config.database)
    }
    else if (config.type == 'redis') {
      const pool = genericPool.createPool({
        create() {
          return redis.createClient(config)
        },
        destroy(client) {
          client.disconnect()
        },
      }, {
        max: 1,
        min: 1,
        autostart: false,
        acquireTimeoutMillis: 3000,
      })
      await pool.use(async client => {
        await client.ping(`PING > PONG ${new Date}`)
      })
      module.exports.connection_by_name[config.name] = pool
    }
  } catch (e) {
    error('createConnection', e.stack)
  }
}
module.exports.getConnectionAny = async (name) => {
  if (!module.exports.connections[name]) {
    throw new Error(`connection ${name} not found.`)
  }
  return module.exports.connections[name]
}