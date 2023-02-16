const {BrowserWindow, app} = require("electron")
const path = require("path")
const log = require("electron-log")
const electron = require("electron")
const {Tray} = require("electron")
let menubarTray
let menubarWindow
let sourceWindow
let cameraWindow
let controlWindow
let permissionWindow
let loginWindow
let splashWindow
const {storeValues, getStoreValue} = require("./common/store")
const {actions} = require("./common/actions")
const {hasAllMediaPermissions} = require("./permissions")
const {isLoggedIn} = require("./login")
const { platform } = require("node:process")

const webPreferences = {
  sandbox: false,
  nodeIntegration: true,
  preload: path.join(__dirname, "preload.js"),
  contextIsolation: false
}

/**
 * Initializes the menubar window while also creating the corresponding
 * Tray object.
 *
 * The menubar window is the 'main' window of the application, giving
 * the user the ability to configure/start a new recording.
 *
 * @param display{Object} the currently active display
 */
const initializeMenubar = (display) => {
  menubarTray = new Tray(path.join(__dirname, "/assets/images/menubar/icon.png"))
  menubarWindow = new BrowserWindow({
    frame: true,
    transparent: false,
    show: true,
    resizable: false,
    movable: true,
    closable: true,
    alwaysOnTop: false,
    minimizable: false,
    maximizable: false,
    hasShadow: true,
    backgroundColor: "#00000000",
    width: 400,
    height: 480,
    webPreferences: webPreferences,
    icon: path.join(__dirname, "/assets/images/menubar/icon.png"),
  })
  menubarWindow.on("close", (e) =>{
    if(menubarTray.isDestroyed()){
      menubarWindow = null
    }else{
      menubarWindow.hide()
      e.preventDefault()
    }
  })
  // and load the index.html of the app.
  menubarWindow.loadFile(path.join(__dirname, "menubar/menubar.html"))
  let isShowingMenubar = false
  menubarTray.on("click", () => {
    if (isShowingMenubar) {
      menubarWindow.hide()
    } else {
      menubarWindow.show()
    }
  })
  menubarWindow.on("show", (e) => {
    // the menubar should only show if the app has all
    // permissions to properly record a video (looking at you macOS)
    if(!hasAllMediaPermissions()){
      permissionWindow.show()
      menubarWindow.hide()
      e.preventDefault()
      return
    }
    // the menubar should only be shown if the user is logged in
    if(!isLoggedIn()){
      loginWindow.show()
      menubarWindow.hide()
      e.preventDefault()
      return
    }
    isShowingMenubar = true
    log.debug("menubar is showing")
    menubarWindow.send(actions.renderer.SET_APP_PATHS, {
      appData: app.getPath("appData"),
      userData: app.getPath("userData"),
      logs: app.getPath("logs"),
      temp: app.getPath("temp"),
      video: app.getPath("videos"),
      crashDumps: app.getPath("crashDumps")
    })
    cameraWindow.show()
    controlWindow.show()
  })
  menubarWindow.on("hide", () => {
    isShowingMenubar = false
    const isRecording = getStoreValue(storeValues.IS_RECORDING)
    log.debug("menubar is hiding", "isRecording?", isRecording)
    if (!isRecording) {
      cameraWindow.hide()
      controlWindow.hide()
    }
  })
}

/**
 * Convienence function to get access to the properly initialized
 * Tray of the application accross the codebase.
 * @returns {Tray} mb
 */
const getMenubar = () => {
  return menubarTray
}

/**
 * Convienence function to get access to the properly initialized
 * menubarWindow of the application accross the codebase.
 * @returns {BrowserWindow} menubarWindow
 */
const getMenubarWindow = () => {
  return menubarWindow
}

/**
 * Initializes the source window.
 *
 * The source window is used if multiple displays are connected
 * to the users computer, giving the user the choice to select
 * and preview the correct screen for a new recording.
 *
 * THIS IS CURRENTLY NOT IN USE, NOT IMPLEMENTED
 *
 * @param display{Object} the currently active display
 */
const initializeSourceWindow = (display) => {
  sourceWindow = new BrowserWindow({
    frame: false,
    transparent: false,
    show: false,
    resizable: false,
    movable: false,
    closable: false,
    alwaysOnTop: true,
    maximizable: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    width: 400,
    height: 400,
    webPreferences: webPreferences,
    icon: path.join(__dirname, "/assets/images/menubar/icon.png"),
  })
  sourceWindow.on("close", () =>{
    sourceWindow = null
  })
  // and load the index.html of the app.
  sourceWindow.loadFile(path.join(__dirname, "source/source.html"))
}

/**
 * Convienence function to get access to the properly initialized
 * sourceWindow of the application accross the codebase.
 *
 * @returns {BrowserWindow} sourceWindow
 */
const getSourceWindow = () => {
  return sourceWindow
}

/**
 * Initializes the camera window.
 *
 * The camera window displays the users camera stream, based
 * on the source the user sets in the menubar window.
 *
 * @param display{Object} the currently active display
 */
const initializeCameraWindow = (display) => {
  cameraWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    show: false,
    resizable: false,
    movable: false,
    closable: false,
    alwaysOnTop: true,
    maximizable: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    x: 10,
    y: display.workAreaSize.height - 400 - 50,
    width: 400,
    height: 400,
    webPreferences: webPreferences,
    icon: path.join(__dirname, "/assets/images/menubar/icon.png"),
  })
  cameraWindow.on("close", () =>{
    cameraWindow = null
  })
  // and load the index.html of the app.
  cameraWindow.loadFile(path.join(__dirname, "camera/camera.html"))
  cameraWindow.on("show", () => {
    log.debug("camera is showing")
    cameraWindow.webContents.send(actions.renderer.SHOW_CAMERA, {})
  })
  cameraWindow.on("hide", () => {
    log.debug("camera is hiding")
    cameraWindow.webContents.send(actions.renderer.HIDE_CAMERA, {})
  })
}

