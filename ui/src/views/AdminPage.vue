<template lang="pug">
div
  //- pre {{this.$store.state.config}}
  div.bg-white.mt-2.mb-4
    div.submenu.d-flex.px-2
      .item(v-for='menu in menus')
        template(v-if='menu.target')
          a(:href='menu.path' :target='menu.target') {{menu.name}} 
            span (링크)
        template(v-else)
          router-link(:to='`/${menu.path}`') {{menu.name}}
      //- button.btn.btn-light.text-success(type='button' v-if='$store.state.admin.active') 관리자
    .page.p-2#page
      //- pre {{ $store.state.config.page }}
      //- pre {{current_path}}
      //- pre {{page}}
      //- pre {{current_page}}
      table-block(
        v-if='current_page'
        :blocks='current_page.blocks' :page='current_page' depth='1' :path='current_path' 
        :admin_domain='admin_domain'
        :show_log='$store.state.admin.active'
      )

</template>

<script>

import { uniqBy, keyBy, sortBy, groupBy, isObject } from 'lodash'
// import Tiptap from '@/components/Tiptap.vue'
import AdminModal from '@/views/AdminModal.vue'
import EditModal from '@/views/EditModal.vue'
import TableBlock from '@/components/TableBlock.vue'

import { VueGoodTable } from 'vue-good-table';

export default {
  name: 'Page',
  props: ['page', 'admin_domain'],
  components: {
    // Tiptap,
    VueGoodTable,
    TableBlock,
  },
  computed: {
    // config() {
    //   return this.$store.state.config
    // },
    current_menu() {
      return this.$store.state.config.menus.filter(e => e.path == this.page)[0] || {}
    },
    current_page() {
      const page = this.$store.state.config.pages.filter(e => e.path == [this.page].filter(Boolean).join('/'))[0] || {}
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
    // console.log('>page', this.page)
    // console.log('>new load', this.current_page)
    // this.load()
    // if (!this.current_page?.path) {
    //   // this.error = {
    //   //   code: '01',
    //   //   sqlMessage: 'No data for page'
    //   // }
    //   return
    // }
    // this.apply_hash_params()
    // const n = {}
    // for (const b of this.current_page.blocks) {
    //   n[b.name] = true
    // }
    // this.count_block_names = Object.keys(n).length
    // for (const i in this.current_page.blocks) {
    //   const block = this.current_page.blocks[i]
    //   console.log(block)
    //   if (block.autoload === true) {
    //     if (block.type == 'query')
    //       this._get_query_result(block, i)
    //     if (block.type == 'http')
    //       this._get_http_result(block, i)
    //   }
    //   this.results[block.name] = {
    //     gsheet_loading: false,
    //     cols: [],
    //     rows: [],
    //   }
    //   this.gsheet_loading.push(false)
    //   this.http_loading.push(false)
    // }
    setTimeout(() => {
      document.querySelector('#page input')?.focus()
    }, 300)
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
        }
        const params = {}
        params.path = `${this.current_path}.blocks.${i}`
        params.admin_domain = this.admin_domain
        
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
        params.admin_domain = this.admin_domain
        
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
    async _get_query_result(block, i, response_type) {
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
        console.log('>>', this.admin_domain)
        const time_s = Date.now()
        const r = await this.$http.post('/api/block/query', {
          fields,
        }, {
          params: {
            path: `${this.current_path}.blocks.${i}`,
            block_idx: i,
            admin_domain: this.admin_domain,
            response_type,
          }
        })
        const time_e = Date.now()
        // if (r.data?.message == 'Invalid Credentials') {

        // }
        if (r.data?.message != 'ok') {
          this.error = r.data.error || r.data.message
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
        alert(error.message)
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
        const time_s = Date.now()
        const r = await this.$http.post('/api/block/http', {
          fields,
        }, {
          params: {
            path: `${this.current_path}.blocks.${i}`,
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
          this.error = r.data.error
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
    open_modal(row, block_idx) {
      this.$modal.show(
        AdminModal,
        {
          path: `${this.current_path}.blocks.${block_idx}`,
          block: this.current_page.blocks[block_idx],
          page: this.current_page,
          depth: 1,
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
          name: 'modal1',
        }
      )
    },
    edit_modal(row, block_idx) {
      this.$modal.show(
        EditModal,
        {
          path: `${this.current_path}.blocks.${block_idx}`,
          block: this.current_page.blocks[block_idx],
          page: this.current_page,
          depth: 1,
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
      // &.router-link-active
      &.router-link-exact-active
        color: $primary
        font-weight: bold
        border-bottom: solid 2px $primary
        
        // line-height: 50px
.page
  height: calc(100vh - 110px)
  overflow: scroll
.visible-hover-outer
  .visible-hover
    display: none !important
  &:hover
    .visible-hover
      display: inherit !important
</style>