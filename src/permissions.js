const {systemPreferences} = require("electron")

const getMediaPermissions = () => {
  const types = ["camera", "microphone", "screen"]
  const perms = {}
  for (const type of types) {
    perms[type] = systemPreferences.getMediaAccessStatus(type)
  }
  return perms
}
const hasAllMediaPermissions = () => {
  const perms = getMediaPermissions()
  return perms['camera'] === 'granted' && perms['microphone'] === "granted" && perms['screen'] === "granted"
}

module.exports = {getMediaPermissions, hasAllMediaPermissions}