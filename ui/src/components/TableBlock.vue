<style lang="sass" scoped>
.col-value
  word-break: break-word
.visible-hover-outer
  .visible-hover
    display: none !important
  &:hover
    .visible-hover
      display: inherit !important
.result-hover
  border: dashed 2px #fff 
  // margin: 0 -1rem
  padding: 0.5rem
  // margin: -0.5rem
  box-sizing: border-box !important
  &:hover
    border: dashed 2px #ccc
    // border-left: solid 5px #ccc

.mw-500
  max-width: 500px
</style>
<template lang="pug">
div
  div.mb-2(v-if='page.params && page.params.length')
    form(@submit.prevent='get_query_result_all()')
      //- pre {{page.params}}
      param-block(:params='page.params')
      button.btn.btn-light.text-primary.border(type='submit') 조회
      //- .d-flex
        div.d-flex(v-for='param in page.params' v-if='!param.valueFromEnv')
          label.text-muted.me-1(style='word-break: keep-all;'): strong: small {{param.label}}
          template(v-if='param.datalist')
            input.form-control.d-inline.me-1(:list='`${i}${param.label}`' v-model='param.value' :required='param.required')
            datalist(:id='`${i}${param.label}`')
              option(:value='label' v-for='label in param.datalist') {{label}}
          template(v-else-if='param.dropdown')
            select.form-control.d-inline.me-1(v-model='param.value' :required='param.required')
              option(:value='label' v-for='label in param.dropdown') {{label}}
          template(v-else)
            input.form-control.d-inline.me-1(:type='param.format' v-model='param.value' :required='param.required')
        button.btn.btn-light.text-primary.border(type='submit') 조회
  div(:class='page.containerClass + " done"' :style='page.containerStyle')
    div(v-if='result_loading' v-for='(block, i) in blocks')
      //- pre {{block}}
      div(v-if='block.type == "query"')
        template(v-if='block.sqlType == "update" || block.sqlType == "insert" ')
          //- pre {{block}}
          form.mb-2(
            :class='block.class || "mx-2 border rounded shadow-sm" '
            @submit.prevent='get_query_update(block, i)'
          )
            .p-2.bg-light(v-if='block.name' style='border-radius: 0.25rem 0.25rem 0 0'): strong.text-muted: small {{block.name}}
            .p-2
              div.alert.alert-light.border(v-if='block.error && block.error.code') 
                strong {{block.error.sqlMessage}}
                code: pre.mb-0.bg-light.p-1.text-wrap {{block.error.sql | sql}}
              div.alert.alert-light.border(v-if='show_log && block.update_result') 
                code: pre.mb-0.bg-light.p-1.text-wrap {{block.update_result.sql | sql}}
              div.alert.alert-light.border(v-else-if='show_log || $store.state.admin.active') 
                code: pre.mb-0.bg-light.p-1.text-wrap {{block.sql | sql}}
              
              param-block(:params='block.params')
              //- .d-flex
                div.mb-3.me-1(v-for='param in block.params' v-if='param.key && !param.valueFromRow && param.valueFromEnv != "true" ')
                  label.d-block.pb-1: strong.text-muted: small {{param.label || param.key || '&nbsp;'}}
                  input.form-control(:type='param.format' v-model='param.value' :required='param.required')

              button.btn.btn-light.border.me-1(type='submit') 
                span(v-show='block.sqlType == "update" ') 수정
                span(v-show='block.sqlType == "insert" ') 저장
              span.ms-2(v-if='block.datetime')
                span.mdi.mdi-check.text-success.me-1
                small.text-success.me-2 완료 {{block.datetime}}
                small.text-muted  ({{block.delay/1000}}초 소요)
              div.alert.alert-light.mt-1(v-if='block.update_result && block.update_result.info') 
                strong {{block.update_result.info}}
              //- div.alert.alert-light.mt-1(v-else-if='block.update_result && block.update_result.affectedRows') 
                strong.me-3 affectedRows: {{block.update_result.affectedRows}}
                strong.me-3 insertId: {{block.update_result.insertId}}
            
            .mt-2
        div(v-else)
          //- div.alert.alert-light.border(v-if='show_log || $store.state.admin.active') 
          //-   code: pre.mb-0.bg-light.p-1.text-wrap {{block.sql | sql}}
          form.p-2.mb-2(
            v-if='block.params && block.params.length > 0 '
            @submit.prevent='get_query_result(block, i)'
          )
            //- v-if='block.params.length > 0 || String(block.autoload) != "true" '
            param-block(:params='block.params')
            //- .d-flex(v-if='block.params.length > 0 ')
              div.mb-3(v-for='param in block.params' v-if='param.key && !param.valueFromRow && String(param.valueFromEnv || "") != "true" ')
                label.d-block.pb-1: strong.text-muted: small {{param.label || param.key || '&nbsp;'}}
                input.form-control(:type='param.format' v-model='param.value')
            button.btn.btn-light.border(type='submit' v-if='String(block.autoload) !== "true"') {{ block.label || '조회' }}
      div(v-else-if='block.type == "http"')
        template(v-if='block.axios && block.axios.method && ["POST", "PUT"].includes(block.axios.method.toUpperCase())')
          .p-2.bg-light(v-if='block.name' style='margin-top: -1px'): strong.text-muted: small {{block.name}}
          div.alert.alert-light.border(v-if='$store.state.admin.active') 
            code: pre.mb-0 {{block}}
          form.p-2.mb-2(
            v-if='block.params && block.params.length > 0 '
            @submit.prevent='!http_loading[i] && get_http_update(block, i)'
          )
            param-block(:params='block.params')
            //- div.mb-3(v-for='param in block.params' v-if='!param.valueFromRow && !param.valueFromEnv')
              label.d-block.pb-1: strong.text-muted: small {{param.label || param.key}}
              input.form-control(:type='param.format' v-model='param.value')
            .mt-2
            //- pre {{http_loading}}
            button.btn.btn-light.border(type='submit' v-show='!block.autoload && block.params') {{block.label || '실행'}}
              h5(style='width: 100px' v-show='http_loading[i]'): span.mdi.mdi-loading.mdi-spin
            div.alert.alert-light.mt-1(v-if='block.update_result') 
              pre {{block.update_result}}
              small.text-muted  ({{block.delay/1000}}초 소요)
              
        form.p-2.mb-2(v-else @submit.prevent='get_http_result(block, i)' v-if='block.params && block.params.length > 0 ')
          div.alert.alert-light.border(v-if='$store.state.admin.active') 
            code: pre.mb-0 {{block}}
          param-block(:params='block.params')
          //- .d-flex(v-if='block.params.length > 0 ')
            div.mb-3(v-for='param in block.params' v-if='param.key && !param.valueFromRow && String(param.valueFromEnv || "") != "true" ')
              label.d-block.pb-1: strong.text-muted: small {{param.label || param.key || '&nbsp;'}}
            
              template(v-if='param.datalist')
                input.form-control.d-inline.me-1(:list='`${i}${param.label}`' v-model='param.value' required)
                datalist(:id='`${i}${param.label}`')
                  option(:value='label' v-for='label in param.datalist') {{label}}
              template(v-else-if='param.dropdown')
                select.form-control.d-inline.me-1(v-model='param.value' required)
                  option(:value='label' v-for='label in param.dropdown') {{label}}
              template(v-else)
                  input.form-control(:type='param.format' v-model='param.value')
            
          button.btn.btn-light.border(type='submit' v-show='block.showSubmitButton !== false && (!block.autoload || block.params)') {{block.label || '조회'}}
      div(v-else-if='block.type == "markdown"')
        strong.text-muted: small {{block.name}}
        div.markdown-body.mb-3(v-html='$options.filters.marked(block.content)')
    
    div.alert.alert-light.border(v-if='error && error.hasOwnProperty()') 
      strong {{error}}

    div.alert.alert-light.border(v-if='error && error.code') 
      strong {{error.sqlMessage}}
      code: pre.mb-0.bg-light.p-1.text-wrap {{error.sql | sql}}
    
    .alert.bg-light.shadow-sm.rounded-lg.position-fixed(
      style='top: 10px; left: calc(50% - 200px); width: 400px'
      v-show='query_warning'
    )
      strong.text-secondary: small 데이터를 기다리고 있습니다. 응답이 늦다면 쿼리를 확인해주세요.
    
    div.position-absolute(style='margin-left: -10px')
      div.visible-hover-outer(v-for='result in results' v-if='n'
        style='width: 100px'
      )
        span.mdi.mdi-loading.mdi-spin.text-primary.fade-in(v-if='result.loading')
    div.visible-hover-outer(v-for='result in results' v-if='n && result.block' :class='{"result-hover": admin_domain == "current"}')
      div.alert.alert-light.mt-1(v-if='result.error && (result.error.code || result.error.message)') 
        strong {{result.error.sqlMessage || result.error.message}}
      div.alert.alert-light.border(v-if='show_log') 
        code: pre.mb-0 {{result.block.sql | sql}}

      template(v-if='result.block.display == "col-2"')
        .d-flex.flex-wrap(:class='result.block.class')
          div.d-flex.border-bottom(v-for='(item, k) in result.rows[0]' v-if='item !== undefined' style='width: 50%')
            div.w-50.bg-light.text-muted.p-2
              strong: small {{k}}
            div.w-50.p-2.col-value 
              template(v-if='result.block.viewModal && result.block.viewModal.useColumn && result.block.viewModal.useColumn == k')
                a(href='#' @click.prevent.stop='open_modal(result.rows[0], result.block_idx, result.rows[0])') {{item}}
              template(v-else-if='item && _isObject(item)')
                pre: code {{ item}}
              template(v-else)
                span {{item}}
          
      
      template(v-else)
        div.d-flex.flex-wrap(v-if='result.cols')
          template(v-if='result.block.actions')
            template(v-for='(action, action_idx) in result.block.actions')
              //- .d-flex
              div(:class='action.containerClass || "ms-2"')
                param-block(:params='action.params')
                button.btn.border.btn-light(type='button' :class='action.class' :disabled='tableSelectedRows.length === 0' @click='action_button(action, action_idx, result.block_idx)'
                  title='클릭하여 선택된 항목을 진행'
                ) 
                  span(v-if='result.block.selectOptions && result.block.selectOptions.disableSelectInfo && tableSelectedRows.length ') {{tableSelectedRows.length}}건 
                  span {{action.label || '실행'}}
        .d-flex.mt-2(
          style='min-height: 30px' v-if='result.block' :class='result.block.containerClass'
        )
          strong.text-muted.me-2: small {{result.block.name}}
          span: small.text-muted  {{result.rows.length}}건 ({{result.delay/1000}}초 소요)
          small.text-muted.ms-4.visible-hover 
            a.text-reset.text-decoration-none.btn.btn-sm.btn-light.rounded-pill(style='position: relative; top: -3px' v-if='result.block.type == "query"' title='구글시트 열기' href='#' @click.prevent='!gsheet_loading[result.block_idx] && _get_query_result(result.block, result.block_idx, "gsheet")') 
              span.mdi.mdi-file-table-outline.text-success
              small.text-muted  구글 시트에서 열기
              h5(style='width: 100px' v-show='gsheet_loading[result.block_idx]'): span.mdi.mdi-loading.mdi-spin.text-success
            a.text-reset.text-decoration-none.btn.btn-sm.btn-light.rounded-pill(style='position: relative; top: -3px' v-if='result.block.type == "http"' title='구글시트 열기' href='#' @click.prevent='!gsheet_loading[result.block_idx] && _get_http_result(result.block, result.block_idx, "gsheet")') 
              span.mdi.mdi-file-table-outline.text-success
              h5(style='width: 100px' v-show='gsheet_loading[result.block_idx]'): span.mdi.mdi-loading.mdi-spin.text-success
        div(v-if='result.cols')
          .table-responsive-lg(:class='result.block.containerClass || "done"')
            vue-good-table(
              @on-selected-rows-change="selectionChanged"
              :ref='`table${n[result.block.name]}`'
              styleClass='table table-hover vgt-table bordered vgt-responsive'
              :columns='result.cols'
              :rows='result.rows'
              :search-options='result.block.searchOptions || {}'
              :select-options='result.block.selectOptions || {}'
              :pagination-options='result.block.paginationOptions || {}'
              @on-search='onSearch'
            )
              template(slot='table-row' slot-scope='props')
                span(v-if='props.column.field == "__조회__"')
                  a(v-if='result.block.viewModal && !result.block.viewModal.useColumn' href='#' @click.prevent.stop='open_modal(props.formattedRow, result.block_idx, props.row)') 조회
                span(v-else-if='props.column.field == "__수정__"')
                  a(href='#' @click.prevent.stop='edit_modal(props.formattedRow, result.block_idx, props.row)') 수정
                span(v-else-if='blocks[result.block_idx].refs && blocks[result.block_idx].refs_by_column && blocks[result.block_idx].refs_by_column[props.column.field]'
                  :set='ref = blocks[result.block_idx].refs_by_column[props.column.field]'
                )
                  template(v-if='ref')
                    template(v-if='_isArray(props.row[ref.valueFromColumn || props.column.field])')
                      template(v-for='value in props.row[ref.valueFromColumn || props.column.field]')
                        router-link.me-2(:to='`/admin/${admin_domain}/${ref.href}#${ encodeURIComponent(JSON.stringify({[ref.param]: value})) }`' :target='ref.target || "_blank"' @click.stop) {{value}}
                    template(v-else)
                      a(:href='`${replace_url(`/admin/${admin_domain}/`, ref.href, props.row[ref.valueFromColumn || props.column.field], ref)}`' :target='ref.target || "_blank"' @click.stop) {{props.formattedRow[props.column.field]}}
                span(v-else) 
                  template(v-if='_isArray(props.row[props.column.field])')
                    span.me-2(v-for='value in props.row[props.column.field]') {{value}}
                  template(v-else-if='result.block.viewModal && result.block.viewModal.useColumn == props.column.field') 
                    template(v-if='props.formattedRow[props.column.field]')
                      a.d-block.w-100(href='#' @click.prevent.stop='open_modal(props.formattedRow, result.block_idx, props.row)') {{props.formattedRow[props.column.field] || '(비어있음)'}}
                    template(v-else)
                      span.d-block.w-100 (비어있음)
                  template(v-else) {{props.formattedRow[props.column.field]}}
