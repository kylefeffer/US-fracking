//init global so it can be used everywhere
var map;
var legend;
var selectedState = [];
var info = L.control();
var FracByState = L.layerGroup();
var AirPollution = L.layerGroup();
var Fraccidents = L.layerGroup();
var EarthquakesBaseline = L.layerGroup();
var EarthquakesCurrent = L.layerGroup();
var Economics = L.layerGroup();

function createMap() {
  var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  });

  map = L.map("map", {
    center: [40, -110],
    zoom: 4,
    zoomControl: false,
    layers: [osm, FracByState],
  });

  var zoomHome = L.Control.zoomHome({ position: "topright" });
  zoomHome.addTo(map);

  var baseLayers = [
    {
      group: "Basemaps",
      layers: [
        {
          active: true,
          name: "Open StreetMap",
          layer: osm,
        },
      ],
    },
  ];

  var overLayers = [
    {
      group: "Fracking Locations",
      layers: [
        {
          active: true,
          name: "Fracking By State",
          icon: '<i class="fas fa-oil-can"></i>',
          layer: FracByState,
        }
      ],
    },
    {
      group: "Environmental Impacts",
      layers: [
        {
          active: false,
          name: "Air Pollution",
          icon: '<i class="fas fa-smog"></i>',
          layer: AirPollution,
        },
        {
          active: false,
          name: "Fracking Accidents",
          icon: '<i class="fas fa-skull-crossbones"></i>',
          layer: Fraccidents,
        },
      ],
    },
    {
      group: "Geologic Impacts",
      layers: [
        {
          active: false,
          name: "Earthquakes - Baseline (2000)",
          icon: '<i class="fas fa-bacon"></i>',
          layer: EarthquakesBaseline,
        },
        {
          active: false,
          name: "Earthquakes - Current (2020)",
          icon: '<i class="fas fa-bacon"></i>',
          layer: EarthquakesCurrent,
        },
      ],
    },
    {
      group: "Economic Impacts",
      layers: [
        {
          active: false,
          name: "Total Employment",
          icon: '<i class="fas fa-money-bill-wave"></i>',
          layer: Economics,
        },
      ],
    },
  ];

  //add layer controls to map
  //var controlLayers = L.control.layers(baseLayer, overlay).addTo(map);
  var panelLayers = new L.Control.PanelLayers(baseLayers, overLayers, {
    compact: true,
    collapsibleGroups: true,
    position: "topleft",
    title: "Select Layer",
  });

  map.addControl(panelLayers);

  //getFracPointData(map, FracWellPoints);
  getFracStateData(map, FracByState);
  getAirPolData(map, AirPollution);
  getFraccidentData(map, Fraccidents);
  getEconStateData(map, Economics);
  getEarthquakeBaselineData(map, EarthquakesBaseline);
  getEarthquakeData(map, EarthquakesCurrent);
  getCSVdata();

  console.log((selectedState));
  /* 
  for (var prop in selectedState){
    if (selectedState.hasOwnProperty(prop)) {
      // handle prop as required
      console.log(prop);
  }
  } */

  map.on("overlayremove", function (eventLayer) {
    if (eventLayer.name == "Fracking By State") {
      // We use the key/display name to refer to the layer
      map.removeControl(legend); // legend is the variable name of the layer legend
    } else if (eventLayer.name == "Air Pollution") {
      map.removeControl(legend);
    } else if (eventLayer.name == "Total Employment") {
      map.removeControl(legend);
    }
  });

  // Adding the legend when the layer is added
  map.on("overlayadd", function (eventLayer) {
    if (eventLayer.name == "Fracking By State") {
      //console.log(eventLayer.name);
      createFracStateLegend(map);
    } else if (eventLayer.name == "Air Pollution") {
      createAirPollutionLegend(map);
    } else if (eventLayer.name == "Total Employment") {
      createEconStateLegend(map);
    }
  });
}

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
  return d > 17392
    ? "#800026"
    : d > 13860
    ? "#BD0026"
    : d > 7053
    ? "#E31A1C"
    : d > 3744
    ? "#FC4E2A"
    : d > 781
    ? "#FD8D3C"
    : d > 221
    ? "#FEB24C"
    : d > 1
    ? "#FED976"
    : "#E8E8E8";
}

function FracStatestyle(feature) {
  return {
    fillColor: getFracStateColor(feature.properties.NAME_count),
    weight: 1,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7,
  };
}

