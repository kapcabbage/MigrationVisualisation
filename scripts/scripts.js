"use strict";

var ViewModel = {
    countries: ko.observableArray([]),
	chosenFrom: ko.observable("SYR"),
	chosenTo: ko.observable("SRB"),
	chosenYear: ko.observable("2015"),
	chosenMonth: ko.observable("1"),
	peopleAm: ko.observable("0"),
	chosenCountry: ko.observable("POL"),
	PKB: ko.observable("0"),
	
	
    getRefugees: function () {
		getRefugees();
	},
    getPKB: function () {
		getPKB();
	}
};



function getCountries() {
    $.getJSON("http://popdata.unhcr.org/api/stats/country_of_residence.json", 
		function (data) 
		{
			ViewModel.countries.removeAll();
			for(var i=0; i < data.length; i++)
			{
				//console.log(data[i]);
				ViewModel.countries.push(ko.mapping.fromJS(data[i]));
			}
		}
	);
}

function getPKB() {
	var query = "?";
	if(ViewModel.chosenYear() != ""){
		if(query != "?"){
			query += "&";
		}
		query += "date="+ViewModel.chosenYear();
	}
	
	var url = "http://api.worldbank.org/v2/countries/" + ViewModel.chosenCountry() + "/indicators/NY.GDP.PCAP.CD/"+query;
	
	$.ajax({
		/*headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},*/
		method: 'GET',
		url: url,
		//dataType: "json",
		success: function (data) {
			console.log(data);
			if(data.length > 0)
			{
				ViewModel.PKB(data[0].value);
			}
			else
			{
				ViewModel.PKB("0");
			}
		}
    });
}

function getRefugees() {
	console.log("getRefugees");
	var query = "?";
	if(ViewModel.chosenFrom() != ""){
		query += "coo="+ViewModel.chosenFrom();
	}
	if(ViewModel.chosenTo() != ""){
		if(query != "?"){
			query += "&";
		}
		query += "coa="+ViewModel.chosenTo();
	}
	if(ViewModel.chosenYear() != ""){
		if(query != "?"){
			query += "&";
		}
		query += "year="+ViewModel.chosenYear();
	}
	if(ViewModel.chosenMonth() != ""){
		if(query != "?"){
			query += "&";
		}
		query += "month="+ViewModel.chosenMonth();
	}
	
	console.log("http://popdata.unhcr.org/api/stats/asylum_seekers_monthly.json"+query);
	
    $.getJSON("http://popdata.unhcr.org/api/stats/asylum_seekers_monthly.json"+query, 
		function (data) 
		{
			console.log(data);
			if(data.length > 0)
			{
				ViewModel.peopleAm(data[0].value);
			}
			else
			{
				ViewModel.peopleAm("0");
			}
		}
	);
}


