const axios = require('axios')
const { DateTime } = require('./thomas/listens/luxon')
const queryString = require('query-string')
const xmlParser = require('fast-xml-parser')
const keysToCamelCase = require('./keysToCamelCase')

// frex Sun Aug 18 05:09:30 -0700 2013
const parseDateTime = string =>
  DateTime.fromFormat(string, 'ccc LLL dd HH:mm:ss ZZZ y')

const toBook = review => {
  review.book.readAt = parseDateTime(review.date_added)
  return keysToCamelCase(review.book)
}

const getBooks = async options => {
  options.key = process.env.GOODREADS_API_KEY
  options.v = 2
  options.id = 8666941 // me
  options.shelf = 'read'
  const endpoint =
    'https://www.goodreads.com/review/list?' + queryString.stringify(options)
  const response = await axios.get(endpoint)
  const reviews = xmlParser.parse(response.data).GoodreadsResponse.reviews
    .review
  console.log(reviews)
  const books = reviews.map(toBook)
  return books
}

module.exports = getBooks
