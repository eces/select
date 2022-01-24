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
        const bind_params = {}
        for (const param of fields) {
          bind_params[param.key] = param.value
          if (param.raw === true) {
            bind_sql = bind_sql.replace(new RegExp(`\:${param.key}`, 'g'), param.value)
          }
        }
        const [ escaped_bind_sql, escaped_bind_params ] = master.driver
          .escapeQueryWithParameters(bind_sql, bind_params, {})
        rows = await master.query(escaped_bind_sql, escaped_bind_params)
      } else {
        rows = await master.query(block.sql)
      }
    } catch (error) {
      return res.status(200).json({
        message: 'query failed',
        rows,
        error: Object.assign({ code: '500', sqlMessage: `Server Error: ${error.message}` }, error, {
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

    let config
    if (_.isObject(block.axios)) {
      config = _.cloneDeep(block.axios)
      if (_.isString(config.data)) {
        try {
          config.data = JSON.parse(config.data)
        } catch (error) {
          throw StatusError(400, 'axios.data JSON invalid: ' + error.message)
        }
      }
      if (_.isString(config.headers)) {
        try {
          config.headers = JSON.parse(config.headers)
        } catch (error) {
          throw StatusError(400, 'axios.headers JSON invalid: ' + error.message)
        }
      }
      if (_.isString(config.params)) {
        try {
          config.params = JSON.parse(config.params)
        } catch (error) {
          throw StatusError(400, 'axios.params JSON invalid: ' + error.message)
        }
      }
      let json = JSON.stringify(config)
      for (const param of fields) {
        let v;
        if (param.format == 'number') {
          if (!isFinite(+param.value)) throw StatusError(`param[${param.key}] invalid number`)
          v = JSON.stringify(+param.value)
        } else {
          v = JSON.stringify(param.value).slice(1, -1)
        }
        json = String(json).replace(new RegExp(`\{\{${param.key}\}\}`, 'g'), v)
        config = JSON.parse(json)
      }
    } else if (_.isString(block.axios)) {
      // TODO: support full json request
      throw StatusError(400, 'block.axios format invalid: Object')
    } else {
      throw StatusError(400, 'block.axios format invalid: Object')
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