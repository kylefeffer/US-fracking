
//wrap everything in a self-executing anonymous function to move to local scope
$(document).ready(function () {
 
  var map = L.map('mapdiv', {
    center: [39.73, -104.99],
    zoom: 4
    //layers: [osm, FracFocusPoints]
  });

  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

  // var baseMaps = {
  //   "Open StreetMap": osm
  // };
  
  // var overlayMaps = {
  //   "Fracking_Locations": FracFocusPoints,
  // };
  
  //L.control.layers(baseMaps).addTo(map);

var markers = L.markerClusterGroup();

//function getData(map){
  $.getJSON("data/FracFocusPoints.geojson", function (data){			
    //fracking point layer
      var FracFocusPoints = L.geoJson(data, {
        pointToLayer: function(feature,latlng) {
          return L.circleMarker(latlng, {
            radius:6,
            opacity: .5,
            color: "#000",
            fillOpacity: 0.8
          });
        },

        onEachFeature: function(feature,layer) {
          layer._leaflet_id = feature.properties.WellName;

          var popupContent = "<p>Well Name: <b>" + feature.properties.WellName;
          
          if (feature.properties && feature.properties.popupContent) {
            popupContent += feature.properties.popupContent;
          }
            layer.bindPopup(popupContent);
        }
      });
      markers.addLayer(FracFocusPoints);
      map.addLayer(markers);
    });
    

//end fracking points layer

//layer control//



});
//last line of main.js - self-executing anonymous function