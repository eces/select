const debug = require('debug')('select:api')
const only = require(__absolute + '/models/only')

const router = require('express').Router()

router.get('/json', [only.id()], (req, res) => {
  res.status(200).json({
    message: 'ok',
    'select-configuration': Object.assign({}, global.config.get('select-configuration'), {
      users: undefined,
      'internal-resources': undefined,
      resources: (global.config.get('select-configuration.resources') || []).map(e => {
        return {
          name: String(e.key).trim(),
          type: String(e.type).trim(),
        }
      }),
    }),
  })
})

module.exports = router