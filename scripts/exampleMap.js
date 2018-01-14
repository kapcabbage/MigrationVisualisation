var map;
var countries = new Array();
var searchedCountries = new Array();
var addedSeries = new Array();

$(document).ready(function() {
    getCountries();

    $('#indicator-selector').change(function() {
        ViewModel.Indicator($(this).prop('checked'));
        map.removeSeries("Map")
        createPkbMap(countries);
    })

    $('#search-close-button').on("click", function(event, ui) {
        $('#search').hide();
    });

    $('#search-modal-button').on("click", function(event, ui) {
        $('#search').show();
    });

    $("#slidercomeagain").on("slide", function(event, ui) {
        ViewModel.chosenYear(ui.value);
        if (typeof ViewModel.chosenFrom() !== 'undefined') {
            searchedCountries.forEach(function(entry) {
                var filtered = $.grep(addedSeries, function(e) {
                    return e.indexOf(entry.name) !== -1;
                })
                filtered.forEach(function(e) {
                    map.removeSeries(e);
                })
                addedSeries = addedSeries.filter(function(el) {
                    return filtered.indexOf(el) < 0;
                });
                get_connects(entry.code);
            });
        } else { console.log("no country provided") }
        map.removeSeries("Map")
        createPkbMap(countries);
    });
    
    $('#get-migration').submit(function(e) {
        e.preventDefault();
        var entry = $.grep(searchedCountries, function(a) {
            return a.code == ViewModel.chosenFrom();
        });
        console.log('entry');
        if (entry.length > 0) {
            var filtered = $.grep(addedSeries, function(e) {
                return e.indexOf(entry[0].name) !== -1;
            })
            filtered.forEach(function(e) {
                map.removeSeries(e);
            })
            addedSeries = addedSeries.filter(function(el) {
                return filtered.indexOf(el) < 0;
            });
        };
        get_connects(ViewModel.chosenFrom());
    });

    $('#sidebar').on('click', '.country-entry-button', function() {
        console.log(searchedCountries);
        var name = $(this).siblings('.country-entry-name');
        var container = $(this).closest('.country-entry');
        console.log(name[0].textContent);
        var entry = $.grep(searchedCountries, function(a) {
            return a.name == name[0].textContent;
        });

        if (entry.length > 0) {
            var index = searchedCountries.indexOf(entry[0]);
            searchedCountries.splice(index, 1);
            var filtered = $.grep(addedSeries, function(e) {
                return e.indexOf(name[0].textContent) !== -1;
            })
            filtered.forEach(function(entry) {
                map.removeSeries(entry);
            })
            addedSeries = addedSeries.filter(function(el) {
                return filtered.indexOf(el) < 0;
            });
            $(container[0]).remove();
        };
    });
    
    mapObj = generate_map(function(mapa, data) {
        map = mapa;
        //countries = data;

    });
    ko.applyBindings(ViewModel);
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
            var color = getRandomColor();
            borders.forEach(function(e) {
                var dataSet = anychart.data.set([e]);
                createSeries(e.value, dataSet, color, e.from + " " + e.value)
            })

        })
    });
}

var createPkbMap = function(argument) {
    var pkbdata = ViewModel.getPKB(function(pkb, def) {
        argument.forEach(function(entry) {
            var pkbrow = $.grep(pkb, function(a) {
                return a.country.id == entry.id
            });
            if (typeof pkbrow[0] != 'undefined') {
                entry['pkbPerCapita'] = pkbrow[0].value;
            }
        });
        def.resolve();
    });
    var def = $.when(pkbdata);
    def.done(function() {

        var dataSet = anychart.data.set(argument);
        var density_data = dataSet.mapAs({
            'value': 'pkbPerCapita'
        });
        var series = map.choropleth(density_data);
        series.name("World")
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
                    (ViewModel.Indicator()? '<span style="color: #d9d9d9">GBP per capita</span>: ' + parseInt(this.getData('pkbPerCapita')).toLocaleString() : '<span style="color: #d9d9d9">GBP growth(annual %)</span>: '+ parseFloat(this.getData('pkbPerCapita')).toLocaleString()+'%')
                    
            });

        if (ViewModel.Indicator()) {
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
        } else {
            var scale = anychart.scales.ordinalColor([{
                    less: -10
                },
                {
                    from: -10,
                    to: -5
                },
                {
                    from: -5,
                    to: -1
                },
                {
                    from: -1,
                    to: 0
                },
                {
                    from: 0,
                    to: 1
                },
                {
                    from: 1,
                    to: 2
                },
                {
                    from: 2,
                    to: 3
                },
                {
                    from: 3,
                    to: 5
                },
                {
                    from: 5,
                    to: 8
                },
                {
                    greater: 8
                }
            ]);
        }

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
                    name = 'More then ' + range.start;
                } else {
                    name = 'Less then ' + range.end;
                }
                return name
            })
        colorRange.title()
            .enabled(true)
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
                    name = 'More then ' + range.start;
                } else {
                    name = 'Less then ' + range.end;
                }
                return name
            })
        colorRange.title()
            .enabled(true)
            .useHtml(true)
            .fontSize(9)
            .padding([10, 0, 10, 0])
            .text('GDP per capita');
        map.legend()
            .enabled(true)
            .position('center-bottom')
            .padding([20, 0, 0, 0])
            .fontSize(10);

        map.legend().title()
            .enabled(true)
            .fontSize(13)
            .padding([0, 0, 5, 0])
            .text('Visibility');
        // create zoom controls

    });
}

