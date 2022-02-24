const {debug, info, error} = require(__absolute + '/log')('select:api')
const only = require(__absolute + '/models/only')
const logger = require(__absolute + '/models/logger')
const { getConnection, Db } = require('typeorm')
const { getRedisConnection } = require(__absolute + '/models/redis')

const external_axios = require('axios').create({
  timeout: 5000,
  headers: {
    'User-Agent': 'SelectAdmin',
  },
})

const {google} = require('googleapis')
const moment = require('moment')
const { getExcelDateFromJs } = require('excel-date-to-js')

const router = require('express').Router()

router.use((req, res, next) => {
  req._json = true
  next()
})

router.post('/query', [only.id()], async (req, res, next) => {
  let team_id = 'hosted'
  let teamrow_id = null
  
  try {
    const path = req.query.path
    const response_type = req.query.response_type

    // cloud start
    // cloud end
    
    // hosted start
    const config = global.config.get('select-configuration')
    const block = _.get(config, path)
    // hosted end

    if (!block) throw StatusError(400, 'block not found')
    teamrow_id = _.get(config, path.match(/pages\.(\d)/)[0] + '.id')
    debug(block, path, teamrow_id)
    const fields = req.body.fields
    const params = JSON.parse(req.query.params || '{}') || {}
  
    params.page = Math.max(1, Math.min(100, params.page || 1))
    params.limit = Math.max(30, Math.min(100, params.limit || 30))
    params.sort = {'ASC': 'ASC', 'DESC': 'DESC'}[params.sort] || 'DESC'
    params.offset = params.page-1 * params.limit

    if (block.type != 'query') throw StatusError(400, 'block type is not query')
    const master_resource = await getConnection(block.resource)

    const keys_by_name = _.keyBy(config.keys, 'key')

    let rows;
    try {
      if (fields && fields.length) {
        let bind_sql = block.sql
        const bind_params = {}

        {
          let queryPlaceholder = ''
          if (bind_sql.includes('{{query}}')) queryPlaceholder = '{{query}}'
          if (bind_sql.includes('{{ query }}')) queryPlaceholder = '{{ query }}'
          if (bind_sql.includes('{{query }}')) queryPlaceholder = '{{query }}'
          if (bind_sql.includes('{{ query}}')) queryPlaceholder = '{{ query}}'
          if (queryPlaceholder) {
            let where = []
            for (const f of fields) {
              if (f.query && f.value) {
                const value_lower = String(f.value).toLowerCase()
                const value_upper = String(f.value).toUpperCase()
  
                if (f.query[value_lower]) {
                  where.push(`(${ f.query[value_lower] })`)
                } else if (f.query[value_upper]) {
                  where.push(`(${ f.query[value_upper] })`)
                } else if (f.query['']) {
                  where.push(`(${ f.query[''] })`)
                } else if (f.query['*']) {
                  where.push(`(${ f.query['*'] })`)
                }
              }
            }
            where.push('1=1')
            bind_sql = bind_sql.replace(queryPlaceholder, where.join(' AND '))
          }
        }
        {
          let queryPlaceholder = ''
          if (bind_sql.includes('{{orderBy}}')) queryPlaceholder = '{{orderBy}}'
          if (bind_sql.includes('{{ orderBy }}')) queryPlaceholder = '{{ orderBy }}'
          if (bind_sql.includes('{{orderBy }}')) queryPlaceholder = '{{orderBy }}'
          if (bind_sql.includes('{{ orderBy}}')) queryPlaceholder = '{{ orderBy}}'
          if (queryPlaceholder) {
            let orderBy = []
            for (const f of fields) {
              if (f.orderBy && f.value) {
                const value_lower = String(f.value).toLowerCase()
                const value_upper = String(f.value).toUpperCase()
  
                if (f.orderBy[value_lower]) {
                  orderBy.push(`${ f.orderBy[value_lower] }`)
                } else if (f.orderBy[value_upper]) {
                  orderBy.push(`${ f.orderBy[value_upper] }`)
                } else if (f.orderBy['']) {
                  orderBy.push(`${ f.orderBy[''] }`)
                } else if (f.orderBy['*']) {
                  orderBy.push(`${ f.orderBy['*'] }`)
                }
              }
            }
            bind_sql = bind_sql.replace(queryPlaceholder, orderBy.join(', '))
          }
        }
        
        for (const param of fields) {
          if (keys_by_name[param.key]) {
            param.value = keys_by_name[param.key].value
          }

          bind_params[param.key] = param.values || param.value || ''
        }
        const [ escaped_bind_sql, escaped_bind_params ] = master_resource.driver
          .escapeQueryWithParameters(bind_sql, bind_params, {})
        debug(escaped_bind_sql, escaped_bind_params)
        logger.emit('query run', {
          team_id, 
          teamrow_id,
          user_id: req.session.id,
          json: {
            sql: escaped_bind_sql,
          },
        })
        rows = await master_resource.query(escaped_bind_sql, escaped_bind_params)
      } else {
        logger.emit('query run', {
          team_id, 
          teamrow_id,
          user_id: req.session.id,
          json: {
            sql: block.sql,
          },
        })
        rows = await master_resource.query(block.sql)
      }
    } catch (error) {
      logger.emit('query error', {
        team_id,
        teamrow_id,
        user_id: req.session.id,
        json: error,
      })
      return res.status(200).json({
        message: 'query failed',
        rows,
        error: Object.assign({ code: '500', sqlMessage: `Server Error: ${error.message}` }, error, {
          driverError: undefined
        }),
      })  
    }

    let spreadsheetUrl;
    if (response_type == 'gsheet') {
      const redis = getRedisConnection()
      const id = req.session.uuid
      const key = `UserProfile:${id}:GoogleSheet`
      const _user = await redis.get(key)
      const user = _user ? JSON.parse(_user) : {}
      
      if (!user.google_sheet_access_token) {
        throw StatusError(400, '구글시트 인증 실패')
      }
      debug(block)
      const sheetname = `${block.name || '결과'}_${moment().format('YYYY.MM.DD_HH:mm:ss')}`

      const USER_DATE_FORMAT = 'yyyy-mm-dd hh:mm'
      const keys_row = {}
      const keys = Object.keys(rows[0])
      for (const key of keys) {
        keys_row[key] = key
      }
      const rowDataItems = [keys_row].concat(rows).map(e => {
        const values = keys.map(key => {
          if (e[key] === undefined || e[key] === null || String(e[key]).length == 0) {
            return {
              userEnteredValue: { stringValue: '' }
            }
          } else if (_.isNumber(e[key])) {
            return {
              userEnteredValue: { numberValue: e[key] }
            }
          } else if (_.isDate(e[key])) {
            if (e[key] == 'Invalid Date') {
              return {
                userEnteredValue: { stringValue: '' }
              }
            }
            return {
              userEnteredValue: { numberValue: getExcelDateFromJs(e[key]) },
              userEnteredFormat: {
                numberFormat: {
                  type: 'DATE_TIME',
                  pattern: USER_DATE_FORMAT,
                }
              }
            }
          } else if (_.isObject(e[key])) {
            return {
              userEnteredValue: { stringValue: JSON.stringify(e[key], null, '  ') }
            }
          } else {
            return {
              userEnteredValue: { stringValue: e[key] }
            }
          }
        })
        // debug(values)
        return {
          values,
        }
      })
      
      const sheets = google.sheets('v4')
      const r = await sheets.spreadsheets.create({
        // auth: 'string',
        access_token: user.google_sheet_access_token,
        resource: {
          properties: {
            title: sheetname,
          },
          sheets: [
            {
              properties: {
                title: 'Sheet1 from Select',
              },
              data: [
                {
                  rowData: rowDataItems,
                }
              ]
              // data: [
              //   {
              //     rowData: [
              //       {
              //         values: [
              //           {
              //             userEnteredValue: {
              //               stringValue: 'dsfdsf',
              //             },
              //           },
              //           {
              //             userEnteredValue: {
              //               stringValue: '3333',
              //             },
              //           },
              //         ]
              //       }
              //     ] 
              //   }
              // ],
            }
          ]
        }
      })
      const {data, statusText} = r
      spreadsheetUrl = data.spreadsheetUrl
    }

    logger.emit('session activity', {
      email: req.session.id,
      sql_type: block.sqlType,
      block_name: block.name,
      response_type,
    })
  
    res.status(200).json({
      message: 'ok',
      rows: spreadsheetUrl ? [] : rows,
      spreadsheetUrl,
    })
  } catch (e) {
    error(e.stack)
    next(e)
  }
})

