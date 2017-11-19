anychart.onDocumentReady(function() {
  // The data used in this sample can be obtained from the CDN

  var geocoder = new google.maps.Geocoder();
    var address = "poland";
    geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK)
    {
      console.log(results);
    }
  });
  // https://cdn.anychart.com/samples-data/maps-connectors/top-chinese-exports-to-the-world/data.json
  anychart.data.loadJsonFile('https://cdn.anychart.com/samples-data/maps-general-features/world-choropleth-map/data.json', function(data) {
    // Creates map chart
    map = anychart.map();

    var data_border = [    
    {from: "poland", to: "new york"},
    {from: "syria", to: "germany"}
    ];

    var json_border = [];

    jQuery.each(data_border, function() {
      var fromx;
      var fromy;
      var tox;
      var toy;
      var point = [];
      geocoder.geocode( { 'address': this.from}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK)
        {
          var resultx = (results[0].geometry.bounds.b.b + results[0].geometry.bounds.b.f) /2;
          var resulty = (results[0].geometry.bounds.f.b + results[0].geometry.bounds.f.f) /2;
          fromx = resultx;
          fromy = resulty;
          point.push(fromx);
          point.push(fromy);
          console.log(fromy)
        }
      });
      geocoder.geocode( { 'address': this.to}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK)
        {
          var resultx = (results[0].geometry.bounds.b.b + results[0].geometry.bounds.b.f) /2;
          var resulty = (results[0].geometry.bounds.f.b + results[0].geometry.bounds.f.f) /2;
          tox = resultx;
          toy = resulty;
          point.push(tox);
          point.push(toy);
          console.log(toy)
        }
      });

      json_border.push({points : point, curvature: -0.27});
      console.log(json_border)
    });

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

    

    

    // create data set
    var data_border = [    
      {points: [32, -106.8, 35, -103.5], curvature: -0.27},
      {points: [35, -103.5, 36.5, -99.5], curvature: 0.47},
      {points: [36.5, -99.5, 34, -97.3], curvature: 0.25},
      {points: [34, -97.3, 32.3, -95.27], curvature: -0.3},
      {points: [32.3,-95.27, 32.9, -92.03], curvature: -0.25},
      {points: [32.9, -92.03, 40.4, -75.5], curvature: 0.05},
      {points: [40.4, -75.5, 39.9, -74.1], curvature: 0.45}
      ];

    console.log(data_border);
    var series = map.choropleth(density_data);

    var connections = map.connector(json_border); 

    console.log(connections)
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
  });
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
