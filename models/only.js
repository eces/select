const debug = require('debug')('select:only')
const jwt = require('jsonwebtoken')
const { getConnection } = require('typeorm')
const parseDuration = require('parse-duration')
const ipcidr = require('ip-cidr')
const UserProfile = require('./UserProfile')
const Team = require('./Team')

const axios = require('axios')
const $http = axios.create({
  withCredentials: false,
  timeout: 30000,
  baseURL: global.__API_BASE,
  headers: {
    Authorization: `Bearer ${process.env.TOKEN}`
  },
})

const id = () => {
  return function (req, res, next) {
    if (req.is_session_from_hash) {
      return next()
    }
    const parts = (req.get('authorization') || '').split(' ')
    const token = parts.length > 1 && parts[1]
    if (!token) {
      return next(new StatusError(403, '로그인이 필요합니다. #1000'))
    }
    try {
      req.session = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN || 'secretAccessToken')
      // for sentry
      req.user = {
        id: req.session.id,
        email: req.session.email,
      }
      // global.Bugsnag && global.Bugsnag.setUser(req.session.id, req.session.email)
      next()
    } catch (error) {
      debug(error)
      if (error.message == 'jwt malformed') {
        return next(new StatusError(403, `다시 로그인이 필요합니다. #1101`))  
      }
      // global.Bugsnag && global.Bugsnag.notify(error)
      return next(new StatusError(403, `세션 오류 #1100`))
    }
  }
}

const id_optional = () => {
  return function (req, res, next) {
    const parts = (req.get('authorization') || '').split(' ')
    const token = parts.length > 1 && parts[1]
    if (!token) {
      return next()
    }
    try {
      req.session = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN || 'secretAccessToken')
      // for sentry
      req.user = {
        id: req.session.id,
        email: req.session.email,
      }
      // global.Bugsnag && global.Bugsnag.setUser(req.session.id, req.session.email)
      next()
    } catch (error) {
      // global.Bugsnag && global.Bugsnag.notify(error)
      return next()
    }
  }
}

const scope = (scope) => {
  return function (req, res, next) {
    if (req.is_session_from_hash) {
      return next()
    }
    
    const parts = (req.get('authorization') || '').split(' ')
    const token = parts.length > 1 && parts[1]
    if (!token) {
      return next(new StatusError(403, '로그인이 필요합니다. #1000'))
    }
    try {
      req.session = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN || 'secretAccessToken')
      // for sentry
      req.user = {
        id: req.session.id,
        email: req.session.email,
      }
      // global.Bugsnag && global.Bugsnag.setUser(req.session.id, req.session.email)
            
      if (!req.session.scope || !req.session.scope.includes(scope)) 
        throw new Error('scope required')
      
      next()
    } catch (error) {
      return next(new StatusError(403, `권한이 없습니다. Name=${scope} #2000`))
    }
  }
}

// any
const teamscope_any_of = (...scopes) => {
  return function (req, res, next) {
    try {
      if (!req.team.id) throw new Error('team not loaded')
      const teamscopes = scopes.map(scope => `tid:${req.team.id}:${scope}`)
      if (!req.session.scope) req.session.scope = []
      if (!req.session.scope || _.intersection(req.session.scope, teamscopes).length == 0) 
        throw new Error('scope required')
      next()
    } catch (error) {
      return next(new StatusError(403, `권한이 없습니다. 해당 권한: [${scopes.join(', ')}] 문의코드 #2000`))
    }
  }
}

const roles_any_of = (...scopes) => {
  return function (req, res, next) {
    try {
      if (!req.queryrow_roles) throw new Error('queryrow_roles not loaded')

      const roles = []
      for (const role of req.queryrow_roles) {
        if (role.user_id == 0 || role.user_id == req.session.id) {
          roles.push(role.name)
        }
      }
      req.queryrow_roles_names = roles
      if (!roles || _.intersection(roles, scopes).length == 0) 
        throw new Error('queryrow roles scope required')
      
      next()
    } catch (error) {
      return next(new StatusError(403, `권한이 없습니다. 해당 권한: [${scopes.join(', ')}] 문의코드 #2001`))
    }
  }
}

// const menu = () => {
//   return async function (req, res, next) {
//     try {
//       const admin_domain = String(req.query.admin_domain || '')
//       const master = await getConnection('mysql.master')

//       const id = +admin_domain || 0
//       const menu = await master.createQueryBuilder()
//         .select('*')
//         .from('TeamRow')
//         .where('id = :id AND `type` = "MENU" ', {
//           id,
//         })
//         .andWhere('commit_at IS NOT NULL')
//         .getRawOne()
//       if (!menu.id) throw StatusError(400, 'admin page not found')
//       const team_id = menu.team_id // from session or selector

//       const roles = await master.createQueryBuilder()
//         .select('*')
//         .from('UserRole')
//         .where('user_id = :uid', {
//           uid: req.session.id,
//         })
//         .getRawMany()

//       if (roles.length == 0) throw StatusError(400, 'no roles access')

//       let has_role = false
//       for (const role of roles) {
//         if (role.team_id == team_id) {
//           has_role = true
//           break
//         }
//       }
//       if (!has_role) throw StatusError(400, 'no roles access')

//       req.menu = menu
//       next()
//     } catch (error) {
//       return next(error)
//     }
//   }
// }

