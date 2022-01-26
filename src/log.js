import {locale} from './variables.js'

const options = {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'}

/**
 * Writes text to console with added timestamp
 *
 * @param {String} text log-text
 */
export default function log(text) {
  const date = new Date().toLocaleString(locale, options)
  console.log(date + ': ' + text)
}
