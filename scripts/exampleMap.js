var map;
var searchedCountries = new Array();

$(document).ready(function() {
    $("#myRange").on("change", function(e) {
        if (typeof ViewModel.chosenFrom() !== 'undefined') {
            get_connects();
        } else console.log("no country provided")
    });

    $("#slidercomeagain").on("slide", function(event, ui) {
        console.log(typeof ViewModel.chosenFrom() !== 'undefined')
        if (typeof ViewModel.chosenFrom() !== 'undefined') {
            map.removeAllSeries();
            searchedCountries.forEach(function(entry){
                get_connects(entry.code);
            });
        } else console.log("no country provided")
    });
    $('#get-migration').submit(function(e) {
        e.preventDefault();
        get_connects(ViewModel.chosenFrom());
    });

    $('#sidebar').on('click', '.country-entry-button', function() {
        var name = $(this).siblings('.country-entry-name');
        var container = $(this).closest('.country-entry');
        console.log(container);
        var entry = searchedCountries.indexOf(name[0].textContent);
        if (entry > -1) {
            searchedCountries.splice(entry, 1);
            map.removeSeries(name[0].textContent);
            $(container[0]).remove();
        };

    });
    mapObj = generate_map(function(mapa) {
        console.log(mapa);
        map = mapa
    });
    ko.applyBindings(ViewModel);
    getCountries();

});



var get_connects = function(chosenFrom) {
    var outputData = new Array();
    var data = ViewModel.getRefugees(chosenFrom,function(destinations, def) {
        console.log(destinations)
        outputData = destinations;
        console.log(outputData)
        def.resolve();
    });
    var def = $.when(data);
    def.done(function() {
        var borders = get_coord(outputData, function(borders) {
            searchedCountries.push({name: borders[0].from , code:ViewModel.chosenFrom()});
            var dataSet = anychart.data.set(borders);
            createSeries('3 - 5%', dataSet, '#996633', borders[0].from)
        })
    });
}

var deleteSeries = function() {

}

var createSeries = function(name, data, color, seriesFrom) {
    map.removeSeries("Angola")
    // Creates connector series for destinations and customizes them
    var connectorSeries = map.connector(data)
        .name(name)
        .fill(color)
        .stroke('1.5 ' + color)
        .curvature(0);
    var sidebar = $('#sidebar').append('<li>' +
        '<span class="country-entry">' +
        '<p class="country-entry-name">' + seriesFrom + '</p><i class="fa fa-times country-entry-button" aria-hidden="true"></i>' +
        '</span>' +
        '</li>');

    connectorSeries.id(seriesFrom);

    var seriesCount = map.getSeriesCount();
    console.log(seriesCount);
    //map.removeSeriesAt(0);
    connectorSeries.hovered()
        .stroke('1.5 #212121')
        .fill('#212121');

    connectorSeries.markers()
        .position('100%')
        .size(20)
        .fill(color)
        .stroke('2 #E1E1E1');

    connectorSeries.hovered().markers()
        .position('100%')
        .size(20)
        .fill('#212121')
        .stroke('2 #455a64');

    if (name == 'More then 10%') {
        connectorSeries.startSize(7).endSize(2);
    } else if (name == '5 - 10%') {
        connectorSeries.startSize(5).endSize(1.5);
    } else if (name == '3 - 5%') {
        connectorSeries.startSize(3).endSize(1);
    } else {
        connectorSeries.startSize(0).endSize(0);
    }

    // Sets settings for labels for the destination series
    connectorSeries.labels()
        .enabled(true)
        .offsetY(0)
        .offsetX(0)
        .fontSize(10)
        .position('100%')
        .format(function() {
            return this.getData('to')
        });

    connectorSeries.hovered().labels()
        .enabled(true)
        .fontColor('#212121');

    // Sets settings for legend items
    connectorSeries.legendItem()
        .iconType('square')
        .iconFill(color)
        .iconStroke(false);

    // Sets tooltip setting for the destination series
    connectorSeries.tooltip()
        .useHtml(true)
        .padding([8, 13, 10, 13])
        .titleFormat('{%to}')
        .fontSize(13)
        .format(function() {
            return '<span style="color: #d9d9d9">From</span>: ' +
                this.getData('from') + '<br/>' +
                '<span style="color: #d9d9d9">To</span>: ' +
                this.getData('to') + '<br/>' +
                '<span style="color: #d9d9d9">Number of migrats</span>: ' +
                this.value + '<br/>' +
                '<span style="color: #d9d9d9">In year</span>: ' +
                this.getData('year');
        });
    // map.legend()
    //         .enabled(true)
    //         .position('center-bottom')
    //         .padding([20, 0, 0, 0])
    //         .fontSize(10);

    // map.legend().title()
    //         .enabled(true)
    //         .fontSize(13)
    //         .padding([0, 0, 5, 0])
    //         .text('Migrants ')
    // ;
};

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
        series.id("Map")
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