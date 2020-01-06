function filterLocationSearch() {
    var geocoder = document.getElementById('geocoder');
    var location = geocoder.value + '.json'
    var locationList = document.getElementById('potentialLocations');
    clearSearchFilter();
    var response = assembleGeocodeURL(location);
    response.then((data) => {
        console.log('The data is', data);
        for (var i = 0; i < 5; ++i) {
            var placeName = data.features[i].place_name;
            var placeElement = document.createElement('li');
            var placeElementLink = document.createElement('a');

            placeElementLink.innerHTML = placeName;

            placeElement.appendChild(placeElementLink);
            locationList.appendChild(placeElement);
        }
    })
}

async function assembleGeocodeURL(location) {
    var response = await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + 
    location + '?access_token=' + apiKey.mapBoxKey);
    var data = await response.json();
    return data;
}

function clearSearchFilter() {
    let filterList = document.getElementById('potentialLocations');
    let filterListNodes = document.getElementById('potentialLocations').childNodes;
    while (filterListNodes.length != 0) {
        filterList.removeChild(filterListNodes[0]);
    }
}

var geocoder = document.getElementById('geocoder');

// geocoder.addEventListener('onkeyup', filterLocationSearch());