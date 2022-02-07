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
      &.router-link-exact-active
        color: $primary
        font-weight: bold
        border-bottom: solid 2px $primary
        
        // line-height: 50px
.page
  height: calc(100vh - 110px)
  overflow: scroll

.col-value
  word-break: break-word
</style>
<template lang="pug">
div
  .border-bottom
    .float-end
      button.btn.btn-default(@click='$modal.hide(`modal${depth}`)') 닫기 &times;
    .clearfix
    button.btn.btn-light.text-success(type='button' v-if='$store.state.admin.active') 관리자
  .d-flex.flex-wrap(v-if='block.viewModal && block.viewModal.displayParentRow !== false')
    div.d-flex.border-bottom(v-for='(item, k) in row' v-if='item' style='width: 50%')
      div.w-50.bg-light.text-muted.p-2
        strong: small {{k}}
      div.w-50.p-2.col-value 
        pre(v-if='item && item[0] == "{" && item[item.length-1] == "}"'): code {{item}}
        span(v-else) {{item}}
  .p-2
    //- .pb-2.border-top(style='margin-top: -1px; height: 1px') &nbsp;
    .pb-2 
    //- table-block(:blocks='(page.modal ? page.modal.blocks : page.blocks)' :row='row' :page='page')
    //- pre {{block}}
    template(v-if='block.viewModal')
      table-block(:blocks='block.viewModal.blocks' :row='row' :row_json='row_json' :page='block.viewModal' :depth='depth' :modal_block_idx='modal_block_idx' :path='`${path}.viewModal`' :admin_domain='admin_domain')
  
  //- pre {{page}} {{path}}
  //- pre {{current_page}}
  //- pre {{row}}
  //- pre {{page.modal}}

</template>

<script>

import { uniqBy, keyBy, sortBy, groupBy, get } from 'lodash'
// import Tiptap from '@/components/Tiptap.vue'
// import TableBlock from '@/components/TableBlock.vue'

import { VueGoodTable } from 'vue-good-table';

export default {
  name: 'AdminModal',
  props: ['page', 'row', 'block', 'depth', 'modal_block_idx', 'path', 'admin_domain', 'row_json'],
  components: {
    // Tiptap,
    VueGoodTable,
    TableBlock: () => import('@/components/TableBlock.vue'),
  },
  computed: {
    // current_page() {
    //   return _.get(this.page, this.path)
    // }
  },
  data() {
    return {
      cols: [],
      rows: [],
      error: {},
    }
  },
  mounted() {
    this.load()
    // for (const i in this.current_page.blocks) {
    //   const block = this.current_page.blocks[i]
    //   console.log(block)
    //   if (block.autoload === true) {
    //     this.get_query_result(block, i)
    //   }
    // }
  },
  methods: {
    
    async load() {
      // this.$store.dispatch('config')
      
    },
  }
}
</script>
