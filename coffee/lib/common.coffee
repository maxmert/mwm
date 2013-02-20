pack = require '../package.json'

async = require 'async'
request = require 'superagent'
fs = require 'fs'
dialog = require 'commander'
wrench = require 'wrench'
path = require 'path'

modifyers = require './modifyers'
themes = require './themes'
widgets = require './widgets'
maxmertkit = require './maxmertkit'
log = require './logger'





# **Initializing**
# a new widget/theme/modifyer in the current directory

exports.init = ( options ) ->

	async.series
	
		default: ( callback ) =>
			initJSON options, callback

	, ( err, res ) ->

		if err?
			log.error "An error while initialize maxmertkit.json"
		
		else

			if not options.theme? and not options.modifyer?

				widgets.init options

			if options.theme

				themes.init options

			else if options.modifyer

				modifyers.init options




# **Publish**
# current version of widget/theme/modifyer.
# First get type, then call publishing function.

exports.publish = ( options ) ->

	mjson = maxmertkit.json()

	switch mjson.type

		when 'modifyer'
			modifyers.publish options

		when 'theme'
			themes.publish options





# **Unpublish**
# current version of widget/theme/modifyer.
# First get type, then call unpublishing functions.

exports.unpublish = ( options ) ->

	mjson = maxmertkit.json()

	switch mjson.type

		when 'modifyer'
			modifyers.unpublish options

		when 'theme'
			themes.unpublish options






# **Install**
# all dependences
exports.install = ( options ) ->

	fs.writeFile '_imports.sass', "/* Generated with mwm – maxmertkit widget manager */\n", ( err ) ->
		if err? then log.error "An error while creating _imports.sass"

	install '.'



install = ( pth, inscludes = null ) ->

	wrench.readdirRecursive pth, ( error, files ) ->

		for index, file of files

			if path.basename( file ) is 'maxmertkit.json'

				mjson = maxmertkit.json( file )

				if mjson.dependences?

					pth = path.join( path.dirname( file ), 'dependences/widgets')
					wrench.mkdirSyncRecursive pth, 0o0777
					widgets.install pth, mjson.dependences, install( pth, yes )

				if mjson.modifyers?

					pth = path.join( path.dirname( file ), 'dependences/modifyers')
					wrench.mkdirSyncRecursive pth, 0o0777
					modifyers.install pth, mjson.modifyers

				if mjson.themes?

					pth = path.join( path.dirname( file ), 'dependences/themes')
					wrench.mkdirSyncRecursive pth, 0o0777
					themes.install pth, mjson.themes






































# **Initializing**
# maxmertkit.json file with main info about project

initJSON = ( options, callback ) ->

	async.series

		type: ( callback ) ->

			if not options.theme and not options.modifyer

				callback null, 'widget'

			else if options.theme

				callback null, 'theme'

			else if options.modifyer

				callback null, 'modifyer'

		name: ( callback ) ->
			defaultPkgName = 'test'
			dialog.prompt "name: (test) ", ( pkgName ) ->
				if pkgName is '' then pkgName = defaultPkgName
				callback null, pkgName

		version: ( callback ) ->
			defaultVersion = '0.0.0'
			dialog.prompt "version: (0.0.0) ", ( version ) ->
				if version is '' then version = defaultVersion
				callback null, version

		description: ( callback ) ->
			dialog.prompt "description: ", ( description ) ->
				callback null, description

		repository: ( callback ) ->
			dialog.prompt "repository: ", ( repository ) ->
				callback null, repository

		author: ( callback ) ->
			dialog.prompt "author: ", ( author ) ->
				callback null, author

		license: ( callback ) ->
			defaultLicense = 'BSD'
			dialog.prompt "license: (BSD) ", ( license ) ->
				if license is '' then license = defaultLicense
				callback null, license

	, ( err, maxmertkitjson ) =>

		initWriteConfirm  pack.maxmertkit, maxmertkitjson, callback



# Function with json write confirmation.
# Uses with maxmertkit.json, theme.json and modifyer.json

initWriteConfirm = ( file, json, callback ) ->

	console.log "\n\nWriting file #{file}\n"
	dialog.confirm "Is everything correct? \n\n #{JSON.stringify(json, null, 4)}\n-> ", ( ok ) =>

			console.log ""

			if not ok
				log.error("Initializing canceled")
				callback ok, null
				process.stdin.destroy()

			else
				fs.exists file, ( exists ) =>

					if not exists
						initWrite file, json, callback
						process.stdin.destroy()

					else #if exists
						log.error("File #{file} already exists.")

						dialog.confirm "Do you want to overwrite it and all other files in that folder? -> ", ( ok ) =>

							if not ok
								log.error("initialization canceled.")
								callback ok, null
								process.stdin.destroy()

							else
								initWrite file, json, callback
								process.stdin.destroy()




# Function with json write.
# Uses with maxmertkit.json, theme.json and modifyer.json

initWrite = ( file, json, callback ) ->

	fs.writeFile file, JSON.stringify(json, null, 4), ( err ) ->

		if err
			log.error "initializing – #{err}."
			callback err, null

		else
			# TODO: Add some info about maxmertkit.json ??

			log.success "file #{file} successfully created."
			callback null, json