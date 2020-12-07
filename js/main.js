
//wrap everything in a self-executing anonymous function to move to local scope
(function(){

  //accordian panel
  var allPanels = $('.accordion > dd').hide();
    
  $('.accordion > dt > a').click(function() {
    allPanels.slideUp();
    $(this).parent().next().slideDown();
    return false;
  });

})(); //last line of main.js - self-executing anonymous function