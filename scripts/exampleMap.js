var map;
var searchedCountries = new Array();

$(document).ready(function() {

    $('#search-close-button').on("click", function(event, ui) {
        $('#search').hide();
    });

    $('#search-modal-button').on("click", function(event, ui) {
        $('#search').show();
    });


    $("#slidercomeagain").on("slide", function(event, ui) {
        console.log(typeof ViewModel.chosenFrom() !== 'undefined')
        if (typeof ViewModel.chosenFrom() !== 'undefined') {
            ViewModel.chosenYear(ui.value);
            searchedCountries.forEach(function(entry) {
                map.removeSeries(entry.name);
                get_connects(entry.code);
            });
        } else console.log("no country provided")
    });
    $('#get-migration').submit(function(e) {
        e.preventDefault();
        var entry = $.grep(searchedCountries, function(a) {
            return a.code == ViewModel.chosenFrom();
        });
        if (entry.length > 0) {
            console.log('hit')
            console.log(entry[0].name);
            map.removeSeries(entry[0].name);
        };
        get_connects(ViewModel.chosenFrom());
        console.log(map.getSeriesCount());
    });

    $('#sidebar').on('click', '.country-entry-button', function() {
        console.log(searchedCountries);
        var name = $(this).siblings('.country-entry-name');
        var container = $(this).closest('.country-entry');
        console.log(name[0].textContent);
        var entry = $.grep(searchedCountries, function(a) {
            return a.name == name[0].textContent;
        });
        console.log(entry[0])

        if (entry.length > 0) {
            console.log(searchedCountries.indexOf(entry[0]));
            var index = searchedCountries.indexOf(entry[0]);
            searchedCountries.splice(index, 1);
            map.removeSeries(name[0].textContent);
            $(container[0]).remove();
        };
        console.log(searchedCountries);

    });
    mapObj = generate_map(function(mapa) {
        map = mapa
    });
    ko.applyBindings(ViewModel);
    getCountries();

});



var get_connects = function(chosenFrom) {
    var outputData = new Array();
    var data = ViewModel.getRefugees(chosenFrom, function(destinations, def) {
        outputData = destinations;
        def.resolve();
    });
    var def = $.when(data);
    def.done(function() {
        var borders = get_coord(outputData, function(borders) {
            console.log(outputData)
            var entry = $.grep(searchedCountries, function(a) {
                return a.code == chosenFrom;
            });

            if (entry.length == 0) {
                searchedCountries.push({ name: borders[0].from, code: ViewModel.chosenFrom() });
                console.log(searchedCountries);
                var sidebar = $('#sidebar').append('<li>' +
                    '<span class="country-entry">' +
                    '<p class="country-entry-name">' + borders[0].from + '</p><i class="fa fa-times country-entry-button" aria-hidden="true"></i>' +
                    '</span>' +
                    '</li>');
            }
            var dataSet = anychart.data.set(borders);
            createSeries('3 - 5%', dataSet, getRandomColor(), borders[0].from)
        })
    });
}

var deleteSeries = function() {

}

var createSeries = function(name, data, color, seriesFrom) {
    // Creates connector series for destinations and customizes them
    var connectorSeries = map.connector(data)
        .name(name)
        .fill(color)
        .stroke('1.5 ' + color)
        .curvature(0);

    connectorSeries.id(seriesFrom);

    var seriesCount = map.getSeriesCount();
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
};

var generate_map = function(callback) {
    var map;
    map = anychart.map();
    http: //api.worldbank.org/v2/countries/all/indicators/NY.GDP.PCAP.CD/?date=2015&per_page=300&format=json
        //https://cdn.anychart.com/samples-data/maps-general-features/world-choropleth-map/data.json
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
            console.log(data);
            // data.forEach(function(entry){
            //     ViewModel.getPKB(entry.id)
            // });
            var pkbdata = ViewModel.getAllPKB(function(pkb, def) {
                data.forEach(function(entry) {
                    var pkbrow = $.grep(pkb, function(a) {
                        return a.country.id == entry.id
                    });
                    if (typeof pkbrow[0] != 'undefined') {
                        entry['pkbPerCapita'] = pkbrow[0].value;
                    }
                });
                console.log(data)
                def.resolve();
            });
            var def = $.when(pkbdata);
            def.done(function() {

                var dataSet = anychart.data.set(data);
                var density_data = dataSet.mapAs({
                    'value': 'pkbPerCapita'
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
                            parseFloat(this.getData('density')).toLocaleString() + ' pop./km&#178 <br/>' +
                            '<span style="color: #d9d9d9">Population</span>: ' +
                            parseInt(this.getData('population')).toLocaleString() + '<br/>' +
                            '<span style="color: #d9d9d9">Area</span>: ' +
                            parseInt(this.getData('area')).toLocaleString() + ' km&#178 <br/>' +
                            '<span style="color: #d9d9d9">pkbPerCapita</span>: ' +
                            parseInt(this.getData('pkbPerCapita')).toLocaleString() + '<br/>' + this.vaulue;
                    });
                var scale = anychart.scales.ordinalColor([{
                        less: 1000
                    },
                    {
                        from: 1000,
                        to: 2000
                    },
                    {
                        from: 2000,
                        to: 4000
                    },
                    {
                        from: 4000,
                        to: 8000
                    },
                    {
                        from: 8000,
                        to: 15000
                    },
                    {
                        from: 15000,
                        to: 25000
                    },
                    {
                        from: 25000,
                        to: 60000
                    },
                    {
                        greater: 60000
                    }
                ]);

                scale.colors(['#42a5f5', '#64b5f6', '#90caf9', '#ffa726', '#fb8c00', '#f57c00', '#ef6c00', '#e65100']);
                series.colorScale(scale);

                var colorRange = map.colorRange();
                colorRange.enabled(true)
                    .padding([20, 0, 0, 0])
                    .colorLineSize(5)
                    .marker({
                        size: 7
                    });
                colorRange.ticks()
                    .enabled(true)
                    .stroke('3 #ffffff')
                    .position('center')
                    .length(20);
                colorRange.labels()
                    .fontSize(10)
                    .padding(0, 0, 0, 5)
                    .format(function() {
                        var range = this.colorRange;
                        var name;
                        if (isFinite(range.start + range.end)) {
                            name = range.start + ' - ' + range.end;
                        } else if (isFinite(range.start)) {
                            name = 'After ' + range.start;
                        } else {
                            name = 'Before ' + range.end;
                        }
                        return name
                    })
                // create zoom controls
                var zoomController = anychart.ui.zoom();
                zoomController.render(map);
                // set container id for the chart
                map.container('maparea');
                // initiate chart drawing
                map.draw();
            });
        });

    callback(map)
    return map;

}