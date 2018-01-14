"use strict";

//map api to UNHCR
var namesDict = []
namesDict["Russia"] = "Russian Federation"
namesDict["United States"] = "United States of America"
namesDict["Greenland"] = "Denmark"
namesDict["Democratic Republic of the Congo"] = "Dem. Rep. of the Congo"
namesDict["Central African Republic"] = "Central African Rep."

var ViewModel = {
    countries: ko.observableArray([]),
    chosenFrom: ko.observable(''),
    chosenTo: ko.observable("SRB"),
    chosenYear: ko.observable("2015"),
    chosenMonth: ko.observable("1"),
    peopleAm: ko.observable("0"),
    chosenCountry: ko.observable("POL"),
    maxEdge: ko.observable(1),
    PKBGrowth: ko.observableArray([]),
    PKBPerCapita: ko.observableArray([]),
    Indicator: ko.observable(true),


    getRefugees: function(chosenFrom, callback) {
        //var def =  getRefugees(callback);
        return getRefugees(chosenFrom, callback);
    },
    getResidents: function(chosenCountry, callback) {
        //var def =  getRefugees(callback);
        return getResidents(chosenCountry, callback);
    },
    getPKB: function(callback) {
        return getAllPKB(callback);
    },
};

ko.bindingHandlers.slider = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().sliderOptions || {};
        if (ko.isObservable(options.max)) {
            options.max.subscribe(function(newValue) {
                $(element).slider('option', 'max', newValue);
            });
            options.max = ko.utils.unwrapObservable(options.max);
        }
        $(element).slider(options);
        ko.utils.registerEventHandler(element, "slidechange", function(event, ui) {
            var observable = valueAccessor();
            observable(ui.value);
        });
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $(element).slider("destroy");
        });
        ko.utils.registerEventHandler(element, "slide", function(event, ui) {
            var observable = valueAccessor();
            observable(ui.value);
        });
    },
    update: function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (isNaN(value)) value = 0;
        $(element).slider("value", value);

    }
};


function getCountries() {
    $.getJSON("http://popdata.unhcr.org/api/stats/country_of_residence.json",
        function(data) {
            ViewModel.countries.removeAll();
            for (var i = 0; i < data.length; i++) {
                //console.log(data[i]);
                ViewModel.countries.push(ko.mapping.fromJS(data[i]));
            }
        }
    );
}

function get3LetterCode(country) {
    if (namesDict[country]) {
        country = namesDict[country]
    }
    var foundShort
    ko.utils.arrayForEach(ViewModel.countries(), function(countryObj) {
        var countryName = countryObj.country_of_residence_en().toString();
        if (countryName == country) {
            foundShort = countryObj.country_of_residence();
        }
    });
    if (foundShort != null && foundShort != undefined) {
        return foundShort;
    }
    ko.utils.arrayForEach(ViewModel.countries(), function(countryObj) {
        var countryName = countryObj.country_of_residence_en().toString();
        console.log(countryName);
    });
    console.log("Country not found " + country + ". List of avaliable countries above.");
}

function getNameFromCode(code){
	var foundName
    ko.utils.arrayForEach(ViewModel.countries(), function(countryObj) {
		var countryShort = countryObj.country_of_residence().toString();
		if(countryShort == code){
			foundName = countryObj.country_of_residence_en();
		}
    });
	return foundName;
}

function getAllPKB(callback) {
    var query = "?";
    var indicator;
    var def = $.Deferred();
    if (ViewModel.chosenYear() != "") {
        if (query != "?") {
            query += "&";
        }
        query += "date=" + ViewModel.chosenYear();
    }
    if(ViewModel.Indicator()){
        indicator = "NY.GDP.PCAP.CD/";
    }
    else{
        indicator = "NY.GDP.MKTP.KD.ZG/"
    }

    var url = "http://api.worldbank.org/v2/countries/all/indicators/"+ indicator + query + "&per_page=300&format=json";
    console.log(url);
    $.ajax({
        method: 'GET',
        url: url,
        success: function(data) {
            ViewModel.PKBPerCapita.removeAll();
            for (var i = 0; i < data[1].length; i++) {
                ViewModel.PKBPerCapita.push(ko.mapping.fromJS(data[1][i]));
            };
            console.log(data[1])
        }
    }).done(function(data) {
        callback(data[1], def);
    });
    return def.promise();
}

