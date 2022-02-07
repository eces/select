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

      h5.text-muted.text-center.mb-3 페이지를 찾을 수 없습니다.

      
      .border-top.my-4(style='opacity: 0.5')
      footer.text-center
        a.me-3(target='_blank' href='https://selectfromuser.com') 소개
        a.me-3(target='_blank' href='https://www.selectfromuser.com/contact') 사전예약신청 또는 문의하기
        a.me-3(target='_blank' href='https://docs.selectfromuser.com') 기술지원
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
  },
  data() {
    return {
      env: process.env,
      done: false,
    }
  },
}
</script>
