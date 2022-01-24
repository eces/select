
const debug = require('debug')('select:app')
debug.log = global.logger.info.bind(global.logger)
const error = require('debug')('select:app')
error.log = global.logger.error.bind(global.logger)

module.exports = (name) => {
  const info = require('debug')(name)
  info.log = global.logger.info.bind(global.logger)
  
  const error = require('debug')(name)
  error.log = global.logger.error.bind(global.logger)

  return {
    debug: require('debug')(name),
    info,
    error,
  }
}