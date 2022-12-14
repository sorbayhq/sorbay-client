const log = require("electron-log")
const Store = require("electron-store")
const {actions} = require("./actions")
const {ipcRenderer, app} = require("electron")
const store = new Store()
const storeValues = {
  SERVER: "server",
  IS_LOGGED_IN: "isLoggedIn",
  API_KEY: "apiKey",
  DEVICE_ID: "deviceID",
  LAST_SELECTED_CAMERA_INPUT_ID: "lastSelectedCameraInputId",
  LAST_SELECTED_AUDIO_INPUT_ID: "lastSelectedAudioInputId",
  LAST_SELECTED_SCREEN_INPUT_ID: "lastSelectedScreenInputId",
  IS_RECORDING: "isRecording",
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  USER_ID: "userID",
  EMAIL: "email",
  APP_PATHS: "appPaths",
}

/**
 * Initializes the store, sets default values
 */
const initializeStore = () => {
  const data = [
    {key: storeValues.IS_RECORDING, value: false},
    {
      key: storeValues.APP_PATHS, value: {
        appData: app.getPath("appData"),
        userData: app.getPath("userData"),
        logs: app.getPath("logs"),
        temp: app.getPath("temp"),
        video: app.getPath("videos"),
        crashDumps: app.getPath("crashDumps")
      }
    }
  ]
  log.debug("initializing data store")
  for (const item of data) {
    log.debug("setting", item.key, "to default value", item.value)
    store.set(item.key, item.value)
  }
}

/**
 * Gets the value for a key, wraps store.get() but logs invocations of it for
 * debugging purposes.
 * @param key
 * @returns {Object}
 */
const getStoreValue = (key) => {
  const value = store.get(key)
  log.debug("getting store value for", key, "it is", value)
  return value
}

/**
 * Wrapper function around store.set() that updates all windows whenever one
 * of the key/value pairs in the store are changing.
 *
 * Except for special purposes (like initialization), this should be the only function
 * that changes items in the store.
 *
 * @param key{String} key to be stored
 * @param value{Object} value to be stored
 */
const setStoreValue = (key, value) => {
  log.debug("setting store value for", key, "to", value)
  store.set(key, value)
  const {getAllWindows} = require("../windows")
  for (const window of getAllWindows()) {
    window.webContents.send(actions.renderer.STORE_VALUE_CHANGED, {key: key, value: value})
  }
}
/**
 * Connects a vue component state to the global store state. The connection does
 * two things:
 *  - get the current state on initialization
 *  - listens for state changes and updates accordingly
 *
 * The intended use is to run this function in Vue.mounted() and connect all
 * relevant properties to it.
 *
 * Example:
 *
 * const {storeValues, registerStoreMapper} = require("../common/store")
 * const vm = this
 * const storeMapping = [
 *       {key: storeValues.SERVER, mapping: 'server'},
 *       ...
 * ]
 * registerStoreMapper(vm, storeMapping)
 *
 * @param vm {Object}
 * @param mapper {Array.<{key: String, mapping}>}
 */
const registerStoreMapper = (vm, mapper) => {
  for (const item of mapper) {
    ipcRenderer.invoke(actions.main.GET_STORE_VALUE, item.key).then((result) => {
      vm[item.mapping] = result
    })
  }
  ipcRenderer.on(actions.renderer.STORE_VALUE_CHANGED, (event, data) => {
    for (const item of mapper) {
      if (data.key === item.key) {
        vm[item.mapping] = data.value
      }
    }
  })
}
module.exports = {storeValues, getStoreValue, setStoreValue, registerStoreMapper, initializeStore}