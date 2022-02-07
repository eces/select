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
.container(style='max-width: 480px')
  h1 로그인 중 ...
    

</template>

<script>

export default {
  name: 'Page',
  
  async mounted() {
    if (this.$route.hash) {
      const [k, v] = this.$route.hash.slice(1).split('=')
      if (k == 'result') {
        alert(`로그인 실패\n\n${ decodeURIComponent(v) }`)
        window.close()
      } else if (k == 'token') {
        window.localStorage.SELECT2_TOKEN = decodeURIComponent(v)
        await this.$store.dispatch('session')

        window.opener.location.href = '/'
        window.close()
      } else {
        alert('로그인 실패\n\n구글인증 응답결과가 올바르지 않습니다.')
        window.close()
      }
    }
    // console.log(this.$route)
    // window.localStorage.SELECT2_TOKEN = token
    //   await this.$store.dispatch('session')

    //   // console.log(11)

    //   document.location = '/'


    // } catch (error) {
    //   if (error.message.includes('REATTEMPT')) {
    //     document.location = `/login?email=${encodeURIComponent(this.form.email)}`
    //   }
    //   alert(error.message)
    // }
  },
}
</script>