router.post('/http', [only.id()], async (req, res, next) => {
  try {
    let team_id = 'hosted'
    const path = req.query.path
    const response_type = req.query.response_type
    
    // cloud start
    // cloud end

    // hosted start
    const config_root = global.config.get('select-configuration')
    const block = _.get(config_root, path)
    // hosted end

    const fields = req.body.fields || []
    const params = JSON.parse(req.query.params || '{}') || {}
  
    params.page = Math.max(1, Math.min(100, params.page || 1))
    params.limit = Math.max(30, Math.min(100, params.limit || 30))
    params.sort = {'ASC': 'ASC', 'DESC': 'DESC'}[params.sort] || 'DESC'
    params.offset = params.page-1 * params.limit

    const keys_by_name = _.keyBy(config_root.keys, 'key')
    
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
        if (param.valueFromEnv && keys_by_name[param.key]) {
          param.value = keys_by_name[param.key].value
        }
        if (param.format == 'number') {
          if (!isFinite(+param.value)) throw StatusError(`param[${param.key}] invalid number`)
          v = JSON.stringify(+param.value)
        } else {
          v = JSON.stringify(String(param.value)).slice(1, -1)
        }
        json = String(json).replace(new RegExp(`\{\{${param.key}\}\}`, 'g'), v)
        debug('>>>>>>', json)
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

    let spreadsheetUrl;
    if (response_type == 'gsheet') {
      const redis = getRedisConnection()
      const id = req.session.uuid
      const key = `UserProfile:${id}:GoogleSheet`
      const _user = await redis.get(key)
      const user = _user ? JSON.parse(_user) : {}
      
      if (!user.google_sheet_access_token) {
        throw StatusError(400, '구글시트 인증 실패')
      }
      debug(block)
      const sheetname = `${block.name || '결과'}_${moment().format('YYYY.MM.DD_HH:mm:ss')}`

      const USER_DATE_FORMAT = 'yyyy-mm-dd hh:mm'
      const keys_row = {}
      const keys = Object.keys(rows[0])
      for (const key of keys) {
        keys_row[key] = key
      }
      const rowDataItems = [keys_row].concat(rows).map(e => {
        const values = keys.map(key => {
          if (e[key] === undefined || e[key] === null) {
            return {
              userEnteredValue: { stringValue: '' }
            }
          } else if (_.isNumber(e[key])) {
            return {
              userEnteredValue: { numberValue: e[key] }
            }
          } else if (_.isDate(e[key])) {
            return {
              userEnteredValue: { numberValue: getExcelDateFromJs(e[key]) },
              userEnteredFormat: {
                numberFormat: {
                  type: 'DATE_TIME',
                  pattern: USER_DATE_FORMAT,
                }
              }
            }
          } else if (_.isObject(e[key])) {
            return {
              userEnteredValue: { stringValue: JSON.stringify(e[key], null, '  ') }
            }
          } else {
            return {
              userEnteredValue: { stringValue: e[key] }
            }
          }
        })
        // debug(values)
        return {
          values,
        }
      })
      
      const sheets = google.sheets('v4')
      const r = await sheets.spreadsheets.create({
        // auth: 'string',
        access_token: user.google_sheet_access_token,
        resource: {
          properties: {
            title: sheetname,
          },
          sheets: [
            {
              properties: {
                title: 'Sheet1 from Select',
              },
              data: [
                {
                  rowData: rowDataItems,
                }
              ]
              // data: [
              //   {
              //     rowData: [
              //       {
              //         values: [
              //           {
              //             userEnteredValue: {
              //               stringValue: 'dsfdsf',
              //             },
              //           },
              //           {
              //             userEnteredValue: {
              //               stringValue: '3333',
              //             },
              //           },
              //         ]
              //       }
              //     ] 
              //   }
              // ],
            }
          ]
        }
      })
      const {data, statusText} = r
      spreadsheetUrl = data.spreadsheetUrl
    }

    logger.emit('session activity', {
      email: req.session.id,
      sql_type: block.sqlType,
      http_method: (block.axios && block.axios.method),
      block_name: block.name,
      response_type,
    })
  
    res.status(200).json({
      message: 'ok',
      rows: spreadsheetUrl ? [] : rows,
      spreadsheetUrl,
    })
  } catch (e) {
    error(e.stack)
    next(e)
  }
})

module.exports = router