// wrap it all in an anonymous function
(function(){
// list attributes in an array for data join / for the dropdown
  var attrArray = ["Property_Damage", "Crop_Damage", "Deaths", "Injuries"];
  // set up initial attribute
  var expressed = attrArray[0];
  // dimensions of the bar graph = a function of window width
  var chartWidth = window.innerWidth * 0.35,
      chartHeight = 350,
      leftPadding = 55,
      rightPadding = 10,
      topBottomPadding = 5,
      chartInnerWidth = chartWidth - leftPadding - rightPadding
      chartInnerHeight = chartHeight - topBottomPadding * 1,
      translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  // yScale for chart, give the axis a domain
  var yScale = d3.scaleLinear()
      .range([300, 0])
      .domain([0, 50000000]);

  // when window loads, initiate map
  window.onload = setMap();

// set up choropleth map
	function setMap() {

		//map frame dimensions
		var width = window.innerWidth * .8,
			height = 750;

		// create new svg container for the map
		var map = d3.select("body")
			.append("svg")
			.attr("class", "map")
			.attr("width", width)
			.attr("height", height);

		// create geoconicconformal conic projection centered on US
		var projection = d3.geoAlbersUsa()
			.scale(1500)
			.translate([width / 2, height / 2]);

		// create path generator
		var path = d3.geoPath()
			.projection(projection);

      // load in the data
  d3.queue()
    .defer(d3.csv, "data/StormEvents.csv")
    .defer(d3.json, "data/cb_2018_us_county_5m.topojson")
    .await(callback);

// set up callback function with 3
  function callback(error, csvData, counties){

    // place graticule on the map
    setGraticule(map, path);

    // translate TopoJSON using the topojson.feature() method
    var eventCounties = topojson.feature(counties, counties.objects.cb_2018_us_county_5m).features;

    // join csv data to Geojson enumerration units
    eventCounties = joinData(eventCounties, csvData);

    // add color scale
    var colorScale = makeColorScale(csvData);
    // add enumeration units to the map
    setEnumerationUnits(eventCounties, map, path, colorScale);
    // add the chart to the map
    setChart(csvData, colorScale);
    // add the dropdown
    createDropdown(csvData);
    };
};// end of setMap

// create a colorbrewer scale for the choropleth
function makeColorScale(data){
    var colorClasses = [
        "#f5cba7",
        "#dc7633",
        "#d35400",
        "#a04000",
        "#6e2c00"
    ];

    // create color scale generator
		var colorScale = d3.scaleThreshold()
			.range(colorClasses);

		// build array of all values of the expressed attribute
		var domainArray = [];
		for (var i=0; i < data.length; i++){
			var val = parseFloat(data[i][expressed]);
			domainArray.push(val);
		};

		// cluster data using ckmeans clustering algorith to create natural breaks
		var clusters = ss.ckmeans(domainArray, 5);
		// reset domain array to cluster minimums
		domainArray = clusters.map(function (d) {
			return d3.min(d);
		});

		// remove first value from domain array to create class breakpoints
		domainArray.shift();

		//assign array of last 4 cluster minimums as domain
		colorScale.domain(domainArray);

		return colorScale;
	};

  function setGraticule(map, path) {
  //create graticule generator
    var graticule = d3.geoGraticule()
      .step([15, 15]); //place graticule lines every 5 degrees of longitude and latitude

    //create graticule background
    var gratBackground = map.append("path")
      .datum(graticule.outline())   // bind graticule background
      .attr("class", "gratBackground")  //assign class for styling
      .attr("d", path) //project graticule

    //create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
      .data(graticule.lines()) //bind graticule lines to each element to be created
      .enter() //create an element for each datum
      .append("path") //append each element to the svg as a path element
      .attr("class", "gratLines") //assign class for styling
      .attr("d", path); //project graticule lines

};

//function to join our data since we brought csv/topo in separately
function joinData(eventCounties, csvData) {
    //loop through csv to assign attribute values to the counties
    for (var i=0; i<csvData.length; i++){
        //variable for the current county in topo
        var csvCounty = csvData[i];
        //variable for the csv primary key
        var csvKey = csvCounty.GEOID;
        //loop through geojson regions to find correct region
        for (var a=0; a<eventCounties.length; a++){
            //the current county geojson properties
            var geojsonProps = eventCounties[a].properties;
            //the geojson primary key
            var geojsonKey = geojsonProps.GEOID;
            //if primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){
                //assign all attributes and values
                attrArray.forEach(function(attr){
                  //get csv attribute value, take it in as a string and return as a float
                  var val = parseFloat(csvCounty[attr]);
                  //assign the attribute and its value to geojson properties
                  geojsonProps[attr] = val;

      						console.log(geojsonProps[attr]);
                });
            };
        };
    };


    console.log(csvData);
    console.log(eventCounties);

    return eventCounties;
  };

  // function to set the enumeration units in the map
  function setEnumerationUnits(eventCounties, map, path, colorScale) {
    // variable counties, styled in style.css
    var counties = map.selectAll(".counties")
        .data(eventCounties)
        .enter()
        .append("path")
        .attr("class", function(d) {
            return "counties " + d.properties.Location;
        })
        .attr("d", path)
        // fill the counties with the choropleth colorScale
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        // when the mouse goes over an enumeration unit, call highlight function
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        // when the mouse leaves an emumeration unit, clal the dehighlight function
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        // when the mouse moves over enumeration units, call moveLabel function
        .on("mousemove", moveLabel);

// set up a variable for the dehighlight function -- what the style will return to on mouseout
    var desc = counties.append("desc")
        .text('{"stroke": "#faf0e6", "stroke-width": "0.5"}');

};


// function to test for data value and return color
function choropleth(props, colorScale){
    // make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    // if attribute value exists, assign a color; otherwise assign gray
    if (val && val != NaN){
        return colorScale(val);
    } else {
        return "#CCC";
  };
};


function createDropdown(csvData){
    // add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    // add initial option for the dropdown
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Classification");

    //a dd attribute name options using attrArray
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
  };

  function changeAttribute(attribute, csvData){
    // change the expressed attribute
    expressed = attribute;

    console.log(expressed);
		console.log(csvData);

    // recreate the color scale
    var colorScale = makeColorScale(csvData);

    // recolor enumeration units
    var counties = d3.selectAll(".counties")
        .transition()
        // almost a second of delay for smooth loading of the counties when changing attribute
        .duration(900)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    var bars = d3.selectAll(".bar")
        // re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition()
        .delay(function(d, i) {
            return i * 20
        })
        // 450 millisecond delay for smooth loading
        .duration(450);

    updateChart(bars, csvData.length, colorScale);
  };
  // function to update the chart as the attribute changes
  function updateChart(bars, n, colorScale) {
    bars.attr("x", function(d, i){
        return i * (chartInnerWidth / n) + leftPadding;
    })
    .attr("height", function(d, i){
		    console.log(d[expressed]);
        return 463 - yScale(parseFloat(d[expressed]));
    })
    .attr("y", function(d, i){
        return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
    .style("fill", function(d){
        return choropleth(d, colorScale);
    })

    var chartTitle = d3.select(".chartTitle")
    .text("Storm Event " + '"' + expressed + '"', '{"font-color": "black"}');
  };



// function to create coordinated bar chart
	function setChart(csvData, colorScale){
		//create a second svg element to hold the bar chart
		var chart = d3.select("body")
			.append("svg")
			.attr("width", chartWidth)
			.attr("height", chartHeight)
			.attr("class", "chart");

		// create a rectangle for chart background fill
		var chartBackground = chart.append("rect")
			.attr("class", "chartBackground")
			.attr("width", chartInnerWidth)
			.attr("height", chartInnerHeight)
			.attr("transform", translate);



    // sets bars for each location
    var bars = chart.selectAll(".bar")
      .data(csvData)
      .enter()
      .append("rect")
      .sort(function(a, b){
          return b[expressed]-a[expressed]
      })
      .attr("class", function(d){
          return "bar " + d.NAME;
      })

      .attr("width", chartInnerWidth / csvData.length - 1)

      .attr("x", function(d, i){
          return i * (chartInnerWidth / csvData.length) + leftPadding;
      })
      .attr("height", function(d, i){
          return 460 - yScale(parseFloat(d[expressed]));
      })
      .attr("y", function(d, i){
          return yScale(parseFloat(d[expressed])) + topBottomPadding;
      })
      .style("fill", function(d){
          return choropleth(d, colorScale);
      })
      .on("mouseover", highlight)
      .on("mouseout", dehighlight)
      .on("mousemove", moveLabel);

    //add style descriptor to each rect
    var desc = bars.append("desc")
      .text('{"stroke": "none", "stroke-width": "0px"}');

    //creates a text element for the chart title
    var chartTitle = chart.append("text")
      .attr("x", 250)
      .attr("y", 25)
      .attr("class", "chartTitle")
      .attr("text-anchor", "middle")


		//create vertical axis generator
		var yAxis = d3.axisLeft()
			.scale(yScale);

		//place axis
		var axis = chart.append("g")
			.attr("class", "axis")
			.attr("transform", translate)
			.call(yAxis);

		//create frame for chart border
		var chartFrame = chart.append("rect")
			.attr("class", "chartFrame")
			.attr("width", chartInnerWidth)
			.attr("height", chartInnerHeight)
			.attr("transform", translate);

		var desc = bars.append("desc")
			.text('{"stroke": "none", "stroke-width": "0px"}');



    updateChart(bars, csvData.length, colorScale);
};



  //function to highlight enumeration units and bars on mouseover
function highlight(props){
    //change stroke on mouseover
    var selected = d3.selectAll("." + props.State)
      .style("stroke", "blue")
      .style("stroke-width", "2");

    setLabel(props);
  };

  function dehighlight(props) {
    var selected = d3.selectAll("." + props.State)
      .style("stroke", function () {
        return getStyle(this, "stroke")
      })
      .style("stroke-width", function () {
        return getStyle(this, "stroke-width")
      });

    function getStyle(element, styleName) {
      var styleText = d3.select(element)
        .select("desc")
        .text();

      var styleObject = JSON.parse(styleText);

      return styleObject[styleName];
    };

    d3.select(".infolabel")
      .remove();
  };

  function setLabel(props) {
    //label content
    var labelAttribute = "<h2>" + props[expressed] +
        "</h2><b>" + expressed + "</b>";

    //create info label div
		var infolabel = d3.select("body")
			.append("div")
			.attr("class", "infolabel")
			.attr("id", props.State + "_label")
			.html(labelAttribute);

    var countyName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.State);
  };
  //set up function for label placement as mouse moves
  function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
      .node()
      .getBoundingClientRect()
      .width;

    //use coordinates of mousemove event to give the label its coordinates
    var x1 = d3.event.clientX + 10,
      y1 = d3.event.clientY - 75,
      x2 = d3.event.clientX - labelWidth - 15,
      y2 = d3.event.clientY + 20;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
  		.style("left", x + "px")
  		.style("top", y + "px");

  };

})(); //last line of main.js
