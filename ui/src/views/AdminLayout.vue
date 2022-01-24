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
    router-link.text-reset(:to='`/${admin_domain}`')
      strong.text-light.ms-3 {{this.$store.state.config.title || '셀렉트 어드민'}}
    .ms-auto.me-3.menu
      template(v-if='$store.state.is_admin')
        a.text-white.me-3(href='#' @click.prevent='admin_mode()') 로그표시
      a.text-white(href='#' @click.prevent='logout' title='클릭하여 로그아웃') {{$store.state.session.email}}
      //- router-link(:to='`/teams`') 
      //-   span.text-white(style='font-weight: normal') {{$store.state.session.email}}

  .nav-left.p-2
    //- button.btn.btn-light.text-success(type='button' v-if='$store.state.admin.active') 관리자
    .pt-2.bg-white
    div(v-for='menu in this.$store.state.config.menus')
      template(v-if='menu.type == "divider"')
        .pt-2.bg-white 
        .mt-2 
        .pt-2.bg-white 
      template(v-else)
        div.menu.bg-white(v-if='!menu.placement')
          //- pre.m-0(style='font-size: 11px') {{menu}}
          template(v-if='menu.target')
            a.px-3.py-2.d-block(:href='menu.path' :target='menu.target') {{menu.name}} 
              span.float-end (링크)
          template(v-else)
            router-link.px-3.py-2.d-block(:to='`/${menu.path}`') {{menu.name}}
          //- pre.m-0.text-end(style='font-size: 11px' v-if='$store.state.admin.active') {{menu.path}}
    .pt-2.bg-white
  .page-right
    router-view(:key='`${$route.fullPath}`' v-if='this.$store.state.config && this.$store.state.config.menus')
    

</template>

<script>

import { groupBy } from 'lodash'

export default {
  name: 'AdminLayout',
  props: ['admin_domain'],
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

    if (this.$store.state.session) {
      const roles = this.$store.state.session.roles.filter(e => {
        return +e.team_id == +this.admin_domain
      })
      const admin_roles = roles.filter(e => {
        return e.name == 'admin' || e.name == 'edit'
      })
      console.log('admin_roles', admin_roles)
      if (admin_roles.length) {
        this.$store.commit('is_admin', true)
      } else {
        this.$store.commit('is_admin', false)
      }
    }
  },
  methods: {
    admin_mode() {
      this.$store.commit('admin', {
        // ...this.$store.state.admin,
        active: !this.$store.state.admin.active,
      })
    },
    async load() {
      // this.$store.dispatch('config')
      // try {
      //   const r = await this.$http.post(`/api/team/${this.admin_domain}/resource/warm-pool`, {
          
      //   })
      //   if (r?.data?.message != 'ok') throw new Error(r?.data?.message || 'warm pool 실패')
      //   console.log('warm pool ok')
      // } catch (error) {
      //   console.log(error.message)
      // }
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
