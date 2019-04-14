const mapValues = require('lodash/mapValues')
const urlParser = require('url')
const queryString = require('query-string')
const getHostAndProtocol = require('../util/getHostAndProtocol')
const tryParseInt = require('../util/tryParseInt')
const UrlPattern = require('url-pattern')
const Lyricist = require('@noise-machines/lyricist')
const lyricist = new Lyricist(process.env.GENIUS_ACCESS_TOKEN)

const urlPattern = new UrlPattern('/songs/search')

const toQuery = offset => queryString.stringify({ offset })

const toMetadata = options => {
  const pageOf =
    options.hostAndProtocol +
    urlPattern.stringify(options) +
    '?' +
    queryString.stringify({ query: options.query })
  const { offset } = options

  const metadata = {
    self: pageOf + '&' + toQuery(offset),
    kind: 'Page',
    pageOf,
    first: pageOf + '&' + toQuery(0),
    next: pageOf + '&' + toQuery(offset + 1)
  }

  if (offset > 0) {
    metadata.previous = pageOf + '&' + toQuery(offset - 1)
  }

  return metadata
}

const toResponse = (options, songs) => {
  const response = {
    ...toMetadata(options),
    contents: songs
  }

  return response
}

const defaultOptions = {
  offset: 0
}

const parseOptions = req => {
  const url = urlParser.parse(req.url, true)
  const queryOptions = mapValues(url.query, tryParseInt)
  const options = Object.assign(defaultOptions, queryOptions)

  options.hostAndProtocol = getHostAndProtocol(req)

  return options
}

const setHeaders = res => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
}

const searchGenius = async options => {
  const songs = await lyricist.search(options.query, {
    page: options.offset + 1
  })
  return songs.map(song => ({
    id: song.id,
    name: song.title,
    artist: {
      id: 644,
      name: song.primary_artist.name
    }
  }))
}

module.exports = async (req, res) => {
  if (!process.env.GENIUS_ACCESS_TOKEN) {
    res.statusCode = 500
    res.end('GENIUS_ACCESS_TOKEN environment variable not set.')
    return
  }

  const options = parseOptions(req)
  if (!options.query) {
    res.statusCode = 400
    res.end(
      'You must provide a query param called `query` so we know what to search for.'
    )
  }

  const songs = await searchGenius(options)
  const response = toResponse(options, songs)

  setHeaders(res)
  res.end(JSON.stringify(response))
}
