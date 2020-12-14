//init global so it can be used everywhere
var map;
var legend;
var FracByState = L.layerGroup();
var FracWellPoints = L.layerGroup();
var AirPollution = L.layerGroup();
var Fraccidents = L.layerGroup();

function createMap() {
  var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  });

  
  map = L.map("map", {
    center: [40, -110],
    zoom: 4,
    zoomControl: false,
    layers: [osm, FracByState]
  });

  var zoomHome = L.Control.zoomHome({ position: "topright" });
  zoomHome.addTo(map);

  var baseLayers = [
    {
      group: "Basemaps",
      layers: [
        {
          active: true,
          name: 'Open StreetMap',
          layer: osm
        }
      ]
    }
  ];

  var overLayers = [
    {
      group: "Fracking Locations",
      layers: [
        {
          active: true,
          name: 'Fracking By State',
          icon: '<i class="fa-globe" aria-hidden="true"></i>',
          layer: FracByState
        },
        {
          name: 'Fracking Well Points',
          icon: '<i class="icon icon-water"></i>',
          layer: FracWellPoints
        }
      ]
    },
    {
      group: "Environmental Impacts",
      layers: [
        {
          active: false,
          name: 'Air Pollution',
          icon: '<i class="fa-globe" aria-hidden="true"></i>',
          layer: AirPollution
        },
        {
          active: false,
          name: 'Fracking Accidents',
          icon: '<i class="fa-globe" aria-hidden="true"></i>',
          layer: Fraccidents
        }
      ]
    }
  ];

  //add layer controls to map
  //var controlLayers = L.control.layers(baseLayer, overlay).addTo(map);
  var panelLayers = new L.Control.PanelLayers(baseLayers, overLayers, {
    compact: true,
    collapsibleGroups: true,
    position: 'topleft',
    title: "Select Layer"
  });

  map.addControl(panelLayers);


  //getFracPointData(map, FracWellPoints);
  getFracStateData(map, FracByState);
  getAirPolData(map, AirPollution);
  getFraccidentData(map, Fraccidents);

  map.on('overlayremove', function(eventLayer){
    if (eventLayer.name == 'Fracking By State'){ // We use the key/display name to refer to the layer
      map.removeControl(legend); // legend is the variable name of the layer legend
    }
    else if (eventLayer.name == 'Air Pollution'){
      map.removeControl(legend);
    }
  });

  // Adding the legend when the layer is added
  map.on('overlayadd', function(eventLayer){
    if (eventLayer.name == 'Fracking By State'){
      //console.log(eventLayer.name);
      createFracStateLegend(map);
    }
    else if (eventLayer.name == 'Air Pollution'){
      createAirPollutionLegend(map);
    }
  });
}

