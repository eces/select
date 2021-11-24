const debug = require('debug')('select:api')
const only = require(__absolute + '/models/only')
const { getConnection } = require('typeorm')

const external_axios = require('axios').create({
  timeout: 5000,
  headers: {
    'User-Agent': 'SelectAdmin',
  },
})

const router = require('express').Router()

router.use((req, res, next) => {
  req._json = true
  next()
})

router.post('/query', [only.id()], async (req, res, next) => {
  try {
    const path = req.query.path
    
    const block = global.config.get('select-configuration.' + path)
    if (!block) throw StatusError(400, 'block not found')
    const fields = req.body.fields
    const params = JSON.parse(req.query.params || '{}') || {}
  
    params.page = Math.max(1, Math.min(100, params.page || 1))
    params.limit = Math.max(30, Math.min(100, params.limit || 30))
    params.sort = {'ASC': 'ASC', 'DESC': 'DESC'}[params.sort] || 'DESC'
    params.offset = params.page-1 * params.limit

    if (block.type != 'query') throw StatusError(400, 'block type is not query')
    const master = await getConnection(block.resource)


    let rows;
    try {
      if (fields && fields.length) {
        let bind_sql = block.sql
        const bind_params = []
        for (const f of fields) {
          if (f.raw === true) {
            bind_sql = bind_sql.replace(':'+f.key, f.value)
          } else if (f.column === true) {
            bind_sql = bind_sql.replace(':'+f.key, '??')
          } else {
            bind_sql = bind_sql.replace(':'+f.key, '?')
          }
          bind_params.push(f.value)
          // 순서 고려해서 넣어야함 $0 $1 @0 @1
        }
        rows = await master.query(bind_sql, bind_params)
      } else {
        rows = await master.query(block.sql)
      }
    } catch (error) {
      res.status(200).json({
        message: 'query failed',
        rows,
        error: Object.assign(error, {
          driverError: undefined
        }),
      })  
    }
  
    res.status(200).json({
      message: 'ok',
      rows,
    })
  } catch (error) {
    debug(error)
    next(error)
  }
})

router.post('/http', [only.id()], async (req, res, next) => {
  try {
    const path = req.query.path
    
    const block = global.config.get('select-configuration.' + path)
    if (!block) throw StatusError(400, 'block not found')
    const fields = req.body.fields || []
    const params = JSON.parse(req.query.params || '{}') || {}
  
    params.page = Math.max(1, Math.min(100, params.page || 1))
    params.limit = Math.max(30, Math.min(100, params.limit || 30))
    params.sort = {'ASC': 'ASC', 'DESC': 'DESC'}[params.sort] || 'DESC'
    params.offset = params.page-1 * params.limit
    
    if (block.type != 'http') throw StatusError(400, 'block type is not http')
    let rows;
    
    const config = _.cloneDeep(block.axios)
    for (const root in config) {
      if (!['data', 'url'].includes(root) || !config[root]) continue

      if (_.isObject(config[root])) {
        for (const key in config[root]) {
          for (const param of fields) {
            config[root][key] = config[root][key].replace(new RegExp(`\{\{${param.key}\}\}`, 'g'), param.value)
          }
        } 
      } 
      else if (_.isString(config[root])) {
        for (const param of fields) {
          config[root] = String(config[root]).replace(new RegExp(`\{\{${param.key}\}\}`, 'g'), param.value)
        }
      }
    }
    
    try {
      const r = await external_axios(config)
      if (!r.data) throw StatusError('no data')
      if (block.rowsPath) {
        rows = _.get(r.data, block.rowsPath)
      } else {
        rows = r.data
      }
    } catch (error) {
      res.status(200).json({
        message: 'http failed',
        rows,
        error: Object.assign(error, {
          driverError: undefined
        }),
      })  
    }
  
    res.status(200).json({
      message: 'ok',
      rows,
    })
  } catch (error) {
    debug(error)
    next(error)
  }
})

module.exports = router