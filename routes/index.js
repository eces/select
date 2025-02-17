const debug = require('debug')('select:api')

const router = require('express').Router()

router.use('/api/block', require('./block'))  
router.use('/api/team', require('./team'))  
router.use('/api/auth', require('./auth'))  
router.use('/api/connect', require('./connect'))  
router.get('/healthcheck', (req, res) => {
  res.status(200).send('ok')
})
router.get('/healthcheck/ip', async (req, res, next) => {
  try {
    res.status(200).json({
      message: 'ok',
      ip: global.PRIVATE_IP,
      // region: global.config.get('region.current'),
    })
  } catch (error) {
    next(error)
  }
})
router.get('/', (req, res) => {
  res.status(200).send('ok')
})

router.use(require('./api'))

module.exports = router