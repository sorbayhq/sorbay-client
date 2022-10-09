const {BrowserWindow} = require("electron")
const path = require("path")
const log = require("electron-log")
const electron = require("electron")
const {menubar} = require("menubar")
let mb
let menubarWindow
let sourceWindow
let cameraWindow
let controlWindow
let permissionWindow
let loginWindow
let splashWindow
let isRecording = false

const webPreferences = {
  sandbox: false,
  nodeIntegration: true,
  preload: path.join(__dirname, "preload.js"),
  contextIsolation: false
}

const initializeMenubar = (display) => {
  mb = menubar({
    index: "file://" + path.join(__dirname, "menubar/menubar.html"),
    icon: path.join(__dirname, "assets/images/menubar/icon.png"),
    browserWindow: {
      webPreferences: webPreferences,
    },
    showDockIcon: false
  })
  mb.on("ready", () => {
    log.debug("app is ready")
    // your app code here
  })
  mb.on("show", () => {
    log.debug("menubar is showing")
    menubarWindow = mb.window
    //menubarWindow.webContents.openDevTools({mode: "detach"})
    cameraWindow.show()
    controlWindow.show()
  })
  mb.on("hide", () => {
    log.debug("menubar is hiding", "isRecording?", isRecording)
    if (!isRecording) {
      cameraWindow.hide()
      controlWindow.hide()
    }
  })
}
const getMenubar = () => {
  return mb
}

const initializeMenubarWindow = (display) => {

}
const getMenubarWindow = () => {
  return menubarWindow
}

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
  })
  // and load the index.html of the app.
  sourceWindow.loadFile(path.join(__dirname, "source/source.html"))
  if (process.env.DEBUG === "true") {
    // Open the DevTools.
    sourceWindow.webContents.openDevTools({mode: "detach"})
  }
}
const getSourceWindow = () => {
  return sourceWindow
}

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
    y: display.bounds.height - 400 - 10,
    width: 400,
    height: 400,
    webPreferences: webPreferences,
  })
  // and load the index.html of the app.
  cameraWindow.loadFile(path.join(__dirname, "camera/camera.html"))
  if (process.env.DEBUG === "true") {
    // Open the DevTools.
    cameraWindow.webContents.openDevTools({mode: "detach"})
  }
  cameraWindow.on("show", () => {
    log.debug("camera is showing")
    cameraWindow.webContents.send("SHOW_CAMERA", {})
  })
  cameraWindow.on("hide", () => {
    log.debug("camera is hiding")
    cameraWindow.webContents.send("HIDE_CAMERA", {})
  })
}
const getCameraWindow = () => {
  return cameraWindow
}

const initializeControlWindow = (display) => {
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
    x: 0,
    //y: display.bounds.height / 2 - 300,
    y: 400,
    width: 48,
    height: 170,
    webPreferences: webPreferences,
  })
  // and load the index.html of the app.
  controlWindow.loadFile(path.join(__dirname, "control/control.html"))
  if (process.env.DEBUG === "true") {
    // Open the DevTools.
    controlWindow.webContents.openDevTools({mode: "detach"})
  }
}
const getControlWindow = () => {
  return controlWindow
}

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
    hasShadow: false,
    width: 500,
    height: 740,
    webPreferences: webPreferences,
  })
  permissionWindow.loadFile(path.join(__dirname, "permissions/permissions.html"))
  if (process.env.DEBUG === "true") {
    permissionWindow.webContents.openDevTools({mode: "detach"})
  }
}
const getPermissionWindow = () => {
  return permissionWindow
}
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
    hasShadow: false,
    width: 500,
    height: 740,
    webPreferences: webPreferences,
  })
  loginWindow.loadFile(path.join(__dirname, "login/login.html"))
  if (process.env.DEBUG === "true") {
    loginWindow.webContents.openDevTools({mode: "detach"})
  }
}
const getLoginWindow = () => {
  return loginWindow
}
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
  })
  splashWindow.loadFile(path.join(__dirname, "splash/splash.html"))
  if (process.env.DEBUG === "true") {
    splashWindow.webContents.openDevTools({mode: "detach"})
  }
}
const getSplashWindow = () => {
  return splashWindow
}

const initializeWindows = () => {
  const display = electron.screen.getPrimaryDisplay()
  initializeMenubar(display)
  initializeMenubarWindow(display)
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
  getSplashWindow
}