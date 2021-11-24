<style lang="sass" scoped>
$primary: #0D6EFD


</style>
<template lang="pug">
.container(style='max-width: 480px')
  .bg-white.shadow.p-4
    h5.text-muted.text-center 로그인

    .border-top.my-4(style='opacity: 0.5')
  
    form(@submit.prevent='login')
      strong.mb-2: small ID
      input.form-control.form-control-lg(type='text' v-model='form.id' autofocus)
      strong.mb-2: small Password
      input.form-control.form-control-lg(type='password' v-model='form.pw')
      button.btn.btn-light.border.py-2.px-4.mt-1(type='submit') 로그인
    
    
    .border-top.my-4(style='opacity: 0.5')
    footer.text-center
      a.me-3(href='https://selectfromuser.com' target='_blank') selectfromuser.com
</template>

<script>
export default {
  name: 'Login',
  components: {
    
  },
  computed: {
    current_menu() {
      return this.$store.state.config.menus.filter(e => e.path == [this.page, this.subpage].filter(Boolean).join('/'))[0] || {}
    },
    menus() {
      if (!this.current_menu) return []
      return this.$store.state.config.menus.filter(e => e.group == this.current_menu.group)
    },
  },
  data() {
    return {
      form: {
        id: '',
        pw: '',
      }
    }
  },
  async mounted() {
    // test
    try {
      await this.$store.dispatch('session')
      if (this.$store.state.session.id) {
        document.location = '/'
      }
    } catch (error) {
      console.log(error)
    }
    this.load()
  },
  methods: {
    load() {
    },
    async login() {
      try {
        const r = await this.$http.post('/api/auth/authorize', {
          id: this.form.id,
          pw: this.form.pw,
        })
        console.log(r)
        if (r?.data?.message != 'ok') throw new Error(r?.data?.message || '로그인 실패')
        
        const {token} = r.data

        window.localStorage.SELECT1_TOKEN = token
        await this.$store.dispatch('session')

        document.location = '/'


      } catch (error) {
        alert(error.message)
      }
    }
  }
}
</script>
