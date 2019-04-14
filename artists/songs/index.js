const mapValues = require('lodash/mapValues')
const urlParser = require('url')
const queryString = require('query-string')
const getHostAndProtocol = require('../../util/getHostAndProtocol')
const tryParseInt = require('../../util/tryParseInt')
const UrlPattern = require('url-pattern')
const Lyricist = require('lyricist')
const lyricist = new Lyricist(process.env.GENIUS_ACCESS_TOKEN)

const toQuery = (offset, limit) =>
  '?' + queryString.stringify({ offset, limit })

const urlPattern = new UrlPattern('/artists/:id/songs')
const toMetadata = options => {
  const pageOf = options.hostAndProtocol + urlPattern.stringify(options)
  const { offset, limit } = options

  const metadata = {
    self: pageOf + toQuery(offset, limit),
    kind: 'Page',
    pageOf,
    first: pageOf + toQuery(0, limit),
    next: pageOf + toQuery(offset + 1, limit)
    // last: pageOf + toQuery(lastFmMetadata.totalPages - 1, limit)
    // total: lastFmMetadata.total
  }

  if (offset > 0) {
    metadata.previous = pageOf + toQuery(offset - 1, limit)
  }

  return metadata
}

const toResponse = (options, lyrics) => {
  const response = {
    ...toMetadata(options),
    contents: lyrics
  }

  return response
}

const defaultOptions = {
  offset: 0,
  limit: 20,
  from: null,
  to: null
}

const parseOptions = req => {
  const url = urlParser.parse(req.url, true)
  const queryOptions = mapValues(url.query, tryParseInt)
  const pathOptions = urlPattern.match(url.pathname)
  const options = Object.assign(defaultOptions, queryOptions, pathOptions)

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

const getSongWithLyrics = async song => {
  const { lyrics } = await lyricist.song(song.id, {
    fetchLyrics: true,
    textFormat: 'plain'
  })

  return {
    track: {
      name: song.title,
      geniusId: song.id,
      lyrics
    },
    artist: {
      name: song.primary_artist.name,
      geniusId: song.primary_artist.id
    }
  }
}

const getGeniusLyrics = async options => {
  const geniusSongs = await lyricist.songsByArtist(options.id, {
    page: options.offset + 1,
    perPage: options.limit
  })
  const songPromises = geniusSongs.map(getSongWithLyrics)
  const songs = await Promise.all(songPromises)

  return songs
}

module.exports = async (req, res) => {
  if (!process.env.GENIUS_ACCESS_TOKEN) {
    res.statusCode = 500
    res.end('GENIUS_ACCESS_TOKEN environment variable not set.')
    return
  }

  const options = parseOptions(req)
  const lyrics = await getGeniusLyrics(options)
  const response = toResponse(options, lyrics)

  setHeaders(res)
  res.end(JSON.stringify(response))
}
