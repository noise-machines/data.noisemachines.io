const axios = require('axios')
const { DateTime } = require('luxon')
const mapValues = require('lodash.mapvalues')
const urlParser = require('url')

const parseInt = string => Number.parseInt(string, 10)

const toMeta = meta => {
  const result = mapValues(meta, parseInt)
  result.user = undefined
  return result
}

const toListen = track => {
  console.log(track)
  const millisecondsSinceEpoch = parseInt(track.date.uts)
  const dt = DateTime.fromMillis(millisecondsSinceEpoch)
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
    dateTime: dt
  }
}

const getListens = async (page = 1) => {
  const endpoint = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=noise_machines&api_key=${process.env.LAST_FM_API_KEY}&format=json&page=${page}`
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
  switch (url.pathname) {
    case '/thomas/listens':
      return getListens(url.query.page)
  }
  return ''
}
