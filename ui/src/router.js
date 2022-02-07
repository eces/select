import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from './views/Layout.vue'
import Login from './views/Login.vue'
import Page404 from './views/Page404.vue'
import LoginProcess from './views/LoginProcess.vue'
import ConnectProcess from './views/ConnectProcess.vue'
import AdminPage from './views/AdminPage.vue'
import AdminLayout from './views/AdminLayout.vue'

import {flatten, compact, intersection} from 'lodash'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/login/process',
    component: LoginProcess,
  },
  {
    path: '/connect/process',
    component: ConnectProcess,
  },
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    meta: {
      sessionRequired: true,
      // setup: 'teams_config',
      // setup: 'config',
    },
    children: [
      {
        path: '',
        component: AdminLayout,
        props: true,
        meta: {
          setup: ['config'],
        },
        children: [
          {
            path: ':page',
            component: AdminPage,
            props: true,
          },
          {
            path: ':page(.*)',
            component: AdminPage,
            props: true,
          },
        ]
      },
    ],
  },
  {
    path: ':any',
    component: Page404,
    props: true,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})


router.beforeEach(async (to, from, next) => {
  console.log('window.__unsaved_changes', window.__unsaved_changes)
  if (window.__unsaved_changes) {
    if (!confirm('저장하지 않은 내용이 있습니다. 페이지를 이동할까요?')) {
      return next(false)
    } else {
      // proceed
      window.__unsaved_changes = true 
    }
  }
  if (to.matched.some(record => record.meta.sessionRequired)) {
    console.log('check signed')
    try {
      const r = await router.app.$store.dispatch('session')
      if (r === true) {
        // segment identify

        const scopes = flatten(compact(to.matched.map(record => record.meta.requires_scope_any_of)))
        const teamscopes = scopes.map(e => {
          return `tid:${to.params.team_id}:${e}`
        })
        if (scopes.length) {
          console.log('>>>>', teamscopes)
          if (intersection(router.app.$store.state.session.scope, teamscopes).length === 0) {
            alert('권한이 없습니다.')
            // router.app.$store.commit('locked', 5000)
            return next({
              path: '/teams'
            })
          }
          // for (const scope of scopes) {
          // }
        }
        // const setup = to.meta.setup
        const setup = flatten(compact(to.matched.map(record => record.meta.setup)))
        console.log('setup', flatten(compact(to.matched.map(record => record.meta.setup))))
        if (setup) {
          try {
            const arr = [].concat(setup)
            for (const name of arr) {
              await router.app.$store.dispatch(name, Object.assign({
                once: true,
              }, to.params))
            }
          } catch (error) {
            console.log('router meta setup failed: ', error.stack)
          }
        }
        return next()
      } else {
        router.app.$store.commit('locked', 4000)
        // alert('로그인이 필요합니다.')
        // return next({
        //   path: '/login',
        // })
      }
    } catch (error) {
      console.log('router session validate:', error.message)
      router.app.$store.commit('locked', 4000)
      // return next({
      //   path: '/login',
      // })
    }
  }
  next()
})

export default router
