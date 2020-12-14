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
    $.ajax("data/Fraccidents.geojson", {
        dataType: "json",
        success: function(response){
          var fraccidentsattributes = processFraccidentsData(response);
          //call function to create proportional symbols
          // createMarker(response, map, fraccidentsattributes);

            //create a Leaflet GeoJSON layer and add it to the map
            //L.geoJson(response).addTo(map);
        }
    });
};

//initial creation of attributes
function processFraccidentsData(data){
    //empty array to hold attributes
    var fraccidentsattributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    return fraccidentsattributes;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    //Determine which attribute to visualize with proportional symbols
    var attribute = "Name";

    //create marker options
    var myIcon = L.icon({
        iconUrl: 'fraccidents.png',
        shadowUrl: 'fraccidents_shadow.png',

        iconSize:     [38, 95], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    var layer = L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);//bindPopup("<p><b>City:</b> " + feature.properties.Name + "</p><p><b>");

    // marker.bindPopup("<p><b>City:</b> " + feature.properties.Name + "</p><p><b>").openPopup();

    // //create marker options
    // var options = {
    //     fillColor: "#FF2222",
    //     color: "#000",
    //     weight: 1,
    //     opacity: 1,
    //     fillOpacity: 0.8,
    // };
    //
    // create circle marker layer
    // var layer = L.circleMarker(latlng, options);
    //
     //build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.Name + "</p><p><b>";

    //bind the popup to the circle marker
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
};

// // //Add circle markers for point features to the map
// function createMarker(data, map){
//     //create a Leaflet GeoJSON layer and add it to the map
//     L.geoJson(data, {pointToLayer: pointToLayer}).addTo(map);
// };


$(document).ready(createMap);