function FracStateonEachFeature(feature, layer, map) {
  layer.bindPopup(
    "<p>Number of Wells: " + feature.properties.NAME_count + "</p>"
  );

  //console.log(selectedState);

  layer.on({
    mouseover: function () {
      this.openPopup();
    },
    mouseout: function () {
      this.closePopup();
    },
    add: function () {
      layer.bringToBack();
    },
    click: populateClick
  });
}

function createFracStateChloro(data, layer) {
  var FracStateChloro = L.geoJson(data, {
    style: FracStatestyle,
    onEachFeature: FracStateonEachFeature,
  });

  FracStateChloro.addTo(layer);
}

function createFracStateLegend(map) {
  if (legend instanceof L.Control) {
    map.removeControl(legend);
  }

  legend = L.control({
    position: "bottomright",
  });

  legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "info legend"),
      grades = [0, 1, 221, 781, 3744, 7053, 13860, 17392],
      labels = [],
      from,
      to;

    for (var i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<i style="background:' +
          getFracStateColor(from + 1) +
          '"></i> ' +
          from.toLocaleString("en") +
          (to ? "&ndash;" + to.toLocaleString("en") : "+")
      );
    }

    div.innerHTML = labels.join("<br>");
    return div;
  };

  legend.addTo(map);
}

///////End Fracking State Chloropleth Layer///////

///////Begin Air Pollution Layer//////////
function getAirPolData(map) {
  //load the data
  $.ajax("data/AirPollution.geojson", {
    dataType: "json",
    success: function (response) {
      var airpollutionattributes = processAirPollutionData(response);
      //create a Leaflet GeoJSON layer and add it to the map
      // L.geoJson(response).addTo(map);
      createAirPollutionChoro(response, AirPollution);
      //createAirPollutionLegend(response, map);
    },
  });
}

//initial creation of attributes
function processAirPollutionData(data) {
  //empty array to hold attributes
  var airpollutionattributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  return airpollutionattributes;
}

function getAirPollutionColor(d) {
  return d > 20000000
    ? "#000000"
    : d > 5000000
    ? "#073146"
    : d > 2000000
    ? "#0b5174"
    : d > 500000
    ? "#1072a2"
    : d > 100000
    ? "#1592d1"
    : d > 10000
    ? "#9fcadf"
    : "#E8E8E8";
}

function AirPollutionStyle(feature) {
  return {
    fillColor: getAirPollutionColor(
      feature.properties.Metric_tons_of_carbon_dioxide_equivalent
    ),
    weight: 2,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7,
  };
}

function AirPollutiononEachFeature(feature, layer, map) {
  layer.bindPopup(
    feature.properties.State +
      "<br>" +
      feature.properties.Metric_tons_of_carbon_dioxide_equivalent +
      " metric tons of CO2 equivalent"
  );

  layer.on({
    mouseover: function () {
      this.openPopup();
    },
    mouseout: function () {
      this.closePopup();
    },
    click: populateClick
    
  });
}

function createAirPollutionChoro(data, layer) {
  var AirPollutionChoro = L.geoJson(data, {
    style: AirPollutionStyle,
    onEachFeature: AirPollutiononEachFeature,
  });

  AirPollutionChoro.addTo(layer);
}

function createAirPollutionLegend(map) {
  if (legend instanceof L.Control) {
    map.removeControl(legend);
  }

  legend = L.control({ position: "bottomright" });
  legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "info legend"),
      grades = [0, 10000, 100000, 500000, 2000000, 5000000, 20000000],
      labels = [];

    // loop throughdensity intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<i style="background:' +
          getAirPollutionColor(from + 1) +
          '"></i> ' +
          from.toLocaleString("en") +
          (to ? "&ndash;" + to.toLocaleString("en") : "+")
      );
    }

    div.innerHTML = labels.join("<br>");
    return div;
  };

  legend.addTo(map);
}
////////////////End Air Pollution Layer///////////////////

//////////////Begin Fraccident Layer /////////////////////
//Import GeoJSON data
function getFraccidentData(map) {
  //load the data
  $.ajax("data/Fraccidents.geojson", {
    dataType: "json",
    success: function (response) {
      //var fraccidentsattributes = processFraccidentsData(response);

      createMarker(response, Fraccidents);

      //create a Leaflet GeoJSON layer and add it to the map
      //L.geoJson(response).addTo(layer);
    },
  });
}

/* //initial creation of attributes
function processFraccidentsData(data){
  //empty array to hold attributes
  var fraccidentsattributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  return fraccidentsattributes;
}; */

