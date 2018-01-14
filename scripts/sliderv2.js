
 var sliderTooltip = function(event, ui) {
      var curValue = ui.value || 2015;
      //get the id of the slider 
      var target =  $(event.target).attr("id");

      var tooltip = '<div class="tooltip237"><div class="tooltip237-inner">' 
             + curValue + '</div><div class="tooltip237-arrow"></div></div>';
      // update the tooltip of the target slider
      $("#"+target + ' .ui-slider-handle').html(tooltip);

  }

  $("#slidercomeagain").slider({
      value: 2015,
      min: 1990,
      max: 2015,
      step: 1,
      create: sliderTooltip,
      slide: sliderTooltip
  });

  

