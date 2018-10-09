const axios = require('axios')
const { DateTime } = require('./luxon')
const mapValues = require('lodash/mapValues')
const queryString = require('query-string')

const parseInt = string => Number.parseInt(string, 10)

const toMeta = meta => {
  const result = mapValues(meta, parseInt)
  result.user = undefined
  return result
}

const toSecondsSinceEpoch = dateTime => Math.round(dateTime.toMillis() / 1000)
const fromSecondsSinceEpoch = secondsSinceEpoch =>
  DateTime.fromMillis(secondsSinceEpoch * 1000)

const toListen = track => {
  let dateTime
  if (track.date) {
    const secondsSinceEpoch = parseInt(track.date.uts)
    dateTime = fromSecondsSinceEpoch(secondsSinceEpoch)
  } else {
    dateTime = DateTime.utc()
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
    dateTime: dateTime.toJSON()
  }
}

const getListens = async options => {
  if (options.from != null) options.from = toSecondsSinceEpoch(options.from)
  if (options.to != null) options.to = toSecondsSinceEpoch(options.to)
  console.log(options)
  options.api_key = process.env.LAST_FM_API_KEY
  options.method = 'user.getrecenttracks'
  options.user = 'noise_machines'
  options.format = 'json'
  options.limit = 200
  const endpoint =
    'http://ws.audioscrobbler.com/2.0/?' + queryString.stringify(options)

  const response = await axios.get(endpoint)
  const data = response.data.recenttracks
  const listens = {
    meta: toMeta(data['@attr']),
    listens: data.track.map(toListen)
  }
  return JSON.stringify(listens)
}

module.exports = getListens
