pack = require '../package.json'

config = require './config'
async = require 'async'
request = require 'superagent'
fs = require 'fs'
path = require 'path'
dialog = require 'commander'
wrench = require 'wrench'

log = require './logger'
maxmertkit = require './maxmertkit'



# **Initializing**
# modifier.json file with main info about project

exports.init = ( options ) ->

	fileName = path.join config.directory(), 'modifier.json'

	async.series

		modifier: ( callback ) =>

			request
				.get( "#{pack.homepage}/api/0.1/defaults/modifier" )
				.set( 'X-Requested-With', 'XMLHttpRequest' )
				.set('Accept', 'application/json')
				.end ( res ) =>

					if res.ok
						write fileName, res.body, callback

					else
						log.requestError res.body.msg, 'ERRR', res.status
						callback res.error, null


	, ( err, res ) =>

		if err?
			log.error "An error while initialized modifier."
			process.stdin.destroy()

		else
			process.stdin.destroy()





# **Publish**
# current version of modifier.

exports.publish = ( options ) ->

	mjson = maxmertkit.json()

	fileName = 'modifier.json'

	async.series

		modifier: ( callback ) =>
			
			fs.exists path.join( config.directory(), fileName ), ( exist ) =>
				if not exist
					log.error("couldn\'t read #{fileName} file.")
					callback true, null

				else
					rawjson = fs.readFileSync path.join( config.directory(), fileName )
			
					if not rawjson?
						log.error("couldn\'t read #{fileName} file.")
						callback true, null

					else
						json = JSON.parse rawjson
						callback null, json


		password: ( callback ) =>
			
			dialog.password '\nEnter your password: ', ( password ) ->
				callback null, password

	, ( err, res ) =>

		if err?
			log.error "Publishing canceled."
			process.stdin.destroy()

		else
			
			request
				.post( "#{pack.homepage}/api/0.1/modifiers/#{mjson.name}/#{mjson.version}" )
				.set( 'X-Requested-With', 'XMLHttpRequest' )
				.send
					modifier: res.modifier
					password: res.password
					name: mjson.name
					version: mjson.version
					username: mjson.author
				
				.end ( res ) ->
					
					if res.ok
						log.requestSuccess "modifier #{mjson.name}@#{mjson.version} successfully published."
						process.stdin.destroy()

					else
						log.requestError res.body.msg, 'ERRR', res.status
						process.stdin.destroy()






# **Unpublish**
# current version of modifier.

exports.unpublish = ( options ) ->

	mjson = maxmertkit.json()

	async.series

		password: ( callback ) =>
			
			dialog.password '\nEnter your password: ', ( password ) ->
				callback null, password

	, ( err, res ) =>

		if err?
			log.error "Unpublishing canceled."
			process.stdin.destroy()

		else
			
			request
				.del( "#{pack.homepage}/api/0.1/modifiers/#{mjson.name}/#{mjson.version}" )
				.set( 'X-Requested-With', 'XMLHttpRequest' )
				.send
					password: res.password
					name: mjson.name
					version: mjson.version
					username: mjson.author
				
				.end ( res ) ->
					
					if res.ok
						log.requestSuccess "modifier #{mjson.name}@#{mjson.version} successfully unpublished."
						process.stdin.destroy()

					else
						log.requestError res.body.msg, 'ERRR', res.status
						process.stdin.destroy()







# **Install**
# modifier dependences.

exports.install = ( pth, list ) ->

	wrench.mkdirSyncRecursive pth, 0o0777

	for name, version of list

		# Need a closure for correct info view
		do (name, version, pth) ->
			
			request
				.get( "#{pack.homepage}/api/0.1/modifiers/#{name}/#{version}" )
				.set( 'X-Requested-With', 'XMLHttpRequest' )
				
				.end ( res ) =>
					
					if res.ok

						str = "$mod-#{name}: #{res.body.modifier.class}"
						fileName = path.join(pth,"_#{name}.sass")
						
						sass fileName, str, ( err, res ) ->

							if err?
								log.error "Couldn\'t write file #{fileName}"

							else

								fs.appendFile path.join(pth,'../../_imports.sass'), "@import 'dependences/modifiers/_#{name}.sass'\n", ( err ) ->
									if err?
										log.error "Couldn\'t append import of #{fileName} to the file _imports.sass"

									else
										log.requestSuccess "modifier #{name}@#{version} successfully installed."

					else
						log.requestError res.body.msg, 'ERRR', res.status
						process.stdin.destroy()



























# Function with json write.

write = ( file, json, callback ) ->

	fs.writeFile file, JSON.stringify(json, null, 4), ( err ) ->

		if err
			log.error "initializing – #{err}."
			callback err, null

		else
		
			log.success "file #{file} successfully created."
			callback null, json



# Write sass file

sass = ( fileName, data, callback ) ->

	fs.writeFile fileName, data, ( err ) ->

		if err?
			callback err, null

		else
			callback null, fileName

