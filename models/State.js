const debug = require('debug')('select:State')

const state = {}

const get = async (name) => {
  return state[name]
}
const set = async (name, value) => {
  return state[name] = value
}

module.exports = {
  get, set
}
