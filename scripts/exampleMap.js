$(document).ready(function(){
    
    var get_coord_point = function(place, geocoder,callback)
    {    
        var point = new Array();
        var def = $.Deferred();
        geocoder.geocode( { 'address': place}, function(results, status) {
            
            if (status == google.maps.GeocoderStatus.OK)
            {
              console.log(place)
              var resulty = (results[0].geometry.bounds.b.b + results[0].geometry.bounds.b.f) /2;
              var resultx = (results[0].geometry.bounds.f.b + results[0].geometry.bounds.f.f) /2;
              fromx = resultx;
              fromy = resulty;
              point.push(fromx);
              point.push(fromy);
              console.log('point');
              callback(point,def);
            }
          });
        return def.promise();
    }
    
    var get_coord = function(data_border,callback)
    {
        var i = 1; 
        console.log(data_border)
        var json_border = [];
        var geocoder = new google.maps.Geocoder();
        $.each(data_border, function() {
            var point = new Array();
            var fromPoint = new Array();
            var toPoint = new Array();
            
            var from = get_coord_point(this.from, geocoder,function(point,def){
              fromPoint = point; console.log(fromPoint);console.log("end"); def.resolve()});

            var to = get_coord_point(this.to, geocoder,function(point,def){
              toPoint = point; console.log(toPoint); console.log("end"); def.resolve()});

            var def = $.when(from, to);

            def.done(function(){ var s = fromPoint.concat(toPoint);
              console.log(i);
              json_border.push({points:s, curvature: -0.27});
              if(i === data_border.length){
                console.log(json_border)
                callback(json_border)
              }
              i++ ;});




        });
        
    }
    
    var generate_map = function(json_borders)
    {
        var map;
        anychart.data.loadJsonFile('https://cdn.anychart.com/samples-data/maps-general-features/world-choropleth-map/data.json', function(data) {
    // Creates map chart
        
        map = anychart.map();
        map.credits()
          .enabled(true)
          .url('https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_population_density')
          .logoSrc('https://en.wikipedia.org/static/favicon/wikipedia.ico')
          .text('Data source: https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_population_density');

        map.title()
          .enabled(true)
          .useHtml(true)
          .padding([10, 0, 10, 0])
          .text('Population Density (people per km&#178)<br/>' +
            '<span  style="color:#929292; font-size: 12px;">(Data source: Wikipedia, 2015)</span>');

        map.geoData('anychart.maps.world');
        map.interactivity().selectionMode('none');
        map.padding(0);

        var dataSet = anychart.data.set(data);
        var density_data = dataSet.mapAs({
          'value': 'density'
        });


        var series = map.choropleth(density_data);

        series.labels(false);

        series.hovered()
          .fill('#f48fb1')
          .stroke(anychart.color.darken('#f48fb1'));

        series.selected()
          .fill('#c2185b')
          .stroke(anychart.color.darken('#c2185b'));

        series.tooltip()
          .useHtml(true)
          .format(function() {
            return '<span style="color: #d9d9d9">Density</span>: ' +
              parseFloat(this.value).toLocaleString() + ' pop./km&#178 <br/>' +
              '<span style="color: #d9d9d9">Population</span>: ' +
              parseInt(this.getData('population')).toLocaleString() + '<br/>' +
              '<span style="color: #d9d9d9">Area</span>: ' +
              parseInt(this.getData('area')).toLocaleString() + ' km&#178';
          });

        var scale = anychart.scales.ordinalColor([{
            less: 10
          },
          {
            from: 10,
            to: 30
          },
          {
            from: 30,
            to: 50
          },
          {
            from: 50,
            to: 100
          },
          {
            from: 100,
            to: 200
          },
          {
            from: 200,
            to: 300
          },
          {
            from: 300,
            to: 500
          },
          {
            from: 500,
            to: 1000
          },
          {
            greater: 1000
          }
        ]);
        scale.colors(['#81d4fa', '#4fc3f7', '#29b6f6', '#039be5', '#0288d1', '#0277bd', '#01579b', '#014377', '#000000']);

        var colorRange = map.colorRange();
        colorRange.enabled(true)
          .padding([0, 0, 20, 0]);
        colorRange.ticks()
          .enabled(true)
          .stroke('3 #ffffff')
          .position('center')
          .length(7);
        colorRange.colorLineSize(5);
        colorRange.marker().size(7);
        colorRange.labels()
          .fontSize(11)
          .padding(3, 0, 0, 0)
          .format(function() {
            var range = this.colorRange;
            var name;
            if (isFinite(range.start + range.end)) {
              name = range.start + ' - ' + range.end;
            } else if (isFinite(range.start)) {
              name = 'More than ' + range.start;
            } else {
              name = 'Less than ' + range.end;
            }
            return name
          });

        series.colorScale(scale);
        
       
        // create zoom controls
        var zoomController = anychart.ui.zoom();
        zoomController.render(map);
         // set container id for the chart
        map.container('container');
        // initiate chart drawing
        map.draw();
        var connects = map.connector(json_borders)
        connects.startSize(5);
        connects.endSize(0);
        connects.fill("#FF9966");
        connects.stroke("#CCCC99");
        connects.hovered().fill("#996633");
        connects.selected().fill("#996633");
        connects.hovered().stroke("#CCCC99");
        connects.hovered().stroke("#CCCC99");
        
      });
        return map;
    }
    
    var get_data = function()
    {
        return result = [{from:'poland', to:'chicago'},{from:'syria', to:'germany'},{from:'etiopia', to:'italy'},{from:'thailand', to:'brazil'},{from:'kamerun', to:'canada'}]
    }
    var data = get_data();
    var borders = get_coord(data,function(borders){generate_map(borders);})

});
// Helper function to bind data field to the local var.
function filter_function(val1, val2) {
  if (val2)
    return function(fieldVal) {
      return val1 <= fieldVal && fieldVal < val2;
    };
  else
    return function(fieldVal) {
      return val1 <= fieldVal;
    };
}
