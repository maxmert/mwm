log = require 'cli-color'
pack = require '../package.json'


###
Set all colors
###
logName = log.xterm(255).bgXterm(0)
logTypeError = log.xterm(196).bgXterm(0)
logTypeSuccess = log.xterm(34).bgXterm(0)
logStatusError = log.xterm(196)
logStatusSuccess = log.xterm(34)
logWidgetName = log.xterm(61)



exports.requestError = ( msg, widget, type = 'ERRR', status = 404 ) ->
	console.log "#{logName(pack.name)} #{logTypeError(type)} #{logStatusError(status)} #{logWidgetName(widget)} – #{msg}"

exports.requestSuccess = ( msg, widget, type = 'http', status = 200 ) ->
	console.log "#{logName(pack.name)} #{logTypeSuccess(type)} #{logStatusSuccess(status)} #{logWidgetName(widget)} – #{msg}"

exports.error = ( msg, type = 'ERRR') ->
	console.log "#{logName(pack.name)} #{logTypeError(type)} #{msg}\n"

exports.success = ( msg, type = 'OK') ->
	console.log "#{logName(pack.name)} #{logTypeSuccess(type)} #{msg}\n"