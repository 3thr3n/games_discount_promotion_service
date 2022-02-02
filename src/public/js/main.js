document.addEventListener('DOMContentLoaded', function() {
  createTimer('#mainTimer')
  createTimer('#deleteTimer')
})

/**
 * @param {String} id
 */
function createTimer(id) {
  const data = $( id ).text()
  // Transform String long date to correct long
  const countDownDate = parseFloat(data)

  // Get now
  const now = new Date().getTime()

  // Find the distance between now and the count down date
  const distance = countDownDate - now

  $(id).text(runTime(distance))
  if (distance < 0) {
    $( id ).text('Refresh site')
  }

  // Update the count down every 1 second
  const x = setInterval(function() {
    // Get today's date and time
    // Output the result in an element with id='xxx'
    $( id ).text(runTime(distance))
    // If the count down is over, write some text
    if (distance < 0) {
      clearInterval(x)
      $( id ).text('Refresh site')
    }
  }, 5000)
}

/**
 * @param {Date} distance
 * @return {String} a String
 */
function runTime(distance) {
  // Time calculations for days, hours, minutes and seconds
  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))

  const s = 'Timer: '
  if (days == 0) {
    return s + hours + 'h '+ minutes + 'm'
  }
  if (days == 0 && hours == 0) {
    return s + minutes + 'm'
  }
  return s + days + 'd ' + hours + 'h ' + minutes + 'm'
}

/**
 * Sorts the table
 * @link https://www.w3schools.com/howto/howto_js_sort_table.asp
 *
 * @param {int} page page
 * @param {int} n column
 */
function sortTable(page, n) { // eslint-disable-line no-unused-vars
  let asc = getParameterByName('asc') === 'true'
  const sort = getParameterByName('sort')
  if (sort == n) {
    asc = !asc
  } else {
    asc = true
  }
  window.location = '?page='+page+'&sort='+n+'&asc='+asc
}

/**
 * Checks the url for query-parameters and gets the specified parameter
 *
 * @param {String} name
 * @param {String} url
 * @return {Object} parameter
 */
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}
