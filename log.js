
const debug = require('debug')('select:app')
debug.log = global.logger.info.bind(global.logger)
const error = require('debug')('select:app')
error.log = global.logger.error.bind(global.logger)

module.exports = (name) => {
  // const info = require('debug')(name)
  // const info = {
  //   log: global.logger.info.bind(global.logger)
  // }
  const info = (message, json) => {
    global.logger.info({
      message,
      json,
    })
  }
  const error = (message, json) => {
    global.logger.error({
      message,
      json,
    })
  }
  
  return {
    debug: require('debug')(name),
    info,
    error,
  }
}