var deleteSeries = function() {

}

var createSeries = function(value, data, color, seriesId) {
    // Creates connector series for destinations and customizes them
    var connectorSeries = map.connector(data)
        .name(seriesId)
        .fill(color)
        .stroke('1.5 ' + color)
        .curvature(0);

    connectorSeries.id(seriesId);
    addedSeries.push(seriesId);

    connectorSeries.hovered()
        .stroke('1.5 #212121')
        .fill('#212121');

    connectorSeries.markers()
        .position('100%')
        .size(20)
        .fill(color)
        .stroke('2 #212121');

    connectorSeries.hovered().markers()
        .position('100%')
        .size(20)
        .fill('#212121')
        .stroke('2 #455a64');
    if (value > 50000) {
        connectorSeries.startSize(15).endSize(3);
    } else if (value > 20000 && value <= 50000) {
        connectorSeries.startSize(12).endSize(2.7);
    } else if (value > 10000 && value <= 20000) {
        connectorSeries.startSize(9).endSize(2.5);
    } else if (value > 5000 && value <= 10000) {
        connectorSeries.startSize(7).endSize(2);
    } else if (value > 1000 && value <= 5000) {
        connectorSeries.startSize(5).endSize(1.5);
    } else if (value > 100 && value <= 1000) {
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
        .fontColor(color);

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
    //var dataCountries;
    map = anychart.map();
    //http: //api.worldbank.org/v2/countries/all/indicators/NY.GDP.PCAP.CD/?date=2015&per_page=300&format=json
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
            .text('Visualisation of Refugee Migration<br/>' +
                '<span  style="color:#929292; font-size: 12px;">(Data source: UNHCR, Worldbank, Wikipedia)</span>');

        map.geoData('anychart.maps.world');
        map.interactivity().selectionMode('none');
        map.padding(0);
			
		var popup = document.getElementById("myPopup");
		popup.onclick = function() {
			popup.style.display = "none";
		}
		chart1 = anychart.column();
		chart1.container("chart1");
		var chartData1 = anychart.data.set();
		chart1.column(chartData1);
		chart1.draw();
        chart1.tooltip()
            .useHtml(true)
            .format(function() {
                var asdf = this;
                return '<span style="color: #d9d9d9">From</span>: ' + getNameFromCode(this.x) + '<br/>' +
                '<span style="color: #d9d9d9">Population</span>: ' + this.value
            });
            
		chart2 = anychart.bar();
		chart2.container("chart2");
		var chartData2 = anychart.data.set();
		chart2.bar(chartData2);
		chart2.draw();
		chart3 = anychart.bar();
		chart3.container("chart3");
		var chartData3 = anychart.data.set();
		chart3.bar(chartData3);
		chart3.draw();
		
		map.listen("click", function(e){

			var index = e.pointIndex;
			if (index != null && typeof index !== 'undefined') {
				popup.style.display = 'block';
				var series = data[index];
				var shortcut = get3LetterCode(series.name)
				
				for(i = 0; i < chartData1.getRowsCount(); 	)
				{
					chartData1.remove(0);
				}
				getResidents(shortcut, function(results, def) 
				{
                    var title = chart1.title();
                    var intermission = "";
                    if(results.length < 10)
                    {
                        intermission += "(" + results.length + ")";
                    }
                    title.text("Refugees residing in " + ViewModel.chosenYear() + ", top 10" + intermission +" nationalities");
                    title.enabled(true);
					for(i = 0; i < results.length; i++)
					{
						chartData1.append(results[i]);
					}
				});
			}
		});
		
        countries = data;
        console.log("DATA")
        //console.log(dataCountries);
        createPkbMap(countries);
        var zoomController = anychart.ui.zoom();
        zoomController.render(map);
    });
    map.container('maparea');
    // initiate chart drawing
    map.draw();
    callback(map, countries)
    return map;
}
