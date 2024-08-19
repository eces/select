const {debug, info, error} = require('../log')('select:api')
const only = require('../models/only')
const logger = require('../models/logger')
const monitor = require('../models/monitor')
const State = require('../models/State')
const { getConnection, Db } = require('typeorm')
const { getConnectionAny } = require('../models/dbAny')
const alasql = require('alasql')
const { getGotInstance } = require('../models/httpGot')
 
const external_axios = require('axios').create({
  timeout: 5000,
  headers: {
    'User-Agent': 'SelectAdmin',
  },
})

const multer = require('multer')
const FormData = require('form-data')

const upload = multer({
  limits: {
    fieldSize: 20 * 1024 * 1024,
    fileSize: 20 * 1024 * 1024,
  }
})

const {google} = require('googleapis')
const moment = require('moment')
const { getExcelDateFromJs } = require('excel-date-to-js')

// const ivm = require('isolated-vm');

const router = require('express').Router()

router.use((req, res, next) => {
  req._json = true
  next()
})

const get_message = (block, fields) => {
  if (block.log === true) {
    return block.name || block.sqlType || ''
  }
  let m = block.log
  if (m.includes('{{')) {
    for (const param of fields) {
      m = String(m).replace(new RegExp(`\{\{(\ )?${param.key}(\ )?\}\}`, 'g'), param.value)
    }
  }
  return m
}

const publish = (next) => {
  const io = {
    to(channel) {
      return {
        emit(name, opt) {
          debug(`[socket.io]`, name)
          console.dir(opt, {depth: null})
        }
      }
    }
  }
  next(io)
}

const _simple_block = (block) => {
  return Object.assign({}, block, {
    viewModal: undefined,
    modals: undefined,
    columns: undefined,
    columnOptions: undefined,
    paginationOptions: undefined,
    tableOptions: undefined,
    sqlTransaction: undefined,
  })
}

const _fetch_query = async (team_id, teamrow_id, user_id, path, resource, bind_sql, bind_params) => {
  try {
    if (resource.type == 'redis') {
      master_resource = await getConnectionAny(`${team_id}-${resource.id}`)
    } else {
      master_resource = await getConnection(`${team_id}-${resource.id}`)
    }

    if (!master_resource) throw StatusError(400, 'resource not found')
    // bind params

    // query
    let rows = []
    let query_start_ts = Date.now()
    if (resource.type == 'redis') {
      // 
    } else {
      if (Object.keys(bind_params).length) {
        const [ escaped_bind_sql, escaped_bind_params ] = master_resource.driver
          .escapeQueryWithParameters(bind_sql, bind_params, {})
        
        monitor.emit('query', {
          team_id,
          resource_uuid: resource.uuid,
          query: escaped_bind_sql.trim(),
          path,
        })

        if (resource.policy) {
          const status = await monitor.get_confirm_status({
            team_id,
            resource_uuid: resource.uuid,
            query: escaped_bind_sql.trim(),
          })
          if (resource.policy == 'strict') {
            if (status != 'Y') {
              throw new Error('query rejected')
            }
          }
          else if (resource.policy == 'flexible') {
            if (status == 'N') {
              throw new Error('query rejected')
            }
          }
        }
        rows = await master_resource.query(escaped_bind_sql, escaped_bind_params)

        monitor.emit('query profile', {
          team_id,
          query: escaped_bind_sql.trim(),
          ms: Date.now() - query_start_ts,
        })
      } else {
        monitor.emit('query', {
          team_id,
          resource_uuid: resource.uuid,
          query: bind_sql.trim(),
          path,
        })

        if (resource.policy) {
          const status = await monitor.get_confirm_status({
            team_id,
            resource_uuid: resource.uuid,
            query: bind_sql.trim(),
          })
          if (resource.policy == 'strict') {
            if (status != 'Y') {
              throw new Error('query rejected')
            }
          }
          else if (resource.policy == 'flexible') {
            if (status == 'N') {
              throw new Error('query rejected')
            }
          }
        }
        rows = await master_resource.query(bind_sql)

        monitor.emit('query profile', {
          team_id,
          query: bind_sql.trim(),
          ms: Date.now() - query_start_ts,
        })
      }
    }
    return rows
  } catch (error) {
    logger.emit('query error', {
      team_id, 
      teamrow_id,
      user_id,
      json: {
        sql: bind_sql,
        path,
        resource,
        error: {
          message: error.message,
          name: error.name,
          // stack: error.stack,
        },
      },
    })
    throw error
  }
}

const _bind_sql_params = (sql, fields, keys_by_name) => {
  let bind_sql = ''+sql
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
          let value = f.value
          if (_.isArray(value)) value = value.join('')
          const value_lower = String(value).toLowerCase().trim()
          const value_upper = String(value).toUpperCase().trim()
          
          if (f.query[value_lower]) {
            where.push(`(${ f.query[value_lower] })`)
          } else if (f.query[value_upper]) {
            where.push(`(${ f.query[value_upper] })`)
          } else if (f.query[''] && value_lower.length == 0) {
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
    // debug(param, keys_by_name[param.key])
    if (keys_by_name[param.key]) {
      param.value = keys_by_name[param.key].value
    }

    bind_params[param.key] = param.values || (param.value === undefined ? '' : param.value)

    if (param.raw) {
      const raw = param.raw[bind_params[param.key]]
      if (raw === undefined) throw StatusError(400, '해당 값과 일치하는 raw를 찾을 수 없습니다. (param value != raw key)')
      bind_params[param.key] = () => { return raw }
    }
    // if (param.raw === true) {
    //   bind_sql = bind_sql.replace(new RegExp(`\:${param.key}`, 'g'), param.value)
    // }
  }

  return [bind_sql, bind_params]
}

_bind_sql_statements = (sql = '') => {
  if (sql.includes(';')) {
    const statements = sql.split(';')
    return statements.filter(e => {
      const line = e.trim()
      if (line.length === 0) return false
      if (line.startsWith('--') || line.startsWith('/*') || line.startsWith('#')) {
        return false
      }
      return true
    })
  } else {
    return [sql]
  }
}

_bind_autolimit = (sql, resource_type) => {
  // debug('_bind_autolimit', sql, resource_type)
  let _sql = sql
  if (sql) {
    const __sql = sql.toUpperCase()
    const last = __sql.slice(-100)
    if (resource_type == 'mysql' || resource_type == 'postgres') {
      // mysql, pgsql <> mssql
      if (__sql.includes('SELECT') && !last.includes('LIMIT')) {
        if (!__sql.startsWith('INSERT') && !__sql.startsWith('UPDATE')) {
          if (!last.trim().includes(';')) {
            _sql += ` LIMIT 1000`
            // has_autolimit = true
          }
        }
      }
    } else if (resource_type == 'mssql') {
      if (__sql.includes('SELECT') && !__sql.includes('SELECT TOP')) {
        if (!__sql.startsWith('INSERT') && !__sql.startsWith('UPDATE')) {
          _sql = _sql.replace(/(select|SELECT)/, 'SELECT TOP 1000')
        }
      }
    }
  }
  return _sql
}

