const debug = require('debug')

/*
 * We need this, so CloudWatch creates just one log entry for multi-line messages.
 */
debug.log = console.log.bind(console)

module.exports = debug
