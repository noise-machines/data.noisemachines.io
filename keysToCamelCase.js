const mapKeys = require('lodash/mapKeys')
const camelCase = require('lodash/camelCase')

const camelCaseMapper = (value, key) => camelCase(key)

module.exports = object => mapKeys(object, camelCaseMapper)
