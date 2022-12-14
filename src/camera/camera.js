const {createApp} = Vue
const log = require("electron-log")
const {actions} = require("../common/actions")
const {registerListeners} = require("../common/listeners")

createApp({
  data() {
    return {
      selectedCameraInput: null,
      stream: null
    }
  },
  mounted() {
    const listenerMapping = [
      {action: actions.renderer.CHANGE_CAMERA, function:this.changeCamera},
      {action: actions.renderer.SHOW_CAMERA, function:this.startStream},
      {action: actions.renderer.HIDE_CAMERA, function:this.stopStream},
    ]
    registerListeners("camera", listenerMapping)
  },
  methods: {
    changeCamera(event, cameraJSON) {
      /**
       * Changes the camera and starts/stops the stream based on the data in cameraJSON.
       */
      const camera = JSON.parse(cameraJSON)
      if (this.selectedCameraInput !== camera) {
        log.debug("selected camera input has changed from", this.selectedCameraInput, "to", camera)
        this.selectedCameraInput = camera
        this.stopStream()
        if (camera.id !== "off") {
          this.startStream()
        }
      }
    },
    stopStream() {
      /**
       * Stops the camera stream by stopping all tracks and removing the element from
       * the DOM.
       */
      log.debug("stopping camera stream")
      this.$refs.videoMask.classList.remove('has-background-black')
      if (this.stream !== null) {
        this.stream.getTracks().forEach(function (track) {
          track.stop()
        })
      }
      this.$refs.camera.srcObject = null
    },
    startStream() {
      /**
       * Starts the camera stream if there's a selected input and the input is not
       * set to 'off' by getting the user media, starting the tracks and adding the
       * camera element to the dom
       */
      if (this.selectedCameraInput !== null && this.selectedCameraInput.id !== "off") {
        log.debug("starting camera stream using", this.selectedCameraInput)
        this.$refs.videoMask.classList.add('has-background-black')
        let vm = this
        navigator.mediaDevices
        .getUserMedia((window.constraints = {
          audio: false,
          video: {
            deviceId: this.selectedCameraInput.id,
            height: 400,
            width: 400,
            aspectRatio: 1,
          }
        }))
        .then(stream => {
          vm.stream = stream
          vm.stream.getTracks().forEach(function (track) {
            log.debug("track settings", track.getSettings())
          })
          vm.$refs.camera.srcObject = this.stream
        })
        .catch(error => {
          log.error("Unable get user media", error)
        })
      } else {
        log.debug("won't start camera stream. selected camera is either null or the user did not select a camera")
      }
    }
  }
}).mount("#app")