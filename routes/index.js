const debug = require('debug')('select:api')

const router = require('express').Router()

router.use('/api/connect', require('./connect'))
router.use('/api/config', require('./config'))
router.use('/api/auth', require('./auth'))
router.use('/api/block', require('./block'))

router.get('/healthcheck', (req, res) => {
  res.status(200).send('ok')
})

module.exports = router