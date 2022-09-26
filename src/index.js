const {app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut} = require("electron")
const path = require("path")
const {menubar} = require("menubar")
const electron = require("electron")
const log = require('electron-log')

let mb
let menubarWindow
let sourceWindow
let cameraWindow
let controlWindow
let isRecording = false

require("electron-reload")(__dirname)

// *************************************************************************************************
// ** STORE SETUP
// *************************************************************************************************
const Store = require("electron-store")
const store = new Store()

ipcMain.handle("getStoreValue", (event, key) => {
    const value = store.get(key)
    log.debug("getting store value for", key, "it is", value)
    return value
})
ipcMain.handle("setStoreValue", (event, data) => {
    log.debug("received", data)
    log.debug("setting store value for", data.key, "to", data.value)
    store.set(data.key, data.value)
})
// *************************************************************************************************
// ** END STORE SETUP
// *************************************************************************************************

// *************************************************************************************************
// ** RECORDER SETUP
// *************************************************************************************************
ipcMain.handle("START_RECORDING_REQUESTED", (event) => {
    log.debug("received action (main)", "START_RECORDING_REQUESTED")
    isRecording = true
    menubarWindow.hide()
    menubarWindow.webContents.send("START_RECORDING")
    controlWindow.webContents.send("START_RECORDING")
})
// *************************************************************************************************
// ** CHANGE_AUDIO_REQUESTED SETUP
// *************************************************************************************************
ipcMain.handle("CHANGE_AUDIO_REQUESTED", (event, audio) => {
    log.debug("received action (main)", "CHANGE_AUDIO_REQUESTED")
    menubarWindow.webContents.send("CHANGE_AUDIO", audio)
    cameraWindow.webContents.send("CHANGE_AUDIO", audio)
})
// *************************************************************************************************
// ** CHANGE_CAMERA_REQUESTED SETUP
// *************************************************************************************************
ipcMain.handle("CHANGE_CAMERA_REQUESTED", (event, camera) => {
    log.debug("received action (main)", "CHANGE_CAMERA_REQUESTED")
    menubarWindow.webContents.send("CHANGE_CAMERA", camera)
    cameraWindow.webContents.send("CHANGE_CAMERA", camera)
})
// *************************************************************************************************
// ** CHANGE_SCREEN_REQUESTED SETUP
// *************************************************************************************************
ipcMain.handle("CHANGE_SCREEN_REQUESTED", (event, camera) => {
    log.debug("received action (main)", "CHANGE_CAMERA_REQUESTED")
    menubarWindow.webContents.send("CHANGE_SCREEN", camera)
    cameraWindow.webContents.send("CHANGE_SCREEN", camera)
})
// *************************************************************************************************
// ** SOURCES HANDLER SETUP
// *************************************************************************************************
ipcMain.handle("GET_SCREEN_INPUTS", (event) => {
    log.debug("received action (main)", "GET_SCREEN_INPUTS")
    desktopCapturer.getSources({types: ['screen']}).then(async sources => {
        menubarWindow.send("SET_SCREEN_SOURCES", sources)
    })
})
ipcMain.handle("STOP_RECORDING_REQUESTED", (event) => {
    log.debug("received action (main)", "STOP_RECORDING_REQUESTED")
    isRecording = false
    menubarWindow.webContents.send("STOP_RECORDING", {})
    controlWindow.webContents.send("STOP_RECORDING", {})
    cameraWindow.hide()
    controlWindow.hide()
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
    contextIsolation: false
}

const createWindows = () => {
    if (process.platform === 'darwin') {
        globalShortcut.register('Command+Q', () => {
            app.quit();
        })
    }
    mb = menubar({
        index: "file://" + path.join(__dirname, "menubar/menubar.html"),
        icon: path.join(__dirname, "assets/images/menubar/icon.png"),
        browserWindow: {
            webPreferences: webPreferences,
        }
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
        if(!isRecording){
            cameraWindow.hide()
            controlWindow.hide()
        }
    })

    const display = electron.screen.getPrimaryDisplay()
    log.debug("primary display is", display)
    log.debug("primary display height", display.bounds.height)
    log.debug("primary display width", display.bounds.width)
    log.debug("y", display.bounds.height - 400 - 10)
    log.debug("x", 10)
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
    cameraWindow.on("show", () => {
        log.debug("camera is showing")
        cameraWindow.webContents.send("SHOW_CAMERA", {})
    })
    cameraWindow.on("hide", () => {
        log.debug("camera is hiding")
        cameraWindow.webContents.send("HIDE_CAMERA", {})
    })
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
        //y: display.bounds.height / 2 - 300,
        y: 400,
        width: 48,
        height: 170,
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
    log.debug("called window-all-closed")
    if (process.platform !== "darwin") {
        log.debug("quitting applicaton")
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
