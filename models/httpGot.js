const {debug, info, error} = require('../log')('select:got')


module.exports.getGotInstance = async () => {
  const { default: got } = await import('got')
  
  const external_got = got.extend({
    timeout: {
      request: 5000,
    },
    headers: {
      'User-Agent': 'SelectAdmin',
    },
  })
  return external_got
}