const debug = require('debug')('select:UserProfile')

const getName = async (opt) => {
  debug('>>>>>>TOOD UserProfile', opt)
  return { name: 'TODO' }
}
const getEmail = async (opt) => {
  debug('>>>>>>TOOD UserProfile', opt)
  return { email: 'TODO' }
}

module.exports = {
  getName,
  getEmail,
}
