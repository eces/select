import Vuex from 'vuex'
import $http from './http'

const delay = ms => new Promise(_ => setTimeout(_, ms))

const store = {
  state: {
    session: {},
    config: {},
    admin: {},
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
    async session(context) {
      try {
        if (context.state.session.checked) return true

        for (let i = 0; i < 3; i++) {
          try {
            $http.defaults.headers.common['Authorization'] = `Bearer ${window.localStorage.SELECT1_TOKEN}`
            const r = await $http.get('/api/auth/me')
            if (r?.data?.message != 'ok') {
              if (String(r?.data?.error).includes('Name=signed')) {
                return new Error(r?.data?.error || '인증된 계정만 이용 가능합니다.')
              }
              throw new Error('retry')
            }

            const {token, session} = r.data

            window.localStorage.SELECT1_TOKEN = token

            session.checked = true
            session.loaded = true
            context.commit('session', session)
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
        const session = {loaded: true}
        context.commit('session', session)

        console.log(error)
        throw error
      }
    },

    'clear session'(context) {
      window.localStorage.SELECT1_TOKEN = ''
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
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // public
        }
      })
    },
  },
}
