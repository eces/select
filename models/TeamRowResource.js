const debug = require('debug')('select:TeamRowResource')

const get = async (opt) => {
  debug('>>>>>>TOOD TeamRowResource', opt)
  return null
}

// await master_cloud.createQueryBuilder()
//           .select('id')
//           .addSelect(`json->'$.type'`, 'json_type')
//           .addSelect(`json->'$.policy'`, 'policy')
//           .addSelect(`json->'$.pg_null_coalescing'`, 'pg_null_coalescing')
//           .addSelect(`json->'$.mode'`, 'mode')
//           .addSelect('uuid')
//           .from('TeamRow')
//           .where('team_id = :tid AND name = :name', {
//             tid: team_id,
//             name: String(tx.resource).trim(),
//           })
//           .andWhere('commit_at IS NOT NULL')
//           .andWhere('`type` = "RESOURCE" ')
//           .andWhere('deleted_at IS NULL')
//           .getRawMany()

module.exports = {
  get,
}
