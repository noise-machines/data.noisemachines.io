const pkg = require('./package.json')
const { NODE_ENV, PORT = 3000 } = process.env
const hostAndProtocol =
  NODE_ENV === 'development'
    ? `http://localhost:${PORT}`
    : 'https://' + pkg.now.alias

module.exports = () => hostAndProtocol
