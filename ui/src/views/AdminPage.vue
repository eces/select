<template lang="pug">
div(v-if='$route.path != "/"')
  div.bg-white.mt-2
    div.submenu.d-flex.px-2
      .item(v-for='menu in menus' v-if='menu.placement != "menu-only"')
        template(v-if='menu.target')
          a(:href='menu.path' :target='menu.target') {{menu.name}} 
            span (링크)
        template(v-else)
          router-link(:to='`/${menu.path}`') {{menu.name}}
    .page.p-2#page
      table-block(
        v-if='current_page && current_page.path'
        :blocks='current_page.blocks' :page='current_page' depth='1' :path='current_path' 
        :admin_domain='admin_domain'
        :show_log='$store.state.admin.active'
      )
      div.p-4(v-if='!menus.length || (current_menu.placement != "menu-only" && !current_page.path)')
        h1 404
        h5.text-muted.mb-3 페이지를 찾을 수 없습니다.
        button.btn.btn-light.border.shadow-sm(type='button' onclick='history.back()' v-show='hasHistory') 뒤로가기

</template>

<script>

import TableBlock from '@/components/TableBlock.vue'

export default {
  name: 'Page',
  props: ['page', 'admin_domain'],
  components: {
    TableBlock,
  },
  computed: {
    hasHistory() {
      return history.length > 1
    },
    current_menu() {
      return this.$store.state.config.menus.filter(e => e.path == this.page)[0] || {}
    },
    current_page() {
      const page = this.$store.state.config.pages.filter(e => e.path == [this.page].filter(Boolean).join('/'))[0] || {}
      if (!page.blocks) page.blocks = []
      // if (!page.blocks) page.blocks = []
      // page.blocks = page.blocks.map(e => {
      //   e.params = ee.params.map(ee => {
      //     ee.value = ''
      //     return 
      //   })
      //   for (const e)
      //   return e
      // })
      return page
    },
    current_path() {
      let found = null
      for(let i=0; i<this.$store.state.config.pages.length; i++) {
        const e = this.$store.state.config.pages[i]
        if (e.path == this.page) {
          found = i
          break 
        }
      }
      return found !== null && `pages.${found}`
    },
    menus() {
      // this.$store.state.config.menus
      if (!this.current_menu) return []
      // return groupBy(this.$store.state.config.menus, 'group')[this.current_menu.group]
      return this.$store.state.config.menus.filter(e => e.group == this.current_menu.group)
    },
  },
  data() {
    return {
      cols: [],
      rows: [],
      results: {},
      error: {},
      current_block: {},
      count_block_names: 0,
      gsheet_loading: [],
      http_loading: [],
    }
  },
  mounted() {
    if (this.current_menu?.redirect) {
      return this.$router.replace({
        path: `/${this.current_menu.redirect}`
      })
    }
    setTimeout(() => {
      document.title = this.current_menu.name || this.$store.state.config.title || '셀렉트 어드민'
    }, 100)
    setTimeout(() => {
      document.querySelector('#page input')?.focus()
    }, 300)
  },
  methods: {
    
  }
}
</script>
<style lang="sass" scoped>
$primary: #0D6EFD

.nav-left
  position: fixed
  top: 51px
  left: 0
  width: 250px
  height: calc(100vh - 50px)
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
.submenu
  background-color: #E4E4E4
  min-height: 40.5px
  line-height: 40px
  .item
    a
      color: #555
      text-decoration: none
      // font-weight: 500
      font-weight: bold
      font-size: 13px
      padding: 10px
      &:hover
        font-weight: bold
        color: $primary
      // &.router-link-active
      &.router-link-active
        color: $primary
        font-weight: bold
        border-bottom: solid 2px $primary
        
        // line-height: 50px
.page
  height: calc(100vh - 105px)
  overflow: scroll
.visible-hover-outer
  .visible-hover
    display: none !important
  &:hover
    .visible-hover
      display: inherit !important
</style>