const {createConnection, getConnection, Connection} = require('typeorm')
const {debug, info, error} = require('../log')('select:db')
// const { getRedisConnection } = require('./redis')
const logger = require('./logger')
const {createConnectionAny, getConnectionAny} = require('./dbAny')
const State = require('./State')

const internal_resources = {}
module.exports.get_internal_resource = async (name) => {
  if (!internal_resources[name]) {
    throw new Error('internal resource not found')
  }
  const conn = await getConnection(internal_resources[name])
  return conn
}

module.exports.init_team_resource_all = async () => {
  // get yaml
  // load resources db/dbAny
  try {
    const ids = [process.env.TEAM_ID]

    for (const team_id of ids) {
      try {
        debug(`try reconnect to tid:${team_id}`)
        await module.exports.init_team_resource(team_id)
      } catch (error) {
        logger.emit('init connections error', {
          json: {
            error: e.stack,
            worker: 'init_team_resource_all',
          },
        })
      }
      // continue to next
    }
      
  } catch (e) {
    error(e.stack)
    logger.emit('init connections error', {
      json: {
        error: e.stack,
        worker: 'init_team_resource_all',
      },
    })
  }
}
module.exports.init_team_resource = async (team_id) => {
  try {
    // const master = await getConnection('mysql.master')
    // const redis = getRedisConnection()

    // filter region
    // const team = await master.createQueryBuilder()
    //   .select('id, env_config')
    //   .from('Team')
    //   .where('id = :id', {
    //     id: team_id
    //   })
    //   .getRawOne()

    // if (!team) return
    
    // const region = (team.env_config && team.env_config.regions) || {}

    const _config = await State.get(`admin.${team_id}.yaml`) || {}
    const config = JSON.parse(_config)
    const rows = config.resources || []
    
    for (const idx in rows) {
      const row = {
        id: idx,
        name: rows[idx].name,
        json: rows[idx],
      }
      if (!['mysql', 'mssql', 'postgres', 'mongodb', 'redis', 'oracle'].includes(row.json && row.json.type)) continue

      // filter region
      // const current_region = region[row.json.mode || 'production'] || 'seoul'
      // if (current_region != global.config.get('region.current')) {
      //   continue
      // }
      if ((row.json.zone || 'seoul') != (process.env.REGION_CURRENT || 'seoul')) {
        continue
      }

      // const active = await State.set(`team.${team_id}.resource.${row.id}.active`, 'Y', 'EX', 3, 'NX')
      const active = 'OK'
      if (active == 'OK') {
        // if (row.json.password) {
        //   row.json.password = row.json.vault ? Vault.decode(row.json.password) : Buffer.from(row.json.password || '', 'base64').toString('utf-8')
        // }
        const config = Object.assign({}, row.json, {
          name: `${team_id}-${row.id}`,
          logging: process.env.NODE_ENV == 'development' ? true : false,
        })
        if (row.json.type == 'postgres') {
          if (String(row.json.ssl) === 'false') {
            config.ssl = false
          } else {
            config.ssl = {
              rejectUnauthorized: false,
            }
          }
        }
        if (row.json.type == 'mssql') {
          config.options = config.options || {}
          config.options.useUTC = true
        }
        if (row.json.type == 'mysql') {
          config.multipleStatements = true
        }
        if (row.json.type == 'mongodb') {
          // if (config.uri) {
          //   config.uri = row.json.vault ? Vault.decode(config.uri) : Buffer.from(config.uri || '', 'base64').toString('utf-8')
          // }
        }

        try {
          if (config.type == 'mongodb') {
            await createConnectionAny(config)
          } else if (config.type == 'redis') {
            await createConnectionAny(config)
          } else {
            await createConnection(config)
          }
          
          let team_resource_connection
          if (config.type == 'mongodb') {
            team_resource_connection = await getConnectionAny(`${team_id}-${row.id}`)
          } else if (config.type == 'mongodb') {
            team_resource_connection = await getConnectionAny(`${team_id}-${row.id}`)
          } else {
            team_resource_connection = await getConnection(`${team_id}-${row.id}`)
          }
          
          // patch _auth req.resource
          internal_resources[row.json.name] = `${team_id}-${row.id}`

          let timezone = undefined
          let version = undefined
          if (row.json.type == 'mysql') {
            const tz = await team_resource_connection.query(`SELECT @@session.time_zone AS 't' `)
            timezone = tz[0].t
            if (timezone == 'SYSTEM') timezone = 'UTC'
            await State.set(`team.${team_id}.resource.${row.id}.timezone`, timezone)
            // debug('>>>>>>', `team.${team_id}.resource.${row.id}.timezone`, timezone)
            
            const _version = await team_resource_connection.query(`SELECT VERSION() AS v`)
            version = _version[0].v
            if (version.toUpperCase().includes('MARIADB')) {
              await team_resource_connection.query(`SET SESSION max_statement_time = 15000`)
            } else {
              await team_resource_connection.query(`SET SESSION max_execution_time = 15000`)
            }
          } else if (row.json.type == 'postgres') {
            const tz = await team_resource_connection.query(`SHOW timezone `)
            timezone = tz[0].TimeZone
            await State.set(`team.${team_id}.resource.${row.id}.timezone`, timezone)
            // debug('>>>>>>', `team.${team_id}.resource.${row.id}.timezone`, timezone)

            const _version = await team_resource_connection.query(`SELECT VERSION() AS v`)
            version = _version[0].v
            await team_resource_connection.query(`SET statement_timeout TO 15000`)
          } else if (row.json.type == 'mssql') {
            const tz = await team_resource_connection.query(`SELECT CURRENT_TIMEZONE() AS t`)
            timezone = tz[0].t
            if (timezone.length > 10) {
              const tz2 = timezone.match(/\(([A-Z]{3})\)/)
              if (tz2) {
                timezone = tz2[1] || timezone
              }
            }
            await State.set(`team.${team_id}.resource.${row.id}.timezone`, timezone)

            const _version = await team_resource_connection.query(`SELECT @@VERSION AS v`)
            version = _version[0].v
          } else if (row.json.type == 'mongodb') {
            // version?
            const info = await team_resource_connection.admin().serverInfo()
            version = info.version
            // timezone?
          }

          logger.emit('connection new', {
            team_id, 
            teamrow_id: row.id,
            json: {
              name: row.name,
              timezone,
              version,
            },
          })
        } catch (error) {
          if (error.name == 'AlreadyHasActiveConnectionError') {
            // ok
            logger.emit('connection pool', {
              team_id, 
              teamrow_id: row.id,
              json: {
                name: row.name,
              },
            })
          } else {
            logger.emit('connection failed', {
              team_id, 
              teamrow_id: row.id,
              json: {
                name: row.name,
                error: error.message,
              },
            })
            debug(error.stack)
            // continue
          }
        }
        info(`connected new: team.${team_id}.resource.${row.id}`)
      }
    }
  } catch (e) {
    error(e.stack)
    logger.emit('connection server error', {
      team_id, 
      json: {
        error: e.stack,
      },
    })
  }
}

module.exports.init = async () => {
  
  // if (process.env.NODE_ENV == 'development') {
  //   await createConnection('selectbase.master')
  // }
  // const select_config = global.config.get('select-configuration')
  // if (!select_config.resources) throw new Error('server error: no resources configured.')

  // for (const r of select_config.resources) {
  //   if (r.type == 'mysql') {
  //     await createConnection({
  //       name: r.key,
  //       type: 'mysql',
  //       host: r.host,
  //       port: r.port || 3306,
  //       username: r.username,
  //       password: Buffer.from(r.password, 'base64').toString('utf-8'),
  //       database: r.database,
  //       synchronize: false,
  //       logging: process.env.NODE_ENV == 'development' ? true : false,
  //       requestTimeout: 60*1000,
  //       timezone: r.timezone || '+00:00',
  //       dateStrings: true,
  //       extra: {
  //         charset: r.charset || "utf8mb4_general_ci",
  //       },
  //     })
  //     // debug('created ', r)
  //   } else {
  //     throw new Error('server error: not supported resource[type].')
  //   }
  // }
}

module.exports.init_service = async () => {
  
}