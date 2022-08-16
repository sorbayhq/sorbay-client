// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
console.log("invoking preload")
const {ipcRenderer, contextBridge, desktopCapturer, systemPreferences} = require("electron")
console.log('capt in import', desktopCapturer)
console.log('prefs in import', systemPreferences)
const {writeFile} = require("fs")
contextBridge.exposeInMainWorld(
  "electron",
  {
    fs: {
      saveVideo(buffer) {
        writeFile(`vid-${Date.now()}.webm`, buffer, () => console.log("video saved successfully!"))
      }
    },
    video: {
      Buffer: Buffer,
      getSources() {
        console.log("calling getSources from preload function")
        console.log("systemPreferences", systemPreferences)
        console.log("desktopCapturer", desktopCapturer)
        console.log('microphone', systemPreferences.getMediaAccessStatus('microphone'))
        console.log('screen', systemPreferences.getMediaAccessStatus('screen'))
        console.log('camera', systemPreferences.getMediaAccessStatus('camera'))
        console.log("calling getSources from preload function")
        console.log(desktopCapturer.getSources({
          types: ["screen"]
        }))
        return ["asd"]
        // const sources = await desktopCapturer.getSources({
        //   types: ['screen']
        // });
        // console.log("calling getSources, available sources are", sources)
        // return sources
      }
    },
    action: {
      keys: actions,
      invoke(channel, data) {
        console.log("invoking action", channel, "with data", data)
        ipcRenderer.invoke(channel, data)
      },
      on(channel, listener) {
        console.log("registering on", channel, "with listener", listener)
        ipcRenderer.on(channel, listener)
      }
    },
    store: {
      keys: keys,
      set({key, value}) {
        console.log("setting store value", {key, value})
        ipcRenderer.invoke("setStoreValue", {key, value})
      },
      async get(key) {
        console.log("getting store value", key)
        return await ipcRenderer.invoke("getStoreValue", key).then((result) => {
          return result
        })
      }
    }
  }
)