///////Fracking Point Location layer//////////
function getFracPointData(map, layer) {
  $.ajax("data/FracFocusPoints.geojson", {
    dataType: "json",
    success: function (response) {
      //create attribute array
      //var attributes = processWellData(response);
      createWellMarkers(response, FracWellPoints);
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

function createWellMarkers(data, layer) {
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
function getFracStateColor(d) {
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
      fillColor: getFracStateColor(feature.properties.NAME_count),
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
            '<i style="background:' + getFracStateColor(from + 1) + '"></i> ' +
            from + (to ? '&ndash;' + to : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(map);
}

///////End Fracking State Chloropleth Layer///////

///////Begin Air Pollution Layer//////////
function getAirPolData(map){
  //load the data
  $.ajax("data/AirPollution.geojson", {
      dataType: "json",
      success: function(response){
        var airpollutionattributes = processAirPollutionData(response);
          //create a Leaflet GeoJSON layer and add it to the map
          // L.geoJson(response).addTo(map);
          createAirPollutionChoro(response, AirPollution);
          //createAirPollutionLegend(response, map);
      }
  });
};


//initial creation of attributes
function processAirPollutionData(data){
  //empty array to hold attributes
  var airpollutionattributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  return airpollutionattributes;
};


function getAirPollutionColor(d) {
  return d > 20000000 ? '#000000' :
         d > 5000000  ? '#073146' :
         d > 2000000  ? '#0b5174' :
         d > 500000   ? '#1072a2' :
         d > 100000   ? '#1592d1' :
         d > 10000   ? '#9fcadf' :
                    '#E8E8E8';
}

function AirPollutionStyle(feature){
return {
  fillColor: getAirPollutionColor(feature.properties.Metric_tons_of_carbon_dioxide_equivalent),
  weight: 2,
  opacity: 1,
  color: 'white',
  fillOpacity: 0.7
};
}


function AirPollutiononEachFeature(feature, layer, map){
layer.bindPopup(feature.properties.State + "<br>" + feature.properties.Metric_tons_of_carbon_dioxide_equivalent + " metric tons of CO2 equivalent");


layer.on({
    mouseover: function(){
        this.openPopup();
    },
    mouseout: function(){
        this.closePopup();
    },
    click: function(){
        $("#info-panel").html(popupContent);
    }
});
}

function createAirPollutionChoro(data, layer){
var AirPollutionChoro = L.geoJson(data, {
  style: AirPollutionStyle,
  onEachFeature: AirPollutiononEachFeature
})

AirPollutionChoro.addTo(layer);
}

function createAirPollutionLegend(map) {
legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend'),
      grades = [0, 10000, 100000, 500000, 2000000, 5000000, 20000000],
      labels = [];

  // loop throughdensity intervals and generate a label with a colored square for each interval
  for (var i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];

    labels.push(
        '<i style="background:' + getAirPollutionColor(from + 1) + '"></i> ' +
        from + (to ? '&ndash;' + to : '+'));
  }

  div.innerHTML = labels.join('<br>');
  return div;
};

legend.addTo(map);
}
////////////////End Air Pollution Layer///////////////////

//////////////Begin Fraccident Layer /////////////////////
//Import GeoJSON data
function getFraccidentData(map){
  //load the data
  $.ajax("data/Fraccidents.geojson", {
      dataType: "json",
      success: function(response){
        //var fraccidentsattributes = processFraccidentsData(response);
        
        createMarker(response, Fraccidents);

          //create a Leaflet GeoJSON layer and add it to the map
          //L.geoJson(response).addTo(layer);
      }
  });
};

/* //initial creation of attributes
function processFraccidentsData(data){
  //empty array to hold attributes
  var fraccidentsattributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  return fraccidentsattributes;
}; */

//function to convert markers to circle markers
function FraccidentpointToLayer(feature, latlng){
  //create marker options
  var myIcon = L.icon({
      iconUrl: 'img/fraccidents.png',
      shadowUrl: 'img/fraccidents_shadow.png',

      iconSize:     [38, 60], // size of the icon
      shadowSize:   [50, 64], // size of the shadow
      iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
      shadowAnchor: [4, 62],  // the same for the shadow
      popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  return L.marker(latlng, {
    icon: myIcon
  });
};

function FraccidentonEachFeature (feature, layer) {
  layer._leaflet_id = feature.properties.WellName;

      var popupContent = "<p><b>City:</b> " + feature.properties.Name + "</p><p><b>";

      if (feature.properties && feature.properties.popupContent) {
        popupContent += feature.properties.popupContent;
      }
      layer.bindPopup(popupContent);
   //event listeners to open popup on hover and fill panel on click
   layer.on({
    mouseover: function(){
        this.openPopup();
    },
    mouseout: function(){
        this.closePopup();
    },
    click: function(){
        $("#info-panel").html(popupContent);
    }
});

//return the circle marker to the L.geoJson pointToLayer option
return layer;
}
  

// // //Add circle markers for point features to the map
function createMarker(data, layer){
  var FraccidentPoints = L.geoJson(data, {
    pointToLayer: FraccidentpointToLayer,
    onEachFeature: FraccidentonEachFeature
  });

  FraccidentPoints.addTo(layer);
}

/////////////////End Fraccident Layer/////////////////////



//calls function to create map
$(document).ready(createMap);


