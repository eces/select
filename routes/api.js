const {debug, info, error} = require('../log')('select:api')
const path = require('path')
const fs = require('fs')

const only = require('../models/only')
const db = require('../models/db')
const router = require('express').Router()

router.use((req, res, next) => {
  try {
    req._json = true
    req.team = global.__TEAM
    req.resource = db.get_internal_resource
    next()
  } catch (error) {
    next(error)
  }
})

// quite not good
global.useRouter = () => {
  return require('express').Router()
}

const p = path.join(process.env.CWD || process.cwd(), '_api', `index.js`)
if (!fs.existsSync(p)) {
  // return res.status(500).json({
  //   message: `_api/${path}.js not found`
  // })
} else {
  console.log(`[_api] index.js loaded`)
  router.use(require(p))
}


module.exports = router