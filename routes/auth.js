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

router.post('/request-otp', async (req, res, next) => {
  const p = path.join(process.env.CWD || process.cwd(), '_auth', 'requestOTP.js')
  if (!fs.existsSync(p)) {
    return res.status(500).json({
      message: 'requestOTP.js not found'
    })
  }
  const f = require(p)
  f(req, res, next)
})

router.post('/submit-otp', async (req, res, next) => {
  const p = path.join(process.env.CWD || process.cwd(), '_auth', 'submitOTP.js')
  if (!fs.existsSync(p)) {
    return res.status(500).json({
      message: 'submitOTP.js not found'
    })
  }
  const f = require(p)
  f(req, res, next)
})

router.post('/submit-password', async (req, res, next) => {
  const p = path.join(process.env.CWD || process.cwd(), '_auth', 'submitPassword.js')
  if (!fs.existsSync(p)) {
    return res.status(500).json({
      message: 'submitPassword.js not found'
    })
  }
  const f = require(p)
  f(req, res, next)
})

router.post('/request-password-reset', async (req, res, next) => {
  const p = path.join(process.env.CWD || process.cwd(), '_auth', 'requestPasswordReset.js')
  if (!fs.existsSync(p)) {
    return res.status(500).json({
      message: 'requestPasswordReset.js not found'
    })
  }
  const f = require(p)
  f(req, res, next)
})

router.get('/me', [only.id()], async (req, res, next) => {
  const p = path.join(process.env.CWD || process.cwd(), '_auth', 'refreshSession.js')
  if (!fs.existsSync(p)) {
    return res.status(500).json({
      message: 'refreshSession.js not found'
    })
  }
  const f = require(p)
  f(req, res, next)
})

module.exports = router