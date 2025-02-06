const {debug, info, error} = require('../log')('select:api')
const path = require('path')
const fs = require('fs')

const only = require('../models/only')
const router = require('express').Router()

router.use((req, res, next) => {
  req._json = true
  next()
})

router.get('/google2', async (req, res, next) => {
  const p = path.join(process.env.CWD || process.cwd(), '_auth', 'connectGoogle.js')
  if (!fs.existsSync(p)) {
    return res.status(500).json({
      message: 'connectGoogle.js not found'
    })
  }
  const f = require(p)
  f(req, res, next)
})

router.get('/google/callback', async (req, res, next) => {
  const p = path.join(process.env.CWD || process.cwd(), '_auth', 'connectGoogleCallback.js')
  if (!fs.existsSync(p)) {
    return res.status(500).json({
      message: 'connectGoogleCallback.js not found'
    })
  }
  const f = require(p)
  f(req, res, next)
})
router.post('/google/device', async (req, res, next) => {
  const p = path.join(process.env.CWD || process.cwd(), '_auth', 'connectGoogleDevice.js')
  if (!fs.existsSync(p)) {
    return res.status(500).json({
      message: 'connectGoogleDevice.js not found'
    })
  }
  const f = require(p)
  f(req, res, next)
})

module.exports = router