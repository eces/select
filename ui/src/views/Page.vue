<template lang="pug">
div
  div.bg-white.mt-2.mb-4
    div.submenu.d-flex.px-2
      .item(v-for='menu in menus')
        template(v-if='menu.target')
          a(:href='menu.path' :target='menu.target') {{menu.name}} 
            span (링크)
        template(v-else)
          router-link(:to='`/${menu.path}`') {{menu.name}}
      button.btn.btn-light.text-success(type='button' v-if='$store.state.admin.active') 관리자
    .page.p-2#page
      button.btn.btn-light.text-success(type='button' v-if='$store.state.admin.active') 관리자
      div.mb-2(v-if='current_page.params')
        form(@submit.prevent='get_query_result_all()')
          .d-flex
            div.d-flex(v-for='param in current_page.params')
              label.text-muted.me-1(style='word-break: keep-all;'): strong: small {{param.label}}
              template(v-if='param.datalist')
                input.form-control.d-inline.me-1(:list='`${i}${param.label}`' v-model='param.value' required)
                datalist(:id='`${i}${param.label}`')
                  option(:value='label' v-for='label in param.datalist') {{label}}
              template(v-else-if='param.dropdown')
                select.form-control.d-inline.me-1(v-model='param.value' required)
                  option(:value='label' v-for='(label, i) in param.dropdown') {{i}}/ {{param.dropdown_labels ? dropdown_labels[i] || label : label}}
              template(v-else)
                input.form-control.d-inline.me-1(:type='param.format' v-model='param.value' required)
            button.btn.btn-light.border(type='submit') 조회

      div.mb-2(v-for='(block, i) in current_page.blocks')
        div(v-if='block.type == "query"')
          template(v-if='block.sql.startsWith("UPDATE") || block.sql.startsWith("update")')
            .p-2.bg-light(v-if='block.name' style='margin-top: -1px'): strong.text-muted: small {{block.name}}
            div.alert.alert-light.border(v-if='$store.state.admin.active') 
              code: pre.mb-0 {{block.sql | sql}}
            form.p-2.mb-2(
              @submit.prevent='get_query_update(block, i)'
            )
              div.mb-3(v-for='param in block.params' v-if='!param.valueFromRow')
                label.d-block.pb-1: strong.text-muted: small {{param.label || param.key}}
                input.form-control(:type='param.format' v-model='param.value')
              .mt-2
              button.btn.btn-light.text-primary.border(type='submit' v-show='!block.autoload && block.params') 실행
              div.alert.alert-light.mt-1(v-if='block.update_result && block.update_result.info') 
                strong {{block.update_result.info}}
                small.text-muted  ({{block.delay/1000}}초 소요)
          template(v-else-if='block.sql.startsWith("INSERT") || block.sql.startsWith("insert")')
            .p-2.bg-light(v-if='block.name' style='margin-top: -1px'): strong.text-muted: small {{block.name}}
            div.alert.alert-light.border(v-if='$store.state.admin.active') 
              code: pre.mb-0 {{block.sql | sql}}
            form.p-2.mb-2(
              @submit.prevent='get_query_insert(block, i)'
            )
              div.mb-3(v-for='param in block.params' v-if='!param.valueFromRow')
                label.d-block.pb-1: strong.text-muted: small {{param.label || param.key}}
                input.form-control(:type='param.format' v-model='param.value')
              .mt-2
              button.btn.btn-light.text-primary.border(type='submit' v-show='!block.autoload && block.params') 실행
              div.alert.alert-light.mt-1(v-if='block.update_result && block.update_result.info') 
                strong {{block.update_result.info}}
                small.text-muted  ({{block.delay/1000}}초 소요)
          form(v-else @submit.prevent='get_query_result(block, i)')
            .d-flex
              div.d-flex(v-for='param in block.params')
                label.text-muted.me-1(style='word-break: keep-all;'): strong: small {{param.label}}
                template(v-if='param.datalist')
                  input.form-control.d-inline.me-1(:list='`${i}${param.label}`' v-model='param.value' required)
                  datalist(:id='`${i}${param.label}`')
                    option(:value='label' v-for='label in param.datalist') {{label}}
                template(v-else-if='param.dropdown')
                  select.form-control.d-inline.me-1(v-model='param.value' required)
                    option(:value='label' v-for='(label, i) in param.dropdown') {{ param.dropdown_labels && param.dropdown_labels[i] || label }}
                template(v-else)
                  input.form-control.d-inline.me-1(:type='param.format' v-model='param.value' required)
              button.btn.btn-light.border(type='submit' v-show='block.showSubmitButton !== false && (!block.autoload || block.params)') 조회
        div(v-if='block.type == "markdown"')
          div.markdown-body(v-html='$options.filters.marked(block.content)')
        div(v-if='block.type == "http"')
          template(v-if='block.axios && block.axios.method && ["POST", "PUT"].includes(block.axios.method.toUpperCase())')
            .p-2.bg-light(v-if='block.name' style='margin-top: -1px'): strong.text-muted: small {{block.name}}
            div.alert.alert-light.border(v-if='$store.state.admin.active') 
              code: pre.mb-0 {{block.axios}}
            form.p-2.mb-2(
              @submit.prevent='get_http_update(block, i)'
            )
              div.mb-3(v-for='param in block.params' v-if='!param.valueFromRow')
                label.d-block.pb-1: strong.text-muted: small {{param.label || param.key}}
                input.form-control(:type='param.format' v-model='param.value')
              .mt-2
              button.btn.btn-light.text-primary.border(type='submit' v-show='!block.autoload && block.params') 실행
              div.alert.alert-light.mt-1(v-if='block.update_result') 
                pre {{block.update_result}}
                small.text-muted  ({{block.delay/1000}}초 소요)
          form(v-else @submit.prevent='get_http_result(block, i)')
            .d-flex
              div.d-flex(v-for='param in block.params')
                label.text-muted.me-1(style='word-break: keep-all;'): strong: small {{param.label}}
                template(v-if='param.datalist')
                  input.form-control.d-inline.me-1(:list='`${i}${param.label}`' v-model='param.value' required)
                  datalist(:id='`${i}${param.label}`')
                    option(:value='label' v-for='label in param.datalist') {{label}}
                template(v-else-if='param.dropdown')
                  select.form-control.d-inline.me-1(v-model='param.value' required)
                    option(:value='label' v-for='label in param.dropdown') {{label}}
                template(v-else)
                  input.form-control.d-inline.me-1(:type='param.format' v-model='param.value' required)
              button.btn.btn-light.border(type='submit' v-show='block.showSubmitButton !== false && (!block.autoload || block.params)') 조회
      div.alert.alert-light.border(v-if='error && error.code !== undefined') 
        strong {{error.sqlMessage}}
        code.d-block {{error.sql}}
      div(v-for='result in results')
        strong.text-muted(v-show='count_block_names > 1'): small {{result.name}}
        div.alert.alert-light.border(v-if='$store.state.admin.active') 
          code: pre.mb-0 {{current_page.blocks[result.block_idx].sql | sql}}
        vue-good-table(
          :columns='result.cols'
          :rows='result.rows'
        )
          template(slot='table-row' slot-scope='props')
            span(v-if='props.column.field == "__조회__"')
              a(href='#' @click.prevent='open_modal(props.formattedRow, result.block_idx)') 조회
            span(v-else-if='props.column.field == "__수정__"')
              a(href='#' @click.prevent='edit_modal(props.formattedRow, result.block_idx)') 수정
            span(v-else) {{props.formattedRow[props.column.field]}}

