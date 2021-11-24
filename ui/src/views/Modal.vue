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
  .p-2
    button.btn.btn-light.text-success(type='button' v-if='$store.state.admin.active') 관리자
    .d-flex.flex-wrap(v-if='block.viewModal && block.viewModal.displayParentRow !== false')
      div.d-flex.border-bottom(v-for='(item, k) in row' v-if='item' style='width: 50%')
        div.w-50.bg-light.text-muted.p-2
          strong: small {{k}}
        div.w-50.p-2.col-value 
          pre(v-if='item && item[0] == "{" && item[item.length-1] == "}"'): code {{item}}
          span(v-else) {{item}}
    .pb-2.border-top(style='margin-top: -1px; height: 1px') &nbsp;
    template(v-if='mode == "edit"')
      template(v-if='block.editModal')
        table-block(:blocks='block.editModal.blocks' :row='row' :page='page' :depth='depth' :modal_block_idx='modal_block_idx' :path='`${path}.viewModal`')
    template(v-else)
      template(v-if='block.viewModal')
        table-block(:blocks='block.viewModal.blocks' :row='row' :page='page' :depth='depth' :modal_block_idx='modal_block_idx' :path='`${path}.viewModal`')

</template>

<script>

import TableBlock from '@/components/TableBlock.vue'

export default {
  name: 'Modal',
  props: ['page', 'row', 'block', 'depth', 'modal_block_idx', 'path', 'mode'],
  components: {
    TableBlock,
  },
  computed: {
    
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
  },
  methods: {
    
    async load() {
      
    },
  }
}
</script>