//function to convert markers to circle markers
function FraccidentpointToLayer(feature, latlng) {
  //create marker options
  var myIcon = L.icon({
    iconUrl: "img/fraccident.png",
    iconSize: [15, 15], // size of the icon
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    popupAnchor: [0, 0], // point from which the popup should open relative to the iconAnchor
  });

  return L.marker(latlng, {
    icon: myIcon,
  });
}

function FraccidentonEachFeature(feature, layer) {
  layer._leaflet_id = feature.properties.WellName;

  var popupContent =
    "<p><b>City:</b> " + feature.properties.Name + "</p><p><b>";

  if (feature.properties && feature.properties.popupContent) {
    popupContent += feature.properties.popupContent;
  }
  layer.bindPopup(popupContent);
  //event listeners to open popup on hover and fill panel on click
  layer.on({
    mouseover: function () {
      this.openPopup();
    },
    mouseout: function () {
      this.closePopup();
    },
    click: populateClick
  });

  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
}

// // //Add circle markers for point features to the map
function createMarker(data, layer) {
  var FraccidentPoints = L.geoJson(data, {
    pointToLayer: FraccidentpointToLayer,
    onEachFeature: FraccidentonEachFeature,
  });

  FraccidentPoints.addTo(layer);
}

/////////////////End Fraccident Layer/////////////////////

//////////////Begin Earthquake - Baseline Layer /////////////////////
//Import GeoJSON data
function getEarthquakeBaselineData(map, layer) {
  //load the data
  $.ajax("data/earthquakesBaseline.geojson", {
    dataType: "json",
    success: function (response) {
      var EarthquakeBaselineattributes = processEarthquakesBaselineData(
        response
      );
      createPropSymbolsBaseline(
        response,
        map,
        EarthquakeBaselineattributes,
        layer
      );

      // //create a Leaflet GeoJSON layer and add it to the map
      // L.geoJson(response).addTo(layer);
    },
  });
}

//initial creation of attributes
function processEarthquakesBaselineData(data) {
  //empty array to hold attributes
  var EarthquakeBaselineattributes = [];

  //properties of the first feature in the dataset
  var EarthquakeBaselineproperties = data.features[0].properties;

  //push each attribute name into attributes array
  for (var magattribute in EarthquakeBaselineproperties) {
    //only take attributes with year over year values
    if (magattribute.indexOf("mag") > -1) {
      EarthquakeBaselineattributes.push(magattribute);
    }
  }

  return EarthquakeBaselineattributes;
}

//Add circle markers for point features to the map
function createPropSymbolsBaseline(
  data,
  map,
  EarthquakeBaselineattributes,
  layer
) {
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return EarthquakeBaselinepointToLayer(
        feature,
        latlng,
        EarthquakeBaselineattributes
      );
    },
  }).addTo(layer);
}

function calcPropRadius(attValue, scale = 25) {
  //scale factor to adjust symbol size evenly
  var scaleFactor = scale;
  //area based on attribute value and scale factor
  var area = Math.abs(attValue) * scaleFactor;
  //radius calculated based on area
  var radius = Math.sqrt(area / Math.PI);

  return radius;
}

//function to convert markers to circle markers
function EarthquakeBaselinepointToLayer(feature, latlng, attributes) {
  //Assign the current attribute based on the first index of the attributes array
  var attribute = attributes[0];

  var options = {
    fillColor: "red",
    color: "#ccc",
    weight: 0,
    opacity: 0,
    fillOpacity: 0.2,
  };

  //For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);

  //Give each feature's circle marker a radius based on its attribute value
  options.radius = calcPropRadius(attValue);

  //create circle marker layer
  var layer = L.circleMarker(latlng, options);

  //build popup content string
  var popupContent = "<p><b>Magnitude:</b> " + feature.properties.mag + "</p>";

  //add formatted attribute to popup content string

  //bind the popup to the circle marker
  layer.bindPopup(popupContent, {
    offset: new L.Point(0, -options.radius),
  });

  //event listeners to open popup on hover and fill panel on click
  layer.on({
    mouseover: function () {
      this.openPopup();
    },
    mouseout: function () {
      this.closePopup();
    },
    click: populateClick
  });

  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
}

/////////////////End Earthquake - Baseline Layer/////////////////////

