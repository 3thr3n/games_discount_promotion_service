document.addEventListener('DOMContentLoaded', function() {
  createTimer('#mainTimer')
  createTimer('#deleteTimer')
  sortTable(0)
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
 * @param {int} n column
 */
function sortTable(n) {
  const table = document.getElementById('table')
  let switching = true
  let rows
  let i
  let shouldSwitch
  let dir
  let switchcount = 0

  // Set the sorting direction to ascending:
  dir = 'asc'
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false
    rows = table.rows
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for (i = 1; i < (rows.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      const x = rows[i].getElementsByTagName('TD')[n].getElementsByTagName('A')[0]
      const y = rows[i + 1].getElementsByTagName('TD')[n].getElementsByTagName('A')[0]
      /* Check if the two rows should switch place,
      based on the direction, asc or desc: */
      const htmlTextX = String(x.innerHTML)
      const htmlTextY = String(y.innerHTML)
      const htmlFloatX = parseFloat(htmlTextX.slice(0, htmlTextX.length - 2))
      const htmlFloatY = parseFloat(htmlTextY.slice(0, htmlTextY.length - 2))
      if (dir == 'asc') {
        if (isNaN(htmlFloatX) && isNaN(htmlFloatY)) {
          if (htmlTextX.toLowerCase() > htmlTextY.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true
            break
          }
        } else {
          if (htmlFloatX > htmlFloatY) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true
            break
          }
        }
      } else if (dir == 'desc') {
        if (isNaN(htmlFloatX) && isNaN(htmlFloatY)) {
          if (htmlTextX.toLowerCase() < htmlTextY.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true
            break
          }
        } else {
          if (htmlFloatX < htmlFloatY) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true
            break
          }
        }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i])
      switching = true
      // Each time a switch is done, increase this count by 1:
      switchcount ++
    } else {
      /* If no switching has been done AND the direction is 'asc',
      set the direction to 'desc' and run the while loop again. */
      if (switchcount == 0 && dir == 'asc') {
        dir = 'desc'
        switching = true
      }
    }
  }
}
