const { DateTime } = require('./luxon')
const urlParser = require('url')
const getListens = require('./getListens')
const getBooks = require('./getBooks')
const getTimeZone = require('./getTimeZone')

module.exports = async (req, res) => {
  const url = urlParser.parse(req.url, true)
  const options = url.query
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
