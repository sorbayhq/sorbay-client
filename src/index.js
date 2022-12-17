const {
  app,
  BrowserWindow,
  globalShortcut,
} = require("electron")
require("dotenv").config()
const log = require("electron-log")
const VERSION = require("./../package.json").version
const {setupActionHandler} = require("./handler")
let {initializeWindows} = require("./windows")
const {initializeStore} = require("./common/store")
log.debug("Starting Sorbay Desktop client using version", VERSION, "and env", process.env.DEBUG)

// setup hot reload
if (process.env.DEBUG === "true") {
  require("electron-reload")(__dirname)
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit()
}
setupActionHandler()
const initialize = () => {
  if (process.platform === "darwin") {
    globalShortcut.register("Command+Q", () => {
      app.quit()
    })
  }
  initializeStore()
  initializeWindows()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", initialize)

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
    initialize()
  }
})