const _fetch_mongodb = async (master_resource, query, sqlType, queryFn, fields, log) => {
  if (queryFn) {
    let rows = []

    try {
      if (!query.collection) throw new Error('query.collection 비어있음')

      // const isolate = new ivm.Isolate({ 
      //   memoryLimit: 64,
      //   inspector: false,
      //   onCatastrophicError: (e) => {
      //     error('[isolated-vm] >>>>>>>>>>>>>>>', e.stack)
      //   }
      //   });
      // const context = await isolate.createContext()
      // const jail = context.global;
      // for (const e of fields) {
      //   jail.setSync(e.key, e.value || e.values || null)
      // }
      // jail.setSync(`log`, log)
      // const prepared = await context.evalClosure(`${queryFn}`, [], {
      //   timeout: 300,
      //   arguments: {
      //     copy: true
      //   },
      //   result: {
      //     copy: true
      //   }
      // })
      // // debug(prepared)
      // // rows = await prepared(master_resource.collection(query.collection))
      // // return rows
      // // // rows = await prepared(master_resource.collection(query.collection)).toArray()
      // // // const rows = await context.eval('[3]')
      // // // debug({rows})
      // // // return rows

      // // query = JSON.parse(JSON.stringify(query).replace('{{')
      // let query_string = JSON.stringify(query || {})
      // for (const key in prepared) {
      //   query_string = query_string.replace(new RegExp(`\"\{\{(\ )?${key}(\ )?\}\}\"`, 'g'), JSON.stringify(prepared[key]))
      // }
      // // debug({query_string})
      // query = JSON.parse(query_string)

      const { Binary, Code, Map, DBRef, Double, Int32, Long, MinKey, MaxKey, ObjectID, ObjectId, Symbol, Timestamp, BSONRegExp, Decimal128 } = require("mongodb");

      const {VM} = require('vm2');

      const vm = new VM({
          timeout: 1000,
          allowAsync: false,
          sandbox: Object.assign({
            [`${query.collection}`]: master_resource.collection(query.collection),
            log,
            Binary, Code, Map, DBRef, Double, Int32, Long, MinKey, MaxKey, ObjectID, ObjectId, Symbol, Timestamp, BSONRegExp, Decimal128
          }, ...fields.map(e => {
            return {
              [`${e.key}`]: e.value || e.values
            }
          }))
      });

      const rows = await vm.run(`${queryFn}`);
      if (_.isObject(rows) && rows.rows !== undefined && rows.total !== undefined) {
        // rows[0] instanceof Promise && rows[1] instanceof Promise
        // return [await rows[0], await rows[1]]
        let total = await rows.total
        if (!isFinite(total)) {
          if (_.isArray(total)) {
            total = Object.values(total[0])[0]
          }
        }
        return {
          type: 'total',
          rows: await rows.rows,
          total,
        }
      }
      return rows
    } catch (err) {
      throw new Error('[queryFn] ' + err.message)
    }
  }
  const traverse = (obj) => {
    for (const key in obj) {
      if (key == "$oid") {
        obj = ObjectId(obj[key])
        continue
      }
      if (obj[key] !== null && typeof(obj[key]) == 'object' && Object.entries(obj[key]).length) {
        obj[key] = traverse(obj[key])
      }
    }
    return obj
  }
  query = traverse(query)
  // debug('>>>>', query)
  let rows
  const command = Object.keys(query).filter( key => key != 'collection')[0]
  if (!command) throw StatusError(400, 'mongodb command not found')
  // if (['updateOne', 'updateMany'].includes(command)) {
  if (['insertOne'].includes(command)) {
    // rows = await master_resource.collection(block.query.collection)[command](opt_json.filter, opt_json.update, opt_json.options)
    // if (!['insert'].includes(sqlType)) {
    //   throw new StatusError(400, 'updateOne: 편집에 해당하는 sqlType(insert)이 필요합니다.')
    // }
    rows = await master_resource
      .collection(query.collection)
      .insertOne(..._.flatten([query.insertOne]))
  } else if (['insertMany'].includes(command)) {
    rows = await master_resource
      .collection(query.collection)
      .insertMany(..._.flatten([query.insertMany]))
  } else if (['updateOne'].includes(command)) {
    // rows = await master_resource.collection(block.query.collection)[command](opt_json.filter, opt_json.update, opt_json.options)
    // if (!['update'].includes(sqlType)) {
    //   throw new StatusError(400, 'updateOne: 편집에 해당하는 sqlType(update)이 필요합니다.')
    // }
    rows = await master_resource
      .collection(query.collection)
      .updateOne(..._.flatten([query.updateOne]))
  } else if (['updateMany'].includes(command)) {
    // rows = await master_resource.collection(block.query.collection)[command](opt_json.filter, opt_json.update, opt_json.options)
    // if (!['update'].includes(sqlType)) {
    //   throw new StatusError(400, 'updateMany: 편집에 해당하는 sqlType(update)이 필요합니다.')
    // }
    rows = await master_resource
      .collection(query.collection)
      .updateMany(..._.flatten([query.updateMany]))
  } else if (['deleteOne'].includes(command)) {
    // rows = await master_resource.collection(block.query.collection)[command](opt_json.filter, opt_json.update, opt_json.options)
    // if (!['update'].includes(sqlType)) {
    //   throw new StatusError(400, 'deleteOne: 편집에 해당하는 sqlType(update)이 필요합니다.')
    // }
    rows = await master_resource
      .collection(query.collection)
      .deleteOne(..._.flatten([query.deleteOne]))
  } else if (['deleteMany'].includes(command)) {
    // rows = await master_resource.collection(block.query.collection)[command](opt_json.filter, opt_json.update, opt_json.options)
    // if (!['update'].includes(sqlType)) {
    //   throw new StatusError(400, 'deleteMany: 편집에 해당하는 sqlType(update)이 필요합니다.')
    // }
    rows = await master_resource
      .collection(query.collection)
      .deleteMany(..._.flatten([query.deleteMany]))
  } else if (['aggregate'].includes(command)){
    rows = await master_resource
      .collection(query.collection)
      .aggregate(..._.flatten(query.aggregate))
      .toArray()
  } else if (['find', 'count'].includes(command)){
    // select
    if (query.count){
      rows = await master_resource
        .collection(query.collection)
        .find(query.find)
        .count()
      rows = [
        {
          value: rows,
        }
      ]
    } else {
      _rows = master_resource
        .collection(query.collection)
        .find(..._.flatten([query.find]))
      if (query.sort) {
        _rows.sort(query.sort)
      }
      if (query.limit) {
        _rows.limit(query.limit)
      }
      if (query.skip) {
        _rows.skip(query.skip)
      }
      rows = await _rows.toArray()
    }
  } else if (['findOne'].includes(command)){
    // select
    _rows = master_resource
      .collection(query.collection)
      .findOne(query.findOne)
    if (query.sort) {
      _rows.sort(query.sort)
    }
    if (query.limit) {
      _rows.limit(query.limit)
    }
    if (query.skip) {
      _rows.skip(query.skip)
    }
    rows = await _rows
    rows = [rows]
  } else if (['findOneAndUpdate'].includes(command)){
    _rows = master_resource
      .collection(query.collection)
      .findOneAndUpdate(..._.flatten([query.findOneAndUpdate]))
    rows = await _rows
    rows = [rows]
  } else if (['findOneAndReplace'].includes(command)){
    _rows = master_resource
      .collection(query.collection)
      .findOneAndReplace(..._.flatten([query.findOneAndReplace]))
    rows = await _rows
    rows = [rows]
  } else if (['findOneAndDelete'].includes(command)){
    _rows = master_resource
      .collection(query.collection)
      .findOneAndDelete(..._.flatten([query.findOneAndDelete]))
    rows = await _rows
    rows = [rows]
  } else if (['distinct'].includes(command)){
    // select
    _rows = master_resource
      .collection(query.collection)
      .distinct(..._.flatten([query.distinct]))
      
    rows = await _rows
    rows = rows.map(e => {
      return {value: e}
    })
  } else {
    throw StatusError(400, `mongodb command not allowed: ${command} (요청필요)`)
    // if (sqlType == 'insert') {
    //   rows = await master_resource.collection(query.collection)[command](query[command])
    // } else {
    //   rows = await master_resource.collection(query.collection)[command](query[command]).toArray()
    // }
  }
  return rows
}

const _save_alasql = async (team_id, resource) => {
  await State.set(`alasql:${team_id}:${resource.databaseid}:tables`, JSON.stringify(resource.tables))

  // alasql.databases[namespace].tables[key].data = block.json[key]
}
const _load_alasql = async (team_id, resource) => {
  const _tables = await State.get(`alasql:${team_id}:${resource.databaseid}:tables`)
  if (_tables) {
    const tables = JSON.parse(_tables)
    
    const namespace = resource.databaseid
    alasql.databases[namespace].tables = tables
  }
}

