// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const log = require('electron-log')
const {ipcRenderer} = require("electron")
window.electron =
  {
    action: {
      invoke(channel, data) {
        log.debug("invoking action", channel, "with data", data)
        ipcRenderer.invoke(channel, data)
      },
      on(channel, listener) {
        log.debug("registering on", channel, "with listener", listener)
        ipcRenderer.on(channel, listener)
      }
    },
    store: {
      set({key, value}) {
        log.debug("setting store value", {key, value})
        ipcRenderer.invoke("setStoreValue", {key, value})
      },
      async get(key) {
        log.debug("getting store value", key)
        return await ipcRenderer.invoke("getStoreValue", key).then((result) => {
          return result
        })
      }
    }
  }