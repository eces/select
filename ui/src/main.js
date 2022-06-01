import Vue from 'vue'
import App from './App.vue'
import router from './router'

import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  Vue,
  dsn: "https://2e24eeaf0dde4e699b0ebf4016a75a33@o1100664.ingest.sentry.io/6168586",
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracingOrigins: ["localhost", /^\//],
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

Vue.config.productionTip = false

import './bootstrap.sass'
import './main.sass'

import $http from './http'

import Vuex from 'vuex'
import Store from './store'
Vue.use(Vuex)
Vue.prototype.$store = Store.create()
Vue.use(Store.visibilityChange)
Vue.prototype.$http = $http

import moment from 'moment'
import numeral from 'numeral'

import VueGoodTablePlugin from 'vue-good-table';

// import the styles
import 'vue-good-table/dist/vue-good-table.css'

// Vue.use(VueGoodTablePlugin);

import VModal from 'vue-js-modal'
Vue.use(VModal)

import "vue-simple-context-menu/dist/vue-simple-context-menu.css";
import VueSimpleContextMenu from "vue-simple-context-menu";

Vue.component("vue-simple-context-menu", VueSimpleContextMenu);

import { format as formatSQL } from 'sql-formatter'
import {marked} from 'marked'
import sanitizeHtml from 'sanitize-html';

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

Vue.filter('datetimeA', value => {
  if (!value) return ''
  return moment(value).format('YYYY-MM-DD h:mm A')
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
  try {
    return formatSQL(value, {
      // uppercase: true,
    }).trim()
  } catch (error) {
    console.log(error)
    return value
  }
})

Vue.filter('number', value => {
  if (!value) return ''
  return numeral(value).format('0,0')
})

Vue.filter('sanitizeHtml', value => {
  if (!value) return ''
  return sanitizeHtml(value)
})

import VueI18n from 'vue-i18n'
Vue.use(VueI18n)

import messages from './i18n/messages'

const i18n = new VueI18n({
  locale: 'en',
  messages,
})

new Vue({
  i18n,
  router,
  render: h => h(App)
}).$mount('#app')

// redeploy