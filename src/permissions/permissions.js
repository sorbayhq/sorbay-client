const {createApp} = Vue
const {actions} = require("../common/actions")
const log = require("electron-log")
createApp({
  data() {
    return {
      perms: null,
    }
  },
  mounted() {
    log.debug("running mounted on permissions")
    this.registerListeners()
  },
  methods: {
    grantPermissionClicked(perm) {
      window.electron.action.invoke(actions.main.REQUEST_GRANT_PERMISSION, {perm: perm})
    },
    registerListeners() {
      const vm = this
      window.electron.action.on(actions.renderer.SET_APP_PERMISSIONS, (event, perms) => {
        log.debug("(permissions) received ", actions.renderer.SET_APP_PERMISSIONS, "action", perms)
        vm.perms = perms
      })
      window.electron.action.invoke(actions.main.GET_APP_PERMISSIONS, {})
    }
  }
}).mount("#app")