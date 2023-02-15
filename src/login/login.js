const {createApp} = Vue
const log = require("electron-log")
const os = require('os')
const {shell} = require("electron")
const {actions} = require("../common/actions")
const {error} = require("electron-log")
const VERSION = require("./../../package.json").version
createApp({
  data() {
    return {
      selectedBackend: "cloud",
      customBackendURL: null,
      isAuthorizing: false
    }
  },
  mounted() {
    log.debug("running mounted on login")
  },
  methods: {
    async startAuthorizationFlow() {
      /**
       * Starts the login flow against Sorbay Cloud, or, if specified, the custom backend.
       *
       * The login flow sets a local device ID and then opens up a browser window with a special
       * crafted URL on the backend server. If the user is logged in on the backend server
       * he now can authorize the device. Once authorized, an API Key can be exchanged by querying
       * the /device/key/ endpoint on the backend service. This API Key can then be used to
       * authorize against the backend.
       */
      log.debug("starting login flow")
      this.isAuthorizing = true
      // set up the payload to start the auth flow in the browser window
      const deviceID = Array.from(Array(128), () => Math.floor(Math.random() * 36).toString(36)).join("")
      let server = this.selectedBackend === "cloud" ? "https://sorbay.io/" : this.customBackendURL
      server += server.endsWith("/") ? "" : "/"
      const payload = {
        token: deviceID,
        name: os.hostname(),
        application: "Sorbay Desktop",
        release: VERSION
      }
      const url = server + "users/device/register/" + btoa(JSON.stringify(payload)) + "/"
      log.debug("login flow continued, opening url", url, "with payload", payload)
      shell.openExternal(url)
      // query the backend server to get an API key in exchange to the device ID
      let vm = this
      let lastResponse = null
      let lastErr = null
      const authorizationStartedAt = Date.now()
      const interval = setInterval(async function () {
        const apiUrl = server + "api/v1/device/key/"
        const data = {"token": deviceID}
        log.debug("querying api for api key, url", apiUrl, "with data", data)
        try{
        const response  = await axios.post(apiUrl, data)
        if(response.status === 200){
          log.debug("api call to ", apiUrl, "returned. got result", response)
          window.electron.action.invoke(actions.main.LOGIN_REQUESTED, {
            apiKey: response.data.key,
            server: server,
            deviceID: deviceID,
            user: response.data.user
          })
          vm.isAuthorizing = false
          vm.customBackendURL = null
          vm.selectedBackend = 'cloud'
          clearInterval(interval)
          return
        }else{
          lastResponse = response
        }
        }catch (err){
          lastErr = err
        }
        // try to authenticate the user for 30 seconds. if this fails, display an error and clear
        // the interval
        if((new Date() - authorizationStartedAt)/1000 > 30){
          let err
          if(lastErr){
            err = lastErr
          }else{
            if(lastResponse !== null){
              err = `Invalid status: ${lastResponse.status}, data: ${lastResponse.data}`
            }else{
              err = "Unknown error."
            }
          }
          log.debug("Unable to authenticate user against server:", server, "lastErr", lastErr, "lastResponse:", lastResponse)
          alert(`There was an error authenticating you to ${server}. Please try again. Error: ${err}`)
          vm.isAuthorizing = false
          clearInterval(interval)
        }
      }, 1000)
    },
  }
}).mount("#app")