$(document).ready(function() {
	var resize = function() {
		var $map = $('#map');

		$map.height($(window).height() - $('nav.navbar').outerHeight(true));

		if (map) {
			map.invalidateSize();
		}
	};

	$(window).on('resize', function() {
		resize();
	});

	resize();

	var map = L.map('map').setView([44.494887, 11.342616], 13);

	var minZoom = 12;
	var maxZoom = 17;
	var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib =
		'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
	var baseLayer = new L.TileLayer(osmUrl, {
		minZoom: minZoom,
		maxZoom: maxZoom,
		attribution: osmAttrib
	});
	baseLayer.addTo(map);

	var stamenLayer = new L.StamenTileLayer('toner', {
		detectRetina: true
	}).setUrl('//stamen-tiles-{s}a.ssl.fastly.net/toner/{z}/{x}/{y}.png');
	stamenLayer.options.minZoom = minZoom;
	stamenLayer.options.maxZoom = maxZoom;
	stamenLayer.addTo(map);

	var layerControl = L.control.layers({
		'OpenStreetMap': baseLayer,
		'Stamen toner': stamenLayer
	}).addTo(map);

	var createLayerGroup = function(name) {
		var layerGroup = new L.LayerGroup();

		map.addLayer(layerGroup);
		layerControl.addOverlay(layerGroup, name);

		return layerGroup;
	};

	var percentProps = function(record) {
		if (record.stud && record.non_freq) {
			record.non_freq_perc = record.non_freq / record.stud * 100;
		}
		if (record.stud && record.stranieri) {
			record.stranieri_perc = record.stranieri / record.stud * 100;
		}
		return record;
	};

	var tablePopupBuilder = function(layer, record) {
		var $html = $(L.HTMLUtils.buildTable({
			Quartiere: record.Quartiere,
			Servizio: record.Servizio,
			Struttura: record.Struttura,
			IC: record['Istituzione scol'],
			Indirizzo: record.indirizzo,
			Studenti: record.stud ? record.stud : 'n/d',
			'Non frequentanti': record.non_freq ? record.non_freq + ' (' + record.non_freq_perc
				.toFixed(1) + '%)' : 'n/d',
			Stranieri: record.stranieri ? record.stranieri + ' (' + record.stranieri_perc
				.toFixed(1) + '%)' : 'n/d'
		}));

		layer.bindPopup($html.wrap('<div/>').parent().html(), {
			minWidth: 400,
			maxWidth: 400
		});
	};

	var byServizio = function(servizio) {
		return function(record) {
			return record.Servizio === servizio;
		};
	};

	var radiusFunc = new L.LinearFunction([0, 10], [500, 30], {
		postProcess: function(value) {
			if (value === 10) {
				return 6;
			}
			return value;
		}
	});
	var fillColorFunc = new L.PiecewiseFunction([
		new L.HSLLuminosityFunction([0, 0], [1, 0]),
		new L.HSLHueFunction([1, 0], [100, 180])
	]);

	var layerOptions = {
		fillOpacity: 0.7,
		opacity: 1,
		weight: 0.5,
		color: 'hsl(220,100%,25%)',
		numberOfSides: 40,
		dropShadow: true,
		gradient: true
	};

	var displayOptions = {
		'stud': {
			displayName: 'Studenti',
			displayText: function(value) {
				return value ? value : 'n/d';
			},
			radius: radiusFunc
		},
		/*
		'stranieri_perc': {
			displayName: 'Stranieri',
			displayText: function(value) {
				return value ? value.toFixed(1) + ' %' : 'n/d';
			},
			weight: new L.LinearFunction([0, 0.1], [100, 6])
		},
		*/
		'non_freq_perc': {
			displayName: 'Non freq.',
			displayText: function(value) {
				return value ? value.toFixed(1) + ' %' : 'n/d';
			},
			fillColor: fillColorFunc
		}
	};

	var options = {
		recordsField: null,
		latitudeField: 'lat',
		longitudeField: 'lon',
		deriveProperties: percentProps,
		layerOptions: layerOptions,
		displayOptions: displayOptions,
		tooltipOptions: {
			iconSize: new L.Point(90, 86),
			iconAnchor: new L.Point(-15, 43)
		},
		onEachRecord: tablePopupBuilder
	};

	var infanzia = L.extend({}, options, {
		filter: byServizio("SCUOLA DELL'INFANZIA")
	});
	var infanziaLayer = L.dataLayer(scuoleData, infanzia);

	var primaria = L.extend({}, options, {
		filter: byServizio("SCUOLA PRIMARIA"),
	});
	var primariaLayer = L.dataLayer(scuoleData, primaria);

	var medieOptions = L.extend({}, options, {
		filter: byServizio("SCUOLA SECONDARIA DI PRIMO GRADO"),
		//displayOptions: displayOptions
	});
	var medieLayer = new L.DataLayer(scuoleData, medieOptions);

	createLayerGroup("Scuole secondarie di primo grado").addLayer(medieLayer);
	createLayerGroup("Scuole primarie").addLayer(primariaLayer);
	createLayerGroup("Scuole dell'infanzia").addLayer(infanziaLayer);

	var minHue = 60;
	var maxHue = 180;
	var stranieriOptions = L.extend({}, options, {
		filter: function(record) {
			return record.stud && record.stranieri;
		},
		layerOptions: L.extend({}, layerOptions, {
			fillOpacity: 0.9,
			radius: 30,
			barThickness: 10,
			maxDegrees: 360,
			rotation: 0,
			numSegments: 10
		}),
		chartOptions: {
			'stranieri_perc': {
				displayName: 'Stranieri',
				displayText: function(value) {
					return value ? value.toFixed(1) + ' %' : 'n/d';
				},
				maxValue: 100,
				minValue: 0
			}
		},
		displayOptions: {
			'stranieri_perc': {
				displayName: 'Stranieri',
				color: new L.HSLHueFunction([0, minHue], [100, maxHue], {
					outputSaturation: '100%',
					outputLuminosity: '25%'
				}),
				fillColor: new L.HSLHueFunction([0, minHue], [100, maxHue], {
					outputSaturation: '100%',
					outputLuminosity: '50%'
				})
			},
			'Servizio': {
				radius: function(value) {
					if (value === "SCUOLA DELL'INFANZIA") {
						return 10;
					} else if (value === 'SCUOLA PRIMARIA') {
						return 20;
					} else /*if (value === "SCUOLA SECONDARIA DI PRIMO GRADO")*/ {
						return 30;
					}
				}
			}
		}
	});
	var stranieriLayer = L.radialMeterMarkerDataLayer(scuoleData,
		stranieriOptions);
	var layerGroup = new L.LayerGroup().addLayer(stranieriLayer);
	layerControl.addOverlay(layerGroup, "Stranieri");

	var legendControl = L.control.legend({
		autoAdd: false,
		gradient: true
	}).addTo(map);
	legendControl.addLayer(infanziaLayer);
	legendControl.addLayer(
		stranieriLayer);
});
