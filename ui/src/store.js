import Vuex from 'vuex'
import $http from './http'
import uniq from 'lodash/uniq'
import compact from 'lodash/compact'
import flatten from 'lodash/flatten'
import {sortBy, keyBy} from 'lodash'
import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";

Sentry.init({
  dsn: "https://2e24eeaf0dde4e699b0ebf4016a75a33@o1100664.ingest.sentry.io/6168586",
  integrations: [new Integrations.BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const delay = ms => new Promise(_ => setTimeout(_, ms))

const store = {
  state: {
    session: {},
    config: {},
    admin: {},
    teams: [],
    teams_by_id: {},
    tables: {},
    table_info_kv: {},
    teamrows_kv: {},
    menu: {},
    locked: false,
    is_admin: false,
  },
  mutations: {
    session(state, session) {
      console.log('session loaded')
      state.session = session
    },
    config(state, config) {
      console.log('config loaded')
      state.config = config
    },
    admin(state, admin) {
      console.log('admin loaded')
      state.admin = admin
    },
    teams(state, teams) {
      console.log('teams loaded')
      state.teams = [...teams]
      state.teams.loaded = true
      state.teams_by_id = {...state.teams_by_id, ...keyBy(teams, 'team.id')}
    },
    // 'teams.one'(state, [teamid, team]) {
    //   console.log('teams.one loaded')
    //   const teams = state.teams.map(e => {
    //     if (e.team.id == team.id) return team
    //     return e
    //   })
    //   state.teams = teams
    //   state.teams_by_id = keyBy(teams, 'team.id')
    // },
    tables_by_teamrow(state, [teamrow_id, tables]) {
      console.log('tables_by_teamrow loaded')
      state.tables[teamrow_id] = tables
    },
    table_info(state, [k, v]) {
      console.log('table_info loaded', k, v)
      state.table_info_kv[k] = v
      console.log('table_info loaded', state.table_info_kv)
    },
    teamrows_kv(state, [k, v]) {
      console.log('teamrows_kv loaded', [k, v])
      // state.teamrows_kv[k] = v
      state.teamrows_kv = { ...state.teamrows_kv, [k]: v}
    },
    menu(state, [v]) {
      console.log('menu loaded', [v])
      // state.teamrows_kv[k] = v
      state.menu = v
    },
    locked(state, v) {
      console.log('locked', v)
      state.locked = v
    },
    is_admin(state, v) {
      console.log('is_admin', v)
      state.is_admin = v
    },
  },
  actions: {
    config(context) {
      return new Promise(async (resolve, reject) => {
        try {
          const r = await $http.get(`/api/config/json`)
          if (r?.data?.message != 'ok') throw new Error(r?.data?.message || 'config 가져오기 실패')

          context.commit('config', r.data['select-configuration'])
          return resolve(true)
        } catch (error) {
          console.log('config @error', error)
          reject(error)
        }
      })
    },
    async config_cloud(context, {admin_domain}) {
      const r = await $http.get(`/api/team/${admin_domain}/config`, {
        
      })
      if (r?.data?.message != 'ok') throw new Error(r?.data?.message || 'config admin_domain 실패')
      context.commit('config', r.data['select-configuration'])
    },
    async config_edit(context, {team_id}) {
      const r = await $http.get(`/api/team/${team_id}/config`, {
        
      })
      if (r?.data?.message != 'ok') throw new Error(r?.data?.message || 'config edit 실패')
      context.commit('config', r.data)
    },
    async teams_config(context, {once = false} = {}) {
      if (once && context.state.teams.loaded) return
      const r = await $http.get(`/api/team`)
      if (r?.data?.message != 'ok') throw new Error(r?.data?.message || '팀 불러오기 실패')
      context.commit('teams', r.data.teams)
    },
    async menu(context, {team_id}) {
      const r = await $http.get(`/api/team/${team_id}/menu`)
      if (r?.data?.message != 'ok') throw new Error(r?.data?.message || 'menu get 실패')
      context.commit('menu', [r.data.row])
    },
    async teamrow_full(context, {team_id, teamrow_id}) {
      console.log({team_id, teamrow_id})
      const r = await $http.get(`/api/team/${team_id}/query/${teamrow_id}`)
      if (r?.data?.message != 'ok') throw new Error(r?.data?.message || 'teamrow get 실패')
      context.commit('teamrows_kv', [teamrow_id, r.data.row])
    },
    async table_info(context, {team_id, teamrow_id, tablename}) {
      console.log({team_id, teamrow_id, tablename})
      const r = await $http.post(`/api/team/${team_id}/resource/${teamrow_id}/table-columns`, {
        q: tablename,
      })
      if (r?.data?.message != 'ok') throw new Error(r?.data?.message || 'table columns 실패')
      console.log('>>3', r.data.rows)
      context.commit('table_info', [JSON.stringify([teamrow_id, tablename]), r.data.rows])
    },
    locked(context, value) {
      context.commit('locked', value)
    },
    // admin(context) {
    //   context.commit('config', r.data['select-configuration'])
    // },
    'force reload session'(context) {
      context.state.session.checked = false
      return context.dispatch('session', context)
    },
    async session(context) {
      try {
        if (context.state.session.checked) return true

        for (let i = 0; i < 3; i++) {
          try {
            $http.defaults.headers.common['Authorization'] = `Bearer ${window.localStorage.SELECT2_TOKEN}`
            const r = await $http.get('/api/auth/me')
            if (r?.data?.message != 'ok') {
              if (String(r?.data?.error).includes('Name=signed')) {
                return new Error(r?.data?.error || '인증된 계정만 이용 가능합니다.')
              }
              throw new Error('retry')
            }

            const {token, session, env, hostname} = r.data

            // refreshed token
            window.localStorage.SELECT2_TOKEN = token

            session.checked = true
            session.loaded = true
            session.roles_by_team_id = keyBy(session.roles, 'team_id')
            context.commit('session', session)
            
            Sentry.setUser({
              email: session.email,
              env,
              hostname,
            })

            return true
          } catch (error) {
            if (i >= 2) {
              throw new Error('로그인이 필요합니다. (4000)')
            }
            await delay(300)
            continue
          }
        }
      } catch (error) {
        // reset
        const session = {loaded: true}
        context.commit('session', session)

        console.log(error)
        throw error
      }
    },

    'clear session'(context) {
      window.localStorage.SELECT2_TOKEN = ''
      $http.defaults.headers.common['Authorization'] = ''
      context.state.session = {
        checked: false
      }
    },
  }
}

export default {
  create() {
    return new Vuex.Store(store)
  },
  visibilityChange: {
    install(Vue) {

      const check = async () => {
        // if (!window.localStorage.SELECT2_TOKEN) return
        
        try {
          // force recheck
          Vue.prototype.$store.state.session.checked = false
          const r = await Vue.prototype.$store.dispatch('session')

          if (Vue.prototype.$store.state.locked == 4000) {
            location.reload()
          }
          Vue.prototype.$store.commit('locked', false)
        } catch (error) {
          // already locked
          if (Vue.prototype.$store.state.locked) return

          Vue.prototype.$store.commit('locked', true)
        }
      }

      setInterval(check, 1000*60*5);

      document.addEventListener('visibilitychange', () => {
        console.log('hidden', document.hidden)
        // window['ysg:visibilitychange:once'] = true
        if (document.visibilityState === 'visible') {
          console.log('visible')
          // window['ysg:visibilitychange:once'] = true
          // public
          check()
        }
      })
    },
  },
}
