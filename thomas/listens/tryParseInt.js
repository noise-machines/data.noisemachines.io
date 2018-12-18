module.exports = string => {
  const parsed = Number.parseInt(string, 10)
  if (Number.isNaN(parsed)) {
    return string
  } else {
    return parsed
  }
}
