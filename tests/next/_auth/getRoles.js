
const jwt = require('jsonwebtoken')
const uuidv4 = require('uuid').v4
const qs = require('querystring')
const { getRedisConnection } = require('./redis')

module.exports = async (user_id) => {
	return {
    user: {
      name: 'Name',
      email: 'jhlee@selectfromuser.com',
    },
    roles: [
      {
        // id,
        user_id,
        name: 'admin',
      }
    ]
  }
}