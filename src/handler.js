const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  globalShortcut,
  systemPreferences
} = require("electron")
const log = require("electron-log")
const {getMediaPermissions} = require("./permissions")


const Store = require("electron-store")
const store = new Store()
const {
  getMenubar,
  getMenubarWindow,
  getSourceWindow,
  getCameraWindow,
  getControlWindow,
  getPermissionWindow
} = require("./windows")
let isRecording = false
const {actions} = require("./common/actions")
const handler = [
  () => {
    ipcMain.handle(actions.main.START_RECORDING_REQUESTED, (event) => {
      log.debug("received action (main)", actions.main.START_RECORDING_REQUESTED)
      isRecording = true
      getMenubarWindow().hide()
      getMenubarWindow().webContents.send(actions.renderer.START_RECORDING)
      getControlWindow().webContents.send(actions.renderer.START_RECORDING)
    })
  },
  () => {
    ipcMain.handle(actions.main.GET_STORE_VALUE, (event, key) => {
      const value = store.get(key)
      log.debug("getting store value for", key, "it is", value)
      return value
    })
  },
  () => {
    ipcMain.handle(actions.main.SET_STORE_VALUE, (event, data) => {
      log.debug("setting store value for", data.key, "to", data.value)
      store.set(data.key, data.value)
    })
  },
  () => {
    ipcMain.handle(actions.main.CHANGE_AUDIO_REQUESTED, (event, audio) => {
      log.debug("received action (main)", actions.main.CHANGE_AUDIO_REQUESTED)
      getMenubarWindow().webContents.send(actions.renderer.CHANGE_AUDIO, audio)
      getCameraWindow().webContents.send(actions.renderer.CHANGE_AUDIO, audio)
    })
  },
  () => {
    ipcMain.handle(actions.main.CHANGE_CAMERA_REQUESTED, (event, camera) => {
      log.debug("received action (main)", actions.main.CHANGE_CAMERA_REQUESTED)
      getMenubarWindow().webContents.send(actions.renderer.CHANGE_CAMERA, camera)
      getCameraWindow().webContents.send(actions.renderer.CHANGE_CAMERA, camera)
    })
  },
  () => {
    ipcMain.handle(actions.main.CHANGE_SCREEN_REQUESTED, (event, camera) => {
      log.debug("received action (main)", actions.main.CHANGE_SCREEN_REQUESTED)
      getMenubarWindow().webContents.send(actions.render.CHANGE_SCREEN, camera)
      getCameraWindow().webContents.send(actions.renderer.CHANGE_SCREEN, camera)
    })
  },
  () => {
    ipcMain.handle(actions.main.GET_SCREEN_INPUTS, (event) => {
      log.debug("received action (main)", actions.main.GET_SCREEN_INPUTS)
      desktopCapturer.getSources({types: ["screen"]}).then(async sources => {
        getMenubarWindow().send(actions.renderer.SET_SCREEN_SOURCES, sources)
      })
    })
  },
  () => {
    ipcMain.handle(actions.main.STOP_RECORDING_REQUESTED, (event) => {
      log.debug("received action (main)", actions.main.STOP_RECORDING_REQUESTED)
      isRecording = false
      getMenubarWindow().webContents.send(actions.renderer.STOP_RECORDING, {})
      getControlWindow().webContents.send(actions.renderer.STOP_RECORDING, {})
      getCameraWindow().hide()
      getControlWindow().hide()
    })
  },
  () => {
    ipcMain.handle(actions.main.GET_APP_PATHS, (event) => {
      log.debug("received action (main)", actions.main.GET_APP_PATHS)
      const paths = {
        appData: app.getPath("appData"),
        userData: app.getPath("userData"),
        logs: app.getPath("logs"),
        temp: app.getPath("temp"),
        video: app.getPath("videos"),
        crashDumps: app.getPath("crashDumps")
      }
      getMenubarWindow().send(actions.renderer.SET_APP_PATHS, paths)
    })
  },
  () => {
    ipcMain.handle(actions.main.GET_APP_PERMISSIONS, (event) => {
      log.debug("received action (main)", actions.main.GET_APP_PERMISSIONS)
      getPermissionWindow().send(actions.renderer.SET_APP_PERMISSIONS, getMediaPermissions())
    })
  },
  () => {
    ipcMain.handle(actions.main.REQUEST_GRANT_PERMISSION, (event) => {
      log.debug("received action (main)", actions.main.REQUEST_GRANT_PERMISSION)
      getPermissionWindow().send(actions.renderer.SET_APP_PERMISSIONS, getMediaPermissions())
    })
  }
]

const setupActionHandler = () => {
  while (handler.length) {
    handler.shift().call()
  }
}
module.exports = {setupActionHandler}