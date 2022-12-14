const {ipcRenderer} = require("electron")
const log = require("electron-log")

/**
 * Registers all event listeners for a component and convienently logs
 * all invocations on it.
 *
 * The intended use is to connect actions defined in ./common/actions with
 * the corresponding functions on a window.
 *
 * Example:
 *
 * const {registerListeners} = require("../common/listeners")
 * const {storeValues} = require("../common/store")
 * const listenerMapping = [
 *   {action:actions.renderer.START_RECORDING, function: this.startRecording},
 *   ...
 * ]
 * registerListeners("menubar", listenerMapping)
 *
 * @param component {String} name of the component (for logging purposes)
 * @param mapping {Array.<{action: String, function: Function}>} listener mapping
 */
const registerListeners = (component, mapping) => {
  log.debug("registering listeners for component", component)
  for (const item of mapping){
    log.debug("(", component, ")", "register listener", item.action, "to", item.function)
    // wrap the original function so that we are able to log when it is getting called
    const wrapper = (...args) => {
      log.debug("(", component, ") received call to action", item.action, ...args)
      item.function(...args)
    }
    ipcRenderer.on(item.action, wrapper)
  }
}

module.exports = {registerListeners}