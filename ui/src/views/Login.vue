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

      h5.text-secondary.text-center.mt-1.mb-1(style='letter-spacing: -0.5px; font-weight: 600') {{ $t('Login.title') }}



      a.btn.btn-light.border.shadow-sm.w-100.py-3(href='#' @click.prevent='continue_google') 
        span.mdi.mdi-google.me-2.text-primary
        span {{ $t('Login.sign_in_with_google') }}
        br 

      .border-top.my-4(style='opacity: 0.5')

      form(@submit.prevent='login')
        strong.mb-2: small {{ $t('Login.login') }}
        input.form-control.form-control-lg(type='text' v-model='form.id' autofocus)
        strong.mb-2: small {{ $t('Login.password') }}
        input.form-control.form-control-lg(type='password' v-model='form.pw')
        button.btn.btn-light.border.py-2.px-4.mt-1(type='submit') {{ $t('Login.submit') }}
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
        a.me-auto(target='_blank' href='https://selectfromuser.com/changelog') {{ $t('Login.installed_version', { version: env.VUE_APP_VERSION }) }}
          strong.ms-2(v-show='next_version' style='background-color: rgb(253, 236, 200); color: rgb(64, 44, 27); padding: 0.25rem; border-radius: 3px; font-weight: 600; border: solid 1px rgba(0,0,0,0.015)') 새로운 업데이트 {{ next_version }}
        a.ms-auto(target='_blank' href='https://docs.selectfromuser.com') {{ $t('Login.help') }}
  //- div.bg-white.m-4.p-4

    pre {{$store.state.session}}
    

</template>

<script>

import { uniqBy, keyBy, sortBy, groupBy } from 'lodash'
// import Tiptap from '@/components/Tiptap.vue'

import axios from 'axios'

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
      next_version: '',
    }
  },
  async mounted() {
    // test
    this.challenge_id = this.$route.query.challenge_id
    this.form.code = this.$route.query.code
    this.form.email = this.$route.query.email

    document.title = `${this.$t('Login.title')} - ${this.$t('App.name')}`

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

    try {
      
      const r = await axios.get('https://trello.com/c/uRIRAmgE/1-latest-ui-version.json')
      const next_version = r.data.desc
      const prev_num = +String(this.env.VUE_APP_VERSION).replace(/-/g, '') || 0
      const next_num = +String(next_version).replace(/-/g, '') || 0
      console.log(next_version, prev_num, next_num)
      if (prev_num < next_num) {
        this.next_version = next_version
      }
    } catch (error) {
      console.log('failed to load up-to-date version', error)
    }
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
