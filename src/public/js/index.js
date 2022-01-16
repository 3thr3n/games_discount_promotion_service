$(function() {
  $('#navbar ul li').click(function() {
     $('#navbar ul li').removeClass("active")
     $(this).addClass('active');
  });
});

function onLoad() {
  $('#mainIframe').height(1)
  $('#mainIframe').height($('#mainIframe').contents().innerHeight())
}

