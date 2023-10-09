const messages = {
  en: {
    App: {
      name: "Select"
    },
    Login: {
      title: 'Administrate Login',
      sign_in_with_google: 'Sign in with Google',
      login: 'Email',
      password: 'Password',
      submit: 'Login',
      installed_version: 'Installed version: {version}',
      help: 'Help'
    }
  },
  kr: {
    App: {
      name: "셀렉트 어드민"
    },
    Login: {
      title: '셀렉트 어드민 로그인',
      sign_in_with_google: '구글 계정으로 로그인',
      login: '이메일',
      password: '비밀번호',
      submit: '로그인',
      installed_version: '설치형 버전: {version}',
      help: '도움말'
    }
  }
}


export const languages = Object.keys(messages)

export default messages
