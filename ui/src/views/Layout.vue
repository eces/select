<style lang="sass" scoped>
// $primary: #273c75
$primary: #0D6EFD

.nav-left
  position: fixed
  top: 0px
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
  //  + 1px
  
.card
  width: 200px

.async-hover-done
  &:hover
    // box-shadow: 0 1rem 3rem rgba(0,0,0,.18) !important
    border-color: #777 !important
    .async-hover
      opacity: 1 !important
  .async-hover
    opacity: 0 !important
#locked-container
  position: fixed
  top: 0
  left: 0
  width: 100%
  height: 100%
  background-color: rgba(0,0,0,0.35)
  z-index: 9999
  .body
    margin: 5rem auto
    width: 300px
</style>
<template lang="pug">
div
  #locked-container(v-if='$store.state.locked')
    .body.bg-white.shadow.rounded.p-4
      template(v-if='$store.state.locked == 4000')
        h5.text-dark: strong 알림
        p.text-muted 로그인이 필요합니다.
        a.btn.btn-success.text-white.border-success.shadow-sm.w-100.py-2(href='/login' target='_blank') 새 창으로 로그인 열기
      template(v-else)
        h5.text-dark: strong 알림
        p.text-muted 자동으로 로그아웃 되었습니다.
        a.btn.btn-success.text-white.border-success.shadow-sm.w-100.py-2(href='/login' target='_blank') 새 창으로 로그인 열기
      //- a.btn.btn-success.text-white.border-success.shadow-sm.w-100.py-2(href='/login' target='_blank' style='border-radius: 0 0 3px 3px') 다시 로그인하기
  //- router-view(:key='`${$route.fullPath}`' v-if='loaded')
  router-view(v-if='loaded')
    

</template>

<script>

import { uniqBy, keyBy, sortBy, groupBy } from 'lodash'
// import Tiptap from '@/components/Tiptap.vue'
import { VueGoodTable } from 'vue-good-table';


export default {
  name: 'Layout',
  components: {

  },
  computed: {
    teams_by_id() {
      return groupBy(this.$store.state.session.roles, 'team_id')
    },
  },
  data() {
    return {
      loaded: false,
    }      
  },
  mounted() {
    console.log(process.env)
    this.load()
  },
  methods: {
    async load() {
      try {
        if (this.$route.path == '/') {
          // if (teams.length === 1) {
          //   this.$router.push({
          //     path: `/teams/${teams[0].team.id}`,
          //   })
          // } else {
          //   this.$router.push({
          //     path: '/teams',
          //   })
          // }
          if (this.$store.state.session?.id) {
            await this.$store.dispatch('config')

            this.$router.push({
              path: '/teams',
            })
          } else {
            this.$router.push({
              path: '/login',
            })
          }
        }
        this.loaded = true
        // this.rows = teams
      } catch (error) {
        alert(error.message)
      }
    },
  }
}
</script>