const menu = () => {
  // block, admin 쪽에만 쓰임
  return async function (req, res, next) {
    if (req.is_session_from_hash) {
      return next()
    }
    
    try {
      const admin_domain = String(req.query.admin_domain || '')

      const team_id = +admin_domain || 0
      
      let roles = []
      let user
      {
        const r = await $http({
          method: 'GET',
          url: '/cli/UserRole/get',
          params: {
            user_id: req.session.id,
            // tid: team_id,
          },
          headers: {
            Authorization: `${process.env.TOKEN}`,
          },
          json: true,
        })
        if (r.data?.message != 'ok') throw new Error('Network Error')
        roles = r.data.roles
        user = r.data.user
      }
      if (roles.length == 0) throw StatusError(400, 'no roles access')

      // let has_role = false
      // for (const role of roles) {
      //   if (role.team_id == team_id) {
      //     has_role = true
      //     break
      //   }
      // }
      // if (!has_role) throw StatusError(400, 'no roles access')

      req.menu = {
        team_id,
      }
      req.user_role = roles[0]

      // only after menu (for block/query)
      req.session.email = user.email
      req.session.name = user.name
      // global.Bugsnag && global.Bugsnag.setUser(req.session.id, req.session.email)
      next()
    } catch (error) {
      // global.Bugsnag && global.Bugsnag.notify(error)
      return next(error)
    }
  }
}

const hash = () => {
  return async function (req, res, next) {
    next()
    // try {
    //   const hash = String(req.query.admin_domain || '')
    //   const master = await getConnection('mysql.master')

    //   let team_share = await master.createQueryBuilder()
    //     .select('*')
    //     .from('TeamShare')
    //     .where('uuid = :hash', {
    //       hash,
    //     })
    //     .andWhere('deleted_at IS NULL')
    //     .getRawOne()
    //   if (!team_share) {
    //     return next()
    //     // throw StatusError(400, 'no share found')
    //   }
      
    //   if (!team_share.scope_json.allow_view_link) {
    //     throw StatusError(400, 'view not allowed')
    //   }

    //   req.team_share = team_share
      
    //   req.menu = {
    //     team_id: team_share.team_id,
    //   }
    //   req.user_role = [
    //     {
    //       id: 1,
    //       user_id: 5,
    //       name: 'view',
    //     }
    //   ]
      
    //   // only after menu (for block/query)
    //   if (!req.session) {
    //     req.session = {}
    //     req.session.email = 'guest@selectfromuser.com'
    //     req.session.id = 5
    //   }
    //   global.Bugsnag && global.Bugsnag.setUser(req.session.id, req.session.email)
      
    //   // pass other ids
    //   req.is_session_from_hash = true

    //   next()
    // } catch (error) {
    //   global.Bugsnag && global.Bugsnag.notify(error)
    //   return next(error)
    // }
  }
}

const expiration = () => {
  return async function (req, res, next) {
    try {
      const tid = String(req.query.admin_domain || req.team.id)
      let team = {}
      {
        const r = await $http({
          method: 'GET',
          url: '/cli/Team/get',
          params: {
            
          },
          headers: {
            Authorization: `${process.env.TOKEN}`,
          },
          json: true,
        })
        if (r.data?.message != 'ok') throw new Error('Network Error')
        team = r.data.team
      }
      if (!team) throw StatusError(400, 'team policy not found')
      team.env_config = team.env_config || {}
      const session_inactivity_timeout = team.env_config.session_inactivity_timeout || '72h'
      const session_max_expiration = team.env_config.session_max_expiration || '365d'
      // debug({
      //   session_inactivity_timeout,
      //   t1a: (Date.now() - req.session.refresh_ts),
      //   t1b: parseDuration(session_inactivity_timeout),
      //   t1: Date.now() - req.session.refresh_ts > parseDuration(session_inactivity_timeout),
      //   session_max_expiration,
      //   t2a: (Date.now() - req.session.initial_ts),
      //   t2b: parseDuration(session_max_expiration),
      //   t2: Date.now() - req.session.initial_ts > parseDuration(session_max_expiration),
      // })
      if (Date.now() - req.session.refresh_ts > parseDuration(session_inactivity_timeout)) {
        throw StatusError(400, 'session_inactivity_timeout')
      }
      if (Date.now() - req.session.initial_ts > parseDuration(session_max_expiration)) {
        throw StatusError(400, 'session_max_expiration')
      }

      const mode = req.get('user-mode') || req.query.mode || 'production'
      if (team.env_config.ip_cidr_enabled && team.env_config.ip_cidr && team.env_config.ip_cidr.length
        && mode != 'local'
      ) {
        const ip = req.ip
        let accepted = false
        for (const policy of team.env_config.ip_cidr) {
          if (policy.mode != mode) continue
          if (!ipcidr.isValidAddress(policy.cidr)) {
            // debug('invalid cidr', policy)
            continue
          }
          const cidr = new ipcidr(policy.cidr)
          if (cidr.contains(ip)) {
            // debug('accept cidr', policy)
            accepted = true
          }
        }
        if (!accepted) {
          throw StatusError(403, '접근 불가능한 네트워크 - 해당 사용자의 세션 IP 대역 오류 (rejected)')
        }
      }

      next()
    } catch (error) {
      // global.Bugsnag && global.Bugsnag.notify(error)
      return next(error)
    }
  }
}

module.exports = {
  scope, id, menu,
  teamscope_any_of,
  id_optional,
  roles_any_of,
  hash,
  expiration,
}