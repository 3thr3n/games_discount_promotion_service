document.addEventListener('DOMContentLoaded', function() {
  createTimer('#mainTimer')
  createTimer('#deleteTimer')
})

/**
 * @param {String} id
 */
function createTimer(id) {
  const data = $( id ).text()
  const countDownDate = new Date(parseFloat(data)).getTime()

  $(id).text(runTime(countDownDate))

  // Update the count down every 1 second
  const x = setInterval(function() {
    // Get today's date and time
    // Output the result in an element with id='demo'
    $( id ).text(runTime(countDownDate))
    // If the count down is over, write some text
    if (distance < 0) {
      clearInterval(x)
      $( id ).text('Refresh site')
    }
  }, 5000)
}

/**
 * @param {Date} countDownDate
 * @return {String} a String
 */
function runTime(countDownDate) {
  const now = new Date().getTime()

  // Find the distance between now and the count down date
  const distance = countDownDate - now

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
