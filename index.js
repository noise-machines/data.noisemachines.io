const axios = require('axios')
const { DateTime } = require('luxon')
const mapValues = require('lodash.mapvalues')
const urlParser = require('url')
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
  options.api_key = process.env.LAST_FM_API_KEY
  const endpoint =
    'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=noise_machines&format=json&limit=200&' +
    queryString.stringify(options)

  const response = await axios.get(endpoint)
  const data = response.data.recenttracks
  const listens = {
    meta: toMeta(data['@attr']),
    listens: data.track.map(toListen)
  }
  return JSON.stringify(listens)
}

module.exports = async (req, res) => {
  const url = urlParser.parse(req.url, true)
  const options = url.query
  switch (url.pathname) {
    case '/thomas/listens':
      return getListens(options)
    case '/thomas/listens/today':
      options.from = DateTime.utc().startOf('day')
      options.to = DateTime.utc()
      return getListens(options)
  }
  return ''
}
