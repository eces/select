const debug = require('debug')('select:api')
const only = require(__absolute + '/models/only')

const router = require('express').Router()

router.get('/json', [only.id()], (req, res) => {
  res.status(200).json({
    message: 'ok',
    'select-configuration': global.config.get('select-configuration'),
  })
})

module.exports = router