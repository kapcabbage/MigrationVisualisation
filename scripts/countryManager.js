"use strict";

var ViewModel = {
    countries: ko.observableArray([]),
    chosenFrom: ko.observable(''),
    chosenTo: ko.observable("SRB"),
    chosenYear: ko.observable("2015"),
    chosenMonth: ko.observable("1"),
    peopleAm: ko.observable("0"),
    chosenCountry: ko.observable("POL"),
    PKB: ko.observable("0"),


    getRefugees: function(callback) {
        //var def =  getRefugees(callback);
        return getRefugees(callback);
    },
    getPKB: function() {
        getPKB();
    }
};

ko.bindingHandlers.slider = {
  init: function (element, valueAccessor, allBindingsAccessor) {
    var options = allBindingsAccessor().sliderOptions || {};
      if (ko.isObservable(options.max)) {
          options.max.subscribe(function(newValue) {
              $(element).slider('option', 'max', newValue);
          });
          options.max = ko.utils.unwrapObservable(options.max);
      }
    $(element).slider(options);
    ko.utils.registerEventHandler(element, "slidechange", function (event, ui) {
        var observable = valueAccessor();
        observable(ui.value);
    });
    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
        $(element).slider("destroy");
    });
    ko.utils.registerEventHandler(element, "slide", function (event, ui) {
        var observable = valueAccessor();
        observable(ui.value);
    });
  },
  update: function (element, valueAccessor) {
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

function getPKB() {
    var query = "?";
    if (ViewModel.chosenYear() != "") {
        if (query != "?") {
            query += "&";
        }
        query += "date=" + ViewModel.chosenYear();
    }

    var url = "http://api.worldbank.org/v2/countries/" + ViewModel.chosenCountry() + "/indicators/NY.GDP.PCAP.CD/" + query;

    $.ajax({
        /*headers: {
        	'Accept': 'application/json',
        	'Content-Type': 'application/json'
        },*/
        method: 'GET',
        url: url,
        //dataType: "json",
        success: function(data) {
            console.log(data);
            if (data.length > 0) {
                ViewModel.PKB(data[0].value);
            } else {
                ViewModel.PKB("0");
            }
        }
    });
}

function getRefugees(callback) {
    console.log("getRefugees");
    var def = $.Deferred();
    var query = "?";
    if (ViewModel.chosenFrom() != "") {
        query += "coo=" + ViewModel.chosenFrom();
    }

    if (ViewModel.chosenYear() != "") {
        if (query != "?") {
            query += "&";
        }
        query += "year=" + ViewModel.chosenYear();
    }
    // if(ViewModel.chosenMonth() != ""){
    // 	if(query != "?"){
    // 		query += "&";
    // 	}
    // 	query += "month="+ViewModel.chosenMonth();
    // }
    var outputData = [];
    console.log("http://popdata.unhcr.org/api/stats/asylum_seekers_monthly.json" + query);

    $.getJSON("http://popdata.unhcr.org/api/stats/asylum_seekers_monthly.json" + query,
        function(data) {
            //console.log(data);
            if (data.length > 0) {


                var grouped = groupBy(data, row => row.country_of_asylum);
                console.log(grouped.entries());

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
                //console.log(outputData);
                ViewModel.peopleAm(data[0].value);
                outputData = outputData.slice(0,4);
            } else {
                ViewModel.peopleAm("0");
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
    $.getJSON("https://restcountries.eu/rest/v2/name/" + place.replace('.',''), function(result) {

       
        	console.log(place)
        	console.log(result);
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
    console.log("databorder")
    console.log(data_border)
    var json_border = [];
    $.each(data_border, function() {
    	var row = this;
        var point = new Array();
        var fromPoint = new Array();
        var toPoint = new Array();
        console.log(this.from)
        console.log(this.to)
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

            json_border.push({ points: s, curvature: -0.27 ,from: row.from, to: row.to, value: row.value,year:row.year});
            console.log(json_border)
            if (i === data_border.length) {
            	console.log(json_border);
                callback(json_border)
            }
            console.log(i)
            console.log(data_border.length)
            i++;

        });



    });

}