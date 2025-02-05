const {debug, info, error} = require('../log')('select:api')
const only = require('../models/only')
const logger = require('../models/logger')
const monitor = require('../models/monitor')
const State = require('../models/State')
const { getConnection, Db } = require('typeorm')
const { getConnectionAny } = require('../models/dbAny')
const alasql = require('alasql')
const { getGotInstance } = require('../models/httpGot')
const router = require('express').Router()

const { Parser } = require('node-sql-parser')
const parser = new Parser

const axios = require('axios')
const $http = axios.create({
  withCredentials: false,
  timeout: 30000,
  baseURL: global.__API_BASE,
})

router.use((req, res, next) => {
  req._json = true
  next()
})

router.param('admin_domain_or_team_id', (req, res, next) => {
  req.team = global.__TEAM
  next()
})

router.get('/:admin_domain_or_team_id/config', [only.id(), only.teamscope_any_of('view', 'edit', 'admin'), only.expiration()], async (req, res, next) => {
  try {
    // const master = await getConnection('mysql.master')

    // trigger
    // // always - auto publish
    // const redis = getRedisConnection()
    // const cached_json = await redis.get(`admin.${req.team.id}.yaml`)
    // const next_json = JSON.stringify(json)
    // if (cached_json != next_json) {
    //   await redis.set(`admin.${req.team.id}.yaml`, next_json)
    // }
    
    // const redis = getRedisConnection('sub')
    const cached_json = await State.get(`admin.${req.team.id}.yaml`)
    let cached_error = await State.get(`admin.${req.team.id}.error`)
    try {
      cached_error = JSON.parse(cached_error || '[]') || []
    } catch (error) {
      debug(error)
    }
    const json = JSON.parse(cached_json || '{}') || {}

    // // inject roles
    // let role = await master.createQueryBuilder()
    //   .select('UserRole.id, UserRole.group_json')
    //   .addSelect('UserProfile.email')
    //   .from('UserRole')
    //   .addFrom('UserProfile')
    //   .where('UserRole.team_id = :tid', {
    //     tid: req.team.id,
    //   })
    //   .andWhere('UserRole.user_id = :uid', {
    //     uid: req.session.id,
    //   })
    //   .andWhere('UserRole.team_row_id IS NULL')
    //   .andWhere('UserRole.deleted_at IS NULL')
    //   .andWhere('UserProfile.id = UserRole.user_id')
    //   .andWhere('UserProfile.deleted_at IS NULL')
    //   .getRawOne()
    // if (!process.env.ONPREM && +req.team.id == +global.config.get('template.team_id')) {
    //   role = {
    //     id: 1,
    //     group_json: [],
    //     email: req.session.email,
    //   }
    // }
    // if (!role || !role.id) throw StatusError(403, '권한을 확인해주세요.')
    // if (!json.users) json.users = []
    // json.users = json.users.filter(e => {
    //   return e.email == role.email
    // })
    // if (json.users.length === 0) {
    //   // yml 없고, ui 기준
    //   json.users.push({
    //     email: role.email,
    //     roles: role.group_json || [],
    //   })
    // } else {
    //   if (role.group_json && role.group_json.length) {
    //     // ui 덮어씌우기
    //     json.users[0].roles = role.group_json
    //   } else {
    //     // yml 유지
    //   }
    // }
    // if (json.users[0]) {
    //   if (!json.users[0].roles) json.users[0].roles = []
    //   json.users[0].roles.push(`email::${json.users[0].email}`)
    // }
    
    // if (json.keys) {
    //   json.keys = json.keys.map(e => {
    //     e.value = undefined
    //     return e
    //   })
    // }

    const clean_sql = (block, use_sqlType = true) => {
      if (block.sql) {
        if (use_sqlType && !block.sqlType) {
          const _resource = json.resources.find(e => e.name == block.resource)
          const resource_type = _resource && _resource.type || 'mysql'

          const sql = block.sql
            .replace(/::([A-Za-z]+)/g, ``)
            .replace(/:(\.\.\.)?([A-Za-z0-9_.]+)/g, `''`)
            .replace(/\{\{(\s)?query(\s)?\}\}/g, `1=1`)
            .replace(/\{\{(\s)?orderBy(\s)?\}\}/g, ``)

          try {
            const ast = parser.astify(sql, {
              database: {
                'mysql': 'mysql',
                'postgres': 'postgresql',
                // 'bigquery': 'bigquery',
                // 'db2': 'db2',
                // 'hive': 'hive',
                // 'mariadb': 'mariadb',
                // 'sqlite': 'sqlite',
                // 'transactsql': 'transactsql',
                // 'flinksql': 'flinksql',
                'mssql': 'transactsql',
              }[resource_type]
            })
            block.sqlType = String(ast.type).toLowerCase()
          } catch (error) {
            debug('failed to astify', error.message, '\n\n', sql, '\n\n')
            block._sqlType = 'astify failed'
            // empty
          }
        }
        block.sql = '***'
      }
      if (block.sqlWith) {
        block.sqlWith = block.sqlWith.map(e => {
          if (e.id) e.id = '***'
          if (e.gid) e.gid = '***'
          if (e.query) e.query = '***'
          return clean_table_block(e)
        })
      }
      if (block.sqlTransaction) {
        block.sqlTransaction = block.sqlTransaction.map(clean_sql)
      }
      return block
    }
    const clean_table_block = (block) => {
      if (block.params) {
        block.params = block.params.map(param => {
          if (param.datalistFromQuery) {
            param.datalistFromQuery = clean_sql(param.datalistFromQuery, false,)
          }
          if (param.defaultValueFromQuery) {
            param.defaultValueFromQuery = clean_sql(param.defaultValueFromQuery, false)
          }
          if (param.query) {
            for (const key of Object.keys(param.query)) {
              if (param.query[key]) param.query[key] = '***'
            }
          }
          if (param.orderBy) {
            for (const key of Object.keys(param.orderBy)) {
              if (param.orderBy[key]) param.orderBy[key] = '***'
            }
          }
          if (param.valueFromQuery) {
            param.valueFromQuery = clean_sql(param.valueFromQuery, false)
          }
          if (param.value === undefined) {
            param.value = ''
          }
          return param
        })
      }
      if (block.actions) {
        block.actions = block.actions.map(clean_block)
      }
      if (block.viewModal) {
        if (block.viewModal.blocks) {
          block.viewModal.blocks = block.viewModal.blocks.map(clean_block)
        }
      }
      if (block.tabOptions) {
        if (block.tabOptions.tabs) {
          block.tabOptions.tabs = block.tabOptions.tabs.map(tab => {
            if (tab.blocks) {
              tab.blocks = tab.blocks.map(clean_block)
            }
            return tab
          })
        }
      }
      if (block.columns) {
        for (const key of Object.keys(block.columns)) {
          if (block.columns[key]) {
            if (block.columns[key].updateOptions) {
              block.columns[key].updateOptions = clean_block(block.columns[key].updateOptions)
            }
            if (block.columns[key].datalistFromQuery) {
              block.columns[key].datalistFromQuery = clean_sql(block.columns[key].datalistFromQuery, false)
            }
            if (block.columns[key].defaultValueFromQuery) {
              block.columns[key].defaultValueFromQuery = clean_sql(block.columns[key].defaultValueFromQuery, false)
            }
          }
        }
      }
      if (block.columnOptions) {
        block.columnOptions = block.columnOptions.map(columnOption => {
          if (columnOption.updateOptions) {
            columnOption.updateOptions = clean_block(columnOption.updateOptions)
          }
          if (columnOption.datalistFromQuery) {
            columnOption.datalistFromQuery = clean_sql(columnOption.datalistFromQuery, false)
          }
          if (columnOption.defaultValueFromQuery) {
            columnOption.defaultValueFromQuery = clean_sql(columnOption.defaultValueFromQuery, false)
          }
          return columnOption
        })
      }
      return block
    }
    const clean_http = (block) => {
      if (block && block.axios) {
        const json = JSON.stringify(block.axios)
        
        let _evals = json.match(/\{\{(.*?)\}\}/gm)
        if (_evals) {
          _evals = _evals.map(e => {
            return JSON.parse(`"${e.slice(2, -2)}"`)
          })
        }
        // debug(_evals)
        block.axios = {
          method: block.axios.method,
          methodType: block.axios.methodType,
          _evals,
        }
      }
      return block
    }
    const clean_block = (block) => {
      if (!block) return block
      if (block.type == 'query') return clean_table_block(clean_sql(block))
      if (block.type == 'http') return clean_table_block(clean_http(block))
      if (['left', 'right', 'center', 'top', 'bottom'].includes(block.type)) {
        if (block.blocks) {
          block.blocks = block.blocks.map(clean_block)
        }
      }
      return clean_table_block(block)
    }
    if (json.pages) {
      json.pages = json.pages.map(page => {
        if (page.blocks) {
          page.blocks = page.blocks.map(clean_block)
        }
        return page
      })

      const menus = json.menus.map(e => {
        return [].concat((e.menus || []), (e.menus || []).map(e => {
          return [].concat((e.menus || []), (e.menus || []).map(e => {
            return e.menus || []
          }))
        }))
      })
      const flatten_menus = _.flatten(_.flatten([].concat(menus, json.menus)))
      
      // update UserRole
      const refresh_role = async () => {
        try {
          const r = await $http({
            method: 'GET',
            url: '/cli/UserRole/get',
            params: {
              user_id: req.session.id,
            },
            headers: {
              Authorization: `${process.env.TOKEN}`,
            },
            json: true,
          })
          if (r.data?.message != 'ok') throw new Error('Network Error')
          
          const roles = []
          if (r.data.roles[0]) {
            roles.push(`select::${r.data.roles[0].name}`)
            if (r.data.roles[0].group_json) {
              roles.push(...r.data.roles[0].group_json)
            }
          }
          roles.push(`email::${r.data.user.email}`)

          r.data.roles = roles

          global.__USER_ROLES[req.session.id] = r.data
          return
        } catch (error) {
          console.log('Failed to fetch UserRole')
        }
      }

      if (!global.__USER_ROLES) global.__USER_ROLES = {}
      if (global.__USER_ROLES[req.session.id]) {
        setTimeout(refresh_role, 1000)
      } else {
        await refresh_role()
      }

      json.users = [
        {
          ...global.__USER_ROLES[req.session.id].user,
          user: global.__USER_ROLES[req.session.id].user,
          roles: global.__USER_ROLES[req.session.id].roles,
        }
      ]
      
      json.pages = json.pages.map(page => {
        if (page && page.path) {
          const menu = flatten_menus.find(e => e.path == page.path)
          if (menu && menu.roles) {
            const r = _.flatten([menu.roles.view])
            if (_.intersection(r, global.__USER_ROLES[req.session.id].roles).length === 0) {
              page.blocks = []
            }
          }
        }
        return page
      })
    }

    const clean_yaml_id = (e) => {
      e._id = undefined
      e._idx = undefined
      return e
    }
    json.menus = (json.menus || []).map(clean_yaml_id)
    json.pages = (json.pages || []).map(clean_yaml_id)

    const team_env_config = req.team.env_config || {}
    if (team_env_config.modes) {
      team_env_config.modes = team_env_config.modes.filter(e => {
        return e.mode == (req.query.mode || "production")
      })
    }

    // hide
    json.resources = []
  

    res.status(200).json({
      message: 'ok',
      team_id: req.team.id,
      team_domain: req.team.domain,
      team_flag_config: req.team.flag_config || {},
      team_plan: req.team.plan || '',
      team_env_config,
      // team_apply_date: billing_method.apply_date,
      'select-configuration': json,
      yml: String(cached_json || '').trim().length, // sample 체크에만 쓰는중
      cached_error,
    })
    
  } catch (e) {
    error(e.stack)
    next(e)
  }
})

