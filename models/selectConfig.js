const {debug, info, error} = require('../log')('select:selectConfig')
const YAML = require('js-yaml')
const { getConnection } = require('typeorm')
const State = require('../models/State')
// const Vault = require('../models/vault')
const {glob} = require('glob')
const fs = require('fs')
const chalk = require('chalk')
const path = require('path')

const refresh_team_config = async (team_id) => {
  const errors = []

  try {
		// check team env
		// if prod fixed > get deployment > inject teamrows > yaml + production
		// if prod not fixed > yaml + production
		
		// const rows = await master.createQueryBuilder()
		// 	.select('*')
		// 	.from('TeamRow')
		// 	.where('team_id = :tid AND `type` = "CONFIG" ', {
		// 		tid: team_id,
		// 	})
		// 	.andWhere('commit_at IS NOT NULL')
		// 	.orderBy('id', 'ASC')
		// 	.getRawMany()

		// if (rows.length === 0) throw StatusError(500, 'no config published')
		
		// const tree = await master.createQueryBuilder()
		// 	.select('*')
		// 	.from('TeamRow')
		// 	.where('team_id = :tid AND `type` = "TREE" ', {
		// 		tid: team_id,
		// 	})
		// 	.andWhere('commit_at IS NOT NULL')
		// 	.orderBy('id', 'ASC')
		// 	.limit(1)
		// 	.getRawOne()

		// let sorted_rows
		// if (tree && tree.json) {
		// 	sorted_rows = tree.json.map(e => {
		// 		return rows.find(file => file.id == e.team_row_id)
		// 	}).filter(e => !!e)
		// } else {
		// 	// not has tree yet
		// 	sorted_rows = rows
		// }

		// todo:  glob FILES
		const files = await glob(path.join(process.cwd(), '**/*.{yml,yaml}'), {
			ignore: 'node_modules/**',
		})

		let global_row
		for (const path of files) {
			const filename = path.split('/').slice(-1)[0]
			if (['global.yml', 'global.yaml'].includes(filename)) {
				global_row = {
					id: path,
					json: {
						yml: fs.readFileSync(path),
					},
				}
			}	
		}

		const config = {}
		sorted_rows = files || []
		sorted_rows.sort()

		let json = {
			menus: [],
			pages: [],
			users: [],
			title: undefined,
			layout: undefined,
			resources: [],
			// defaultColumns: {},
			// defaultColumnOptions: {},
		}
		for (const path of sorted_rows) {
			try {
				const filename = path.split('/').slice(-1)[0]
				if (filename[0] == '_') continue

				const row = {
					id: path,
					json: {
						yml: '',
					}
				}
				row.json.yml = fs.readFileSync(path)
				if (global_row && global_row.json && global_row.id != path) {
					row.json.yml = `${global_row.json.yml || ''}\n\n${row.json.yml || ''}`
				}
				// const parsed = YAML.load(row.json.yml || '') || {}
				const docs = YAML.loadAll(row.json.yml || '') || []
				for (const parsed of docs) {
					if (!_.isObject(parsed)) continue

					if (parsed.title) {
						json.title = parsed.title
					}
					if (parsed.layout) {
						json.layout = parsed.layout
					}

					if (_.isArray(parsed.menus)) {
						parsed.menus = parsed.menus.map(e => {
							e._id = row.id
							e.order = +e.order || undefined
							return e
						})
						json.menus.push(...parsed.menus)
					}
					if (_.isArray(parsed.pages)) {
						parsed.pages = parsed.pages.map(e => {
							e._id = row.id
							e.order = +e.order || undefined
							return e
						})
						json.pages.push(...parsed.pages)
					}
					if (_.isArray(parsed.users)) {
						json.users.push(...parsed.users)
					}
					if (_.isArray(parsed.resources)) {
						json.resources.push(...parsed.resources)
					}
					// if (parsed.defaultColumns && _.isObject(parsed.defaultColumns)) {
					// 	json.defaultColumns = Object.assign(json.defaultColumns, parsed.defaultColumns)
					// }
					// if (parsed.defaultColumnOptions && _.isObject(parsed.defaultColumnOptions)) {
					// 	json.defaultColumnOptions = Object.assign(json.defaultColumnOptions, parsed.defaultColumnOptions)
					// }
				}

				// fill tabs page
				const fill_block = (block) => {
					if (block && block.tabOptions && block.tabOptions.tabs) {
						block.tabOptions.tabs = block.tabOptions.tabs.map(tab => {
							if (tab.path) {
								const filler = json.pages.find(e => e.path == tab.path)
								if (filler) {
									return {
										...filler,
										...tab,
									}
								}
							}
							if (tab && tab.blocks) {
								tab.blocks = tab.blocks.map(fill_block)
							}
							return tab
						})
					}
					if (block && block.viewModal && block.viewModal.usePage) {
						const filler = json.pages.find(e => e.path == block.viewModal.usePage)
						if (filler) {
							block.viewModal = {
								...filler,
								...block.viewModal,
								blocks: filler.blocks,
							}
						}
					}
					if (block && block.modals) {
						block.modals = block.modals.map(viewModal => {
							if (viewModal.usePage) {
								const filler = json.pages.find(e => e.path == viewModal.usePage)
								if (filler) {
									return {
										...filler,
										...viewModal,
										blocks: filler.blocks,
									}
								}		
							}
							return viewModal
						})
					}
					if (block && block.blocks) {
						block.blocks = block.blocks.map(fill_block)
					}
					if (block.got) {
						block.axios = block.got
						block._use_http_got = true
					}
					return block
				}
				json.pages = json.pages.map((page, i) => {
					if (page && page.blocks) {
						page.blocks = page.blocks.map(fill_block)
					}
					page._idx = i
					return page
				})

				// if (json == null) {
				// 	if (!_.isArray(parsed.menus)) parsed.menus = []
				// 	if (!_.isArray(parsed.pages)) parsed.pages = []
				// 	if (!_.isArray(parsed.users)) parsed.users = []

				// 	parsed.menus = parsed.menus.map(e => {
				// 		e._id = row.id
				// 		e.order = +e.order || undefined
				// 		return e
				// 	})
				// 	parsed.pages = parsed.pages.map(e => {
				// 		e._id = row.id
				// 		e.order = +e.order || undefined
				// 		return e
				// 	})

				// 	json = parsed
				// } else {
				// 	if (!_.isObject(parsed)) continue

				// 	if (_.isArray(parsed.menus)) {
				// 		parsed.menus = parsed.menus.map(e => {
				// 			e._id = row.id
				// 			e.order = +e.order || undefined
				// 			return e
				// 		})
				// 		json.menus.push(...parsed.menus)
				// 	}
				// 	if (_.isArray(parsed.pages)) {
				// 		parsed.pages = parsed.pages.map(e => {
				// 			e._id = row.id
				// 			e.order = +e.order || undefined
				// 			return e
				// 		})
				// 		json.pages.push(...parsed.pages)
				// 	}
				// 	if (_.isArray(parsed.users)) {
				// 		json.users.push(...parsed.users)
				// 	}
				// }
			} catch (e) {
				// debug(e.stack)
				// TODO: notify to user
        console.log('')
				error(path)
				error(e)
        console.log('')
        errors.push({
          path,
          message: e.message,
        })
			}
		}
		json.menus = _.sortBy(json.menus, 'order')

		// const keys = await master.createQueryBuilder()
		// 	.select('*')
		// 	.from('TeamRow')
		// 	.where('team_id = :tid AND `type` = "KEY" ', {
		// 		tid: team_id,
		// 	})
		// 	.andWhere('commit_at IS NOT NULL')
		// 	.getRawMany()

		// TODD: load env from api 

		const items = Object.keys(process.env).filter(e => e.startsWith('APP_'))
		const keys = items.map(key => {
			return {
				name: key,
				json: {
					value: process.env[key],
				},
			}
		})


		json.keys = keys.map(e => {
			return {
				key: e.name,
				// value: e.json.vault ? Vault.decode(e.json.value) : String(e.json.value === undefined ? '' : e.json.value).trim(),
				value: String(e.json.value === undefined ? '' : e.json.value).trim(),
				// mode: e.json.mode,
			}
		})

		const _resources = json.resources || []
		const resources = _resources.map((e, i) => {
			e.id = i
			e.name = String(e.name).trim()
      for (const key in e) {
        if (String(e[key]).startsWith('$')) {
          const v = process.env[String(e[key]).slice(1)]
          if (!v) {
            console.log(chalk.yellow('[WARN]'), `process.env.${ String(e[key]).slice(1) } not found.`)
          }
          e[key] = process.env[String(e[key]).slice(1)] || undefined
        }
      }
			return e
		})

		// cloud overwrite
		json.resources = resources

		// ts for reload
		json.ts = Date.now()

		// always - auto publish
		const next_json = JSON.stringify(json)
		// debug(next_json)
		await State.set(`admin.${team_id}.yaml`, next_json)
		await State.set(`admin.${team_id}.error`, errors.length ? JSON.stringify(errors) : '')
		// const cached_json = await redis.get(`admin.${team_id}.yaml`)
		// if (cached_json != next_json) {
		// }

		if (global.__livereload_server) {
			debug('global.__livereload_server')
			global.__livereload_server.refresh('/')
		}

	} catch (e) {
		error(e.stack)

		throw StatusError(500, 'config not updated. ' + e.message)
	}
}

const refresh_team_all = async () => {
  try {
		const ids = [process.env.TEAM_ID]
    for (const team_id of ids) {
      try {
        debug(`try refresh config to tid:${team_id}`)
        await module.exports.refresh_team_config(team_id)
      } catch (ee) {
        debug('refresh config error', ee.message)
      }
      // continue to next
    }
      
  } catch (e) {
    error(e.stack)
  }
}

const watch = () => {
	const chokidar = require('chokidar')

	chokidar.watch(path.join(process.cwd(), '**/*.yml'), {
		ignored: 'node_modules/**',
		ignoreInitial: true,
	})
	.on('all', (event, path) => {
		console.log(chalk.blue('[INFO]'), `Reload from ${path} ${event}.`)
		refresh_team_config(process.env.TEAM_ID)
	})
}

module.exports = {
  refresh_team_config,
	refresh_team_all,
	watch,
}