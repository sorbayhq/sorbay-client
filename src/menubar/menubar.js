const log = require("electron-log")
const {writeFile, existsSync, mkdirSync} = require("fs")
const {shell} = require("electron")
const {createApp} = Vue
const {actions} = require("../common/actions")
const {storeValues, registerStoreMapper} = require("../common/store")
const activeWindow = require("active-win")
const {registerListeners} = require("../common/listeners")
createApp({
  data() {
    return {
      videoID: null,
      videoName: null,
      videoPublicUrl: null,
      videoAbsoluteUrl: null,
      recordedChunks: [],
      mediaRecorder: null,
      selectedScreenInput: null,
      selectedAudioInput: null,
      selectedCameraInput: null,
      availableScreenInputs: [],
      availableAudioInputs: [],
      availableCameraInputs: [],
      // store values
      server: null,
      isLoggedIn: false,
      name: null,
      deviceID: null,
      apiKey: null,
      lastSelectedScreenInputId: null,
      lastSelectedAudioInputId: null,
      lastSelectedCameraInputId: null,
      paths: null,
      isRecording: false,
    }
  },
  mounted() {
    log.debug("running mounted on menubar")
    const listenerMapping = [
      {action: actions.renderer.START_RECORDING, function: this.startRecording},
      {action: actions.renderer.STOP_RECORDING, function: this.stopRecording},
      {action: actions.renderer.SET_SCREEN_SOURCES, function: this.setScreenSources},
      {action: actions.renderer.CHANGE_CAMERA, function: this.changeCamera},
      {action: actions.renderer.CHANGE_SCREEN, function: this.changeScreen},
      {action: actions.renderer.CHANGE_AUDIO, function: this.changeAudio},
    ]
    registerListeners("menubar", listenerMapping)
    const vm = this
    const storeMapping = [
      {key: storeValues.SERVER, mapping: "server"},
      {key: storeValues.IS_LOGGED_IN, mapping: "isLoggedIn"},
      {key: storeValues.DEVICE_ID, mapping: "deviceID"},
      {key: storeValues.FIRST_NAME, mapping: "name"},
      {key: storeValues.API_KEY, mapping: "apiKey"},
      {key: storeValues.LAST_SELECTED_SCREEN_INPUT_ID, mapping: "lastSelectedScreenInputId"},
      {key: storeValues.LAST_SELECTED_AUDIO_INPUT_ID, mapping: "lastSelectedAudioInputId"},
      {key: storeValues.LAST_SELECTED_CAMERA_INPUT_ID, mapping: "lastSelectedCameraInputId"},
      {key: storeValues.APP_PATHS, mapping: "paths"},
      {key: storeValues.IS_RECORDING, mapping: "isRecording"},
    ]
    registerStoreMapper(vm, storeMapping)
    window.electron.action.invoke("GET_SCREEN_INPUTS", {})
    this.setAudioInputs()
    this.setCameraInputs()
  },
  methods: {
    /**
     * Sets the available screen sources. If the currently selected screen input is not set,
     * sets the first one.
     *
     * @param event
     * @param sources {Array<{id: String, display_id: String, name: String}>}
     */
    setScreenSources(event, sources) {
      sources.forEach(source => {
        const item = {
          id: source.id,
          displayId: source.display_id,
          label: source.name,
        }
        this.availableScreenInputs.push(item)
      })
      if (this.selectedScreenInput === null) {
        this.selectedScreenInput = this.availableScreenInputs[0]
      }
      log.debug("available screen inputs is", this.availableScreenInputs)
      log.debug("selected screen input is", this.selectedScreenInput)
    },
    /**
     * Sets the available audio inputs by querying navigator.mediaDevices. Sets the correct
     * audio source, if an audio source has previously been selected.
     *
     * Invokes `CHANGE_AUDIO_REQUESTED` if the audio is set.
     */
    setAudioInputs() {
      const vm = this
      this.availableAudioInputs = [{label: "Off", id: "off"}]
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        devices.forEach((device) => {
          if (device.kind === "audioinput") {
            const item = {
              label: device.label,
              id: device.deviceId,
              groupId: device.groupId
            }
            vm.availableAudioInputs.push(item)
            if (vm.lastSelectedAudioInputId === item.id) {
              log.debug("setting audio input to last selected audio input", item)
              vm.selectedAudioInput = item
              window.electron.action.invoke(actions.main.CHANGE_AUDIO_REQUESTED, JSON.stringify(item))
            }
          }
        })
      })
    },
    /**
     * Sets the available camera inputs by querying navigator.mediaDevices. Sets the correct
     * camera source, if a camera has previously been selected.
     *
     * Invokes `CHANGE_CAMERA_REQUESTED` if the camera is set.
     */
    setCameraInputs() {
      const vm = this
      this.availableCameraInputs = [{label: "Off", id: "off"}]
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        devices.forEach((device) => {
          if (device.kind === "videoinput") {
            const item = {
              label: device.label,
              id: device.deviceId,
              groupId: device.groupId
            }
            vm.availableCameraInputs.push(item)
            if (vm.lastSelectedCameraInputId === item.id) {
              log.debug("setting camera input to last selected camera input", item)
              vm.selectedCameraInput = item
              window.electron.action.invoke(actions.main.CHANGE_CAMERA_REQUESTED, JSON.stringify(item))
            }

          }
        })
      })
    },
    /**
     * Starts a recording.
     *
     * This is a multi step process which:
     *  - starts the video and audio streams
     *  - starts a timed function which sets the video name
     *  - queries the backend, asking for a video id
     *  - sets up the actual recording via chunks
     * @returns {Promise<void>}
     */
    async startRecording() {
      log.debug("starting recording on source", this.selectedScreenInput, "with audio", this.selectedAudioInput)
      // first, setup the streams
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: this.selectedScreenInput.id
            }
          }
        })
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSourceId: this.selectedAudioInput.id
              }
            },
            video: false
          })
          const audioTracks = audioStream.getAudioTracks()

          // merge audio and video tracks
          if (audioTracks.length > 0) {
            stream.addTrack(audioTracks[0])
          }

          try {
            const vm = this
            // create a function which sets the video name. We use a 5 second timeout
            // to give the user an actual chance to open up whatever he wants to show
            setTimeout(async function () {
              const window = await activeWindow()
              vm.videoName = window.title
              log.debug("Setting video name to", vm.videoName)
            }, 5000)

            // set the video up in the backend, query for the video ID
            const response = await axios.post(this.server + "api/v1/recordings/", {}, {
              headers: {
                "X-Api-Key": this.apiKey
              }
            })
            log.debug("POST to", this.server + "api/v1/recordings/", "returned with status", response.status, "data", response.data)
            if (response.status !== 201) {
              log.debug("POST to", this.server + "api/v1/recordings/", "had the wrong status code", response.status, "data", response.data)
              alert(`There was an error communicating with the backend, status code is ${response.status}. [Error Code 23]`)
              window.electron.action.invoke(actions.main.STOP_RECORDING_REQUESTED, {})
              return
            }
            this.videoID = response.data["short_id"]
            this.videoPublicUrl = response.data["public_url"]
            this.videoAbsoluteUrl = response.data["absolute_url"]
            log.debug("Successfully started streams & got the video ready in the backend. the video id is", this.videoID, "public url will be", this.videoPublicUrl)
            this.isRecording = true
            this.recordedChunks = []
            // set up the actual video recording
            this.recordVideoChunk(stream, 0)
          } catch (err) {
            log.debug("POST to", this.server + "api/v1/recordings/", "threw an error", err)
            window.electron.action.invoke(actions.main.STOP_RECORDING_REQUESTED, {})
            alert(`There was an error communicating with the backend. [Error Code 22]`)
          }
        } catch (err) {
          log.debug("Unable to start audio stream", err)
          window.electron.action.invoke(actions.main.STOP_RECORDING_REQUESTED, {})
          alert("There was an error starting the audio stream. [Error Code 15]")
        }
      } catch (err) {
        log.debug("Unable to start video stream", err)
        window.electron.action.invoke(actions.main.STOP_RECORDING_REQUESTED, {})
        alert("There was an error starting the video stream. [Error Code 14]")
      }
    },
    /**
     * Records a chunk of video/audio for the supplied stream.
     *
     * The chunking is done by creating a MediaRecorder, starting it and then setting
     * a timeout of 5 seconds. If the recording is still running after the 5 seconds have
     * passed, a new MediaRecorder is started and the old one is stopped.
     *
     * Chunking the stream allows us to constantly upload new video parts to the backend
     * while the recording is still running. This makes it possible that the recorder video
     * is instantly streamable from the backend, once the recording is finished.
     *
     * @param stream {MediaStream} the stream that's about to be recorded
     * @param n {Number} the current chunk number
     */
    recordVideoChunk(stream, n) {
      const vm = this
      // set up a new MediaRecorder, using the H264 video codec. This makes it easier
      // on the backend, because no transcoding needs to happen. The coding can simply
      // be copied
      this.mediaRecorder = new MediaRecorder(stream, {mimeType: "video/webm; codecs=H264"})

      // if there's actual data available, push it to recorderChunks
      this.mediaRecorder.ondataavailable = function (e) {
        vm.recordedChunks.push(e.data)
      }

      // if the mediarecorder is told to be stopped, convert the actual chunks
      // to a blob and process the video (=uploading it/saving it to the filesystem)
      this.mediaRecorder.onstop = function () {
        const actualChunks = vm.recordedChunks.splice(0, vm.recordedChunks.length)
        const blob = new Blob(actualChunks, {type: "video/webm; codecs=H264"})
        vm.processVideoPart(blob, n)
      }

      // if we are still recording, start a new chunk
      if (this.isRecording) {
        vm.mediaRecorder.start()
        setTimeout(function () {
          // if the mediarecorder state is on 'inactive', stop the recorder
          if (vm.mediaRecorder.state !== "inactive") {
            vm.mediaRecorder.stop()
          }
          //
          vm.recordVideoChunk(stream, n + 1)
        }, 5000) // 5 second chunks
      }
    },
    /**
     * Processes the chunk by uploading it/saving it to the file system.
     *
     * @param blob {Blob} the video, as a blob
     * @param n {Number} the current chunk number
     */
    processVideoPart(blob, n) {
      const fileName = `chunk-${n}.webm`
      this.uploadVideoPart(blob, n, fileName)
      this.saveVideoPart(blob, n, fileName)
    },
    /**
     * Saves the video chunk to the file system.
     *
     * @param blob {Blob} the video, as a blob
     * @param n {Number} the current chunk number
     * @param filename the desired filename
     * @returns {Promise<void>}
     */
    async saveVideoPart(blob, n, filename) {
      const directory = `${this.paths.userData}/recordings/${this.videoID}`
      if (!existsSync(directory)) {
        log.debug(mkdirSync(directory, {recursive: true}))
      }
      const fullPath = `${directory}/${filename}`
      const buffer = Buffer.from(await blob.arrayBuffer())
      writeFile(fullPath, buffer, () => {
        log.debug("Successfully wrote ", fullPath)
      })
    },
    /**
     * Uploads the video chunk to the backend.
     *
     * @param blob {Blob} the video, as a blob
     * @param n {Number} the current chunk number
     * @param filename the desired filename
     * @returns {Promise<void>}
     */
    async uploadVideoPart(blob, n, filename) {
      let url = this.server + "api/v1/recordings/chunk/" + this.videoID + "/"
      const form_data = new FormData()
      form_data.append("name", filename)
      form_data.append("position", n)
      form_data.append("data", blob, "data")
      try {
        let response = await axios.post(url, form_data, {
          headers: {
            "X-Api-Key": this.apiKey
          }
        })
        if (response.status !== 200) {
          log.error("There was an error POSTing to", url, ". status code", response.status, "data", response.data)
          return
        }
        log.debug("Successfully POSTed to", url, response.status, response.data)
      } catch (err) {
        log.error("There was an error POSTing to", url, err)
      }
    },
    /**
     * Stops the video recording and finalizes the upload to the backend, by:
     *
     *  - stopping the MediaRecorder
     *  - posting to the backend that the video is now finished
     * @param e {Event}
     * @returns {Promise<void>}
     */
    async stopRecording(e) {
      log.debug("stopping video recording")
      this.isRecording = false
      this.mediaRecorder.stop()
      // if we don't have a video name by now, set it here. This might happen on
      // very short recordings if the timeout that we have set during the start
      // of the recording hasn't been reached
      if (this.videoName === null) {
        const window = await activeWindow()
        this.videoName = window.title
      }
      const url = this.server + "api/v1/recordings/" + this.videoID + "/"
      const payload = {"is_uploaded": true, "name": this.videoName}
      try {
        const response = await axios.patch(url, payload, {
          headers: {
            "X-Api-Key": this.apiKey
          }
        })
        if (response.status !== 202) {
          log.error("There was an error sending a PATCH request to", url, response.status, response.data)
        } else {
          log.debug("Successfully send PATCH request to", url, response)
        }
      } catch (err) {

      }
      shell.openExternal(this.videoAbsoluteUrl)
      this.videoName = null
      this.videoID = null
      this.videoAbsoluteUrl = null
      this.videoPublicUrl = null
    },
    changeAudioSelected(event) {
      const audio = this.availableAudioInputs.find(x => x.id === event.target.value)
      this.lastSelectedAudioInputId = audio.id
      window.electron.store.set({
        key: storeValues.LAST_SELECTED_AUDIO_INPUT_ID,
        value: this.lastSelectedAudioInputId
      })
      window.electron.action.invoke(actions.main.CHANGE_AUDIO_REQUESTED, JSON.stringify(audio))
    },
    changeCameraSelected(event) {
      const camera = this.availableCameraInputs.find(x => x.id === event.target.value)
      this.lastSelectedCameraInputId = camera.id
      window.electron.store.set({
        key: storeValues.LAST_SELECTED_CAMERA_INPUT_ID,
        value: this.lastSelectedCameraInputId
      })
      window.electron.action.invoke(actions.main.CHANGE_CAMERA_REQUESTED, JSON.stringify(camera))
    },
    changeScreenSelected(event) {
      const screen = this.availableScreenInputs.find(x => x.id === event.target.value)
      window.electron.action.invoke(actions.main.CHANGE_SCREEN_REQUESTED, JSON.stringify(screen))
    },
    changeCamera(event, cameraJSON) {
      const camera = JSON.parse(cameraJSON)
      log.debug("changing selected camera to", camera)
      this.selectedCameraInput = camera
    },
    changeScreen(event, screenJSON) {
      const screen = JSON.parse(screenJSON)
      log.debug("changing selected screen to", screen)
      this.selectedScreenInput = screen
    },
    changeAudio(event, audioJSON) {
      const audio = JSON.parse(audioJSON)
      log.debug("changing selected audio to", audio)
      this.selectedAudioInput = audio
    },
    startRecordingClicked(options) {
      window.electron.action.invoke(actions.main.START_RECORDING_REQUESTED, {})
    },
    logoutClicked() {
      window.electron.action.invoke(actions.main.LOGOUT_REQUESTED, {})
    },
  }
}).mount("#app")