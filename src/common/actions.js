const actions = {
  main: {
    START_RECORDING_REQUESTED: 'START_RECORDING_REQUESTED',
    GET_STORE_VALUE: 'GET_STORE_VALUE',
    SET_STORE_VALUE: 'SET_STORE_VALUE',
    CHANGE_AUDIO_REQUESTED: 'CHANGE_AUDIO_REQUESTED',
    CHANGE_CAMERA_REQUESTED: 'CHANGE_CAMERA_REQUESTED',
    CHANGE_SCREEN_REQUESTED: 'CHANGE_SCREEN_REQUESTED',
    GET_SCREEN_INPUTS: 'GET_SCREEN_INPUTS',
    STOP_RECORDING_REQUESTED: 'STOP_RECORDING_REQUESTED',
    GET_APP_PATHS: 'GET_APP_PATHS',
    GET_APP_PERMISSIONS: 'GET_APP_PERMISSIONS',
    REQUEST_GRANT_PERMISSION: 'REQUEST_GRANT_PERMISSION',
    LOGOUT_REQUESTED: 'LOGOUT_REQUESTED',
    LOGIN_REQUESTED: 'LOGIN_REQUESTED',
    SHOW_MENUBAR_WINDOW: 'SHOW_MENUBAR_WINDOW',
    SHOW_SOURCE_WINDOW: 'SHOW_SOURCE_WINDOW',
    SHOW_CONTROL_WINDOW: 'SHOW_CONTROL_WINDOW',
    SHOW_PERMISSION_WINDOW: 'SHOW_PERMISSION_WINDOW',
    SHOW_LOGIN_WINDOW: 'SHOW_LOGIN_WINDOW',
    SHOW_SPLASH_WINDOW: 'SHOW_SPLASH_WINDOW',
    HIDE_MENUBAR_WINDOW: 'HIDE_MENUBAR_WINDOW',
    HIDE_SOURCE_WINDOW: 'HIDE_SOURCE_WINDOW',
    HIDE_CONTROL_WINDOW: 'HIDE_CONTROL_WINDOW',
    HIDE_PERMISSION_WINDOW: 'HIDE_PERMISSION_WINDOW',
    HIDE_LOGIN_WINDOW: 'HIDE_LOGIN_WINDOW',
    HIDE_SPLASH_WINDOW: 'HIDE_SPLASH_WINDOW',
  },
  renderer: {
    START_RECORDING: 'START_RECORDING',
    STORE_VALUE_CHANGED: 'STORE_VALUE_CHANGED',
    CHANGE_AUDIO: 'CHANGE_AUDIO',
    CHANGE_CAMERA: 'CHANGE_CAMERA',
    CHANGE_SCREEN: 'CHANGE_SCREEN',
    SET_SCREEN_SOURCES: 'SET_SCREEN_SOURCES',
    STOP_RECORDING: 'STOP_RECORDING',
    SET_APP_PATHS: 'SET_APP_PATHS',
    SET_APP_PERMISSIONS: 'SET_APP_PERMISSIONS',
    SHOW_CAMERA: 'SHOW_CAMERA',
    HIDE_CAMERA: 'HIDE_CAMERA'
  }
}

module.exports = {actions}