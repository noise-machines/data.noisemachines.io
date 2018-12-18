const luxon = require('luxon')
const getTimeZone = require('./getTimeZone')

luxon.Settings.defaultZoneName = getTimeZone()

module.exports = luxon
