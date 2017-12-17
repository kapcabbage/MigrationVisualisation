var map;

$(document).ready(function() {
    $("#myRange").on("change", function(e) {
        console.log(ViewModel.chosenFrom())
        console.log(typeof ViewModel.chosenFrom() !== 'undefined')
        if (typeof ViewModel.chosenFrom() !== 'undefined') {
            get_connects();
        } else console.log("no country provided")
    });

    $('#get-migration').submit(function(e) {
        e.preventDefault();
        get_connects();
    });


    mapObj = generate_map(function(mapa) {
        console.log(mapa);
        map = mapa
    });


    ko.applyBindings(ViewModel);
    getCountries();


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

var get_connects = function(){
  var outputData = new Array();
        var data = ViewModel.getRefugees(function(destinations, def) {
            console.log(destinations)
            outputData = destinations;
            console.log(outputData)
            def.resolve();
        });
        var def = $.when(data);
        def.done(function() {
            var borders = get_coord(outputData, function(borders) {
                var series = map.choropleth();
                var connects = map.connector(borders);
                console.log(borders);
                connects.startSize(0);
                connects.endSize(5)
                connects.type("arrowhead");;
                //connects.colorScale(anychart.scales.linearColor('#FFEBD6','#C40A0A'));
                // connects.fill("#FF9966");
                // connects.stroke("#CCCC99");
                // connects.hovered().fill("#996633");
                // connects.selected().fill("#996633");
                // connects.hovered().stroke("#CCCC99");
                // connects.hovered().stroke("#CCCC99");;
                connects.tooltip().useHtml(true)
                    .format(function() {
                        console.log(this)
                        return '<span style="color: #d9d9d9">From</span>: ' +
                            this.getData('from') + '<br/>' +
                            '<span style="color: #d9d9d9">To</span>: ' +
                            this.getData('to') + '<br/>' +
                            '<span style="color: #d9d9d9">Number of migrats</span>: ' +
                            this.value +'<br/>' +
                            '<span style="color: #d9d9d9">In year</span>: ' +
                            this.getData('year');
                    });
                
            })
        });
}

var generate_map = function(callback) {
    var map;
    map = anychart.map();
    var mapObject = anychart.data.loadJsonFile('https://cdn.anychart.com/samples-data/maps-general-features/world-choropleth-map/data.json', function(data) {
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
        // create zoom controls
        var zoomController = anychart.ui.zoom();
        zoomController.render(map);
        // set container id for the chart
        map.container('maparea');
        // initiate chart drawing
        map.draw();
    });

    console.log(map);
    callback(map)
    return map;

}