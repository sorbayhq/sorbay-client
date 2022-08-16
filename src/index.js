const {app, BrowserWindow, ipcMain, desktopCapturer} = require("electron")
const path = require("path")
const {menubar} = require("menubar")
const electron = require("electron")
let mb
let menubarWindow
let sourceWindow
let cameraWindow
let controlWindow

require("electron-reload")(__dirname)

// *************************************************************************************************
// ** STORE SETUP
// *************************************************************************************************
const Store = require("electron-store")
const store = new Store()

ipcMain.handle("getStoreValue", (event, key) => {
  const value = store.get(key)
  console.log("getting store value for", key, "it is", value)
  return value
})
ipcMain.handle("setStoreValue", (event, data) => {
  console.log("received", data)
  console.log("setting store value for", data.key, "to", data.value)
  store.set(data.key, data.value)
})
// *************************************************************************************************
// ** END STORE SETUP
// *************************************************************************************************

// *************************************************************************************************
// ** RECORDER SETUP
// *************************************************************************************************
ipcMain.handle("START_RECORDING_REQUESTED", (event) => {
  console.log("received action (main)", "START_RECORDING_REQUESTED")
  desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    console.log("available sources are", sources)
    sources.forEach(source => {
      if(source.name === "Screen 1"){
        console.debug("found source with name Screen 1")
        menubarWindow.hide()
        menubarWindow.webContents.send("START_RECORDING", source)
        controlWindow.webContents.send("START_RECORDING", source)
      }
    })
  })
  menubarWindow.hide()
})
ipcMain.handle("STOP_RECORDING_REQUESTED", (event) => {
  console.log("received action (main)", "STOP_RECORDING_REQUESTED")
  menubarWindow.hide()
  menubarWindow.webContents.send("STOP_RECORDING", {})
  controlWindow.webContents.send("STOP_RECORDING", {})
})
// *************************************************************************************************
// ** END RECORDER SETUP
// *************************************************************************************************


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit()
}

const webPreferences = {
  sandbox: false,
  nodeIntegration: true,
  preload: path.join(__dirname, "preload.js"),
  contextIsolation: true
}

const createWindows = () => {
  mb = menubar({
    index: "file://" + path.join(__dirname, "menubar/menubar.html"),
    browserWindow: {
      webPreferences: webPreferences,
    }
  })
  mb.on("ready", () => {
    console.log("app is ready")
    // your app code here
  })
  mb.on("show", () => {
    menubarWindow = mb.window
    menubarWindow.webContents.openDevTools({mode: "detach"})
    console.log("menubar is showing")
    cameraWindow.show()
    controlWindow.show()
  })

  const display = electron.screen.getPrimaryDisplay()
  // Create the browser window.
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
  // Open the DevTools.
  cameraWindow.webContents.openDevTools({mode: "detach"})

  // Create the browser window.
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
    y: display.bounds.height / 2 - 150,
    width: 50,
    height: 300,
    webPreferences: webPreferences,
  })
  // and load the index.html of the app.
  controlWindow.loadFile(path.join(__dirname, "control/control.html"))
  // Open the DevTools.
  controlWindow.webContents.openDevTools({mode: "detach"})

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
  // Open the DevTools.
  sourceWindow.webContents.openDevTools({mode: "detach"})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindows)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