//////////////Begin Earthquake - Current Layer /////////////////////
//Import GeoJSON data
function getEarthquakeData(map, layer) {
  //load the data
  $.ajax("data/earthquakesCurrent.geojson", {
    dataType: "json",
    success: function (response) {
      var Earthquakeattributes = processEarthquakesData(response);
      createPropSymbols(response, map, Earthquakeattributes, layer);

      // //create a Leaflet GeoJSON layer and add it to the map
      // L.geoJson(response).addTo(layer);
    },
  });
}

//initial creation of attributes
function processEarthquakesData(data) {
  //empty array to hold attributes
  var Earthquakeattributes = [];

  //properties of the first feature in the dataset
  var Earthquakeproperties = data.features[0].properties;

  //push each attribute name into attributes array
  for (var magattribute in Earthquakeproperties) {
    //only take attributes with year over year values
    if (magattribute.indexOf("mag") > -1) {
      Earthquakeattributes.push(magattribute);
    }
  }

  return Earthquakeattributes;
}

//Add circle markers for point features to the map
function createPropSymbols(data, map, Earthquakeattributes, layer) {
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return EarthquakepointToLayer(feature, latlng, Earthquakeattributes);
    },
  }).addTo(layer);
}

function calcPropRadius(attValue, scale = 50) {
  //scale factor to adjust symbol size evenly
  var scaleFactor = scale;
  //area based on attribute value and scale factor
  var area = Math.abs(attValue) * scaleFactor;
  //radius calculated based on area
  var radius = Math.sqrt(area / Math.PI);

  return radius;
}

//function to convert markers to circle markers
function EarthquakepointToLayer(feature, latlng, attributes) {
  //Assign the current attribute based on the first index of the attributes array
  var attribute = attributes[0];

  var options = {
    fillColor: "green",
    color: "#ccc",
    weight: 0,
    opacity: 0,
    fillOpacity: 0.2,
  };

  //For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);

  //Give each feature's circle marker a radius based on its attribute value
  options.radius = calcPropRadius(attValue);

  //create circle marker layer
  var layer = L.circleMarker(latlng, options);

  //build popup content string
  var popupContent = "<p><b>Magnitude:</b> " + feature.properties.mag + "</p>";

  //add formatted attribute to popup content string

  //bind the popup to the circle marker
  layer.bindPopup(popupContent, {
    offset: new L.Point(0, -options.radius),
  });

  //event listeners to open popup on hover and fill panel on click
  layer.on({
    mouseover: function () {
      this.openPopup();
    },
    mouseout: function () {
      this.closePopup();
    },
    click: populateClick
  });

  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
}

/////////////////End Earthquake - Current Layer/////////////////////

///////Begin Economics State Chloropleth Layer///////
function getEconStateData(map) {
  $.ajax("data/Economics.geojson", {
    dataType: "json",
    success: function (response) {
      //create attribute array
      var EconStateattributes = processEconStateData(response);
      //console.log(EconStateattributes)
      //function to create chloropleth
      createEconStateChloro(response, Economics);
    },
  });
}

function processEconStateData(data) {
  //empty array for attributes
  var EconStateattributes = [];

  //take properties of first feature
  var properties = data.features[0].properties;

  //push each attribute name to array
  for (var attribute in properties) {
    if (attribute.indexOf("economics_tot_emp") > -1) {
      EconStateattributes.push(attribute);
    }
  }

  return EconStateattributes;
}

///Natural Breaks Distribution///
function getEconStateColor(d) {
  return d > 16400
    ? "#005a32"
    : d > 6300
    ? "#238443"
    : d > 3520
    ? "#41ab5d"
    : d > 2460
    ? "#78c679"
    : d > 1190
    ? "#addd8e"
    : d > 510
    ? "#d9f0a3"
    : d > 0
    ? "#ffffcc"
    : "#E8E8E8";
}

function EconStatestyle(feature) {
  return {
    fillColor: getEconStateColor(feature.properties.economics_tot_emp),
    weight: 1,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7,
  };
}

function EconStateonEachFeature(feature, layer, map) {
  layer.bindPopup(
    "<p>Number of Employees: " + feature.properties.economics_tot_emp + "</p>"
  );

  layer.on({
    mouseover: function () {
      this.openPopup();
    },
    mouseout: function () {
      this.closePopup();
    },
    add: function () {
      layer.bringToBack();
    },
    click: populateClick
  });
}

function createEconStateChloro(data, layer) {
  var EconStateChloro = L.geoJson(data, {
    style: EconStatestyle,
    onEachFeature: EconStateonEachFeature,
  });

  EconStateChloro.addTo(layer);
}

