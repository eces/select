<style lang="sass" scoped>
.opacity-50
  opacity: 50
.per-page
  // font-size: 0.9rem
</style>
<template lang="pug">
div.d-flex.p-1.bg-light.border-start.border-end.border-bottom(style='border-radius: 0 0 0.25rem 0.25rem')
  select.per-page.border-0.btn(v-model='paginationOptions.perPage' @change='customPerPageChange($event.target.value)')
    template(v-if='paginationOptions.perPageDropdown')
      option(
        v-for='e in paginationOptions.perPageDropdown'
        :value='e'
      ) {{e}}
    template(v-else)
      option(
        v-for='e in perPages'
        :value='e'
      ) {{e}}
  .mx-auto.d-flex
    button.btn.text-muted.px-2(
      type='button'
      @click='customPageChange(currentPage-1)'
      :class='currentPage == 1 ? "opacity-50" : "" '
    )
      span.mdi.mdi-chevron-left
    .btn-group
      button.btn.px-2(
        type='button'
        v-for='i in pages'
        v-if='i >= pages_min && i <= pages_max' 
        :class='i == currentPage ? "text-primary" : "btn-light" '
        @click='customPageChange(i)'
      ) {{i}}
    button.btn.text-muted.px-2(
      type='button'
      @click='customPageChange(currentPage+1)'
      :class='currentPage == pages ? "opacity-50" : "" '
    )
      span.mdi.mdi-chevron-right
  
  .btn-group
    label.btn.btn-light(
      @click='customPageChange(currentPage-1)'
      :class='currentPage == 1 ? "opacity-50" : "" '
    ) {{paginationOptions.prevLabel}}
    label.btn.btn-light(
      @click='customPageChange(currentPage+1)'
      :class='currentPage == pages ? "opacity-50" : "" '
    ) {{paginationOptions.nextLabel}}
                
</template>

<script>

import {uniq, compact} from 'lodash'

export default {
  name: 'TablePagination',
  props: ['total', 'pageChanged', 'perPageChanged', 'paginationOptions'],
  components: {
    
  },
  computed: {
    pages() {
      return Math.ceil(this.total / this.paginationOptions?.perPage)
    },
    pages_min() {
      const v = Math.floor(this.currentPage / 10) * 10
      return v
      // return v == this.currentPage ? v-1 : v
    },
    pages_max() {
      const v = Math.floor(this.currentPage / 10) * 10 + 10
      return v
      // return this.currentPage % 10 == 0 ? v-1 : v
    },
  },
  data() {
    return {
      currentPage: 1,
      perPages: uniq(compact([10, 20, 30, 50, 100, +this.paginationOptions?.perPage])).sort((a, b) => a-b)
    }
  },
  mounted() {
    
  },
  methods: {
    customPageChange(customCurrentPage) {
      this.currentPage = Math.max(1, Math.min(this.pages, customCurrentPage))
      this.pageChanged({currentPage: this.currentPage});
    },
    customPerPageChange(customPerPage) {
      this.perPageChanged({currentPerPage: customPerPage});
    }
  }
}
</script>
