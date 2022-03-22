<style lang="sass" scoped>
$primary: #0D6EFD
.title
  color: #555

.editor
  
.nav-left
  // position: fixed
  // top: 50px
  left: 0
  width: 250px
  // height: 100vh
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
</style>
<template lang="pug">
div
  .p-4.bg-light
    .d-flex
      h2.title {{column.label || column.field}}
      
  div.shadow
    textarea.w-100.p-2.border-0(style='height: 80vh') {{code}} 
  
    

</template>

<script>

export default {
  name: 'TextViewer',
  props: ['column', 'value'],
  components: {
    
  },
  computed: {
    
  },
  data() {
    return {
      code: String(this.value),
      current_lang: this.column.highlightLanguage || "json" 
    }
  },
  async mounted() {
    
  },
  methods: {
    load() {
      // this.$store.dispatch('config')
      
    },
    highlighter(code) {
      return highlight(code, languages.js);
    },
  }
}
</script>
