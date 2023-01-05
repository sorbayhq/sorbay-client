const {systemPreferences} = require("electron")
const { platform } = require('node:process')

/**
 * Gets the media permissions this app has set.
 *
 * Example:
 *   {camera: "granted", microphone: "granted", screen: "granted"}
 *
 * @returns {{camera: String, microphone: String, screen: String}}
 */
const getMediaPermissions = () => {
  if (platform !== 'win32' || platform !== 'darwin')
    return {camera: "granted", microphone: "granted", screen: "granted"}
  
  const types = ["camera", "microphone", "screen"]
  const perms = {}
  for (const type of types) {
    perms[type] = systemPreferences.getMediaAccessStatus(type)
  }
  return perms
}

/**
 * Checks if the user has all needed media permissions set.
 *
 * @returns {boolean} true if all permissions are set correctly
 */
const hasAllMediaPermissions = () => {
  const perms = getMediaPermissions()
  return perms['camera'] === 'granted' && perms['microphone'] === "granted" && perms['screen'] === "granted"
}

module.exports = {getMediaPermissions, hasAllMediaPermissions}