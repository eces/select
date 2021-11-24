import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from './views/Layout.vue'
import Page from './views/Page.vue'
import Login from './views/Login.vue'

import {flatten, compact} from 'lodash'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    meta: {
      sessionRequired: true,
    },
    children: [
      {
        path: ':page',
        component: Page,
        props: true,
      },
      {
        path: ':page/:subpage',
        component: Page,
        props: true,
      },
    ]
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})


router.beforeEach(async (to, from, next) => {
  if (to.matched.some(record => record.meta.sessionRequired)) {
    console.log('check signed')
    try {
      const r = await router.app.$store.dispatch('session')
      if (r === true) {
        const scopes = flatten(compact(to.matched.map(record => record.meta.scopeRequired)))
        if (scopes.length) {
          for (const scope of scopes) {
            if (!router.app.$store.state.session.scope.includes(scope)) {
              if (!router.app.$store.state.session.scope || router.app.$store.state.session.scope.length === 0) {
                return next({
                  name: 'signup.connect',
                })
              }
              alert('권한이 없습니다.')
              return next(false)
            }
          }
        }
        return next()
      } else {
        alert('로그인이 필요합니다.')
        return next({
          path: '/login',
        })
      }
    } catch (error) {
      alert(error.message)
      return next({
        path: '/login',
      })
    }
  }
  next()
})

export default router
