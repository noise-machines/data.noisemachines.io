require('dotenv').config()
const axios = require('axios')
const urlParser = require('url')
const mapValues = require('lodash/mapValues')
const queryString = require('query-string')
const stringify = require('json-stringify-safe')
const { DateTime } = require('./luxon')
const getHostAndProtocol = require('./getHostAndProtocol')
const tryParseInt = require('./tryParseInt')

const toSecondsSinceEpoch = dateTime => Math.round(dateTime.toMillis() / 1000)
const fromSecondsSinceEpoch = secondsSinceEpoch =>
  DateTime.fromMillis(secondsSinceEpoch * 1000)

const toListen = track => {
  let listenedAt
  if (track.date) {
    const secondsSinceEpoch = tryParseInt(track.date.uts)
    listenedAt = fromSecondsSinceEpoch(secondsSinceEpoch)
  } else {
    listenedAt = DateTime.local()
  }
  return {
    track: {
      name: track.name,
      musicBrainzId: track.mbid
    },
    album: {
      name: track.album['#text'],
      musicBrainzId: track.album.mbid
    },
    artist: {
      name: track.artist['#text'],
      musicBrainzId: track.artist.mbid
    },
    listenedAt: listenedAt.toJSON()
  }
}

const toContents = (options, lastFmResponse) =>
  lastFmResponse.track.map(toListen)

const toQuery = (offset, limit) =>
  '?' + queryString.stringify({ offset, limit })

const toMetadata = (options, lastFmResponse) => {
  const pageOf = options.hostAndProtocol + '/thomas/listens'
  const { offset, limit } = options
  const lastFmOptions = getLastFmOptions(options)
  let lastFmMetadata = lastFmResponse['@attr']
  lastFmMetadata = mapValues(lastFmMetadata, tryParseInt)

  const metadata = {
    self: pageOf + toQuery(offset, limit),
    kind: 'Page',
    pageOf,
    first: pageOf + toQuery(0, limit),
    last: pageOf + toQuery(lastFmMetadata.totalPages - 1, limit),
    total: lastFmMetadata.total
  }

  if (lastFmOptions.page < lastFmMetadata.totalPages) {
    metadata.next = pageOf + toQuery(offset + 1, limit)
  }

  if (offset > 0) {
    metadata.previous = pageOf + toQuery(offset - 1, limit)
  }

  return metadata
}

const toResponse = (options, lastFmResponse) => {
  const response = {
    ...toMetadata(options, lastFmResponse),
    contents: toContents(options, lastFmResponse)
  }

  if (options['include-last-fm-response']) {
    response.lastFmResponse = lastFmResponse
  }

  return response
}

const getLastFmOptions = options => ({
  api_key: process.env.LAST_FM_API_KEY,
  method: 'user.getrecenttracks',
  user: 'noise_machines',
  format: 'json',
  limit: options.limit,
  // the Last.fm page parameter is 1-indexed, but our offset
  // parameter is 0-indexed since JS collections are virtually
  // all 0-indexed.
  page: options.offset + 1,
  from: options.from,
  to: options.to
})

const getFromLastFm = async options => {
  const endpoint =
    'http://ws.audioscrobbler.com/2.0/?' + queryString.stringify(options)
  const result = await axios.get(endpoint)
  return result.data.recenttracks
}

const defaultOptions = {
  offset: 0,
  limit: 200,
  from: null,
  to: null
}

const getListens = async (req, res) => {
  const url = urlParser.parse(req.url, true)
  let options = mapValues(url.query, tryParseInt)
  options = Object.assign(defaultOptions, options)
  options.hostAndProtocol = getHostAndProtocol(req)

  if (options.from != null) options.from = toSecondsSinceEpoch(options.from)
  if (options.to != null) options.to = toSecondsSinceEpoch(options.to)

  const lastFmOptions = getLastFmOptions(options)
  const lastFmResponse = await getFromLastFm(lastFmOptions)
  const response = toResponse(options, lastFmResponse)

  return stringify(response)
}

module.exports = getListens
