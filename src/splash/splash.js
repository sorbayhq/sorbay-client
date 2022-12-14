const {createApp} = Vue
const log = require("electron-log")
const os = require('os')
const {shell} = require("electron")
const VERSION = require("./../../package.json").version
createApp({
  data() {
    return {

    }
  },
  mounted() {
  },
  methods: {
  }
}).mount("#app")