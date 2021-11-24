<style lang="sass" scoped>
$primary: #0D6EFD

.nav-left
  position: fixed
  top: 50px
  left: 0
  width: 250px
  height: 100vh
  overflow: scroll
  .menu
    a
      color: #555
      text-decoration: none
      font-weight: 500
      font-size: 13px
      &:hover
        color: $primary
        font-weight: bold
      &.router-link-active
        font-weight: bold
.nav-top
  line-height: 50px
  .menu
    a
      color: #555
      text-decoration: none
      font-weight: 500
      font-size: 13px
      &:hover
        font-weight: bold
.page-right
  margin-left: 250px
</style>
<template lang="pug">
div
  div.bg-dark.nav-top.d-flex
    strong.text-light.ms-3 {{this.$store.state.config.title || '셀렉트 어드민'}}
    .ms-auto.me-3.menu
      a.text-white.me-3(href='#' @click.prevent='admin_mode()') 관리자
      a.text-white(href='#' @click.prevent='logout') 로그아웃

  .nav-left.p-2
    button.btn.btn-light.text-success(type='button' v-if='$store.state.admin.active') 관리자
    .pt-2.bg-white
    div(v-for='menu in this.$store.state.config.menus')
      template(v-if='menu.type == "divider"')
        .pt-2.bg-white 
        .mt-2 
        .pt-2.bg-white 
      template(v-else)
        div.menu.bg-white(v-if='!menu.placement')
          template(v-if='menu.target')
            a.px-3.py-2.d-block(:href='menu.path' :target='menu.target') {{menu.name}} 
              span.float-end (링크)
          template(v-else)
            router-link.px-3.py-2.d-block(:to='`/${menu.path}`') {{menu.name}}
    .pt-2.bg-white
  .page-right
    router-view(:key='`${$route.fullPath}`' v-if='this.$store.state.config && this.$store.state.config.menus')
    

</template>

<script>

import { groupBy } from 'lodash'

export default {
  name: 'Layout',
  components: {
    
  },
  computed: {
    menu_groups() {
      return groupBy(this.$store.state.config.menus, 'group')
    },
  },
  data() {
    return {
      
    }
  },
  mounted() {
    console.log(process.env)
    this.load()
  },
  methods: {
    admin_mode() {
      this.$store.commit('admin', {
        active: !this.$store.state.admin.active,
      })
    },
    load() {
      this.$store.dispatch('config')
    },
    logout() {
      this.$store.dispatch("clear session")
      if (process.env.NODE_ENV == 'production' && process.env.VUE_APP_CF_LOGOUT) {
        document.location = '/cdn-cgi/access/logout'
      } else {
        document.location = '/login'
      }
    },
  }
}
</script>