router.get('/public', async (req, res, next) => {
  try {
    const team = global.__TEAM
    const cached_json = await State.get(`admin.${team.id}.yaml`)
    let cached_error = await State.get(`admin.${team.id}.error`)
    try {
      cached_error = JSON.parse(cached_error || '[]') || []
    } catch (error) {
      debug(error)
    }
    const json = JSON.parse(cached_json || '{}') || {}

    // filter public pages

    const clean_sql = (block, use_sqlType = true) => {
      if (block.sql) {
        if (use_sqlType && !block.sqlType) {
          const _resource = json.resources.find(e => e.name == block.resource)
          const resource_type = _resource && _resource.type || 'mysql'

          const sql = block.sql
            .replace(/::([A-Za-z]+)/g, ``)
            .replace(/:(\.\.\.)?([A-Za-z0-9_.]+)/g, `''`)
            .replace(/\{\{(\s)?query(\s)?\}\}/g, `1=1`)
            .replace(/\{\{(\s)?orderBy(\s)?\}\}/g, ``)

          try {
            const ast = parser.astify(sql, {
              database: {
                'mysql': 'mysql',
                'postgres': 'postgresql',
                // 'bigquery': 'bigquery',
                // 'db2': 'db2',
                // 'hive': 'hive',
                // 'mariadb': 'mariadb',
                // 'sqlite': 'sqlite',
                // 'transactsql': 'transactsql',
                // 'flinksql': 'flinksql',
                'mssql': 'transactsql',
              }[resource_type]
            })
            block.sqlType = String(ast.type).toLowerCase()
          } catch (error) {
            debug('failed to astify', error.message, '\n\n', sql, '\n\n')
            block._sqlType = 'astify failed'
            // empty
          }
        }
        block.sql = '***'
      }
      if (block.sqlWith) {
        block.sqlWith = block.sqlWith.map(e => {
          if (e.id) e.id = '***'
          if (e.gid) e.gid = '***'
          if (e.query) e.query = '***'
          return clean_table_block(e)
        })
      }
      if (block.sqlTransaction) {
        block.sqlTransaction = block.sqlTransaction.map(clean_sql)
      }
      return block
    }
    const clean_table_block = (block) => {
      if (block.params) {
        block.params = block.params.map(param => {
          if (param.datalistFromQuery) {
            param.datalistFromQuery = clean_sql(param.datalistFromQuery, false,)
          }
          if (param.defaultValueFromQuery) {
            param.defaultValueFromQuery = clean_sql(param.defaultValueFromQuery, false)
          }
          if (param.query) {
            for (const key of Object.keys(param.query)) {
              if (param.query[key]) param.query[key] = '***'
            }
          }
          if (param.orderBy) {
            for (const key of Object.keys(param.orderBy)) {
              if (param.orderBy[key]) param.orderBy[key] = '***'
            }
          }
          if (param.valueFromQuery) {
            param.valueFromQuery = clean_sql(param.valueFromQuery, false)
          }
          if (param.value === undefined) {
            param.value = ''
          }
          return param
        })
      }
      if (block.actions) {
        block.actions = block.actions.map(clean_block)
      }
      if (block.viewModal) {
        if (block.viewModal.blocks) {
          block.viewModal.blocks = block.viewModal.blocks.map(clean_block)
        }
      }
      if (block.tabOptions) {
        if (block.tabOptions.tabs) {
          block.tabOptions.tabs = block.tabOptions.tabs.map(tab => {
            if (tab.blocks) {
              tab.blocks = tab.blocks.map(clean_block)
            }
            return tab
          })
        }
      }
      if (block.columns) {
        for (const key of Object.keys(block.columns)) {
          if (block.columns[key]) {
            if (block.columns[key].updateOptions) {
              block.columns[key].updateOptions = clean_block(block.columns[key].updateOptions)
            }
            if (block.columns[key].datalistFromQuery) {
              block.columns[key].datalistFromQuery = clean_sql(block.columns[key].datalistFromQuery, false)
            }
            if (block.columns[key].defaultValueFromQuery) {
              block.columns[key].defaultValueFromQuery = clean_sql(block.columns[key].defaultValueFromQuery, false)
            }
          }
        }
      }
      if (block.columnOptions) {
        block.columnOptions = block.columnOptions.map(columnOption => {
          if (columnOption.updateOptions) {
            columnOption.updateOptions = clean_block(columnOption.updateOptions)
          }
          if (columnOption.datalistFromQuery) {
            columnOption.datalistFromQuery = clean_sql(columnOption.datalistFromQuery, false)
          }
          if (columnOption.defaultValueFromQuery) {
            columnOption.defaultValueFromQuery = clean_sql(columnOption.defaultValueFromQuery, false)
          }
          return columnOption
        })
      }
      return block
    }
    const clean_http = (block) => {
      if (block && block.axios) {
        const json = JSON.stringify(block.axios)
        
        let _evals = json.match(/\{\{(.*?)\}\}/gm)
        if (_evals) {
          _evals = _evals.map(e => {
            return JSON.parse(`"${e.slice(2, -2)}"`)
          })
        }
        // debug(_evals)
        block.axios = {
          method: block.axios.method,
          methodType: block.axios.methodType,
          _evals,
        }
      }
      return block
    }
    const clean_block = (block) => {
      if (!block) return block
      if (block.type == 'query') return clean_table_block(clean_sql(block))
      if (block.type == 'http') return clean_table_block(clean_http(block))
      if (['left', 'right', 'center', 'top', 'bottom'].includes(block.type)) {
        if (block.blocks) {
          block.blocks = block.blocks.map(clean_block)
        }
      }
      return clean_table_block(block)
    }
    if (json.pages) {
      json.pages = json.pages.map(page => {
        if (page.blocks) {
          page.blocks = page.blocks.map(clean_block)
        }
        return page
      })

      const menus = json.menus.map(e => {
        return [].concat((e.menus || []), (e.menus || []).map(e => {
          return [].concat((e.menus || []), (e.menus || []).map(e => {
            return e.menus || []
          }))
        }))
      })
      const flatten_menus = _.flatten(_.flatten([].concat(menus, json.menus)))
      json.users = [
        
      ]
      
      json.pages = json.pages.filter(page => page.public === true)
    }

    const clean_yaml_id = (e) => {
      e._id = undefined
      e._idx = undefined
      return e
    }
    json.menus = []
    json.pages = (json.pages || []).map(clean_yaml_id)

    // const team_env_config = team.env_config || {}
    // if (team_env_config.modes) {
    //   team_env_config.modes = team_env_config.modes.filter(e => {
    //     return e.mode == (req.query.mode || "production")
    //   })
    // }

    // hide
    json.resources = []
  

    res.status(200).json({
      message: 'ok',
      
      // team_id: req.team.id,
      // team_domain: req.team.domain,
      // team_flag_config: req.team.flag_config || {},
      // team_plan: req.team.plan || '',
      // team_env_config,
      // // team_apply_date: billing_method.apply_date,
      'select-configuration': json,
      // yml: String(cached_json || '').trim().length, // sample 체크에만 쓰는중
      // cached_error,
    })
    
  } catch (e) {
    error(e.stack)
    next(e)
  }
})

module.exports = router