function getRefugees(chosenFrom, callback) {
    console.log("getRefugees");
    var def = $.Deferred();
    var query = "?";
    if (chosenFrom != "") {
        query += "coo=" + chosenFrom;
    }

    if (ViewModel.chosenYear() != "") {
        if (query != "?") {
            query += "&";
        }
        query += "year=" + ViewModel.chosenYear();
    }
    var outputData = [];
    $.getJSON("http://popdata.unhcr.org/api/stats/asylum_seekers_monthly.json" + query,
        function(data) {
            console.log(data);
            if (data.length > 0) {
                var grouped = groupBy(data, row => row.country_of_asylum);
                for (var key of grouped.keys()) {
                    var value = grouped.get(key);
                    var entry = { from: value[0].country_of_origin_en.split('(')[0], to: value[0].country_of_asylum_en.split('(')[0], year: value[0].year, value: 0 };
                    value.forEach((item) => {
                        entry.value += item.value;
                    })
                    outputData.push(entry);
                }
                // Sort by price high to low
                outputData.sort(sort_by('value', true, parseInt));

                ViewModel.peopleAm(data[0].value);
                outputData = outputData.slice(0, ViewModel.maxEdge());
            } else {
                ViewModel.peopleAm("0");
            }
        }
    ).done(function() {
        callback(outputData, def);
    });
    return def.promise();
}

function compareAmounts(a,b) {
    if ((a.refugees == 0 || a.refugees == NaN) && (b.refugees == 0 || b.refugees == NaN))
        return 0;
    if (b.refugees == 0 || b.refugees == NaN)
        return -1;
    if (a.refugees == 0 || a.refugees == NaN)
        return 1;
    if (a.refugees > b.refugees)
        return -1;
    if (a.refugees < b.refugees)
        return 1;
    return 0;
}

function getResidents(chosenCountry, callback) {
    var query = "?";
    var def = $.Deferred();
    if (chosenCountry != "") {
        query += "country_of_residence=" + chosenCountry;
    }
    if (ViewModel.chosenYear() != "") {
        if (query != "?") {
            query += "&";
        }
        query += "year=" + ViewModel.chosenYear();
    }
    var outputData = [];
    $.getJSON("http://popdata.unhcr.org/api/stats/persons_of_concern.json" + query,
        function(data) {
            data.sort(compareAmounts);
            var limit = Math.min(data.length, 10);
            for (i = 0; i < limit; i++) {
                outputData.push({ x: data[i].country_of_origin, value: data[i].refugees })
            }
			data.sort(compareAmounts);
			var limit = Math.min(data.length, 10);
			for(i = 0; i < limit; i++)
			{
                if(data[i].refugees != 0 && data[i].refugees != NaN)
                {
                    outputData.push({x: data[i].country_of_origin, value: data[i].refugees});
                }
			}
        }
    ).done(function() {
        callback(outputData, def);
    });
    return def.promise();
}

function getRefugeesYearly(destination, year, callback)
{
    var query = "?";
    var def = $.Deferred();
    if (destination != "") {
        query += "country_of_asylum=" + destination;
    }
    if (year != "") {
        if (query != "?") {
            query += "&";
        }
        query += "year=" + year;
    }
    if (query != "?") {
        query += "&";
    }
    query += "total=true";
    var outputData = {x: year, value: 0};
    var address = "http://popdata.unhcr.org/api/stats/asylum_seekers_monthly.json" + query
	$.getJSON(address,
        function(data) {
            if(data.total != NaN && data.total != undefined)
            {
                outputData.value += data.total;
            }
        }
    ).done(function() {
        callback(outputData, def);
    });
    return def.promise();
}

var get_coord_point = function(place, callback) {

    var def = $.Deferred();
    var point = new Array();
    $.getJSON("https://restcountries.eu/rest/v2/name/" + place.replace('.', ''), function(result) {

        var resulty = result[0].latlng[1];
        var resultx = result[0].latlng[0];
        var fromx = resultx;
        var fromy = resulty;
        point.push(fromx);
        point.push(fromy);


    }).done(function() {
        callback(point, def);
    });
    return def.promise();
}

var get_coord = function(data_border, callback) {
    var i = 1;
    var json_border = [];
    $.each(data_border, function() {
        var row = this;
        var point = new Array();
        var fromPoint = new Array();
        var toPoint = new Array();

        var from = get_coord_point(this.from, function(point, def) {
            fromPoint = point;
            def.resolve()
        });

        var to = get_coord_point(this.to, function(point, def) {
            toPoint = point;
            def.resolve()
        });
        var def = $.when(from, to);

        def.done(function() {
            var s = fromPoint.concat(toPoint);

            json_border.push({ points: s, curvature: -0.27, from: row.from, to: row.to, value: row.value, year: row.year });
            if (i === data_border.length) {
                callback(json_border)
            }
            i++;
        });
    });
}
