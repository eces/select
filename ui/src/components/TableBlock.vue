<style lang="sass" scoped>
.col-value
  word-break: break-word
</style>
<template lang="pug">
div
  div(v-for='(block, i) in blocks')
    div(v-if='block.type == "query"')
      template(v-if='block.sql.startsWith("UPDATE") || block.sql.startsWith("update")')
        .p-2.bg-light(v-if='block.name' style='margin-top: -1px'): strong.text-muted: small {{block.name}}
        div.alert.alert-light.border(v-if='$store.state.admin.active') 
          code: pre.mb-0 {{block.sql | sql}}
        form.p-2.mb-2(
          @submit.prevent='get_query_update(block, i)'
        )
          div.mb-3(v-for='param in block.params' v-if='!param.valueFromRow')
            label.d-block.pb-1: strong.text-muted: small {{param.label}}
            input.form-control(:type='param.format' v-model='param.value')
          .mt-2
          button.btn.btn-light.text-primary.border(type='submit' v-show='!block.autoload && block.params') 실행
          div.alert.alert-light.mt-1(v-if='block.update_result && block.update_result.info') 
            strong {{block.update_result.info}}
            small.text-muted  ({{block.delay/1000}}초 소요)
      form(v-else @submit.prevent='get_query_result(block, i)')
        .d-flex
          div(v-for='param in block.params' v-if='!param.valueFromRow')
            label {{param.label}}
            input(:type='param.format' v-model='param.value' required)
          button.btn.btn-light.border(type='submit' v-show='!block.autoload && block.params') 조회
  
  div.alert.alert-light.border(v-if='error.code') 
    strong {{error.sqlMessage}}
    pre.mb-0: code {{error.sql | sql}}
  
  div(v-for='result in results')
    div.alert.alert-light.border(v-if='$store.state.admin.active') 
      code: pre.mb-0 {{result.block.sql | sql}}
    
    template(v-if='result.block.display == "col-2"')
      .d-flex.flex-wrap
        div.d-flex.border-bottom(v-for='(item, k) in result.rows[0]' v-if='item !== undefined' style='width: 50%')
          div.w-50.bg-light.text-muted.p-2
            strong: small {{k}}
          div.w-50.p-2.col-value 
            pre(v-if='item && isObject(item)'): code {{ item}}
            span(v-else) {{item}}
    
    template(v-else)
      .p-2.border-top(style='margin-top: -1px'): strong.text-muted: small {{result.name}}
      vue-good-table(
        :columns='result.cols'
        :rows='result.rows'
      )
        template(slot='table-row' slot-scope='props')
          span(v-if='props.column.field == "__조회__"')
            a(href='#' @click.prevent='open_modal(props.formattedRow, result.block_idx)') 조회
          span(v-else) 
            span(v-for='ref in blocks[result.block_idx].refs' v-if='ref.column == props.column.field')
              a(:href='`${ref.href}#${ encodeURIComponent(JSON.stringify({[ref.param]: props.formattedRow[props.column.field]})) }`' target='_blank') {{props.formattedRow[props.column.field]}}
            span(v-else) {{props.formattedRow[props.column.field]}}
</template>

<script>

import { uniqBy, keyBy, sortBy, groupBy, isObject } from 'lodash'
import Modal from '@/views/Modal.vue'

export default {
  name: 'TableBlock',
  props: ['row', 'blocks', 'page', 'depth', 'path'],
  components: {
    Modal,
  },
  computed: {
    
  },
  data() {
    return {
      cols: [],
      rows: [],
      results: {},
      error: {},
      current_block: {},
      count_block_names: 0,
    }
  },
  mounted() {
    this.load()
    const n = {}
    for (const b of this.blocks) {
      n[b.name] = true
    }
    this.count_block_names = Object.keys(n).length
    for (const i in this.blocks) {
      const block = this.blocks[i]
      if (block.autoload === true) {
        this.get_query_result(block, i)
      }
      block.params = (block.params || []).map(e => {
        if (e.defaultValueFromRow) {
          e.value = this.row[e.defaultValueFromRow]
        }
        return e
      })
    }
  },
  methods: {
    isObject,
    async get_query_update(block, i) {
      if (block.type != 'query') {
        return console.log('non query block request; canceled.')
      }
      if (!block.sql) {
        return console.log('query block sql empty; canceled.')
      }
      if (!block.sql.startsWith('update') && !block.sql.startsWith('UPDATE')) {
        return console.log('update query for not starting with UPDATE; canceled.')
      }
      try {
        for (const param of block.params) {
          if (param.valueFromRow) {
            this.$set(param, 'value', this.row[param.valueFromRow])
          }
        }
        const params = {}
        params.path = `${this.path}.blocks.${i}`
        
        const time_s = Date.now()
        const r = await this.$http.post('/api/block/query', {
          fields: block.params,
        }, {
          params,
        })
        const time_e = Date.now()
        if (r.data?.message != 'ok') {
          this.error = r.data.error
          return
        } else {
          this.error = {}
        }
        this.$set(block, 'update_result', r.data.rows)
        this.$set(block, 'delay', time_e - time_s)
      } catch (error) {
        console.log(error)
      }
    },
    async get_query_result(block, i) {
      if (block.type != 'query') {
        return console.log('non query block request; canceled.')
      }
      if (!block.sql) {
        return console.log('query block sql empty; canceled.')
      }
      if (!block.sql.startsWith('select') && !block.sql.startsWith('SELECT')) {
        return console.log('select query result for not starting with SELECT; canceled.')
      }
      try {
        for (const param of block.params) {
          if (param.valueFromRow) {
            this.$set(param, 'value', this.row[param.valueFromRow])
          }
        }
        const params = {}
        params.path = `${this.path}.blocks.${i}`
        
        const r = await this.$http.post('/api/block/query', {
          fields: block.params,
        }, {
          params,
        })
        if (r.data?.message != 'ok') {
          this.error = r.data.error
          return
        } else {
          this.error = {}
        }
        if (!this.results[block.name]) {
          this.results[block.name] = {
            name: block.name,
            cols: [],
            rows: [],
            block,
          }
        }
        if (r.data.rows?.length > 0) {
          this.results[block.name].cols = Object.keys(r.data.rows[0]).map(e => {
            const v = r.data.rows[0][e]
            let type = undefined
            if (isFinite(+v)) type = 'number'
            else if (v === true || v === false) type = 'boolean'
            return {
              label: e,
              field: e,
              type,
            }
          })
          this.results[block.name].rows = r.data.rows
          this.results[block.name].block_idx = i
        }
      } catch (error) {
        console.log(error)
      }
    },
    open_modal(row, block_idx) {

      this.$modal.show(
        Modal,
        {
          page: this.page,
          depth: this.depth + 1,
          modal_block_idx: block_idx,
          row: Object.assign({}, row, {
            '__조회__': undefined
          }),
        },
        {
          scrollable: true,
          height: 'auto',
          transition: 'none',
        }
      )
    },
    async load() {
      
    },
  }
}
</script>
