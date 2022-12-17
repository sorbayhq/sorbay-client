const {app, ipcMain, desktopCapturer,} = require("electron")
const log = require("electron-log")
const {getMediaPermissions} = require("./permissions")
const {
  getMenubarWindow,
  getSourceWindow,
  getCameraWindow,
  getControlWindow,
  getPermissionWindow,
  getSplashWindow,
  getLoginWindow,
  getAllWindows, getMenubarTray
} = require("./windows")
const {actions} = require("./common/actions")
const {storeValues, getStoreValue, setStoreValue} = require("./common/store")

/**
 * Wrapper function handling an action. Registers the function with ipcMain
 * and logs invocations of it.
 *
 * Ideally, this should be used as a wrapper around every action that is
 * performed on main.
 *
 * @param action {String} constant
 * @param fn {Function} function handling the action
 */
const handleAction = (action, fn) => {
  log.debug("(main) setting up action handler for", action)
  ipcMain.handle(action, (event, args) => {
    log.debug("(main) received action", action, "routing to action handler", args)
    return fn(event, args)
  })
}

/**
 * Handles the START_RECORDING_REQUESTED action
 *
 * Starts a recording by setting the isRecording state in the store,
 * hiding the menubar window and sending the renderer.START_RECORDING action
 */
const startRecordingRequested = () => {
  handleAction(actions.main.START_RECORDING_REQUESTED, () => {
    setStoreValue(storeValues.IS_RECORDING, true)
    getMenubarWindow().hide()
    getMenubarWindow().webContents.send(actions.renderer.START_RECORDING)
    getControlWindow().webContents.send(actions.renderer.START_RECORDING)
  })
}

/**
 * Handles the CHANGE_AUDIO_REQUESTED action
 */
const changeAudioRequested = () => {
  handleAction(actions.main.CHANGE_AUDIO_REQUESTED, (event, audio) =>{
    getMenubarWindow().webContents.send(actions.renderer.CHANGE_AUDIO, audio)
    getCameraWindow().webContents.send(actions.renderer.CHANGE_AUDIO, audio)
  })
}

/**
 * Handles the CHANGE_CAMERA_REQUESTED action
 */
const changeCameraRequested = () => {
  handleAction(actions.main.CHANGE_CAMERA_REQUESTED, (event, camera) => {
    getMenubarWindow().webContents.send(actions.renderer.CHANGE_CAMERA, camera)
    getCameraWindow().webContents.send(actions.renderer.CHANGE_CAMERA, camera)
  })
}

/**
 * Handles the CHANGE_SCREEN_REQUESTED action
 */
const changeScreenRequested = () => {
  handleAction(actions.main.CHANGE_SCREEN_REQUESTED, (event, screen) =>{
    getMenubarWindow().webContents.send(actions.renderer.CHANGE_SCREEN, screen)
    getCameraWindow().webContents.send(actions.renderer.CHANGE_SCREEN, screen)
  })
}

/**
 * Handles the GET_SCREEN_INPUTS action
 *
 * Calls desktopCapturer under the hood and invokes renderer.SET_SCREEN_SOURCES
 * with all available screens.
 */
const getScreenInputs = () => {
  handleAction(actions.main.GET_SCREEN_INPUTS, () => {
    desktopCapturer.getSources({types: ["screen"]}).then(async sources => {
      getMenubarWindow().send(actions.renderer.SET_SCREEN_SOURCES, sources)
    })
  })
}

/**
 * Handles the STOP_RECORDING_REQUESTED action
 *
 * Stops a recording by setting isRecording to false, sending the
 * renderer.STOP_RECORDING action and hiding all windows that are
 * no longer needed to perform a recording
 */
const stopRecordingRequested = () => {
  handleAction(actions.main.STOP_RECORDING_REQUESTED, () => {
    setStoreValue(storeValues.IS_RECORDING, false)
    getMenubarWindow().webContents.send(actions.renderer.STOP_RECORDING, {})
    getControlWindow().webContents.send(actions.renderer.STOP_RECORDING, {})
    getCameraWindow().hide()
    getControlWindow().hide()
  })
}

/**
 * Handles the GET_APP_PERMISSIONS action
 *
 * Gets the app's permissions, sending them via the renderer.SET_APP_PERMISSIONS
 * action
 */
