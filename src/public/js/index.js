$(function() {
  $('#navbar ul li').click(function() {
    $('#navbar ul li').removeClass('active')
    $().addClass('active')
  })
})

/* eslint-disable no-unused-vars */
/**
 * Setup the mainIframe to set height to the contents height
 */
function onLoad() {
  $('#mainIframe').height(1)
  $('#mainIframe').height($('#mainIframe').contents().innerHeight())
}
/* eslint-enable no-unused-vars */

