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
  if (platform !== 'win32' && platform !== 'darwin'){
    return {camera: "granted", microphone: "granted", screen: "granted"}
  }
  
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
 * Except for the screen,
 * if a media permission is set to 'not-determined',
 * meaning the user doesn't have the hardware of that media,
 * or the hardware is not detected,
 * then it is then ignored.
 * 
 * @returns {boolean} true if all permissions are set correctly
 */
const hasAllMediaPermissions = () => {
  const perms = getMediaPermissions()
  if( platform === 'darwin' ){
    // let that as (perm[mediaType] !== 'granted') for now
    if(perms['camera'] !== 'granted') systemPreferences.askForMediaAccess('camera')
    if(perms['microphone'] !== 'granted') systemPreferences.askForMediaAccess('microphone')
  }
  return perms['camera'] === 'granted' && perms['microphone'] === 'granted' && perms['screen'] === "granted"
}

module.exports = {getMediaPermissions, hasAllMediaPermissions}