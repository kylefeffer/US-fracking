//init global so it can be used everywhere
var map;
var legend;
var FracByState = L.layerGroup();
var FracWellPoints = L.layerGroup();

function createMap() {
  var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  });

  
  map = L.map("mapdiv", {
    center: [40, -110],
    zoom: 4,
    zoomControl: false,
    layers: [osm, FracByState]
  });

  var zoomHome = L.Control.zoomHome({ position: "topright" });
  zoomHome.addTo(map);

  var baseLayer = {
    'Open StreetMap': osm
  };

  var overlay = {
    'Fracking By State': FracByState,
    'Fracking Well Points': FracWellPoints
  };

  getFracPointData(map, FracWellPoints);
  getFracStateData(map, FracByState);
  
  //add layer controls to map
  var controlLayers = L.control.layers(baseLayer, overlay).addTo(map);

  map.on('overlayremove', function(eventLayer){
    if (eventLayer.name == 'Fracking By State'){ // We use the key/display name to refer to the layer
      map.removeControl(legend); // legend is the variable name of the layer legend
    }
  });

  // Adding the legend when the layer is added
  map.on('overlayadd', function(eventLayer){
    if (eventLayer.name == 'Fracking By State'){
      //console.log(eventLayer.name);
      createFracStateLegend(map);
    }
  });
}

///////Fracking Point Location layer//////////
function getFracPointData(map) {
  $.ajax("data/FracFocusPoints.geojson", {
    dataType: "json",
    success: function (response) {
      //create attribute array
      //var attributes = processWellData(response);
      createMarkers(response, FracWellPoints);
    },
  });
}

function processWellData(data) {
  //empty array for attributes
  var attributes = [];

  //take properties of first feature
  var properties = data.features[0].properties;

  //push each attribute name to array
  for (var attributes in properties) {
    if (attributes.indexOf("NAME") > -1) {
      attributes.push(attributes);
    }
  }

  return attributes;
}

function createMarkers(data, layer) {
  //create layer and add to map
  var markers = L.markerClusterGroup();

  var FracFocusPoints = L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 6,
        opacity: 0.5,
        color: "#000",
        fillOpacity: 0.8,
      });
    },

    onEachFeature: function (feature, layer) {
      layer._leaflet_id = feature.properties.WellName;

      var popupContent = "<p>Well Name: <b>" + feature.properties.WellName;

      if (feature.properties && feature.properties.popupContent) {
        popupContent += feature.properties.popupContent;
      }
      layer.bindPopup(popupContent);
    },
  });

  markers.addLayer(FracFocusPoints);
  markers.addTo(layer);
}
///////End Fracking Point Location layer//////////

///////Begin Fracking State Chloropleth Layer///////
function getFracStateData(map) {
  $.ajax("data/frackingwells.geojson", {
    dataType: "json",
    success: function (response) {
      //create attribute array
      var FracStateattributes = processFracStateData(response);

      //function to create chloropleth
      createFracStateChloro(response, FracByState);
      createFracStateLegend(map);
    },
  });
}

function processFracStateData(data) {
  //empty array for attributes
  var FracStateattributes = [];

  //take properties of first feature
  var properties = data.features[0].properties;

  //push each attribute name to array
  for (var attribute in properties) {
    if (attribute.indexOf("NAME_count") > -1) {
      FracStateattributes.push(attribute);
    }
  }

  return FracStateattributes;
}

///Natural Breaks Distribution///
function getColor(d) {
  return  d > 17392 ? "#800026": 
          d > 13860 ? "#BD0026":
          d > 7053 ? "#E31A1C":
          d > 3744 ? "#FC4E2A": 
          d > 781  ? "#FD8D3C": 
          d > 221  ? "#FEB24C": 
          d > 1  ? "#FED976": 
                    "#FFEDA0";
}

function FracStatestyle(feature) {
  return {
      fillColor: getColor(feature.properties.NAME_count),
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
  };
}

function FracStateonEachFeature(feature, layer, map) {
  layer.bindPopup("<p>Number of Wells: " + feature.properties.NAME_count + "</p>");

  layer.on({
    mouseover: function(){
      this.openPopup();
    },
    mouseout: function(){
      this.closePopup();
    },
    'add': function () {
      layer.bringToBack()
    }
  });
}

function createFracStateChloro(data, layer) {
  var FracStateChloro = L.geoJson(data, {
    style: FracStatestyle,
    onEachFeature: FracStateonEachFeature
  })

  FracStateChloro.addTo(layer);
}

function createFracStateLegend(map) {
  legend = L.control({
    position: 'bottomright'
  });

  legend.onAdd = function(map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 221, 781, 3744, 7053, 13860, 17392],
        labels = [],
        from, to;

    for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
            '<i style="background:' + getColor(from + 1) + '"></i> ' +
            from + (to ? '&ndash;' + to : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(map);
}

///////End Fracking State Chloropleth Layer///////

//calls function to create map
$(document).ready(createMap);