router.post('/query', [only.hash(), only.id(), only.menu(), only.expiration()], async (req, res, next) => {
  let team_id = req.menu.team_id
  let teamrow_id = null
  let block = null
  try {
    const path = req.query.path
    const response_type = req.query.response_type
    const confirmed = req.query.confirmed == 'confirmed'

    // cloud start
    const _config = await State.get(`admin.${team_id}.yaml`)
    if (!_config) throw StatusError(500, 'admin config not ready')
    let config = JSON.parse(_config)

    // debug(config.keys)
    // const mode = req.get('User-Mode') || 'production'

    // todo: block mode::development
    // req.user_role.service_json
    
    const keys = config.keys
    // .filter(e => {
    //   return (e.mode || ['production']).includes(mode)
    // })

    const keys_by_name = _.keyBy(keys, 'key')
    // debug(keys_by_name)
    
    if (req.team_share) {
      const block_json = req.team_share.block_json
      const linked_pages = block_json.menus.map(e => e.linked_page)
      block_json.pages = (config.pages || []).filter(e => {
        return linked_pages.includes(e.path)
      })
      config = block_json
    }
    block = _.get(config, path)
    // cloud end

    if (!block) throw StatusError(400, 'block not found')
    if (path.startsWith('menus.')) {
      teamrow_id = null
    } else {
      teamrow_id = _.get(config, path.match(/pages\.(\d)/)[0] + '.id')
    }
    // debug(block, path, teamrow_id)
    let fields = _.compact(req.body.fields || [])
    const params = JSON.parse(req.query.params || '{}') || {}
  
    params.page = Math.max(1, Math.min(100, params.page || 1))
    params.limit = Math.max(30, Math.min(100, params.limit || 30))
    params.sort = {'ASC': 'ASC', 'DESC': 'DESC'}[params.sort] || 'DESC'
    params.offset = params.page-1 * params.limit

    if (block.type != 'query') throw StatusError(400, 'block type is not query')
    // const master = await getConnection(block.resource)

    {
      fields = fields.map(f => {
        const param = (block && block.params && block.params || []).find(e => e.key == f.key) || {}
        
        if (f.query || param.query) {
          f.query = param.query
        }
        if (f.orderBy || param.orderBy) {
          f.orderBy = param.orderBy
        }
        if (f.valueFromUserProperty || param.valueFromUserProperty) {
          f.valueFromUserProperty = param.valueFromUserProperty
        }
        
        if (param.valueFromEnv) {
          f.valueFromEnv = param.valueFromEnv
        }
        f.raw = param.raw
        return f
      })
    }
    // patch: updateOptions
    for (const param of (block && block.params && block.params || [])) {
      const found = fields.find(e => e.key == param.key)
      if (!found) {
        if (param.query || param.orderBy || param.valueFromUserProperty || param.valueFromEnv || param.range || param.updateOptions) {
          fields.push(param)
        }
      }
    }


    // 지금 기준 role 가져오고 (yml > db), 지금 기준 menu Role이랑 비교하고 차단
    // menus.roles / blocks.roles / actions.roles
    let session_roles = []
    // let session_select_roles = ''
    let required_roles = []
    let current_menu = null
    {
      // debug('req.user_role', req.user_role)
      const p = path.split('.')
      // let menu_path
      if (!path.startsWith('menus.')) {
        if (p[0] != 'pages') throw StatusError(400, 'path: pages not found')
      }
      const menu_path = _.get(config, `${p[0]}.${p[1]}.path`)

      const menus = config.menus.map(e => {
        return [].concat((e.menus || []), (e.menus || []).map(e => {
          return [].concat((e.menus || []), (e.menus || []).map(e => {
            return e.menus || []
          }))
        }))
      })
      const m = _.flatten(_.flatten([...config.menus, ...menus])).find(e => e.path == menu_path)

      if (m) {
        current_menu = {
          path: m.path,
        }
      }

      if (m && m.roles) {
        // menu 있거나, menu.roles 있는 경우에만 진행
        if (_.isArray(req.user_role.group_json) && req.user_role.group_json.length > 0) {
          session_roles = req.user_role.group_json
        } else {
          const u = config.users.find(e => e.email == req.session.email)
          if (u) {
            session_roles = u.roles
          }
        }
        session_roles.push(`email::${req.session.email}`)

        {
          // check view
          required_roles = _.flatten([m.roles.view])
          // debug({session_roles, required_roles})
          if (_.intersection(session_roles, required_roles).length === 0) {
            throw StatusError(403, '권한이 없습니다.')
          }
        }
      }
      if (req.user_role) {
        session_roles.push(`select::${req.user_role.name}`)
      }
    }

    const has_user_property = (block.params || []).filter(e => e.valueFromUserProperty).length > 0
    if (has_user_property) {
      req.user_role.property_json = req.user_role.property_json || []
      for (const param of block.params) {
        if (param.valueFromUserProperty === undefined) continue
        const valueFromUserProperty = String(param.valueFromUserProperty || '').trim()
        let found = req.user_role.property_json.find(e => e.key == valueFromUserProperty)
        if (valueFromUserProperty == '{{email}}') {
          found = {
            value: req.session.email
          }
        }
        else if (valueFromUserProperty == '{{name}}') {
          let name = req.user_role.profile_name
          if (!name) {
            const me = req.session.name
            name = me.name
          }
          found = {
            value: name,
          }
        }
        if (!found || !found.value) {
          // re-find
          if (config.users) {
            const found_users = config.users.filter(e => e.email == req.session.email)
            for (const user of found_users) {
              if (user && user.property && user.property[valueFromUserProperty]) {
                found = {
                  value: user.property[valueFromUserProperty],
                }
              }
            }
          }
        }
        if (found && found.value !== undefined) {
          fields = fields.map(e => {
            if (e.key == param.key) {
              e.value = found.value
            }
            return e
          })
        } else {
          if (param.required) throw StatusError(400, 'dialog:계정 설정을 확인해주세요. (UserProperty 필수값 오류)')
        }
      }
    }

    // filter region
    {
      let resource = block.resource
      if (block.sqlWith) {
        resource = block.sqlWith?.[0]?.resource
      }
      else if (block.sqlTransaction) {
        resource = block.sqlTransaction?.[0]?.resource
      }
      const resource_policy = (config.resources || []).find(e => {
        return String(e.name || '').trim() == String(resource || '').trim()
      })
      const zone = (resource_policy?.zone || 'seoul')
      if (zone != (process.env.REGION_CURRENT || 'seoul')) {
        throw StatusError(403, '접근 불가능한 네트워크 - 리소스 가용영역 오류 (rejected)')
      }
    }

    let resource = null
    let master_resource
    let sqlWith = {}

    if (block.resource == 'json') {
      resource = {
        json_type: 'json',
      }
    } 
    else if (block.resource == 'json+sql') {
      resource = {
        json_type: 'json+sql',
      }
      const namespace = `${team_id}_temp`
      master_resource = new alasql.Database(namespace)
      await _load_alasql(team_id, master_resource)

      if (block.sqlType == 'select') {
        // const table = 'temp'+Date.now()
        if (block.json) {
          if (Object.keys(block.json).length == 0) {
            throw StatusError(400, 'json의 키값으로 테이블 생성 실패')
          }
          for (const key in block.json) {
            if (!alasql.databases[namespace].tables[key]) {
              master_resource.exec(`CREATE TABLE ${key}`)
              alasql.databases[namespace].tables[key].data = block.json[key]
            }
          }
          await _save_alasql(team_id, master_resource)
        }
      }
    } 
    else if (block.resource == 'sqlWith') {
      resource = {
        json_type: 'sqlWith',
      }
      // init alasql
      master_resource = new alasql.Database(`${team_id}`)
      // debug('>>>>>>>>>> cached?', alasql.databases[`${team_id}`].tables)
      // fetch by [resource, query, name]
        // bind params :id
      for (const sql of block.sqlWith) {
        // debug(sql)
        if (sql.resource == 'gsheet') {
          const table = sql.name
          
          const url = `https://docs.google.com/spreadsheets/d/${sql.id}/export?format=csv&gid=${sql.gid || 0}`
          const q = await alasql.promise(`SELECT * FROM CSV(?,{headers:true})`, [url])
          // debug('>>>>>>>q sheet', q)
          if (q && q[0] && String(Object.keys(q[0])[0]).startsWith('<!DOCTYPE html>')) {
            throw new Error('no data in google sheets.')
          }

          master_resource.exec(`CREATE TABLE ${table}`)
          alasql.databases[`${team_id}`].tables[table].data = q
          
          logger.emit('query source', {
            team_id, 
            teamrow_id,
            user_id: req.session.id,
            json: {
              url,
              path: `${path}.sqlWith`,
              count_rows: q.length,
              count_cols: q && q[0] && Object.keys(q[0]).length,
              resource: {
                type: 'ghseet',
              },
            },
          })
        } else {
          let sqlWith_resource = config.resources.find(e => e.name == String(sql.resource).trim())
          // debug({sqlWith_resource})
          if (!sqlWith_resource) throw StatusError(400, 'sqlWith_resource not found')
          
          let fields_scope = [].concat(fields)
          if (sql.params && _.isArray(sql.params)) {
            for (const param of sql.params) {
              if (param.valueFromQuery) {
                const {resource, sql, defaultValue} = param.valueFromQuery
                let rows = []
                if (resource == 'sqlWith') {
                  rows = master_resource.exec(sql)
                } else {
                  throw StatusError(500, 'valueFromQuery resource type not supported')
                }
                
                // dedup, overwrite
                fields_scope = fields_scope.filter(e => e.key != param.key)
                fields_scope.push({
                  key: param.key,
                  value: [defaultValue !== undefined ? defaultValue : 0].concat(rows.map(e => e.id)),
                })
              }
            }
          }
          const query_or_sql = sql.query || sql.sql
          const [bind_sql, bind_params] = _bind_sql_params(query_or_sql, fields_scope, keys_by_name)
          // debug('>>>>>>sub run', {bind_sql, bind_params})

          let q = []

          if (sqlWith_resource.json_type == 'mongodb') {
            const sqlWith_master_resource = await getConnectionAny(`${team_id}-${sqlWith_resource.id}`)
            q = await _fetch_mongodb(sqlWith_master_resource, query_or_sql, sql.sqlType, sql.queryFn)
            if (_.isObject(q) && q.type == 'total') {
              // total = q.total
              q = q.rows
            }
            // debug('sqlWith result:mongo> ', q)
          } else {
            q = await _fetch_query(team_id, teamrow_id, req.session.id, `${path}.sqlWith`, {
              name: sql.resource,
              id: sqlWith_resource.id,
              type: sqlWith_resource.json_type, 
              uuid: sqlWith_resource.uuid,
              policy: sqlWith_resource.policy,
            }, bind_sql, bind_params)
            // debug('sqlWith result:db> ', q)
          }
          
          const table = sql.name
          master_resource.exec(`CREATE TABLE ${table}`)
          alasql.databases[`${team_id}`].tables[table].data = q
          // // Method 1
          // alasql.tables.one.data = data;
          // // Method 2
          // alasql('SELECT * INTO one FROM ?',[data]);
          // // Method 3
          // alasql('INSERT INTO one SELECT * FROM ?',[data]);
        }
      }
      // insert with [name]
      // loop end
    } else if (block.resource == 'sqlTransaction') {
      resource = {
        json_type: 'sqlTransaction',
      }
      if (!block.sqlTransaction || !_.isArray(block.sqlTransaction)) {
        throw StatusError(400, 'sqlTransaction empty (required Array)')
      }
      for (const tx of block.sqlTransaction) {
        let tx_resource = config.resources.find(e => e.name == String(tx.resource).trim())
        if (!tx_resource) throw StatusError(400, 'tx_resource not found')
        if (tx_resource.json_type == 'redis') {
          tx.resource = await getConnectionAny(`${team_id}-${tx_resource.id}`)
          tx.resource_type = tx_resource.json_type
          tx.resource_uuid = tx_resource.uuid
          tx.resource_policy = tx_resource.policy
          throw StatusError(500, 'Feature disabled: redis transaction')
        } else {
          tx.resource = await getConnection(`${team_id}-${tx_resource.id}`)
          tx.resource_type = tx_resource.json_type
          tx.resource_uuid = tx_resource.uuid
          tx.resource_policy = tx_resource.policy
        }
        if (!tx.resource) throw StatusError(400, 'tx.resource not found')
      }
    } else {
      resource = config.resources.find(e => e.name == String(block.resource).trim())
      if (!resource) throw StatusError(400, 'resource not found')

      if (resource.json_type == 'redis') {
        master_resource = await getConnectionAny(`${team_id}-${resource.id}`)
      } else if (resource.json_type == 'mongodb') {
        master_resource = await getConnectionAny(`${team_id}-${resource.id}`)
      } else {
        master_resource = await getConnection(`${team_id}-${resource.id}`)
      }
  
      if (!master_resource) throw StatusError(400, 'resource not found')
    }

    let rows, total;
    let result = [];
    let query_start_ts = Date.now()
    // const timeout_ms = 30000
    // const timeout_promise = new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     resolve("TIMEOUT")
    //   }, timeout_ms)
    // })
    let has_autolimit = false
    
    try {
      if (resource.json_type == 'sqlTransaction') {
        let confirm_escaped_bind_sql = ''
        let confirm_escaped_bind_params = []

        // bind param for each
        for (const tx of block.sqlTransaction) {
          const [bind_sql, bind_params] = _bind_sql_params(_bind_autolimit(tx.sql, tx.resource_type), fields, keys_by_name)
          tx.bind_sql = bind_sql
          tx.bind_params = bind_params
        }
        // begin tx
        const master_resource = (i) => {
          if (block.sqlTransaction[i]) {
            return block.sqlTransaction[i].resource
          } else {
            null
          }
        }
        if (!master_resource(0)) throw StatusError('tx.0 failed to begin.')

        await master_resource(0).transaction( async (tx0) => {
          const {bind_sql, bind_params, resource_uuid, resource_policy} = block.sqlTransaction[0]
          const [ escaped_bind_sql, escaped_bind_params ] = master_resource(0).driver
            .escapeQueryWithParameters(bind_sql, bind_params, {})

          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request (sqlTransaction)',
              body: {
                sql: escaped_bind_sql,
                params: escaped_bind_params,
                fields: bind_params,
                transaction_order: 0,
              },
              ts: Date.now(),
              uid: req.session.id,
            })
          })

          if (block.sqlConfirm && !confirmed) {
            confirm_escaped_bind_sql += escaped_bind_sql
            confirm_escaped_bind_sql += ';\n\n'
            confirm_escaped_bind_params.push(...escaped_bind_params)
          } else {
            monitor.emit('query', {
              team_id,
              resource_uuid: resource_uuid,
              query: escaped_bind_sql.trim(),
              path: current_menu && current_menu.path,
            })
  
            if (resource_policy) {
              const status = await monitor.get_confirm_status({
                team_id,
                resource_uuid: resource_uuid,
                query: escaped_bind_sql.trim(),
              })
              if (resource_policy == 'strict') {
                if (status != 'Y') {
                  return res.status(200).json({
                    message: 'query rejected',
                    escaped_bind_sql, 
                    escaped_bind_params,
                  })  
                }
              }
              else if (resource_policy == 'flexible') {
                if (status == 'N') {
                  return res.status(200).json({
                    message: 'query rejected',
                    escaped_bind_sql, 
                    escaped_bind_params,
                  })  
                }
              }
            }
            const r = await tx0.query(escaped_bind_sql, escaped_bind_params)
            publish( io => {
              io.to(`tid:${team_id}`).emit('log', {
                type: 'query',
                message: 'Response (sqlTransaction)',
                body: r,
                ts: Date.now(),
                uid: req.session.id,
              })
            })
            result.push(r)
          }

          const tx_execute = async (i) => {
            if (master_resource(i)) {
              await master_resource(i).transaction( async (tx) => {
                const {bind_sql, bind_params, resource_type, resource_uuid, resource_policy} = block.sqlTransaction[i]
                const [ escaped_bind_sql, escaped_bind_params ] = master_resource(i).driver
                  .escapeQueryWithParameters(_bind_autolimit(bind_sql, resource_type), bind_params, {})

                publish( io => {
                  io.to(`tid:${team_id}`).emit('log', {
                    type: 'query',
                    message: 'Request (sqlTransaction)',
                    body: {
                      sql: escaped_bind_sql,
                      params: escaped_bind_params,
                      fields: bind_params,
                      transaction_order: i,
                    },
                    ts: Date.now(),
                    uid: req.session.id,
                  })
                })
                if (block.sqlConfirm && !confirmed) {
                  confirm_escaped_bind_sql += escaped_bind_sql
                  confirm_escaped_bind_sql += ';\n\n'
                  confirm_escaped_bind_params.push(...escaped_bind_params)
                } else {
                  monitor.emit('query', {
                    team_id,
                    resource_uuid: resource_uuid,
                    query: escaped_bind_sql.trim(),
                    path: current_menu && current_menu.path,
                  })
        
                  if (resource_policy) {
                    const status = await monitor.get_confirm_status({
                      team_id,
                      resource_uuid: resource_uuid,
                      query: escaped_bind_sql.trim(),
                    })
                    if (resource_policy == 'strict') {
                      if (status != 'Y') {
                        return res.status(200).json({
                          message: 'query rejected',
                          escaped_bind_sql, 
                          escaped_bind_params,
                        })  
                      }
                    }
                    else if (resource_policy == 'flexible') {
                      if (status == 'N') {
                        return res.status(200).json({
                          message: 'query rejected',
                          escaped_bind_sql, 
                          escaped_bind_params,
                        })  
                      }
                    }
                  }
                  // PATCH REQUEST:
                  // const r = await tx.query(escaped_bind_sql, escaped_bind_params)
                  // >>>> did use current tx ?
                  const r = await tx.query(escaped_bind_sql, escaped_bind_params)
                  publish( io => {
                    io.to(`tid:${team_id}`).emit('log', {
                      type: 'query',
                      message: 'Response (sqlTransaction)',
                      body: r,
                      ts: Date.now(),
                      uid: req.session.id,
                    })
                  })
                  result.push(r)
                }

                await tx_execute(i+1)


                publish( io => {
                  io.to(`tid:${team_id}`).emit('log', {
                    type: 'query',
                    message: 'COMMIT (sqlTransaction)',
                    body: {
                      transaction_order: i,
                    },
                    ts: Date.now(),
                    uid: req.session.id,
                  })
                })

              })
            }
          }
          await tx_execute(1)
          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'COMMIT (sqlTransaction)',
              body: {
                transaction_order: 0,
              },
              ts: Date.now(),
              uid: req.session.id,
            })
          })
        })
        // await close tx

        if (block.sqlConfirm && !confirmed) {
          return res.status(200).json({
            message: 'query cancelled',
            escaped_bind_sql: confirm_escaped_bind_sql, 
            escaped_bind_params: confirm_escaped_bind_params,
          })
        }

        rows = result.slice(-1)[0]
      } else if (fields && fields.length) {
        const [bind_sql, bind_params] = _bind_sql_params(_bind_autolimit(block.sql, resource.json_type), fields, keys_by_name)
        const [bind_sql_total, bind_params_total] = block.sqlTotal ? _bind_sql_params(_bind_autolimit(block.sqlTotal, resource.json_type), fields, keys_by_name) : [false, false]
        
        if (resource.json_type == 'redis') {
          let commands = _.flatten([block.commands]).map(e => {
            let line = e
            for (const param of fields) {
              line = String(line).replace(new RegExp(`\{\{(\ )?${param.key}(\ )?\}\}`, 'g'), bind_params[param.key])
            }
            return line.match(/(?:[^\s"]+|"[^"]*")+/g).map(e => {
              if (e.startsWith('"') && e.endsWith('"')) {
                return e.slice(1, -1)
              }
              return e
            })
          })
          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request',
              body: {
                commands: commands.map(e => e.join(' ')),
              },
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          try {
            await master_resource.use(async master_resource => {
              if (commands.length == 1) {
                rows = await master_resource.call(...commands[0])
              } else {
                let stack = master_resource
                for (let i=0; i<commands.length-1; i++) {
                  if (['PIPELINE'].includes(String(commands[i][0]).toUpperCase())) {
                    stack.pipeline()
                    continue
                  }
                  await stack.call(...commands[i])
                }
                rows = await stack.call(...commands[commands.length-1])
                
                publish( io => {
                  io.to(`tid:${team_id}`).emit('log', {
                    type: 'query',
                    message: 'Response',
                    body: rows,
                    ts: Date.now(),
                    uid: req.session.id,
                  })
                })
              }
            })
          } catch (err) {
            throw new Error(`[redis]: ${err.message}`)
          }
          if (_.isArray(rows)) {
            rows = rows.map(e => {
              return {
                '1': e
              }
            })
          } else {
            rows = [
              {
                '1': rows,
              }
            ]
          }
        } else if (resource.json_type == 'sqlWith') {
          // debug({bind_sql, bind_params})
          // alasql bind
          let escaped_bind_sql = bind_sql
          let escaped_bind_params = []
          for (const key in bind_params) {
            escaped_bind_sql = escaped_bind_sql.replace(new RegExp(`\:${key}`, 'g'), () => {
              escaped_bind_params.push(bind_params[key])
              return '?'
            })
          }
          // debug(escaped_bind_sql, {escaped_bind_params}, block.sql)
          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request',
              body: {
                sql: escaped_bind_sql,
                params: escaped_bind_params,
                fields: bind_params,
              },
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          rows = master_resource.exec(escaped_bind_sql, escaped_bind_params)
          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Response',
              body: rows,
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          
          logger.emit('query run', {
            team_id, 
            teamrow_id,
            user_id: req.session.id,
            json: {
              sql: escaped_bind_sql,
              path,
              resource: {
                type: 'sqlWith',
              },
              params: block.log ? escaped_bind_params : undefined,
              menu: current_menu,
              ips: req.ips,
              session_roles,
              required_roles,
              resource_uuid: resource.uuid,
              resource_name: resource.name,
            },
          })
        } else if (resource.json_type == 'json') {
          rows = block.json
        } else if (resource.json_type == 'json+sql') {
          let escaped_bind_sql = bind_sql
          let escaped_bind_params = []
          // debug('bind_params', bind_params)
          const keys = escaped_bind_sql.match(/:(\.\.\.)?([A-Za-z0-9_]+)/g)
          // debug('keys', keys)
          if (keys) {
            for (const key of keys) {
              escaped_bind_sql = escaped_bind_sql.replace(key, () => {
                escaped_bind_params.push(bind_params[key.slice(1)])
                return '?'
              })
            }

          }

          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request',
              body: {
                sql: escaped_bind_sql,
                params: escaped_bind_params,
                fields: bind_params,
              },
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          try {
            rows = master_resource.exec(escaped_bind_sql, escaped_bind_params) 
            await _save_alasql(team_id, master_resource)
          } catch (error_message) {
            throw new Error(`json+sql: ${error_message}`)
          }
          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Response',
              body: rows,
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          
          logger.emit('query run', {
            team_id, 
            teamrow_id,
            user_id: req.session.id,
            json: {
              sql: escaped_bind_sql,
              path,
              resource: {
                type: 'sqlWith',
              },
              params: block.log ? escaped_bind_params : undefined,
              menu: current_menu,
              ips: req.ips,
              session_roles,
              required_roles,
              resource_uuid: resource.uuid,
              resource_name: resource.name,
            },
          })
        } else if (resource.json_type == 'mongodb') {
          let query_string = JSON.stringify(block.query || {})
          for (const param of fields) {
            if (isFinite(+param.value)) {
              query_string = String(query_string).replace(new RegExp(`\\"\\$\{\{(\ )?${param.key}(\ )?\}\}\\"`, 'g'), param.value)
            }
            query_string = String(query_string).replace(new RegExp(`\\$\{\{(\ )?${param.key}(\ )?\}\}`, 'g'), param.value)
            query_string = String(query_string).replace(new RegExp(`\{\{(\ )?${param.key}(\ )?\}\}`, 'g'), param.value)
          }
          
          block.query = JSON.parse(query_string)

          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request',
              body: block.query,
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          if (block.sqlConfirm && !confirmed) {
            return res.status(200).json({
              message: 'query cancelled',
              query_string,
            })
          }
          monitor.emit('query', {
            team_id,
            resource_uuid: resource.uuid,
            query: query_string.trim(),
            path: current_menu && current_menu.path,
          })

          if (resource.policy) {
            const status = await monitor.get_confirm_status({
              team_id,
              resource_uuid: resource.uuid,
              query: escaped_bind_sql.trim(),
            })
            if (resource.policy == 'strict') {
              if (status != 'Y') {
                return res.status(200).json({
                  message: 'query rejected',
                  query: query_string.trim(),
                })  
              }
            }
            else if (resource.policy == 'flexible') {
              if (status == 'N') {
                return res.status(200).json({
                  message: 'query rejected',
                  query: query_string.trim(),
                })  
              }
            }
          }
          const log = (...message) => {
            publish( io => {
              io.to(`tid:${team_id}`).emit('log', {
                type: 'query',
                message: 'Debug',
                body: message,
                ts: Date.now(),
                uid: req.session.id,
              })
            })
          }
          rows = await _fetch_mongodb(master_resource, block.query, block.sqlType, block.queryFn, fields, log)
          if (_.isObject(rows) && rows.type == 'total') {
            total = rows.total
            rows = rows.rows
          }
          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Response',
              body: rows,
              ts: Date.now(),
              uid: req.session.id,
            })
          })
        } else {
          let [ escaped_bind_sql, escaped_bind_params ] = master_resource.driver
            .escapeQueryWithParameters(bind_sql, bind_params, {})

          if (resource.json_type == 'postgres') {
            if (resource.pg_null_coalescing === true) {
              escaped_bind_params = escaped_bind_params.map(e => {
                if (e == '') return null
                return e
              })
            }
          }
          
          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request',
              body: {
                sql: escaped_bind_sql,
                params: escaped_bind_params,
                fields: bind_params,
              },
              ts: Date.now(),
              uid: req.session.id,
            })
          })

          if (block.sqlConfirm && !confirmed) {
            return res.status(200).json({
              message: 'query cancelled',
              escaped_bind_sql, 
              escaped_bind_params,
            })
          }
          monitor.emit('query', {
            team_id,
            resource_uuid: resource.uuid,
            query: escaped_bind_sql.trim(),
            path: current_menu && current_menu.path,
          })

          if (resource.policy) {
            const status = await monitor.get_confirm_status({
              team_id,
              resource_uuid: resource.uuid,
              query: escaped_bind_sql.trim(),
            })
            if (resource.policy == 'strict') {
              if (status != 'Y') {
                return res.status(200).json({
                  message: 'query rejected',
                  escaped_bind_sql, 
                  escaped_bind_params,
                })  
              }
            }
            else if (resource.policy == 'flexible') {
              if (status == 'N') {
                return res.status(200).json({
                  message: 'query rejected',
                  escaped_bind_sql, 
                  escaped_bind_params,
                })  
              }
            }
          }

          rows = await master_resource.query(escaped_bind_sql, escaped_bind_params)

          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Response',
              body: rows,
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          
          if (block.log) {
            monitor.emit('activity', {
              message: get_message(block, fields),
              team_id, 
              teamrow_id,
              user_id: req.session.id,
              user_email: req.session.email,
              menu_path: current_menu && current_menu.path,
              menu_name: current_menu && current_menu.name,
              params: block.log ? escaped_bind_params : undefined,
              ips: req.ips,
              session_roles,
              required_roles,
              resource_uuid: resource.uuid,
            })
          }
          monitor.emit('query profile', {
            team_id,
            query: escaped_bind_sql.trim(),
            ms: Date.now() - query_start_ts,
          })
          {
            if (bind_sql_total) {
              const [ escaped_bind_sql, escaped_bind_params ] = master_resource.driver
                .escapeQueryWithParameters(bind_sql_total, bind_params_total, {})
              const _total = await master_resource.query(escaped_bind_sql, escaped_bind_params)
              total = Object.values(_total[0])[0]
            }
          }
        }
      } else {
        if (resource.json_type == 'redis') {
          let commands = _.flatten([block.commands]).map(e => {
            let line = e
            return line.match(/(?:[^\s"]+|"[^"]*")+/g).map(e => {
              if (e.startsWith('"') && e.endsWith('"')) {
                return e.slice(1, -1)
              }
              return e
            })
          })
          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request',
              body: {
                commands: commands.map(e => e.join(' ')),
              },
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          try {
            await master_resource.use(async master_resource => {
              if (commands.length == 1) {
                rows = await master_resource.call(...commands[0])
              } else {
                let stack = master_resource
                for (let i=0; i<commands.length-1; i++) {
                  await stack.call(...commands[i])
                }
                rows = await stack.call(...commands[commands.length-1])
                
                publish( io => {
                  io.to(`tid:${team_id}`).emit('log', {
                    type: 'query',
                    message: 'Response',
                    body: rows,
                    ts: Date.now(),
                    uid: req.session.id,
                  })
                })
              }
            })
          } catch (err) {
            throw new Error(`[redis]: ${err.message}`)
          }
          if (_.isArray(rows)) {
            rows = rows.map(e => {
              return {
                '1': e
              }
            })
          } else {
            rows = [
              {
                '1': rows,
              }
            ]
          }
        } else if (resource.json_type == 'sqlWith') {
          
          rows = master_resource.exec(block.sql)
          // logger.emit('query profile', {
          //   team_id, 
          //   teamrow_id,
          //   user_id: req.session.id,
          //   json: {
          //     sql: block.sql,
          //     resource_uuid: resource.uuid,
          //     resource_name: resource.name,
          //     ms: Date.now() - query_start_ts,
          //   },
          // })

        } else if (resource.json_type == 'json+sql') {

          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request',
              body: block.sql,
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          rows = master_resource.exec(block.sql)
          await _save_alasql(team_id, master_resource)
          // logger.emit('query profile', {
          //   team_id, 
          //   teamrow_id,
          //   user_id: req.session.id,
          //   json: {
          //     sql: block.sql,
          //     resource_uuid: resource.uuid,
          //     resource_name: resource.name,
          //     ms: Date.now() - query_start_ts,
          //   },
          // })          
        } else if (resource.json_type == 'mongodb') {

          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Request',
              body: block.query,
              ts: Date.now(),
              uid: req.session.id,
            })
          })
          if (block.sqlConfirm && !confirmed) {
            return res.status(200).json({
              message: 'query cancelled',
              query: JSON.stringify(block.query),
            })
          }
          monitor.emit('query', {
            team_id,
            resource_uuid: resource.uuid,
            query: JSON.stringify(block.query).trim(),
            path: current_menu && current_menu.path,
          })

          if (resource.policy) {
            const status = await monitor.get_confirm_status({
              team_id,
              resource_uuid: resource.uuid,
              query: JSON.stringify(block.query).trim(),
            })
            if (resource.policy == 'strict') {
              if (status != 'Y') {
                return res.status(200).json({
                  message: 'query rejected',
                  query: JSON.stringify(block.query),
                })  
              }
            }
            else if (resource.policy == 'flexible') {
              if (status == 'N') {
                return res.status(200).json({
                  message: 'query rejected',
                  query: JSON.stringify(block.query),
                })  
              }
            }
          }
          const log = (...message) => {
            publish( io => {
              io.to(`tid:${team_id}`).emit('log', {
                type: 'query',
                message: 'Debug',
                body: message,
                ts: Date.now(),
                uid: req.session.id,
              })
            })
          }
          rows = await _fetch_mongodb(master_resource, block.query, block.sqlType, block.queryFn, fields, log)
          if (_.isObject(rows) && rows.type == 'total') {
            total = rows.total
            rows = rows.rows
          }

          publish( io => {
            io.to(`tid:${team_id}`).emit('log', {
              type: 'query',
              message: 'Response',
              body: rows,
              ts: Date.now(),
              uid: req.session.id,
            })
          })
        } else if (resource.json_type == 'json') {
          rows = block.json
        } else {
          const sql_many = _bind_sql_statements(_bind_autolimit(block.sql, resource.json_type))
          // debug('>>>>>>>', sql_many)

          let escaped_bind_sql = ''
          let escaped_bind_params = []

          for (const sql_single of sql_many) {
            const [bind_sql, bind_params] = _bind_sql_params(sql_single, fields, keys_by_name)

            publish( io => {
              io.to(`tid:${team_id}`).emit('log', {
                type: 'query',
                message: 'Request',
                body: {
                  sql: bind_sql,
                  params: bind_params, 
                },
                ts: Date.now(),
                uid: req.session.id,
              })
            })

            if (block.sqlConfirm && !confirmed) {
              escaped_bind_sql += bind_sql
              escaped_bind_sql += '\n\n'
              escaped_bind_params.push(...bind_params)
              continue
            }

            monitor.emit('query', {
              team_id,
              resource_uuid: resource.uuid,
              query: bind_sql.trim(),
              path: current_menu && current_menu.path,
            })
  
            if (resource.policy) {
              const status = await monitor.get_confirm_status({
                team_id,
                resource_uuid: resource.uuid,
                query: bind_sql.trim(),
              })
              if (resource.policy == 'strict') {
                if (status != 'Y') {
                  return res.status(200).json({
                    message: 'query rejected',
                  })  
                }
              }
              else if (resource.policy == 'flexible') {
                if (status == 'N') {
                  return res.status(200).json({
                    message: 'query rejected',
                  })  
                }
              }
            }
            
            const _rows = await master_resource.query(bind_sql)
            if (_rows) {
              if (rows) {
                if (_rows.constructor.name == 'Array') {
                  rows = _rows
                }
              } else {
                rows = _rows
              }
              // debug('_rows', _rows, _rows.constructor.name)
            }

            publish( io => {
              io.to(`tid:${team_id}`).emit('log', {
                type: 'query',
                message: 'Response',
                body: rows,
                ts: Date.now(),
                uid: req.session.id,
              })
            })

            
            monitor.emit('query profile', {
              team_id,
              query: bind_sql.trim(),
              ms: Date.now() - query_start_ts,
            })
          }
          
          if (block.log) {
            monitor.emit('activity', {
              message: get_message(block, fields),
              team_id, 
              teamrow_id,
              user_id: req.session.id,
              user_email: req.session.email,
              menu_path: current_menu && current_menu.path,
              menu_name: current_menu && current_menu.name,
              params: block.log ? escaped_bind_params : undefined,
              ips: req.ips,
              session_roles,
              required_roles,
              resource_uuid: resource.uuid,
            })
          }
        }
      }
    } catch (e) {
      error(e.stack)
      publish( io => {
        io.to(`tid:${team_id}`).emit('log', {
          type: 'query',
          message: e.message,
          body: {
            code: e.code,
            sqlMessage: e.sqlMessage,
            sql: e.sql,
          },
          block: _simple_block(block),
          ts: Date.now(),
          uid: req.session.id,
        })
      })
      logger.emit('query error', {
        team_id,
        teamrow_id,
        user_id: req.session.id,
        json: Object.assign({
          message: e.message,
          stack: e.stack,
        }, e, {
          path,
          menu: current_menu,
          ips: req.ips,
          session_roles,
          required_roles,
          resource_uuid: resource.uuid,
          resource_name: resource.name,
          ms: Date.now() - query_start_ts,
        })
      })
      return res.status(200).json({
        message: 'query failed',
        rows,
        error: Object.assign({ code: '500', sqlMessage: `Server Error: ${e.message}` }, error, {
          driverError: undefined
        }),
      })  
    }

    let spreadsheetUrl;
    if (response_type == 'gsheet') {
      throw StatusError(400, 'CLI 환경에서는 구글시트를 지원하지 않습니다.')
    }

    let cached_timezone = 'UTC'
    if (resource && resource.id) {
      const tz = await State.get(`team.${team_id}.resource.${resource.id}.timezone`)
      cached_timezone = tz || 'UTC'
    }
  
    res.status(200).json({
      message: 'ok',
      rows: spreadsheetUrl ? [] : rows,
      total,
      spreadsheetUrl,
      cached_timezone,
      has_autolimit,
    })
  } catch (e) {
    publish( io => {
      io.to(`tid:${team_id}`).emit('log', {
        type: 'query',
        message: e.message,
        block,
        ts: Date.now(),
        uid: req.session.id,
      })
    })

    error(e.stack)
    next(e)
  }
})