function createEconStateLegend(map) {
  if (legend instanceof L.Control) {
    map.removeControl(legend);
  };

  legend = L.control({
    position: "bottomright",
  });

  legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "info legend"),
      grades = [0, 510, 1190, 2460, 3520, 6300, 16400, 75830],
      labels = [],
      from,
      to;

    for (var i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<i style="background:' +
          getEconStateColor(from + 1) +
          '"></i> ' +
          from.toLocaleString("en") +
          (to ? "&ndash;" + to.toLocaleString("en") : "+")
      );
    }

    div.innerHTML = labels.join("<br>");
    return div;
  };

  legend.addTo(map);
}

///////End Fracking State Chloropleth Layer///////

//////////////Get CSV table data/////////////////////

function getCSVdata() {
  $.ajax({
    url: "data/StateStatistics.csv",
    dataType: "text",
    success: function (data) {
      var stateStats = parseCSV(data);
      
      for (var i = 0; i < stateStats.length; i++) {
        selectedState.push(stateStats[i]);
      }

      //send to tab for table?//
      /*  var state_data = data.split(/\r?\n|\r/);
    var table_data = '<table class="table table-bordered table-striped">';
    for(var count = 0; count<state_data.length; count++)
    {
      var cell_data = state_data[count].split(",");
      table_data += '<tr>';
      for(var cell_count=0; cell_count<cell_data.length; cell_count++)
      {
        if(count === 0)
        {
        table_data += '<th>'+cell_data[cell_count]+'</th>';
        }
        else
        {
        table_data += '<td>'+cell_data[cell_count]+'</td>';
        }
      }
    table_data += '</tr>';
    }
    table_data += '</table>';
    $('#externaldiv').html(table_data); */
    },
  });
}

function parseCSV(str, opts = { headers: true }) {
  var arr = [];
  var quote = false; // true means we're inside a quoted field
  var col, c;

  // iterate over each character, keep track of current row and column (of the returned array)
  for (var row = (col = c = 0); c < str.length; c++) {
    var cc = str[c],
      nc = str[c + 1]; // current character, next character
    arr[row] = arr[row] || []; // create a new row if necessary
    arr[row][col] = arr[row][col] || ""; // create a new column (start with empty string) if necessary

    // If the current character is a quotation mark, and we're inside a
    // quoted field, and the next character is also a quotation mark,
    // add a quotation mark to the current column and skip the next character
    if (cc == '"' && quote && nc == '"') {
      arr[row][col] += cc;
      ++c;
      continue;
    }

    // If it's just one quotation mark, begin/end quoted field
    if (cc == '"') {
      quote = !quote;
      continue;
    }

    // If it's a comma and we're not in a quoted field, move on to the next column
    if (cc == "," && !quote) {
      ++col;
      continue;
    }

    // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
    // and move on to the next row and move to column 0 of that new row
    if (cc == "\r" && nc == "\n" && !quote) {
      ++row;
      col = 0;
      ++c;
      continue;
    }

    // If it's a newline (LF or CR) and we're not in a quoted field,
    // move on to the next row and move to column 0 of that new row
    if (cc == "\n" && !quote) {
      ++row;
      col = 0;
      continue;
    }
    if (cc == "\r" && !quote) {
      ++row;
      col = 0;
      continue;
    }

    // Otherwise, append the current character to the current column
    arr[row][col] += cc;
  }

  if (opts.headers) {
    let header = arr[0];
    let rest = arr.slice(1);
    return rest.map((r) => {
      return r.reduce((acc, v, i) => {
        let key = header[i];
        acc[key] = v;
        return acc;
      }, {});
    });
  } else {
    return arr;
  }
}
/////////////////////End CSV Layer/////////////////////////

////////////////////Populate click on data layers//////////////////////
function populateClick(e){
  document.getElementById("externaldiv").innerHTML = "";
  for (var i = 0; i < selectedState.length; i++) {
    if (selectedState[i].State === e.target.feature.properties.NAME) {
      //console.log(selectedState[i]);
      for (var key in selectedState[i]) {
        document.getElementById("externaldiv").innerHTML += '<b>' + key + '</b>' + ": " + selectedState[i][key].replace(/\d+/, n => parseFloat(n).toLocaleString("en")) + "<br>";
        //console.log(key, selectedState[i][key]);
      }
      break;
    }
  }
}



//////////////////////////End populate click////////////////////////////////////////

//calls function to create map
$(document).ready(createMap);
