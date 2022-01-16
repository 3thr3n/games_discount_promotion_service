document.addEventListener("DOMContentLoaded", function(){
  createTimer('#mainTimer')
  createTimer('#deleteTimer')
});

function createTimer(id) {
  let data = $( id ).text()
  let countDownDate = new Date(parseFloat(data)).getTime();

  $( id ).text(runTime(countDownDate));

  // Update the count down every 1 second
  var x = setInterval(function() {
    // Get today's date and time
    // Output the result in an element with id="demo"
    $( id ).text(runTime(countDownDate));
    // If the count down is over, write some text 
    // if (distance < 0) {
    //   clearInterval(x);
    //   document.getElementById("demo").innerHTML = "EXPIRED";
    // }
  }, 5000);
}

function runTime(countDownDate) {
  var now = new Date().getTime();
      
  // Find the distance between now and the count down date
  var distance = countDownDate - now;
    
  // Time calculations for days, hours, minutes and seconds
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

  let s = "Timer: "
  if (days == 0) {
    return s + hours + "h "+ minutes + "m"
  }
  if (days == 0 && hours == 0) {
    return s + minutes + "m"
  }
  return s + days + "d " + hours + "h " + minutes + "m"
}