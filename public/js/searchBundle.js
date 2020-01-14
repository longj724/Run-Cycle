(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

const EARTH_RADIUS = 6371000; // meters

const DEG_TO_RAD = Math.PI / 180.0;
const THREE_PI = Math.PI * 3;
const TWO_PI = Math.PI * 2;

const toRadians = deg => deg * DEG_TO_RAD;

const toDegrees = rad => rad / DEG_TO_RAD;
/*
Given a centerPoint C and a radius R, returns a random point that is on the
circumference defined by C and R.

centerPoint C is of type { latitude: A, longitude: B }
Where -90 <= A <= 90 and -180 <= B <= 180.

radius R is in meters.

Based on: http://www.movable-type.co.uk/scripts/latlong.html#destPoint
*/


const randomCircumferencePoint = (centerPoint, radius, randomFn = Math.random) => {
  const sinLat = Math.sin(toRadians(centerPoint.latitude));
  const cosLat = Math.cos(toRadians(centerPoint.latitude)); // Random bearing (direction out 360 degrees)

  const bearing = randomFn() * TWO_PI;
  const sinBearing = Math.sin(bearing);
  const cosBearing = Math.cos(bearing); // Theta is the approximated angular distance

  const theta = radius / EARTH_RADIUS;
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  let rLatitude, rLongitude;
  rLatitude = Math.asin(sinLat * cosTheta + cosLat * sinTheta * cosBearing);
  rLongitude = toRadians(centerPoint.longitude) + Math.atan2(sinBearing * sinTheta * cosLat, cosTheta - sinLat * Math.sin(rLatitude)); // Normalize longitude L such that -PI < L < +PI

  rLongitude = (rLongitude + THREE_PI) % TWO_PI - Math.PI;
  return {
    latitude: toDegrees(rLatitude),
    longitude: toDegrees(rLongitude)
  };
};
/*
Given a centerPoint C and a radius R, returns a random point that is inside
the circle defined by C and R.

centerPoint C is of type { latitude: A, longitude: B }
Where -90 <= A <= 90 and -180 <= B <= 180.

radius R is in meters.
*/


const randomCirclePoint = (centerPoint, radius, randomFn = Math.random) => {
  // http://mathworld.wolfram.com/DiskPointPicking.html
  return randomCircumferencePoint(centerPoint, Math.sqrt(randomFn()) * radius, randomFn);
};
/*
Returns the distance in meters between two points P1 and P2.

P1 and P2 are of type { latitude: A, longitude: B }
Where -90 <= A <= 90 and -180 <= B <= 180.

Basically it is the Haversine distance function.
Based on: http://www.movable-type.co.uk/scripts/latlong.html
*/


const distance = (P1, P2) => {
  const rP1 = {
    latitude: toRadians(P1.latitude),
    longitude: toRadians(P1.longitude)
  };
  const rP2 = {
    latitude: toRadians(P2.latitude),
    longitude: toRadians(P2.longitude)
  };
  const D = {
    latitude: Math.sin((rP2.latitude - rP1.latitude) / 2),
    longitude: Math.sin((rP2.longitude - rP1.longitude) / 2)
  };
  const A = D.latitude * D.latitude + D.longitude * D.longitude * Math.cos(rP1.latitude) * Math.cos(rP2.latitude);
  const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return EARTH_RADIUS * C;
};

const haversine = distance;
module.exports = {
  distance,
  haversine,
  randomCircumferencePoint,
  randomCirclePoint
};
},{}],2:[function(require,module,exports){
const randomLocation = require('random-location');

mapboxgl.accessToken = apiKey.mapBoxKey;

// Creates map and geocoding
var map = new mapboxgl.Map({
    container: 'map', // Container ID
    style: 'mapbox://styles/longj24/ck4z3ai5j084a1cnvlg84jzde', // Map style to use
    center: [-122.25948, 37.87221], // Starting position [lng, lat]
    zoom: 12, // Starting zoom level
});


var geocoder = new MapboxGeocoder({ // Initialize the geocoder
    accessToken: mapboxgl.accessToken, // Set the access token
    mapboxgl: mapboxgl, // Set the mapbox-gl instance
    marker: false,
    placeholder: 'Enter Starting Location'
});
  
// Add the geocoder to the map
// map.addControl(geocoder);

function assembleDirectionsURL(points) {
    // Make the TomTom API Request
    return 'https://api.tomtom.com/routing/1/calculateRoute/' + points.join(':')  + '/json'
     + '?key=' + apiKey.tomtomKey + '&travelMode=pedestrian&maxAlternatives=5&windingness=low&routeType=thrilling';
}

async function makeNavRequest(coordinates) {
    var response = await fetch(assembleDirectionsURL(coordinates));
    var data = await response.json();
    return data;
}

function filterLocationSearch() {
  var geocoder = document.getElementById('geocoder');
  var location = geocoder.value + '.json'
  var locationList = document.getElementById('potentialLocations');
  clearSearchFilter2();
  var response = assembleGeocodeURL(location);
  response.then((data) => {
      if (data && !locationList.hasChildNodes()) {
        for (var i = 0; i < 5; ++i) {
          var placeName = data.features[i].place_name;
          var placeElement = document.createElement('li');
          var placeElementLink = document.createElement('a');

          placeElementLink.innerHTML = placeName;

          placeName = JSON.stringify(placeName);
          placeElementLink.setAttribute('onclick', `fillInSearchBox(${placeName})`);
          placeElement.appendChild(placeElementLink);
          locationList.appendChild(placeElement);
        }
      }
  })
}

function clearSearchFilter2() {
  let filterList = document.getElementById('potentialLocations');
  let filterListNodes = document.getElementById('potentialLocations').childNodes;
  while (filterListNodes.length != 0) {
      filterList.removeChild(filterListNodes[0]);
  }
}

async function assembleGeocodeURL(location) {
  var response = await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + 
  location + '?access_token=' + apiKey.mapBoxKey);
  var data = await response.json();
  return data;
}

async function getRouteInfo() {
  var geocoder = document.getElementById('geocoder');
  var location = geocoder.value + '.json';
  var distance = document.getElementById('routeDistance');
  var response = await assembleGeocodeURL(location);
  return response;
}

function createRoute() {
  // When there is no route
  var nothing = turf.featureCollection([]);

  var geocodeResponse = getRouteInfo();
  geocodeResponse.then((geocodeData) => {

    var mapA = new mapboxgl.Map({
      container: 'map', // Container ID
      style: 'mapbox://styles/longj24/ck4z3ai5j084a1cnvlg84jzde', // Map style to use
      center: geocodeData.features[0].center, // Starting position [lng, lat]
      zoom: 12, // Starting zoom level
    });

    mapA.on('load', function() {
      mapA.addSource('single-point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      mapA.addLayer({
        id: 'point',
        source: 'single-point',
        type: 'circle',
        paint: {
          'circle-radius': 10,
          'circle-color': '#448ee4'
        }
      })

      mapA.getSource('single-point').setData({
        "type": "FeatureCollection",
        "features": [{
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Point",
            "coordinates": geocodeData.features[0].center
          }
        }]
      });

      // Object containing the latitude and longitude at the entered address
      var latLong = {'latitude': geocodeData.features[0].center[1], 'longitude': geocodeData.features[0].center[0]};

      // An array representing the coordinates of the starting point: lng, lat
      var startingPoint = [geocodeData.features[0].center[1], geocodeData.features[0].center[0]];

      // Variables to be used after making the API request
      var routeGeoJSON;
      var potentialRoutePoints = [];

      // Get the requested route length
      var requestedRouteLength = document.getElementById('routeDistance').value;

      // Get the unit that the user wants to calculate the route in
      var distanceUnit;
      var radios = document.getElementsByName('unit-switch');
      for (var i = 0; i < radios.length; ++i) {
        if (radios[i].checked) {
          distanceUnit = radios[i].value;
          break;
        }
      }

      // Convert the entered route length to meters
      var distanceInMeters = 0;
      if (distanceUnit.localeCompare("Miles") == 0) {
        distanceInMeters = requestedRouteLength * 1609.34;
      } else {
        distanceInMeters = requestedRouteLength * 1000;
      }

      // Get a random point within the given circumference
      const randomCircumferencePoint = randomLocation.randomCircumferencePoint(latLong, distanceInMeters * .45);

      // Add the starting point to the potential route points array and calculate the ending point
      potentialRoutePoints.push(startingPoint);
      var pointToAdd = [randomCircumferencePoint.latitude, randomCircumferencePoint.longitude];
      potentialRoutePoints.push(pointToAdd);

      // Make a request to get the route to the randomly generated point
      var totalRouteDistance = 0;
      var response = makeNavRequest(potentialRoutePoints);
      response.then((data) => {

        // If no route can be found
        if(!data.routes[0]) {
          console.log('No Route of that length found');
        } else {
          
          // Update the total route distance
          totalRouteDistance += data.routes[0].summary.lengthInMeters

          // Get the coordinates that make up the route
          var originalRoutePoints = data.routes[0].legs[0].points;
          var newRoutePoints = []

          // Convert the route coordinates to a 2d array with [lng, lat] elements
          for (var i = 0; i < originalRoutePoints.length; ++i) {
            newRoutePoints[i] = [originalRoutePoints[i].longitude, originalRoutePoints[i].latitude];
          }

          // If a cycle can be made between the starting and ending points
          if (data.routes.length > 1) {

            // Make the request to get the returning route
            potentialRoutePoints.length = 0;
            potentialRoutePoints.push(pointToAdd);
            potentialRoutePoints.push(startingPoint);
            var returnRequest = makeNavRequest(potentialRoutePoints);

            returnRequest.then((returnData) => {

              // Update the total route distance
              totalRouteDistance += returnData.routes[0].summary.lengthInMeters

              if (distanceUnit.localeCompare("Miles") == 0) {
                totalRouteDistance = totalRouteDistance * 0.000621371;
              } else {
                totalRouteDistance = totalRouteDistance * 0.001;
              }

              // Display distance to the user
              var displayDistance = document.getElementById('routeInfo');
              displayDistance.innerHTML = 'Distance: ' + totalRouteDistance.toFixed(2) + ' ' + distanceUnit;

              console.log('The total route distance is: ', totalRouteDistance, distanceUnit);

              originalRoutePoints.length = 0;
              originalRoutePoints = returnData.routes[1].legs[0].points;
              
              var newRoutePointsLength = newRoutePoints.length;

              // Convert the returning route coordinates to a 2d array with [lng, lat] elements
              // Append the returning route coordinates to newRoutePoints array
              for (var i = 0; i < originalRoutePoints.length; ++i) {
                newRoutePoints[newRoutePointsLength + i] = [originalRoutePoints[i].longitude, originalRoutePoints[i].latitude];
              }

              // Create the geometry to plot the route
              var geometryObject = {'coordinates': newRoutePoints, 'type': 'LineString'};

              routeGeoJSON = turf.featureCollection([turf.feature(geometryObject)]);

              // Update the `route` source by getting the route source
              // and setting the data equal to routeGeoJSON
              mapA.getSource('route').setData(routeGeoJSON);
            })
          } else {
            // If a cycle cannot be made - the route will now be an out and back
            if (distanceUnit.localeCompare("Miles") == 0) {
              totalRouteDistance = totalRouteDistance * 0.000621371;
            } else {
              totalRouteDistance = totalRouteDistance * 0.001;
            }
            console.log('one route, the distance is: ', totalRouteDistance * 2, distanceUnit);

            // Display distance to the user
            var displayDistance = document.getElementById('routeInfo');
            displayDistance.innerHTML = 'Distance: ' + totalRouteDistance.toFixed(2) + ' ' + distanceUnit;

            // The route points as latitude longitude objects
            var originalRoutePoints = data.routes[0].legs[0].points;
            var newRoutePoints = []

            // Convert the route points to a 2d array with [lng, lat] elements
            for (var i = 0; i < originalRoutePoints.length; ++i) {
              newRoutePoints[i] = [originalRoutePoints[i].longitude, originalRoutePoints[i].latitude];
            }

            var geometryObject = {'coordinates': newRoutePoints, 'type': 'LineString'};

            routeGeoJSON = turf.featureCollection([turf.feature(geometryObject)]);

            mapA.getSource('route').setData(routeGeoJSON);
          }
        }
      })
      // Clearing potentialRoutePoints so new routes can be created
      potentialRoutePoints.length = 0;

      mapA.addSource('route', {
        type: 'geojson',
        data: nothing
      })

      mapA.addLayer({
          id: 'routeline-active',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#F93800',
            'line-width': [
              "interpolate",
              ["linear"],
              ["zoom"],
              12, 3,
              22, 12
            ]
          }
        }, 'waterway-label');

      mapA.addLayer({
      id: 'routearrows',
      type: 'symbol',
      source: 'route',
      layout: {
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': [
          "interpolate",
          ["linear"],
          ["zoom"],
          12, 24,
          22, 60
          ],
          'symbol-spacing': [
          "interpolate",
          ["linear"],
          ["zoom"],
          12, 30,
          22, 160
          ],
          'text-keep-upright': false
        },
        paint: {
            'text-color': '#FFB500',
            'text-halo-color': '#283350',
            'text-halo-width': 2
        }
      }, 'waterway-label');    
    })
  })
}

var searchInput = document.getElementById('geocoder');
searchInput.addEventListener('keyup', filterLocationSearch);

var createRouteBtn = document.getElementById('makeRoute');
createRouteBtn.addEventListener('click', createRoute);
},{"random-location":1}]},{},[2]);

function fillInSearchBox(location) {
  var searchBox = document.getElementById('geocoder');
  searchBox.value = location;
  clearSearchFilter();
}

function clearSearchFilter() {
  let filterList = document.getElementById('potentialLocations');
  let filterListNodes = document.getElementById('potentialLocations').childNodes;
  while (filterListNodes.length != 0) {
      filterList.removeChild(filterListNodes[0]);
  }
}

var locationList = document.getElementById('potentialLocations');
window.onclick = function(event) {
  if (event.target == locationList) {
    console.log('This kind of works');
    locationList.style.display == 'none';
    clearSearchFilter();
  }
}
