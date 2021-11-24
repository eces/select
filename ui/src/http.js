import axios from 'axios'

const $http = axios.create({
  withCredentials: false,
  timeout: 5000,
  baseURL: process.env.VUE_APP_API_URL,
  headers: {

  },
})

$http.interceptors.response.use(response => {
  return response
}, error => {
  // if (error.response.status === 401) {
  //   alert('로그인 필요합니다.')
  //   window.location.href = '/user/login'
  // }
  return error
})

export default $http
