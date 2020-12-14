/* Map of GeoJSON data from airports_origin.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [37.8, -96],
        zoom: 3
    });

    //add OSM base tilelayer
    var osm = new L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | <a href="https://www.transtats.bts.gov/Data_Elements.aspx">Bureau of Transportation Statistics</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

//Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/AirPollution.geojson", {
        dataType: "json",
        success: function(response){
          var airpollutionattributes = processAirPollutionData(response);
            //create a Leaflet GeoJSON layer and add it to the map
            // L.geoJson(response).addTo(map);
            createAirPollutionChoro(response, map, airpollutionattributes);
            createAirPollutionLegend(response, map);
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


function getColor(d) {
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
    fillColor: getColor(feature.properties.Metric_tons_of_carbon_dioxide_equivalent),
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

function createAirPollutionChoro(data,map){
  var AirPollutionChoro = L.geoJson(data, {
    style: AirPollutionStyle,
    onEachFeature: AirPollutiononEachFeature
  })

  AirPollutionChoro.addTo(map);
}

function createAirPollutionLegend(data, map) {
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10000, 100000, 500000, 2000000, 5000000, 20000000],
        labels = [];

    // loop throughdensity intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);
}



$(document).ready(createMap);
