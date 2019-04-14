require('dotenv').config()
const urlParser = require('url')
const getListens = require('./thomas/listens')
const getSongs = require('./artists/songs')
const searchSongs = require('./songs/search')

module.exports = async (req, res) => {
  const { pathname } = urlParser.parse(req.url, true)
  switch (true) {
    case pathname === '/':
      return 'Hi from data.noisemachines.io'
    case pathname === '/thomas/listens':
      return getListens(req, res)
    case /artists\/.*\/songs/.test(pathname): // artists/:id/songs
      return getSongs(req, res)
    case /songs\/search/.test(pathname): // songs/search
      return searchSongs(req, res)
  }
  const error = new Error(`Didn't recognize route ${pathname}.`)
  error.statusCode = 404
  throw error
}