/**
 * Convienence function to get access to the properly initialized
 * cameraWindow of the application accross the codebase.
 *
 * @returns {BrowserWindow} cameraWindow
 */
const getCameraWindow = () => {
  return cameraWindow
}

/**
 * Initializes the control window.
 *
 * The control window gives the user quick access to start/stop/restart
 * functionality while recording a video.
 *
 * @param display{Object} the currently active display
 */
const initializeControlWindow = (display) => {
  let offset = 10
  if( platform === 'win32' ){
    offset = 60
  }
  controlWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    show: false,
    resizable: false,
    movable: false,
    closable: false,
    alwaysOnTop: true,
    maximizable: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    x: 120,
    //y: display.bounds.height / 2 - 300,
    y: display.workAreaSize.height - offset,
    width: 220,
    height: 50,
    webPreferences: webPreferences,
    icon: path.join(__dirname, "/assets/images/menubar/icon.png"),
  })
  controlWindow.on("close", () =>{
    controlWindow = null
  })
  // and load the index.html of the app.
  controlWindow.loadFile(path.join(__dirname, "control/control.html"))
}

/**
 * Convienence function to get access to the properly initialized
 * controlWindow of the application accross the codebase.
 *
 * @returns {BrowserWindow} controlWindow
 */
const getControlWindow = () => {
  return controlWindow
}

/**
 * Initializes the permission window.
 *
 * The permission window displays the permissions the user has
 * granted to the application.
 *
 * @param display{Object} the currently active display
 */
const initializePermissionWindow = (display) => {
  permissionWindow = new BrowserWindow({
    frame: true,
    transparent: false,
    show: false,
    resizable: false,
    movable: true,
    closable: true,
    alwaysOnTop: false,
    maximizable: false,
    minimizable: false,
    hasShadow: true,
    width: 500,
    height: 740,
    webPreferences: webPreferences,
    icon: path.join(__dirname, "/assets/images/menubar/icon.png"),
  })
  permissionWindow.on("close", () =>{
    permissionWindow = null
  })
  permissionWindow.loadFile(path.join(__dirname, "permissions/permissions.html"))
}

/**
 * Convienence function to get access to the properly initialized
 * permission window of the application accross the codebase.
 *
 * @returns {BrowserWindow} permissionWindow
 */
const getPermissionWindow = () => {
  return permissionWindow
}

/**
 * Initializes the login window.
 *
 * The login window shows a login form, giving the user the ability
 * to link the client to the backend service.
 *
 * @param display{Object} the currently active display
 */
const initializeLoginWindow = (display) => {
  loginWindow = new BrowserWindow({
    frame: true,
    transparent: false,
    show: false,
    resizable: false,
    movable: true,
    closable: true,
    alwaysOnTop: false,
    maximizable: false,
    minimizable: false,
    hasShadow: true,
    width: 500,
    height: 740,
    webPreferences: webPreferences,
    icon: path.join(__dirname, "/assets/images/menubar/icon.png"),
  })
  loginWindow.on("close", () =>{
    loginWindow = null
  })
  loginWindow.loadFile(path.join(__dirname, "login/login.html"))
}

/**
 * Convienence function to get access to the properly initialized
 * login window of the application accross the codebase.
 *
 * @returns {BrowserWindow} loginWindow
 */
const getLoginWindow = () => {
  return loginWindow
}

/**
 * Initializes the splash window.
 *
 * The splash window shows a countdown right before a new recording
 * starts.
 *
 * @param display{Object} the currently active display
 */
const initializeSplashWindow = (display) => {
  splashWindow = new BrowserWindow({
    frame: true,
    transparent: false,
    show: false,
    resizable: false,
    movable: true,
    closable: true,
    alwaysOnTop: false,
    maximizable: false,
    hasShadow: false,
    width: 500,
    height: 740,
    webPreferences: webPreferences,
    icon: path.join(__dirname, "/assets/images/menubar/icon.png"),
  })
  splashWindow.on("close", () =>{
    splashWindow = null
  })
  splashWindow.loadFile(path.join(__dirname, "splash/splash.html"))
}

/**
 * Convienence function to get access to the properly initialized
 * splash window of the application accross the codebase.
 *
 * @returns {BrowserWindow} splashWindow
 */
const getSplashWindow = () => {
  return splashWindow
}

/**
 * Convienence function to get access to the properly initialized
 * menubar tray of the application accross the codebase.
 *
 * @returns {Tray} menubarTray
 */
const getMenubarTray = () => {
  return menubarTray
}

/**
 * Convienence function to get access to all properly initialized
 * windows of the application accross the codebase.
 *
 * @returns {Array.<BrowserWindow>}
 */
const getAllWindows = () => {
  return [
    menubarWindow,
    sourceWindow,
    cameraWindow,
    controlWindow,
    permissionWindow,
    splashWindow,
    loginWindow,
  ]
}

/**
 * Initializes all windows the application needs.
 */
const initializeWindows = () => {
  const display = electron.screen.getPrimaryDisplay()
  initializeMenubar(display)
  initializeSourceWindow(display)
  initializeCameraWindow(display)
  initializeControlWindow(display)
  initializePermissionWindow(display)
  initializeLoginWindow(display)
  initializeSplashWindow(display)
}

module.exports = {
  initializeWindows,
  getMenubar,
  getMenubarWindow,
  getSourceWindow,
  getCameraWindow,
  getControlWindow,
  getPermissionWindow,
  getLoginWindow,
  getSplashWindow,
  getAllWindows,
  getMenubarTray
}