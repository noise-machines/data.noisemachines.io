module.exports = req => {
  const protocol = req.connection.encrypted ? 'https://' : 'http://'
  const host = req.headers.host
  return protocol + host
}
