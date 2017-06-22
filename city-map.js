  var CitySelctorComponent = function (opts) {
      this.elementID = opts.elementID;
      this.worldData = opts.worldData;
      this.cityData = opts.cityData;
      this.selectdCityCallback = opts.selectdCityCallback;
      this.initiallySelctedCity = opts.initiallySelctedCity;
      var self = this;
      var cityCircleScale = d3.scale.linear();
      cityCircleScale.domain([1, 30]);
      cityCircleScale.range([2, 0.25]);
      var selectedCityCircleScale = d3.scale.log();
      selectedCityCircleScale.domain([1, 30]);
      selectedCityCircleScale.range([10, 0.25]);
      var width = 962,
          rotated = 90,
          height = 502;
      var zoomScale = 1;
      var initX;
      var s = 1;
      var mouseClicked = false;
      var projection = d3.geo.mercator().scale(153).translate([width / 2, height / 1.5]).rotate([rotated, 0, 0]);
      var zoom = d3.behavior.zoom().scaleExtent([1, 30]).on("zoom", zoomed);
      var svg = createSVG(this.elementID);
      var offsetL = document.getElementById(this.elementID).offsetLeft + 10;
      var offsetT = document.getElementById(this.elementID).offsetTop + 10;
      var path = d3.geo.path().projection(projection);
      var tooltip = d3.select("#" + this.elementID).append("div").attr("class", "tooltip hidden");
      var g = svg.append("g");

      function createSVG(elementID) {
          return d3.select("#" + elementID).append("svg").attr("width", width).attr("height", height)
              .on("mousedown", function () {
                  d3.event.preventDefault();
                  if (s !== 1) return;
                  initX = d3.mouse(this)[0];
                  mouseClicked = true;
              }).on("mouseup", function () {
                  if (s !== 1) return;
                  rotated = rotated + ((d3.mouse(this)[0] - initX) * 360 / (s * width));
                  mouseClicked = false;
              }).call(zoom);
      }

      function drawWorldMap(worldData) {
          g.append("g").attr("class", "boundary").selectAll("boundary").data(topojson.feature(worldData, worldData.objects.countries).features).enter().append("path")
              .attr("name", function (d) {
                  return d.properties.name;
              }).attr("id", function (d) {
                  return d.id;
              }).on("mousemove", function (d) {
                  showTooltip(d.properties.name);
              }).on("mouseout", function (d, i) {
                  tooltip.classed("hidden", true);
              }).attr("d", path);
      }

      function drawCities(cityData) {
          g.append("g").selectAll("circle").data(cityData).enter().append("circle").attr("class", "city-circle")
              .attr("cx", function (d) {
                  return projection([d.lng, d.lat])[0];
              }).attr("cy", function (d) {
                  return projection([d.lng, d.lat])[1];
              }).on('click', function (d) {
                  selectCircle(d);
                  self.selectdCityCallback(d);
              })
              .on("mousemove", function (d) {
                  showTooltip("City Name: " + d.city_ascii + " Lat: " + d.lat + " Lng: " + d.lng);
              }).on("mouseout", function (d, i) {
                  tooltip.classed("hidden", true);
              }).attr("r", 2).style("fill", "navy").style("opacity", 0.5);   
          g.selectAll("text")
              .data(cityData)
              .enter()
              .append("text")
              .text(function (d) {
                  return d.city;
              })
              .attr("x", function (d) {
                  return projection([d.lng, d.lat])[0];
              })
              .attr("y", function (d) {
                  return projection([d.lng, d.lat])[1] + 0.75;
              })
              .attr("text-anchor", "middle")
              .attr('font-size', '0.5pt')
              .style("visibility", "hidden");
          selectinItiallySelctedCity(cityData);
      }

      function rotateMap(endX) {
          projection.rotate([rotated + (endX - initX) * 360 / (s * width), 0, 0])
          g.selectAll('path')
              .attr('d', path);
          g.selectAll("circle").attr("cx", function (d) {
              return projection([d.lng, d.lat])[0];
          }).attr("cy", function (d) {
              return projection([d.lng, d.lat])[1];
          })
      }

      function selectinItiallySelctedCity(data) {
          var selctedCity = null;
          data.forEach(function (item) {
              if (item.city == self.initiallySelctedCity) {
                  selctedCity = item;
                  return false
              }
          });
          if (selctedCity) selectCircle(selctedCity);
      }

      function showTooltip(label) {
          var mouse = d3.mouse(svg.node()).map(function (d) {
              return parseInt(d);
          });
          tooltip.classed("hidden", false).attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px").html(label);
      }

      function selectCircle(datum) {
          d3.selectAll(".selected-city-circle").remove();
          g.append("g").selectAll(".mark").data([datum]).enter().append("circle").attr("class", "selected-city-circle")
              .attr("cx", function (d) {
                  return projection([d.lng, d.lat])[0];
              }).attr("cy", function (d) {
                  return projection([d.lng, d.lat])[1];
              })
              .on("mousemove", function (d) {
                  showTooltip("City Name: " + d.city_ascii + " Lat: " + d.lat + " Lng: " + d.lng);
              }).on("mouseout", function (d, i) {
                  tooltip.classed("hidden", true);
              })
              .attr("r", selectedCityCircleScale(zoomScale)).style("fill", "red").style("opacity", 0.75);
      }

      function zoomed() {
          var t = d3.event.translate;
          s = zoomScale = d3.event.scale;
          var h = 0;
          t[0] = Math.min(
              (width / height) * (s - 1), Math.max(width * (1 - s), t[0]));
          t[1] = Math.min(h * (s - 1) + h * s, Math.max(height * (1 - s) - h * s, t[1]));
          zoom.translate(t);
          if (s === 1 && mouseClicked) {
              rotateMap(d3.mouse(this)[0])
              return;
          }
          g.attr("transform", "translate(" + t + ")scale(" + s + ")");
          d3.selectAll(".boundary").style("stroke-width", 1 / s);
          if (s > 1) {
              g.selectAll(".city-circle").attr("r", cityCircleScale(s));
              g.selectAll(".selected-city-circle").attr("r", selectedCityCircleScale(s));
          }
          if (s < 10) {
              g.selectAll("text")
                  .style("visibility", "hidden");
          } else {
              g.selectAll("text")
                  .style("visibility", "visible");
          }
      }

      drawWorldMap(this.worldData);
      drawCities(this.cityData);
  }