</template>

<script>

import { isObject } from 'lodash'
import Modal from '@/views/Modal.vue'
import TableBlock from '@/components/TableBlock.vue'

export default {
  name: 'Page',
  props: ['page', 'subpage'],
  components: {
    TableBlock,
  },
  computed: {
    current_menu() {
      return this.$store.state.config.menus.filter(e => e.path == [this.page, this.subpage].filter(Boolean).join('/'))[0] || {}
    },
    current_page() {
      const page = this.$store.state.config.pages.filter(e => e.path == [this.page, this.subpage].filter(Boolean).join('/'))[0] || {}
      return page
    },
    current_path() {
      let found = null
      for(let i=0; i<this.$store.state.config.pages.length; i++) {
        const e = this.$store.state.config.pages[i]
        if (e.path == [this.page, this.subpage].filter(Boolean).join('/')) {
          found = i
          break 
        }
      }
      return found !== null && `pages.${found}`
    },
    menus() {
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
    }
  },
  mounted() {
    // console.log('>new load', this.current_page)
    this.load()
    if (!this.current_page?.path) {
      return
    }
    this.apply_hash_params()
    const n = {}
    for (const b of this.current_page.blocks) {
      n[b.name] = true
    }
    this.count_block_names = Object.keys(n).length
    for (const i in this.current_page.blocks) {
      const block = this.current_page.blocks[i]
      if (block.autoload === true) {
        this._get_query_result(block, i)
      }
    }
    if (this.$route.hash.length < 2) {
      setTimeout(() => {
        document.querySelector('#page input')?.focus()
      }, 300)
    }
  },
  methods: {
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
          if (param.dropdown && !param.value) {
            param.value = param.dropdown[0]
          }
        }
        const params = {}
        params.path = `${this.current_path}.blocks.${i}`
        
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
    async get_http_update(block, i) {
      if (block.type != 'http') {
        return console.log('non http block request; canceled.')
      }
      try {
        for (const param of block.params) {
          if (param.valueFromRow) {
            this.$set(param, 'value', this.row[param.valueFromRow])
          }
        }
        const params = {}
        params.path = `${this.current_path}.blocks.${i}`
        
        const time_s = Date.now()
        const r = await this.$http.post('/api/block/http', {
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
    async get_query_insert(block, i) {
      if (block.type != 'query') {
        return console.log('non query block request; canceled.')
      }
      if (!block.sql) {
        return console.log('query block sql empty; canceled.')
      }
      if (!block.sql.startsWith('insert') && !block.sql.startsWith('INSERT')) {
        return console.log('insert query for not starting with INSERT; canceled.')
      }
      try {
        for (const param of block.params) {
          if (param.valueFromRow) {
            this.$set(param, 'value', this.row[param.valueFromRow])
          }
        }
        const params = {}
        params.path = `${this.current_path}.blocks.${i}`
        
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
    apply_hash_params() {
      console.log(this.$route.hash)
      const params = decodeURIComponent(this.$route.hash.slice(1))
      if (params.length === 0) return

      let url_params
      try {
        url_params = JSON.parse(params)
      } catch (error) {
        return alert('URL 오류')
      }
      let autoload_all = false
      let autoload_block_idx = []
      for (const key in url_params) {
        if (this.current_page.params) {
          for (const p of this.current_page.params) {
            if (p.key == key) {
              this.$set(p, 'value', url_params[key])
              autoload_all = true
              break
            }
          }
        } 
        if (this.current_page.blocks) {
          for (const i in this.current_page.blocks) {
            const block = this.current_page.blocks[i]
            if (!block.params) continue
            for (const p of block.params) {
              if (p.key == key) {
                this.$set(p, 'value', url_params[key])
                autoload_block_idx.push(i)
                break
              }
            }
          }
        }
      }
      if (autoload_all) {
        this._get_query_result_all()
      } else {
        autoload_block_idx.forEach(i => {
          this._get_query_result(this.current_page.blocks[i], i)
        })
      }
    },
    async get_query_result_all() {
      const merged_params = {}
      let fields = []
      if (this.current_page.params?.length) {
        for (const p of this.current_page.params) {
          if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
          merged_params[p.key].value = p.value
        }
        fields = Object.values(merged_params)
      }
      const p = {}
      for (const f of fields) {
        p[f.key] = f.value
      }
      console.log({p})
      location.hash = '#'+encodeURIComponent(JSON.stringify(p))
    },
    async _get_query_result_all() {
      for (const i in this.current_page.blocks) {
        await this._get_query_result(this.current_page.blocks[i], i)
      }
    },
    async get_query_result(block, i) {
      if (block.type != 'query') {
        return console.log('non query block request canceled.')
      }
      if (!block.sql) {
        return console.log('query block sql empty; canceled.')
      }
      if (!block.sql.startsWith('select') && !block.sql.startsWith('SELECT')) {
        return console.log('select query result for not starting with SELECT; canceled.')
      }

      let fields = block.params || []
      if (this.current_page.params?.length) {
        const merged_params = {}
        if (block.params) {
          for (const p of block.params) {
            if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
          }
        }
        for (const p of this.current_page.params) {
          if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
          merged_params[p.key].value = p.value
        }
        fields = Object.values(merged_params)
      }

      if (fields.length) {
        const p = {}
        for (const f of fields) {
          p[f.key] = f.value
        }
        location.hash = '#'+encodeURIComponent(JSON.stringify(p))
      } else {
        location.hash = ''
        this._get_query_result(block, i)
      }
    },
    async get_http_result(block, i) {
      if (block.type != 'http') {
        return console.log('non http block request canceled.')
      }
      if (!block.axios) {
        return console.log('http block axios empty; canceled.')
      }

      let fields = block.params || []
      if (this.current_page.params?.length) {
        const merged_params = {}
        if (block.params) {
          for (const p of block.params) {
            if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
          }
        }
        for (const p of this.current_page.params) {
          if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
          merged_params[p.key].value = p.value
        }
        fields = Object.values(merged_params)
      }

      if (fields.length) {
        const p = {}
        for (const f of fields) {
          p[f.key] = f.value
        }
        location.hash = '#'+encodeURIComponent(JSON.stringify(p))
      } else {
        location.hash = ''
        this._get_http_result(block, i)
      }
    },
    async _get_query_result(block, i) {
      try {
        if (block.type != 'query') {
          return console.log('non query block request canceled.')
        }
        let fields = block.params
        if (this.current_page.params) {
          const merged_params = {}
          if (block.params) {
            for (const p of block.params) {
              if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
            }
          }
          for (const p of this.current_page.params) {
            if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
            merged_params[p.key].value = p.value
          }
          fields = Object.values(merged_params)
        }
        const r = await this.$http.post('/api/block/query', {
          fields,
        }, {
          params: {
            path: `${this.current_path}.blocks.${i}`,
            block_idx: i,
          }
        })
        // console.log(r.data)
        if (r.data?.message != 'ok') {
          this.error = r.data.error
          return
        } else {
          this.error = {}
        }
        if (!this.results[i]) {
          this.results[i] = {
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
          this.results[i].cols = cols
        }
        this.results[i].rows = r.data.rows
        this.results[i].block_idx = i
        this.current_block = block
      } catch (error) {
        console.log(error)
      }
    },
    async _get_http_result(block, i) {
      try {
        if (block.type != 'http') {
          return console.log('non http block request canceled.')
        }
        let fields = block.params
        if (this.current_page.params) {
          const merged_params = {}
          if (block.params) {
            for (const p of block.params) {
              if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
            }
          }
          for (const p of this.current_page.params) {
            if (!merged_params[p.key]) merged_params[p.key] = Object.assign({}, p)
            merged_params[p.key].value = p.value
          }
          fields = Object.values(merged_params)
        }
        const r = await this.$http.post('/api/block/http', {
          fields,
        }, {
          params: {
            path: `${this.current_path}.blocks.${i}`,
            block_idx: i,
          }
        })
        // console.log(r.data)
        if (r.data?.message != 'ok') {
          this.error = r.data.error
          return
        } else {
          this.error = {}
        }
        if (!this.results[i]) {
          this.results[i] = {
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
          this.results[i].cols = cols
        }
        this.results[i].rows = r.data.rows
        this.results[i].block_idx = i
        this.current_block = block
      } catch (error) {
        console.log(error)
      }
    },
    edit_modal(row, block_idx) {
      this.open_modal(row, block_idx, 'edit')
    },
    open_modal(row, block_idx, mode = 'view') {
      this.$modal.show(
        Modal,
        {
          path: `${this.current_path}.blocks.${block_idx}`,
          block: this.current_page.blocks[block_idx],
          page: this.current_page,
          depth: 1,
          row: Object.assign({}, row, {
            '__조회__': undefined,
            '__수정__': undefined,
          }),
          mode,
        },
        {
          scrollable: true,
          height: 'auto',
          transition: 'none',
          name: 'modal1',
        }
      )
    },
    async load() {
      // this.$store.dispatch('config')
      
    },
  }
}
</script>
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
      // &.router-link-exact-active
      &.router-link-active
        color: $primary
        font-weight: bold
        border-bottom: solid 2px $primary
        
        // line-height: 50px
.page
  height: calc(100vh - 110px)
  overflow: scroll
</style>