// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const log = require('electron-log')
const {ipcRenderer} = require("electron")
const {actions} = require("./common/actions")
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
    env: {
      DEBUG: process.env.DEBUG
    },
    store: {
      set({key, value}) {
        log.debug("setting store value", {key, value})
        ipcRenderer.invoke(actions.main.SET_STORE_VALUE, {key, value})
      },
      async get(key) {
        log.debug("calling", actions.main.GET_STORE_VALUE, 'for key', key)
        return await ipcRenderer.invoke(actions.main.GET_STORE_VALUE, key).then((result) => {
          return result
        })
      }
    }
  }