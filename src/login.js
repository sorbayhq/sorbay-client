const {storeValues, getStoreValue} = require("./common/store")

/**
 * Checks if the the user logged in.
 *
 * @returns {Boolean} true, if the user is logged in
 */
const isLoggedIn = () => {
  return getStoreValue(storeValues.IS_LOGGED_IN)
}

module.exports = {isLoggedIn}