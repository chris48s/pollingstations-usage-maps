/*
OSThematic

A javascript library which helps you to create
simple but beautiful thematic maps
of continuous univariate data
using the Ordnance Survey OpenSpace API

Author: Christopher Shaw
*/


"use strict";

function OSThematic(map) {
	if (!(map instanceof OpenSpace.Map)) {
		//map must be an OpenSpace map
		throw "Map is not an instance of OpenSpace.Map";
	} else {
		this.osMap         = map;
		this.data          = [];
		this.colours       = [];
		this.opacity       = 0.8;
		this.noDataColour  = 'black';
		this.noDataOpacity = 0.1;
		this.borderColour  = 'black';
		this.layers        = [];
		this.boundaryLayer = {};
	}
}

OSThematic.prototype = (function() {
	
	//private functions
	
	//check for error conditions
	var validate = function(obj) {
		
		//prevent divide by 0 error
		if (obj.colours.length === 0) {
			return false;
		}
		
		//must have at least as many distinct data points as colours to produce sensible output
		var distinct_values = obj.data.map(function(object) { return object.value; });
		distinct_values = distinct_values.filter(function(v,i) { return distinct_values.indexOf(v) === i; });
		if (distinct_values.length < obj.colours.length) {
			return false;
		}
		
		return true;
	};
	
	//assign each value in data array a rank
	var rankData = function(data) {
		var sorted = data.slice().sort( function(a,b) { return b.value-a.value; } );
		for (var i=0; i<data.length; i++) {
			for (var j=0; j<sorted.length; j++) {
				if (data[i].value === sorted[j].value) {
					data[i].rank = j+1;
					break;
				}
			}
		}
	};
	
	//build context function
	var createContext = function(data) {
		
		var context = function(feature) {
			var value = {"VALUE" : undefined, "RANK" : undefined};
			for (var i=0; i<data.length; i++) {
				if (data[i].ons_code === feature.attributes["CENSUS_CODE"]) {
					value = {"VALUE" : data[i].value, "RANK" : data[i].rank};
				}
			}
			return value;
		};
		
		return context;
	};
	
	//generate OpenLayers rules based on colours and ranks
	var generateStyles = function(obj, context) {
		var style = new OpenLayers.Style();
		var rules = [];
		
		//band the data into n-tiles where n=obj.colours.length
		//and create styling rules for each n-tile
		var interval = obj.data.length/obj.colours.length;
		for (var i=0; i<obj.colours.length; i++) {
			
			rules.push(
				new OpenLayers.Rule({
					context: context,
					filter: new OpenLayers.Filter.Comparison({
						type: OpenLayers.Filter.Comparison.BETWEEN,
						property: "RANK",
						lowerBoundary: Math.round((interval*i)+1),
						upperBoundary: Math.round(interval*(i+1))
					}),
					symbolizer: {fillColor: obj.colours[i], fillOpacity: obj.opacity, strokeColor: obj.borderColour}
				})
			);
			
		}
		
		//no data rule
		rules.push(
			new OpenLayers.Rule({
				context: context,
				filter: new OpenLayers.Filter.Comparison({
					type: OpenLayers.Filter.Comparison.EQUAL_TO,
					property: "VALUE",
					value: undefined}),
				symbolizer: {fillColor: obj.noDataColour, fillOpacity: obj.noDataOpacity, strokeColor: obj.borderColour}
			})
		);
		
		style.addRules(rules);
		
		return style;
	};
	
	
	//public interface
	return {
		
		constructor: OSThematic,
		
		//setters
		setData: function(data) {
			this.data = data;
		},
		setColours: function(colours) {
			this.colours = colours;
		},
		setOpacity: function(opacity) {
			this.opacity = opacity;
		},
		setNoDataColour: function(colour) {
			this.noDataColour = colour;
		},
		setNoDataOpacity: function(opacity) {
			this.noDataOpacity = opacity;
		},
		setBorderColour: function(colour) {
			this.borderColour = colour;
		},
		setLayers: function(layers) {
			this.layers = layers;
		},
		
		drawMap: function() {
			
			//remove boundary layer
			try {
				this.osMap.removeLayer(this.boundaryLayer);
			} catch (e) {
				//no boundary layer to remove
			}
			
			if (validate(this)) {
				
				rankData(this.data);
				
				//create the boundary layer
				var context = createContext(this.data);
				var styles = generateStyles(this, context);
				var styleMap = new OpenLayers.StyleMap(styles);
				this.boundaryLayer = new OpenSpace.Layer.Boundary("Boundaries", {
					strategies: [new OpenSpace.Strategy.BBOX()],
					area_code: this.layers,
					styleMap: styleMap });
				
				//add the boundary layer
				this.osMap.addLayer(this.boundaryLayer);
				
				//refresh the map to see changes
				this.boundaryLayer.refresh();
				
			} else {
				//throw an exception if we can't draw a sensible map using the supplied params
				throw "Must have 1 or more colours and at least as many distinct data values as colours to draw map.";
			}
		}
		
	};
})();