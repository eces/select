<style lang="sass" scoped>
$primary: #0D6EFD

footer
  a
    text-decoration: none
    font-size: 0.8rem
    color: #777
    &:hover
      color: #333

</style>
<template lang="pug">
div
  .container.my-4(style='max-width: 480px')
    .bg-white.shadow-sm.p-4.rounded

      h5.text-muted.text-center.mb-3 셀렉트 어드민 로그인



      a.btn.btn-light.border.shadow-sm.w-100.py-3(href='#' @click.prevent='continue_google') 
        span.mdi.mdi-google.me-2.text-primary
        span Sign in with Google 구글 계정으로 로그인
        br 

      .border-top.my-4(style='opacity: 0.5')

      form(@submit.prevent='login')
        strong.mb-2: small 이메일
        input.form-control.form-control-lg(type='text' v-model='form.id' autofocus)
        strong.mb-2: small 비밀번호
        input.form-control.form-control-lg(type='password' v-model='form.pw')
        button.btn.btn-light.border.py-2.px-4.mt-1(type='submit') 로그인
      //- .border-top.my-4(style='opacity: 0.5')
    
      //- form.async(:class='{done:done}' @submit.prevent='login' v-if='!challenge_id')
      //-   h4.text-center.mb-4: small 이메일 주소 OTP 로그인
        
      //-   input.form-control.form-control-lg(type='email' autofocus v-model='form.email')
      //-   button.btn.btn-light.border.py-2.px-4.mt-1(type='submit' style='') 인증코드 요청
      //-   //- .input-group-append
      
      //- form.async(:class='{done:done}' @submit.prevent='login2' v-else)
      //-   .text-center
      //-     h4.text-center.mb-4: small 메일함에 도착한 인증코드를 입력해주세요.
      //-     input.form-control.form-control-lg.mx-auto(type='text' autofocus v-model='form.code' style='width: 80%')
      //-     button.btn.btn-light.border.py-2.px-4.mt-1(type='submit') 로그인

      //- .border-top.my-4(style='opacity: 0.5')
      .border-top.my-4(style='opacity: 0.5')
      footer.d-flex
        a.me-auto(target='_blank' href='https://selectfromuser.com') 설치형 버전:{{env.VUE_APP_VERSION}}
        a.ms-auto(target='_blank' href='https://docs.selectfromuser.com') 도움말
  //- div.bg-white.m-4.p-4

    pre {{$store.state.session}}
    

</template>

<script>

import { uniqBy, keyBy, sortBy, groupBy } from 'lodash'
// import Tiptap from '@/components/Tiptap.vue'

export default {
  name: 'Page',
  props: ['page', 'subpage'],
  components: {
    // Tiptap,
  },
  computed: {
    // config() {
    //   return this.$store.state.config
    // },
    current_menu() {
      return this.$store.state.config.menus.filter(e => e.path == [this.page, this.subpage].filter(Boolean).join('/'))[0] || {}
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
      env: process.env,
      done: false,
      form: {
        email: 'test@test.com',
        code: '',
      },
      challenge_id: 0,
    }
  },
  async mounted() {
    // test
    this.challenge_id = this.$route.query.challenge_id
    this.form.code = this.$route.query.code
    this.form.email = this.$route.query.email

    try {
      await this.$store.dispatch('session')
      if (this.$store.state.session.id) {
        document.location = '/'
      }
    } catch (error) {
      console.log(error)
    }
    this.done = true
    
    this.load()
  },
  methods: {
    load() {
      // this.$store.dispatch('config')
    },
    async continue_google() {
      try {
        const r = await this.$http.get('/api/connect/google')
        if (r?.data?.message != 'ok') throw new Error(r?.data?.message || '로그인 요청 실패')

        const w = 500
        const h = 670
        const y = window.top.outerHeight / 2 + window.top.screenY - ( h / 2);
        const x = window.top.outerWidth / 2 + window.top.screenX - ( w / 2);
        window.open(r.data.url, 'YSG_GoogleOAuthStep1', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`)
      } catch (error) {
        alert(error.message)
      }
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

        window.localStorage.SELECT2_TOKEN = token
        await this.$store.dispatch('session')

        document.location = '/'


      } catch (error) {
        alert(error.message)
      }
    }
  }
}
</script>