const getAppPermissions = () => {
  handleAction(actions.main.GET_APP_PERMISSIONS, () => {
    getPermissionWindow().send(actions.renderer.SET_APP_PERMISSIONS, getMediaPermissions())
  })
}

/**
 * Handles the REQUEST_GRANT_PERMISSION action
 *
 * Gets the app's permissions, sending them via the renderer.SET_APP_PERMISSIONS
 * action
 */
const requestGrantPermissions = () => {
  handleAction(actions.main.REQUEST_GRANT_PERMISSION, () => {
    getPermissionWindow().send(actions.renderer.SET_APP_PERMISSIONS, getMediaPermissions())
  })
}

/**
 * Handles the LOGIN_REQUESTED action
 *
 * Logs the user in by storing his credentials in the store, hiding
 * the login window and showing the menubar window
 */
const loginRequested = () => {
  handleAction(actions.main.LOGIN_REQUESTED, (event, data) => {
    setStoreValue(storeValues.IS_LOGGED_IN, true)
    setStoreValue(storeValues.FIRST_NAME, data.user.first_name)
    setStoreValue(storeValues.LAST_NAME, data.user.last_name)
    setStoreValue(storeValues.EMAIL, data.user.email)
    setStoreValue(storeValues.USER_ID, data.user.id)
    setStoreValue(storeValues.DEVICE_ID, data.deviceID)
    setStoreValue(storeValues.API_KEY, data.apiKey)
    setStoreValue(storeValues.SERVER, data.server)
    getLoginWindow().hide()
    getMenubarWindow().show()
  })
}

/**
 * Handles the LOGOUT_REQUESTED action
 *
 * Logs the user out by setting his credentials to null and displays the
 * login window while hiding the menubar window.
 */
const logoutRequested = () => {
  handleAction(actions.main.LOGOUT_REQUESTED, () => {
    setStoreValue(storeValues.IS_LOGGED_IN, false)
    setStoreValue(storeValues.FIRST_NAME, null)
    setStoreValue(storeValues.LAST_NAME, null)
    setStoreValue(storeValues.EMAIL, null)
    setStoreValue(storeValues.USER_ID, null)
    setStoreValue(storeValues.DEVICE_ID, null)
    setStoreValue(storeValues.API_KEY, null)
    setStoreValue(storeValues.SERVER, null)
    getMenubarWindow().hide()
    getLoginWindow().show()
  })
}

/**
 * Handles the GET_STORE_VALUE action
 *
 * Wraps getStoreValue for access in the renderer processes
 * */
const getStoreValueHandler = () => (
  handleAction(actions.main.GET_STORE_VALUE, (event, key) => {
    return getStoreValue(key)
  })
)

/**
 * Handles the SET_STORE_VALUE action
 *
 * Wraps setStoreValue for access in the renderer processes
 */
const setStoreValueHandler = (event, data) => (
  handleAction(actions.main.SET_STORE_VALUE, (event, data) => {
    return setStoreValue(data.key, data.value)
  })
)

/**
 * Handles the QUIT_REQUESTED action
 *
 * Quits the app
 */
const quitRequested = () => (
  handleAction(actions.main.QUIT_REQUESTED, () => {
    app.exit()
  })
)

/**
 * Handles the OPEN_DEVTOOLS_REQUESTED action
 *
 * Opens the devtools for all windows
 */
const openDevToolsRequested = () => (
  handleAction(actions.main.OPEN_DEVTOOLS_REQUESTED, () => {
    for(const window of getAllWindows()){
      window.webContents.openDevTools({mode: "detach"})
    }
  })
)

/**
 * Sets up all action handlers on main
 */
const setupActionHandler = () => {
  // it might look tempting to optimize this in some
  // kind of way to make it more DRY.
  // for debugging purposes and better control flow on
  // actions/events, it makes sense to do it this way.
  // leave this in for now
  getStoreValueHandler()
  setStoreValueHandler()
  startRecordingRequested()
  changeAudioRequested()
  changeCameraRequested()
  changeScreenRequested()
  getScreenInputs()
  stopRecordingRequested()
  getAppPermissions()
  requestGrantPermissions()
  loginRequested()
  logoutRequested()
  quitRequested()
  openDevToolsRequested()
}
module.exports = {setupActionHandler}