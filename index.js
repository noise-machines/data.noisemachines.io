const urlParser = require('url')
const mapValues = require('lodash/mapValues')
const { DateTime } = require('./luxon')
const tryParseInt = require('./tryParseInt')
const getListens = require('./getListens')
const getBooks = require('./getBooks')
const getTimeZone = require('./getTimeZone')

module.exports = async (req, res) => {
  const url = urlParser.parse(req.url, true)
  const options = mapValues(url.query, tryParseInt)
  switch (url.pathname) {
    case '/thomas/listens':
      return getListens(options)
    case '/thomas/listens/today':
      options.from = DateTime.local().startOf('day')
      options.to = DateTime.local()
      return getListens(options)
    case '/thomas/books':
      return getBooks(options)
    case '/thomas/time-zone':
      return getTimeZone()
  }
  return ''
}
