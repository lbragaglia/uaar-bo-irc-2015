$(document).ready(function() {
	var resize = function() {
		var $map = $('#map');

		$map.height($(window).height() - $('div.navbar').outerHeight());

		if (map) {
			map.invalidateSize();
		}
	};

	$(window).on('resize', function() {
		resize();
	});

	resize();

	var map = L.map('map').setView([44.494887, 11.342616], 13);

	var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib =
		'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	var baseLayer = new L.TileLayer(osmUrl, {
		minZoom: 8,
		maxZoom: 17,
		attribution: osmAttrib
	});
	baseLayer.addTo(map);

	var layerControl = L.control.layers({
		'OpenStreetMap': baseLayer
	}).addTo(map);

	var marker;
	var layer;

	var createLayerGroup = function(name) {
		var layerGroup = new L.LayerGroup();

		map.addLayer(layerGroup);
		layerControl.addOverlay(layerGroup, name);

		return layerGroup;
	};

	var pcOptions = {
		recordsField: null,
		latitudeField: 'lat',
		longitudeField: 'lon',
		layerOptions: {
			fillOpacity: 0.9,
			opacity: 1,
			weight: 0.5,
			radius: 10,
			width: 5,
			barThickness: 10
		},
		displayOptions: {
			'stud': {
				displayName: 'Totale studenti',
				radius: new L.LinearFunction([0, 10], [500, 30]),
			},
			'stranieri': {
				displayName: 'Stranieri',
				//barThickness: new L.LinearFunction([0, 4], [500, 30])
			}
		},
		chartOptions: {
			'non_freq': {
				color: 'hsl(0,100%,25%)',
				fillColor: 'hsl(0,70%,60%)',
				//maxValue: 500,
				//maxHeight: 20,
				displayName: 'Non freq.',
				displayText: function(value) {
					return value.toFixed();
				}
			},
			'freq': {
				color: 'hsl(240,100%,25%)',
				fillColor: 'hsl(240,70%,60%)',
				//maxValue: 500,
				//maxHeight: 20,
				displayName: 'Freq.',
				displayText: function(value) {
					return value.toFixed();
				}

			}
		},
		tooltipOptions: {
			iconSize: new L.Point(80, 55),
			iconAnchor: new L.Point(-5, 55)
		},
		onEachRecord: function(layer, record) {
			var $html = $(L.HTMLUtils.buildTable(record));

			layer.bindPopup($html.wrap('<div/>').parent().html(), {
				minWidth: 400,
				maxWidth: 400
			});
		}
	};
	var pieChartLayer = L.pieChartDataLayer(scuoleData, pcOptions);
	createLayerGroup('PieChart').addLayer(pieChartLayer);

	var minHue = 120;
	var maxHue = 0;
	var rmOptions = {
		recordsField: null,
		latitudeField: 'lat',
		longitudeField: 'lon',
		deriveProperties: function(record) {
			if (record.stud && record.non_freq) {
				record.non_freq_perc = record.non_freq / record.stud * 100
			}
			return record;
		},
		chartOptions: {
			'non_freq_perc': {
				displayName: 'Non freq. (%)',
				displayText: function(value) {
					return value.toFixed(1);
				},
				color: 'hsl(240,100%,55%)',
				fillColor: 'hsl(240,80%,55%)',
				maxValue: 100,
				minValue: 0
			}
		},
		displayOptions: {
			'non_freq_perc': {
				color: new L.HSLHueFunction(new L.Point(0, minHue), new L.Point(100,
					maxHue), {
					outputSaturation: '100%',
					outputLuminosity: '25%'
				}),
				fillColor: new L.HSLHueFunction(new L.Point(0, minHue), new L.Point(
					100, maxHue), {
					outputSaturation: '100%',
					outputLuminosity: '50%'
				})
			}
		},
		layerOptions: {
			fillOpacity: 0.9,
			opacity: 1,
			weight: 0.5,
			radius: 30,
			barThickness: 15,
			maxDegrees: 360,
			rotation: 0,
			numSegments: 10
		},
		tooltipOptions: {
			iconSize: new L.Point(80, 55),
			iconAnchor: new L.Point(-5, 55)
		},
		onEachRecord: function(layer, record) {
			var $html = $(L.HTMLUtils.buildTable(record));

			layer.bindPopup($html.wrap('<div/>').parent().html(), {
				minWidth: 400,
				maxWidth: 400
			});
		}
	};
	var radialMeterLayer = L.radialMeterMarkerDataLayer(scuoleData, rmOptions);
	createLayerGroup('RadialMeter').addLayer(radialMeterLayer);

	$('#legend').append(pieChartLayer.getLegend({
		numSegments: 20,
		width: 80,
		className: 'well',
		//gradient: true
	}));
});
