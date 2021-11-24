import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

import './bootstrap.sass'
import './main.sass'

import $http from './http'
import Vuex from 'vuex'
import Store from './store'

Vue.use(Vuex)
Vue.prototype.$store = Store.create()
Vue.prototype.$http = $http

import moment from 'moment'

import VueGoodTablePlugin from 'vue-good-table';
import 'vue-good-table/dist/vue-good-table.css'
Vue.use(VueGoodTablePlugin);

import VModal from 'vue-js-modal'
Vue.use(VModal)

import { format as formatSQL } from 'sql-formatter'
import {marked} from 'marked'

Vue.filter('datetime', value => {
  if (!value) return ''
  return moment(value).format('YYYY-MM-DD HH:mm')
})

Vue.filter('date', value => {
  if (!value) return ''
  return moment(value).format('YYYY-MM-DD')
})

Vue.filter('time', value => {
  if (!value) return ''
  return moment(value).format('h:mm A')
})

Vue.filter('ts_datetime', value => {
  if (!value) return ''
  return moment(value).format('YYYY-MM-DD HH:mm')
})

Vue.filter('fromDays', (value, postfix = '') => {
  if (!value) return ''
  return moment().diff(moment(value), 'day') + postfix
})

Vue.filter('decodeURIComponent', value => {
  if (!value) return ''
  return decodeURIComponent(value)
})
Vue.filter('marked', value => {
  if (!value) return ''
  return marked.parse(value)
})

Vue.filter('sql', value => {
  if (!value) return ''
  return formatSQL(value, {
    // uppercase: true,
  }).trim()
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')