</template>

<script>

import { Parser } from 'node-sql-parser'
const parser = new Parser

import { uniqBy, keyBy, sortBy, groupBy, isObject, cloneDeep, compact, uniq, isArray } from 'lodash'
// import Tiptap from '@/components/Tiptap.vue'
import AdminModal from '@/views/AdminModal.vue'

import { VueGoodTable } from 'vue-good-table';

import moment from 'moment'

export default {
  name: 'TableBlock',
  props: ['row', 'blocks', 'page', 'depth', 'path', 'admin_domain', 'team_id', 'teamrow_id', 'show_log', 'selectedRows', 'row_json'],
  components: {
    // Tiptap,
    VueGoodTable,
    AdminModal,
    TableBlockSelf: () => import('@/components/TableBlock.vue'),
    ParamBlock: () => import('@/components/ParamBlock.vue'),
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

      gsheet_loading: [],
      http_loading: [],
      result_loading: false,
      n: {},
      tableSelectedRows: [],

      query_warning: '',
      query_warning_timeout: null,
    }
  },
  watch: {
    // selectedRows: (after, before) => {
    //   this.reload_selected()
    // },
  },
  mounted() {
    this.load()

    const n = {}
    let i = 0
    for (const b of this.blocks) {
      n[b.name] = i++
    }
    this.n = n

    this.count_block_names = Object.keys(n).length
    for (const i in this.blocks) {
      const block = this.blocks[i]
      if (block.paginationOptions) {
        block.paginationOptions.firstLabel = block.paginationOptions.firstLabel || '처음'
        block.paginationOptions.lastLabel = block.paginationOptions.lastLabel || '마지막'
        block.paginationOptions.nextLabel = block.paginationOptions.nextLabel || '다음'
        block.paginationOptions.prevLabel = block.paginationOptions.prevLabel || '이전'
        block.paginationOptions.rowsPerPageLabel = block.paginationOptions.rowsPerPageLabel || '표시'
        block.paginationOptions.ofLabel = block.paginationOptions.ofLabel || '/'
        block.paginationOptions.pageLabel = block.paginationOptions.pageLabel || '페이지'
        block.paginationOptions.allLabel = block.paginationOptions.allLabel || '전체'
      }
      if (block.sql) {
        if (block.sqlType) {
          // block.ast = {
          //   type: String(block.sqlType).toLowerCase()
          // }
        } else {
          try {
            const ast = parser.astify(block.sql, 'MySQL')
            // block.ast = ast
            block.sqlType = String(ast.type).toLowerCase()
          } catch (error) {
            alert('SQL 해석 실패')
            console.log('parse error: ', error)
            // block.ast = {}
          }
        }
        // if (ast.type != 'select') {
        //   return console.log('select query result for not starting with SELECT; canceled.')
        // }
      }
      this.results[block.name] = {
        gsheet_loading: false,
        loading: false,
        cols: [],
        rows: [],
      }
      if (String(block.autoload) == 'true') {
        // todo update/delete
        if (block.sqlType == 'select') {
          this.results[block.name].loading = true
          this._get_query_result(block, i)
        }
      }
      this.gsheet_loading.push(false)
      this.http_loading.push(false)
      // console.log('>>>>>>>>>>>>defaultValueFromRow', this.row)
      block.params = (block.params || []).map((e, param_idx) => {
        if (e.defaultValueFromRow) {
          const key = String(e.defaultValueFromRow) == 'true' ? e.key : e.defaultValueFromRow
          // console.log('>>>>>>>>>>>>defaultValueFromRow', this.row)
          if (e.datalist && e.datalistLength) {
            // why?
            e.values = [...this.row_json[key]]
            this.$set(e, 'values', e.values)
            e.value = ''
          } 
          else if (e.format == 'date') {
            e.value = moment(this.row_json[key]).format('YYYY-MM-DD')
          } 
          else {
            // e.value = String(this.row_json[key])
            e.value = this.row_json[key]
          }

        }
        if (e.defaultValue !== undefined) {
          e.value = e.value || e.defaultValue
        }
        if (e.valueFromRow) {
          const key = String(e.valueFromRow) == 'true' ? e.key : e.valueFromRow
          e.value = this.row_json[key]
        }
        if (e.datalistFromQuery) {
          e.datalist = e.datalist || []
          this.load_datalist(e, i, param_idx)
        }

        return e
      })
      block.refs_by_column = {} 
      if (block.refs) {
        block.refs_by_column = keyBy(block.refs, 'column')
      }
    }
    
    this.page.params = (this.page.params || []).map((e, param_idx) => {
      if (e.datalistFromQuery) {
        e.datalist = e.datalist || []
        this.load_datalist(e, -1, param_idx)
      }
      return e
    })
    this.apply_hash_params()
    this.result_loading = true

    this.$root.$on('reloadAfterSubmit', () => {
      console.log("// this._get_query_result_all()")
      this._get_query_result_all()
    })
  },
  methods: {
    // replace_url(prefix, href, value, ref) {
    replace_url(prefix, href, value, ref) {
      if (href.includes(`{{${ref.param}}}`)) {
        return href.replace(`{{${ref.param}}}`, value)
      } else {
        return prefix + href + `#${ encodeURIComponent(JSON.stringify({[ref.param]: value})) }`
      }
    },
    _isArray: isArray,
    onSearch(r) {
      console.log('searchTemr: ', this.$refs['table0'][0].searchTerm)
    },
    async load_datalist(param, block_idx, param_idx) {
      try {
        const fields = this.blocks[block_idx].params.map(e => {
          return {
            key: e.key,
            value: e.value,
          }
        })

        const params = {}
        if (block_idx === -1) {
          params.path = `${this.path}.params.${param_idx}.datalistFromQuery`
        } else {
          params.path = `${this.path}.blocks.${block_idx}.params.${param_idx}.datalistFromQuery`
        }
        params.admin_domain = this.admin_domain

        let r;
        if (this.admin_domain == 'current') {
          r = await this.$http.post(`/api/team/${this.team_id}/query/test-block`, {
            block: param,
            fields,
            // response_type,
            teamrow_id: this.teamrow_id,
          })
        } else {
          r = await this.$http.post('/api/block/query', {
            fields,
          }, {
            params,
          })
        }
        
        if (r.data?.message != 'ok') {
          const response = r.data?.error || r.data
          alert(`입력폼 옵션 가져오기 실패. \n\ndatalistFromQuery: ${ JSON.stringify(response, null, '  ') }`)
        } else {
          // this._get_query_result_all()
          // this.$root.$emit('reloadAfterSubmit')
          // const rows = r.data.rows.map(e => {
          //   // if (e.value) return e.value
          //   return Object.values(e)[0]
          // })
          const rows = r.data.rows.map(e => {
            const value = e.value || Object.values(e)[0]
            const label = e.label || value
            return {
              value,
              label,
            }
          })
          param.datalist = [...rows]
          // param.datalist_label = [...rows_label]
        } 
      } catch (error) {
        console.log('failed to load_datalist', error)
      }
    },
    async action_button(action, action_idx, block_idx) {
      if (action.confirmText) {
        const values = this.tableSelectedRows.map(e => e[`${ action.valueFromSelectedRowsAs || 'id'}`])
        if (!confirm(`${action.confirmText}\n\n대상: ${values.join(', ')}`)) return false
      }

      try {
        let fields = (action.params || []).map(e => {
          if (e.valueFromSelectedRows) {
            const values = this.tableSelectedRows.map(row => row[`${ e.valueFromSelectedRowsAs || 'id'}`])
            e.value = values
          }
          if (e.valueFromPrompt) {
            e.value = prompt(e.promptText || '입력:')
            if (e.value === null) {
              alert('입력 취소됨')
              throw new Error('input cancel')
            }
          }
          return e
        })

        const params = {}
        params.path = `${this.path}.blocks.${block_idx}.actions.${action_idx}`
        params.admin_domain = this.admin_domain

        let r;
        if (this.admin_domain == 'current') {
          r = await this.$http.post(`/api/team/${this.team_id}/query/test-block`, {
            block,
            fields,
            // response_type,
            teamrow_id: this.teamrow_id,
          })
        } else {
          r = await this.$http.post('/api/block/query', {
            fields,
          }, {
            params,
          })
        }
        
        if (r.data?.message != 'ok') {
          alert(`실패 \n\n${ JSON.stringify(r.data.error) }`)
        } else {
          this._get_query_result_all()
          this.$root.$emit('reloadAfterSubmit')
          // if (String(action.reloadAfterSubmit) == 'true') {
          // }
          alert('완료')
        }
        // this.blocks = [...this.blocks]
      } catch (error) {
        console.log(error)
      }

    },
    selectionChanged(params) {
      console.log(params.selectedRows)
      this.tableSelectedRows = params.selectedRows
      // this
    },
    _isObject: isObject,
    apply_hash_params() {
      if (this.depth > 1) {
        this._get_query_result_all()
        return
      }
      console.log(this.$route.hash)
      // const params = decodeURIComponent(this.$route.hash.slice(1))
      // if (params.length === 0) return

      // let url_params
      // try {
      //   url_params = JSON.parse(params)
      // } catch (error) {
        //   return alert('URL 오류')
      // }
      const url_params = cloneDeep(this.$route.query)

      let autoload_all = false
      let autoload_block_idx = []
      for (const key in url_params) {
        if (this.page.params) {
          for (const p of this.page.params) {
            if (p.key == key) {
              this.$set(p, 'value', url_params[key])
              autoload_all = true
              break
            }
          }
        } 
        if (this.page.blocks) {
          for (const i in this.page.blocks) {
            const block = this.page.blocks[i]
            if (block.type == 'query') {
              if (block.sqlType == 'insert' || block.sqlType == 'update') {
                continue
              }
            }
            if (!block.params) continue
            for (const p of block.params) {
              if (p.key == key) {
                if (isArray(url_params[key])) {
                  this.$set(p, 'values', url_params[key])
                } else {
                  if (p.datalistLength > 0) {
                    this.$set(p, 'values', [url_params[key]])
                  } else {
                    this.$set(p, 'value', url_params[key] || p.defaultValue || '')
                  }
                }
                autoload_block_idx.push(i)
                break
              }
            }
          }
        }
      }
      // console.log(333, url_params)
      if (!url_params.hasOwnProperty()) autoload_all = true
      if (autoload_all) {
        this._get_query_result_all()
        this._get_http_result_all()
      } else {
        autoload_block_idx.forEach(i => {
          this._get_query_result(this.current_page.blocks[i], i)
          this._get_http_result(this.current_page.blocks[i], i)
        })
      }
    },
    _get_query_result_all() {
      for (const i in this.page.blocks) {
        this._get_query_result(this.page.blocks[i], i)
      }
    },
    _get_http_result_all() {
      for (const i in this.page.blocks) {
        this._get_http_result(this.page.blocks[i], i)
      }
    },
    async get_query_update(block, i) {
      block.datetime = ''
      block.update_result = {}
      if (block.type != 'query') {
        return console.log('non query block request; canceled.')
      }
      if (!block.sql) {
        return console.log('query block sql empty; canceled.')
      }
      try {
        for (const param of block.params) {
          if (param.valueFromRow) {
            const key = String(param.valueFromRow) == 'true' ? param.key : param.valueFromRow
            this.$set(param, 'value', this.row_json[key])
          }
        }
        let fields = cloneDeep(block.params || []).map(param => {
          if (param.datalist && param.datalistLength) {
            if (param.datalistType == 'json') {
              param.value = JSON.stringify(uniq(compact(param.values)))
            }
            else if (param.datalistType == 'csv') {
              param.value = uniq(compact(param.values)).join(',')
            }
          }
          return param
        })
        if (!confirm('실행하시겠습니까?\n\n'+fields.map( e => `${e.label || e.key}: ${e.value}` ).join('\n'))) return false

        const params = {}
        params.path = `${this.path}.blocks.${i}`
        params.admin_domain = this.admin_domain
        
        const time_s = Date.now()

        let r;
        if (this.admin_domain == 'current') {
          r = await this.$http.post(`/api/team/${this.team_id}/query/test-block`, {
            block,
            fields,
            // response_type,
            teamrow_id: this.teamrow_id,
          })
        } else {
          r = await this.$http.post('/api/block/query', {
            fields,
          }, {
            params,
          })
        }
        
        const time_e = Date.now()
        if (r.data?.message != 'ok') {
          this.$set(block, 'error', r.data?.error || {})
          this.$set(block, 'update_result', null)
        } else {
          const update_result = r.data.rows

          if (this.admin_domain == 'current') {
            const {log_sql, log_params} = r.data
            let result_sql = log_sql
            for (const params of log_params) {
              result_sql = result_sql.replace('?', JSON.stringify(params))
            }
            update_result.sql = result_sql

          }
          this.$set(block, 'update_result', update_result)

          this.$set(block, 'error', null)
          this.$set(block, 'delay', time_e - time_s)
          this.$set(block, 'datetime', moment().format('YYYY-MM-DD HH:mm:ss'))

          if (String(block.resetAfterSubmit) != 'false') {
            for (const param of block.params) {
              this.$set(param, 'value', '')
              if (param.values) {
                this.$set(param, 'values', [])
              }
            }
          }
          if (String(block.reloadAfterSubmit) == 'true') {
            this._get_query_result_all()
            this.$root.$emit('reloadAfterSubmit')
          }

          (block.params || []).map((e, param_idx) => {
            if (e.datalistFromQuery) {
              e.datalist = e.datalist || []
              this.load_datalist(e, i, param_idx)
            }

            return e
          })
          if (block.sqlType == "update") {
            alert('수정했습니다.')
          }
          else if (block.sqlType == "insert") {
            alert('저장했습니다.')
          }
        }
        // this.blocks = [...this.blocks]
      } catch (error) {
        console.log(error)
      }
    },

    async get_query_result_all() {
      const fields = this.get_state_params()
      console.log('get_query_result_all', fields)
      const p = {}
      for (const f of fields) {
        p[f.key] = f.value || f.defaultValue || ''
      }
      this.$router.push({
        query: p
      }).catch(() => {
        console.log("params not changed. let's reload.")
        this.apply_hash_params()
      })
    },

    get_state_params() {
      const merged_params = {}
      for (const block of this.page.blocks) {
        if (block.type == 'query') {
          if (block.sqlType == 'insert' || block.sqlType == 'update') {
            continue
          }
        }
        for (const p of block.params) {
          if (String(p.valueFromRow || 'false') == 'true') continue
          if (String(p.valueFromEnv || 'false') == 'true') continue
          if (merged_params[p.key] === undefined) merged_params[p.key] = Object.assign({}, p)
          merged_params[p.key].value = p.value
        }
      }
      console.log('this.page.params', this.page.params)
      if (this.page.params?.length) {
        for (const p of this.page.params) {
          if (String(p.valueFromRow || 'false') == 'true') continue
          if (String(p.valueFromEnv || 'false') == 'true') continue
          if (merged_params[p.key] === undefined) merged_params[p.key] = Object.assign({}, p)
          merged_params[p.key].value = p.value
        }
      }
      console.log('merged_params', merged_params)
      return Object.values(merged_params)
    },

    async get_query_result(block, i, response_type = '') {
      // console.log('>>>>>>>>>>', {block}, 'page', this.page)
      console.log('this.admin_domain', this.admin_domain)
      if (this.admin_domain == 'current') {
        // disabled hash at studio
        this._get_query_result(block, i, response_type)
        return
      }
      if (this.depth > 1) {
        // disabled hash at opened modal
        this._get_query_result(block, i, response_type)
        return
      }
      if (block.type != 'query') {
        return console.log('non query block request canceled.')
      }
      if (!block.sql) {
        return console.log('query block sql empty; canceled.')
      }
      
      
      const fields = this.get_state_params()

      if (fields.length) {
        const p = {}
        for (const f of fields) {
          if (f.values || f.datalistLength > 1) {
            const v = uniq(compact(f.values))
            p[f.key] = v.length ? v : undefined
          } else {
            p[f.key] = String(f.value || f.defaultValue || '')
          }
        }
        // console.log('get_query_result', {p, fields})
        // console.log('current', this.$route.query)
        // console.log('next', p)
        this.$router.push({
          query: {
            ...this.$route.query,
            ...p,
          },
        }).catch((e) => {
          console.log("params not changed. let's reload.")
          this.apply_hash_params()
        })
        // location.hash = '#'+encodeURIComponent(JSON.stringify(p))
        // const new_hash = '#'+encodeURIComponent(JSON.stringify(p))
        // if (location.hash == new_hash) {
        //   this.apply_hash_params()
        // } else {
        //   location.hash = new_hash
        // }
      } else {
        // location.hash = ''
        this._get_query_result(block, i, response_type)
      }
    },

    async _get_query_result(block, i, response_type = '') {
      console.log('block AST:', block.sqlType)
      if (block.sqlType != 'select') {
        return console.log('non select canceled.')
      }

      if (block.fetching === true) {
        return console.log('block isFetching=true')
      }
      block.fetching = true

      this.query_warning = false
      const slow_timeout = setTimeout(() => {
        this.query_warning = true
        if (this.query_warning_timeout) {
          clearTimeout(this.query_warning_timeout)
        }
        this.query_warning_timeout = setTimeout(() => {
          this.query_warning = false
        }, 5000)
      }, 5000)

      try {
        if (response_type == 'gsheet') {
          this.gsheet_loading[i] = true
          this.gsheet_loading = [...this.gsheet_loading]
          const r = await this.$http.get(`/api/connect/google/spreadsheet/refresh`)
          if (r?.data?.message == 'not connected' || r?.data?.message.includes('invalid_grant')) {
            {
              const r = await this.$http.get('/api/connect/google/spreadsheet')
              if (r?.data?.message != 'ok') throw new Error(r?.data?.message || '연결된 구글시트 계정이 없음')
  
              const w = 500
              const h = 670
              const y = window.top.outerHeight / 2 + window.top.screenY - ( h / 2);
              const x = window.top.outerWidth / 2 + window.top.screenX - ( w / 2);
              window.open(r.data.url, 'YSG_GoogleSheetStep1', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`)
            }
            return
          }
          if (r?.data?.message != 'ok') throw new Error(r?.data?.message || '구글연동 확인 실패')  
        }
        if (block.type != 'query') {
          return console.log('non query block request canceled.')
        }
        let fields = block.params
        if (this.page.params) {
          const merged_params = {}
          if (block.params) {
            for (const p of block.params) {
              if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
            }
          }
          for (const p of this.page.params) {
            if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
            merged_params[p.key].value = p.value || ''
          }
          fields = Object.values(merged_params)
        }
        const time_s = Date.now()

        let r;
        if (this.admin_domain == 'current') {
          r = await this.$http.post(`/api/team/${this.team_id}/query/test-block`, {
            block,
            fields,
            response_type,
            teamrow_id: this.teamrow_id,
          })
        } else {
          r = await this.$http.post('/api/block/query', {
            fields,
          }, {
            params: {
              path: `${this.path}.blocks.${i}`,
              block_idx: i,
              admin_domain: this.admin_domain,
              response_type,
            }
          })
        }
        const time_e = Date.now()
        
        if (r.data?.message != 'ok') {
          this.error = r.data?.error || r.data?.message
          if (response_type == 'gsheet') {
            alert(`내보내기 실패: ${r.data.message}`)
          }
          this.gsheet_loading[i] = false
          this.gsheet_loading = [...this.gsheet_loading]
          return
        } else {
          this.error = {}
        }
        if (r?.data?.spreadsheetUrl) {
          window.open(r.data.spreadsheetUrl)
          this.gsheet_loading[i] = false
          this.gsheet_loading = [...this.gsheet_loading]
          return
        }
        if (!this.results[block.name]) {
          this.results[block.name] = {
            name: block.name,
            cols: [],
            rows: [],
          }
        }
        this.results[block.name].block = block
        if (r.data.rows.length > 0) {
          if (block.columnOptions) {
            this.results[block.name].cols = block.columnOptions.map(e => {
              if (e.tdClass && e.tdClass.length && e.tdClass.includes('return')) {
                e.tdClass = new Function('row', e.tdClass)
              }
              if (e.formatFn) {
                if (this.$options.filters[e.formatFn]) {
                  e.formatFn = this.$options.filters[e.formatFn]
                }
              }
              return e
            })
          } else {
            const fields = {}
            for(let i=0; i<r.data.rows.length; i++) {
              if (i >= 30) break
  
              Object.keys(r.data.rows[i]).map(e => {
                const v = r.data.rows[i][e]
                let type = 'text'
                const opt = {}
                if (v && v !== null) {
                  if (isFinite(+v)) type = 'number'
                  else if (isObject(v)) {
                    type = 'json'
                    opt.formatFn = (v) => {
                      return JSON.stringify(v, null, '  ')
                    }
                  }
                  else if (v === true || v === false) type = 'boolean'
                  else if (v && v != 'null' && v != null && moment(v, 'YYYY-MM-DD\THH:mm:ss.000Z', true).isValid()) {
                    // type = 'date'
                    opt.formatFn = (v) => {
                      return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : ''
                    }
                  }
                }
                const field = e
                fields[field] = fields[field] || {
                  label: field,
                  field: field,
                  type,
                  ...opt,
                }
                if (fields[field].type == 'text' && type != 'text') {
                  // new format detected
                  fields[field] = Object.assign(fields[field], {
                    label: e,
                    field: e,
                    type,
                    ...opt,
                  })
                } 
              })
            }
            this.results[block.name].cols = Object.keys(fields).map(e => {
              return fields[e]
            })
          }
          if (block.viewModal && !block.viewModal?.useColumn) {
            this.results[block.name].cols.push({
              label: '조회',
              field: '__조회__',
              sortable: false,
              globalSearchDisabled: true,
              width: '100px',
            })
          }
          if (block.editModal) {
            this.results[block.name].cols.push({
              label: '수정',
              field: '__수정__',
              sortable: false,
              globalSearchDisabled: true,
              width: '100px',
            })
          }
        } else {
          this.results[block.name].cols = []
        }

        if (this.admin_domain == 'current') {
          const {log_sql, log_params} = r.data
          let result_sql = log_sql
          for (const params of log_params) {
            result_sql = result_sql.replace('?', JSON.stringify(params))
          }
          this.results[block.name].sql = result_sql
        }

        this.results[block.name].rows = r.data.rows
        this.results[block.name].block_idx = i
        this.results[block.name].delay = time_e - time_s
        this.current_block = block

      } catch (error) {
        console.log(error)
        alert(error.message)
      }
      if (block && this.results[block.name]) {
        this.results[block.name].loading = false
      }
      clearTimeout(slow_timeout)
      block.fetching = false
    },

    async get_http_result(block, i) {
      console.log('>>>get_http_result')
      if (block.type != 'http') {
        return console.log('non http block request canceled.')
      }
      if (!block.axios) {
        return console.log('http block axios empty; canceled.')
      }

      const fields = this.get_state_params()

      if (fields.length) {
        const p = {}
        for (const f of fields) {
          p[f.key] = String(f.value || '')
        }
        this.$router.push({
          query: p
        }).catch(() => {
          console.log("params not changed. let's reload.")
          this.apply_hash_params()
        })
      } else {
        // location.hash = ''
        this._get_http_result(block, i)
      }
    },
    async _get_http_result(block, i, response_type) {
      try {
        if (block.type != 'http') {
          return console.log('non http block request canceled.')
        }
        this.http_loading[i] = true
        this.http_loading = [...this.http_loading]

        if (response_type == 'gsheet') {
          this.gsheet_loading[i] = true
          this.gsheet_loading = [...this.gsheet_loading]
          const r = await this.$http.get(`/api/connect/google/spreadsheet/refresh`)
          if (r?.data?.message == 'not connected' || r?.data?.message.includes('invalid_grant')) {
            {
              const r = await this.$http.get('/api/connect/google/spreadsheet')
              if (r?.data?.message != 'ok') throw new Error(r?.data?.message || '연결된 구글시트 계정이 없음')
  
              const w = 500
              const h = 670
              const y = window.top.outerHeight / 2 + window.top.screenY - ( h / 2);
              const x = window.top.outerWidth / 2 + window.top.screenX - ( w / 2);
              window.open(r.data.url, 'YSG_GoogleSheetStep1', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`)
            }
            return
          }
          if (r?.data?.message != 'ok') throw new Error(r?.data?.message || '구글연동 확인 실패')  
        }
        let fields = block.params
        if (this.page.params) {
          const merged_params = {}
          if (block.params) {
            for (const p of block.params) {
              if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
            }
          }
          for (const p of this.page.params) {
            if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
            merged_params[p.key].value = p.value
          }
          fields = Object.values(merged_params)
        }
        const time_s = Date.now()
        const r = await this.$http.post('/api/block/http', {
          fields,
        }, {
          params: {
            path: `${this.path}.blocks.${i}`,
            block_idx: i,
            admin_domain: this.admin_domain,
            response_type,
          }
        })
        const time_e = Date.now()
        this.http_loading[i] = false
        this.http_loading = [...this.http_loading]

        // console.log(r.data)
        if (r.data?.message != 'ok') {
          this.error = r.data?.error
          return
        } else {
          this.error = {}
        }
        if (r?.data?.spreadsheetUrl) {
          window.open(r.data.spreadsheetUrl)
          this.gsheet_loading[i] = false
          this.gsheet_loading = [...this.gsheet_loading]
          return
        }
        if (!this.results[block.name]) {
          this.results[block.name] = {
            name: block.name,
            cols: [],
            rows: [],
          }
        }
        if (r.data.rows.length > 0) {
          const cols = Object.keys(r.data.rows[0]).map(e => {
            const v = r.data.rows[0][e]
            let type = undefined
            if (v === null) type = 'text'
            else if (isObject(v)) type = 'json'
            else if (isFinite(+v)) type = 'number'
            else if (v === true || v === false) type = 'boolean'
            // console.log({
            //   v,
            //   label: e,
            //   field: e,
            //   type,
            // })
            return {
              label: e,
              field: e,
              type,
            }
          })
          
          if (block.viewModal) {
            cols.push({
              label: '조회',
              field: '__조회__',
              sortable: false,
              globalSearchDisabled: true,
              width: '100px',
            })
          }
          if (block.editModal) {
            cols.push({
              label: '수정',
              field: '__수정__',
              sortable: false,
              globalSearchDisabled: true,
              width: '100px',
            })
          }
          this.results[block.name].cols = cols
        }
        this.results[block.name].rows = r.data.rows
        this.results[block.name].block_idx = i
        this.results[block.name].block = block
        this.results[block.name].delay = time_e - time_s
        this.current_block = block
      } catch (error) {
        console.log(error)
      }
    },

    async get_http_update(block, i) {
      if (block.type != 'http') {
        return console.log('non http block request; canceled.')
      }
      try {
        for (const param of block.params) {
          if (param.valueFromRow) {
            const key = String(param.valueFromRow) == 'true' ? param.key : param.valueFromRow
            this.$set(param, 'value', this.row_json[key])
          }
        }
        const params = {}
        params.path = `${this.path}.blocks.${i}`
        params.admin_domain = this.admin_domain

        this.http_loading[i] = true
        this.http_loading = [...this.http_loading]
        
        const time_s = Date.now()
        const r = await this.$http.post('/api/block/http', {
          fields: block.params,
        }, {
          params,
        })
        const time_e = Date.now()

        this.http_loading[i] = false
        this.http_loading = [...this.http_loading]

        if (r.data?.message != 'ok') {
          this.error = r.data?.error
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

    open_modal(row, block_idx, row_json) {
      this.$modal.show(
        AdminModal,
        {
          path: `${this.path}.blocks.${block_idx}`,
          block: this.page.blocks[block_idx],
          page: this.page,
          depth: 2,
          row: Object.assign({}, row, {
            '__조회__': undefined,
            '__수정__': undefined,
          }),
          row_json: row_json,
          admin_domain: this.admin_domain,
        },
        {
          scrollable: true,
          height: 'auto',
          transition: 'none',
          name: 'modal2',
        }
      )
    },
    edit_modal(row, block_idx) {
      this.$modal.show(
        EditModal,
        {
          path: `${this.path}.blocks.${block_idx}`,
          block: this.page.blocks[block_idx],
          page: this.page,
          depth: 2,
          // block: this.current_block,
          row: Object.assign({}, row, {
            '__조회__': undefined,
            '__수정__': undefined,
          }),
          admin_domain: this.admin_domain,
        },
        {
          scrollable: true,
          height: 'auto',
          transition: 'none',
          name: 'modal2',
        }
      )
    },
    async load() {
      // this.$store.dispatch('config')
      
    },
  }
}
</script>