router.post('/http', [only.id(), only.menu(), upload.any(), only.expiration()], async (req, res, next) => {
  let team_id = req.menu.team_id
  let block 
  try {
    const path = req.query.path
    const response_type = req.query.response_type
    
    // cloud start
    const _config = await State.get(`admin.${team_id}.yaml`)
    if (!_config) throw StatusError(500, 'admin config not ready')
    const config_root = JSON.parse(_config)
    
    block = _.get(config_root, path)
    // cloud end

    let fields = req.body.fields || []
    if (req.query.formdata) {
      fields = Object.entries(req.body).map( e => {
        return {
          key: e[0],
          value: e[1],
        }
      })
    }
    const params = JSON.parse(req.query.params || '{}') || {}
  
    params.page = Math.max(1, Math.min(100, params.page || 1))
    params.limit = Math.max(30, Math.min(100, params.limit || 30))
    params.sort = {'ASC': 'ASC', 'DESC': 'DESC'}[params.sort] || 'DESC'
    params.offset = params.page-1 * params.limit

    // const mode = req.get('User-Mode') || 'production'
    
    const keys = config_root.keys
    const keys_by_name = _.keyBy(keys, 'key')
    
    if (block.type != 'http') throw StatusError(400, 'block type is not http')

    {
      fields = fields.map(f => {
        const param = (block && block.params && block.params || []).find(e => e.key == f.key) || {}
        
        if (f.query || param.query) {
          f.query = param.query
        }
        if (f.orderBy || param.orderBy) {
          f.orderBy = param.orderBy
        }
        if (f.valueFromUserProperty || param.valueFromUserProperty) {
          f.valueFromUserProperty = param.valueFromUserProperty
        }

        if (param.valueFromEnv) {
          f.valueFromEnv = param.valueFromEnv
        }
        return f
      })
    }
    // patch: updateOptions
    for (const param of (block && block.params && block.params || [])) {
      const found = fields.find(e => e.key == param.key)
      if (!found) {
        if (param.query || param.orderBy || param.valueFromUserProperty || param.valueFromEnv || param.range || param.updateOptions) {
          fields.push(param)
        }
      }
    }

    let rows;

    let config, base_config

    if (block.resource) {
      let resource = config.resources.find(e => e.name == String(block.resource).trim())
      if (!resource || !resource.id) throw StatusError(400, 'resource not found')
      base_config = resource.json || {}
      if (!resource.json || resource.json.type !== 'http') throw StatusError(400, 'http resource not found')
    }

    // debug('>>>block.axios', block.axios)
    if (_.isObject(block.axios)) {
      if (block._use_http_got) {
        config = _.cloneDeep(block.got)
      } else {
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
      }
      config = _.merge({}, base_config, config)
      let json = JSON.stringify(config)
      // debug('>>>json', json)

      // 지금 기준 role 가져오고 (yml > db), 지금 기준 menu Role이랑 비교하고 차단
      // menus.roles / blocks.roles / actions.roles
      let session_roles = []
      let required_roles = []
      let current_menu = null
      {
        const p = path.split('.')
        // let menu_path
        if (!path.startsWith('menus.')) {
          if (p[0] != 'pages') throw StatusError(400, 'path: pages not found')
        }
        const menu_path = _.get(config_root, `${p[0]}.${p[1]}.path`)

        const menus = config_root.menus.map(e => {
          return [].concat((e.menus || []), (e.menus || []).map(e => {
            return [].concat((e.menus || []), (e.menus || []).map(e => {
              return e.menus || []
            }))
          }))
        })
        const m = _.flatten(_.flatten([...config_root.menus, ...menus])).find(e => e.path == menu_path)

        if (m) {
          current_menu = {
            path: m.path,
          }
        }

        if (m && m.roles) {
          // menu 있거나, menu.roles 있는 경우에만 진행
          if (_.isArray(req.user_role.group_json) && req.user_role.group_json.length > 0) {
            session_roles = req.user_role.group_json
          } else {
            const u = config_root.users.find(e => e.email == req.session.email)
            if (u) {
              session_roles = u.roles
            }
          }
          session_roles.push(`email::${req.session.email}`)

          {
            // check view
            required_roles = _.flatten([m.roles.view])
            // debug({session_roles, required_roles})
            if (_.intersection(session_roles, required_roles).length === 0) {
              throw StatusError(403, '권한이 없습니다.')
            }
          }
        }
        if (req.user_role) {
          session_roles.push(`select::${req.user_role.name}`)
        }
      }

      {
        // block roles edit
        if (block.roles?.edit) {
          if (_.isArray(req.user_role.group_json) && req.user_role.group_json.length > 0) {
            session_roles = req.user_role.group_json
          } else {
            const u = config_root.users.find(e => e.email == req.session.email)
            if (u) {
              session_roles = u.roles
            }
          }
          session_roles.push(`email::${req.session.email}`)
          if (req.user_role) {
            session_roles.push(`select::${req.user_role.name}`)
          }
  
          // check view
          const required_roles = _.flatten([block.roles.edit])
          // debug({session_roles, required_roles})
          if (_.intersection(session_roles, required_roles).length === 0) {
            throw StatusError(403, '(api block not allowed)')
          }
        }
      }

      if (block && block.params) {
        const has_user_property = (fields || []).filter(e => e.valueFromUserProperty).length > 0
        if (has_user_property) {
          req.user_role.property_json = req.user_role.property_json || []
          for (const param of fields) {
            if (param.valueFromUserProperty === undefined) continue
            const valueFromUserProperty = String(param.valueFromUserProperty || '').trim()
            let found = req.user_role.property_json.find(e => e.key == valueFromUserProperty)
            if (valueFromUserProperty == '{{email}}') {
              found = {
                value: req.session.email
              }
            }
            else if (valueFromUserProperty == '{{id}}') {
              found = {
                value: req.session.id
              }
            }
            else if (valueFromUserProperty == '{{name}}') {
              let name = req.user_role.profile_name
              if (!name) {
                const me = req.session.name
                name = me.name
              }
              found = {
                value: name,
              }
            }
            if (!found || !found.value) {
              // re-find
              if (config_root.users) {
                const found_users = config_root.users.filter(e => e.email == req.session.email)
                for (const user of found_users) {
                  if (user && user.property && user.property[valueFromUserProperty]) {
                    found = {
                      value: user.property[valueFromUserProperty],
                    }
                  }
                }
              }
            }
            if (found && found.value !== undefined) {
              fields = fields.map(e => {
                if (e.key == param.key) {
                  e.value = found.value
                }
                return e
              })
            } else {
              if (param.required) throw StatusError(400, 'dialog:계정 설정을 확인해주세요. (UserProperty 필수값 오류)')
            }
          }
        }
      }

      // do match for params {{ id }}
      // seek ENVs first
      for (const param of fields) {
        if (param.valueFromEnv) {
          if (String(param.valueFromEnv) == 'true') {
            param.valueFromEnv = param.key
          }
          if (keys_by_name[param.valueFromEnv]) {
            param.value = keys_by_name[param.valueFromEnv].value
            // debug('keys_by_name[param.valueFromEnv].value', keys_by_name[param.valueFromEnv])
            keys_by_name[param.valueFromEnv].used = true
          } else {
            throw StatusError(400, 'param.valueFromEnv not found: ' + param.valueFromEnv)
          }
        }
      }
      // match code_fields then replacement
      for (const param of fields) {
        let _evals = json.match(/\{\{(.*?)\}\}/gm)
        if (_evals) {
          _evals = _evals.map(e => {
            return JSON.parse(`"${e.slice(2, -2)}"`)
          })
          if (req.body.code_fields) {
            if (!_.isArray(req.body.code_fields) && req.body.code_fields[0] == '[') {
              req.body.code_fields = JSON.parse(req.body.code_fields)
            }
            for (const _eval of _evals) {
              // valueFromEnv cannot be from code_fields
              if (keys_by_name[String(_eval).trim()] && keys_by_name[String(_eval).trim()].used) {
                const keyName = String(_eval).trim()
                json = String(json).replace(`{{${_eval}}}`, `{{${keyName}}}`)
                continue
              }
              const field = req.body.code_fields.find(e => {
                return String(e.code).trim() == String(_eval).trim()
              })
              if (field) {
                json = String(json).replace(`"{{${JSON.stringify(field.code).slice(1,-1)}}}"`, JSON.stringify(field.value))
              }
            }
          }
        }

        let v;
        if (param.values) {
          v = JSON.stringify(param.values)
          json = String(json).replace(new RegExp(`\"\{\{(\ )?encodeURIComponent\(${param.key}\)(\ )?\}\}\"`, 'g'), encodeURIComponent(v))
          json = String(json).replace(new RegExp(`\"\=\{\{(\ )?${param.key}(\ )?\}\}\"`, 'g'), '='+encodeURIComponent(v))
          json = String(json).replace(new RegExp(`\\$\{\{(\ )?${param.key}(\ )?\}\}`, 'g'), v)
          json = String(json).replace(new RegExp(`\"\{\{(\ )?${param.key}(\ )?\}\}\"`, 'g'), v)
        } else {
          if (param.format == 'number') {
            if (!isFinite(+param.value)) {
              if (param.cast) {
                if (param.cast.includes('nullable')) {
                  if (param.value === undefined || param.value == '') {
                    let v = 'null'
                    if (param.cast.includes('0')) {
                      v = '0'
                    }
                    else if (param.cast.includes('-1')) {
                      v = '-1'
                    }
                    json = String(json).replace(new RegExp(`"\\$\{\{(\ )?${param.key}(\ )?\}\}"`, 'g'), v)
                    json = String(json).replace(new RegExp(`"\{\{(\ )?${param.key}(\ )?\}\}"`, 'g'), v)
                    continue
                  }
                  continue
                }
              }
              throw StatusError(`param[${param.key}] invalid number`)
            }
            if (param.cast && param.cast.includes('number')) {
              json = String(json).replace(new RegExp(`"\\$\{\{(\ )?${param.key}(\ )?\}\}"`, 'g'), param.value)
              json = String(json).replace(new RegExp(`"\{\{(\ )?${param.key}(\ )?\}\}"`, 'g'), param.value)
              continue
            }
            v = JSON.stringify(+param.value)
          } else {
            v = JSON.stringify(String(param.value)).slice(1, -1)
            // debug('v=', v)
          }
          json = String(json).replace(new RegExp(`\{\{(\ )?encodeURIComponent\\(${param.key}\\)(\ )?\}\}`, 'g'), encodeURIComponent(v))
          json = String(json).replace(new RegExp(`\=\{\{(\ )?${param.key}(\ )?\}\}`, 'g'), '='+encodeURIComponent(v))
          json = String(json).replace(new RegExp(`\\$\{\{(\ )?${param.key}(\ )?\}\}`, 'g'), v)
          json = String(json).replace(new RegExp(`\{\{(\ )?${param.key}(\ )?\}\}`, 'g'), v)
        }
        // debug({param})
      }

      // do match for evals {{ CODE }}

      config = JSON.parse(json)
      
    } else if (_.isString(block.axios)) {
      // TODO: support full json request
      throw StatusError(400, 'block.axios format invalid: Object')
    } else {
      throw StatusError(400, 'block.axios format invalid: Object')
    }
    // debug('>>>', config)

    

    try {
      // if (_.isObject(config.data)) {
      //   config.data = JSON.stringify(config.data)
      // }
      if (req.query.formdata || req.files && req.files.length > 0) {
        // debug('>>>>>> config ', config)
        const data = new FormData()

        if (config.json) {
          data.append('json', JSON.stringify(config.data))
        } else {
          for (const field of fields) {
            if (field.valueFromEnv) continue
            data.append(field.key, field.value)
          }
        }
        for (const file of req.files) {
          data.append(file.fieldname, file.buffer, {
            filename: file.originalname
          })
        }
        config.headers = {
          ...config.headers,
          ...data.getHeaders(),
          // "Content-Length": data.getLengthSync(),
        }
        config.data = data
      }
      
      publish( io => {
        let _data = undefined
        if (config.data && config.data._streams) {
          _data = config.data._streams.filter(e => {
            return !Buffer.isBuffer(e) && typeof e !== 'function'
          })
        }
        io.to(`tid:${team_id}`).emit('log', {
          type: 'http',
          message: 'Request',
          body: Object.assign({}, config, {
            data: _data,
          }),
          fields,
          code_fields: req.body.code_fields,
          ts: Date.now(),
          uid: req.session.id,
        })
      })
      config.url = encodeURI(config.url)
      let r
      if (block._use_http_got) {
        const external_got = await getGotInstance()
        r = await external_got(config).json()
        r = {
          data: r
        }
      } else {
        r = await external_axios(config)
      }
      publish( io => {
        io.to(`tid:${team_id}`).emit('log', {
          type: 'http',
          message: 'Response',
          status: r.status,
          statusText: r.statusText,
          body: r.data,
          ts: Date.now(),
          uid: req.session.id,
        })
      })
      if (!r.data) throw StatusError('no data')
      if (block.rowsPath) {
        rows = _.get(r.data, block.rowsPath)
      } 
      
      if (!rows) {
        if (_.isArray(r.data)) {
          rows = r.data
        } else if (_.isObject(r.data)) {
          rows = [r.data]
        } else {
          rows = r.data
        }
      }
    } catch (error) {
      debug(error)
      const resp = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        body: error.response?.body,
        message: error?.message,
      }
      // debug(resp)
      let plain_error = JSON.stringify(Object.assign({}, resp))
      // debug(plain_error, resp)
      // debug(keys_by_name)
      for (const key of keys) {
        if (keys_by_name[key.key] && keys_by_name[key.key].used) {
          plain_error = plain_error.replace(key.value, '******')
        }
      }
      publish( io => {
        io.to(`tid:${team_id}`).emit('log', {
          type: 'http',
          message: 'Response',
          status: resp.status,
          statusText: resp.statusText,
          body: resp.data,
          block: _simple_block(block),
          ts: Date.now(),
          uid: req.session.id,
        })
      })
      res.status(200).json({
        message: 'http failed',
        rows,
        error: Object.assign(resp, JSON.parse(plain_error)),
      })
      return
    }

    let spreadsheetUrl;
    if (response_type == 'gsheet') {
      throw StatusError(400, 'CLI 환경에서는 구글시트를 지원하지 않습니다.')
    }
  
    res.status(200).json({
      message: 'ok',
      rows: spreadsheetUrl ? [] : rows,
      spreadsheetUrl,
    })
  } catch (e) {
    publish( io => {
      io.to(`tid:${team_id}`).emit('log', {
        type: 'http',
        message: 'Error',
        body: e.message,
        block,
        ts: Date.now(),
        uid: req.session.id,
      })
    })
    error(e.stack)
    // next(e)
    res.status(200).json({
      message: e.message,
      error: e,
    })
  }
})

module.exports = router