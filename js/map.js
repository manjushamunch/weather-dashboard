let map;
let marker;
let geocoder;
let autocomplete;
let responseDiv;
let response;

function initMap() {
  // Create a map centered at a default location
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 8,
    center: { lat: -34.397, lng: 150.644 },
    mapTypeControl: false,
  });

  geocoder = new google.maps.Geocoder();

  // Autocomplete for pac-input
  const input = document.getElementById("pac-input");
  const txtCity = document.getElementById("text-city");

  map.addListener("click", (e) => {
    geocode({ location: e.latLng });
    fetchWeatherData(e.latLng);
    fetchAQIData(e.latLng);
  });

  // Initialize the autocomplete with the input field
  autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["geocode"], // You can restrict the types of predictions (like addresses or cities)
    fields: ["place_id", "geometry", "name"], // Specify the fields to return
  });

  // Bias the autocomplete predictions towards the map's viewport.
  autocomplete.bindTo("bounds", map);

  // Event listener for place changes in autocomplete
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      txtCity.value = "";
      window.alert("No details available for the input: '" + place.name + "'");
      return;
    }
    txtCity.value = place.formatted_address || place.name;

    // If the place has a geometry, move the map to the place location
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17); // Adjust the zoom
    }

    // Place a marker on the map at the selected location
    if (marker) {
      marker.setPosition(place.geometry.location);
    } else {
      marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
      });
    }
    fetchWeatherData(place.geometry.location);
    fetchAQIData(place.geometry.location);
    marker.addListener("click", (e) => {
      geocode({ location: e.latLng });
      fetchWeatherData(e.latLng);
      fetchAQIData(e.latLng);
    });
  });

  function clear() {
    marker.setMap(null);
  }

  function geocode(request) {
    clear();
    geocoder
      .geocode(request)
      .then((result) => {
        const { results } = result;

        map.setCenter(results[0].geometry.location);
        marker.setPosition(results[0].geometry.location);
        marker.setMap(map);
        return results;
      })
      .catch((e) => {
        alert("Geocode was not successful for the following reason: " + e);
      });
  }
}

function addMarker(lat, lon, title) {
  const location = { lat: lat, lng: lon };
  marker = new google.maps.Marker({
    position: location,
    map: map,
    title: title,
  });
  marker.addListener("click", (e) => {
    geocode({ location: e.latLng });
    fetchWeatherData(e.latLng);
    fetchAQIData(e.latLng);
  });

  function clear() {
    marker.setMap(null);
  }

  function geocode(request) {
    clear();
    geocoder
      .geocode(request)
      .then((result) => {
        const { results } = result;

        map.setCenter(results[0].geometry.location);
        marker.setPosition(results[0].geometry.location);
        marker.setMap(map);
        return results;
      })
      .catch((e) => {
        alert("Geocode was not successful for the following reason: " + e);
      });
  }

  // Center the map on the new marker
  map.setCenter(location);
}

function fetchWeatherData(location) {
  const apiKey = "8cc48b29732e9b93c55cb8d7c75a78bf"; // Replace with your API key
  const lat = location.lat();
  const lng = location.lng();
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

  fetch(weatherUrl)
    .then((response) => response.json())
    .then((data) => {
      fetchAQIData(location, data);
    })
    .catch((error) => console.error("Error fetching weather data:", error));
}

function fetchAQIData(location, weatherData = null) {
  const apiKey = "9ddec3b0-1fcf-4616-a9bb-590bef1cadfe"; // Replace with your API key
  const lat = location.lat();
  const lng = location.lng();
  const aqiUrl = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lng}&key=${apiKey}`;

  fetch(aqiUrl)
    .then((response) => response.json())
    .then((data) => {
      displayCombinedData(weatherData, data);
    })
    .catch((error) => console.error("Error fetching AQI data:", error));
}

function displayCombinedData(weatherData, aqiData) {
  const aqi = aqiData.data.current.pollution.aqius; // or 'aqicn' for AQI CN
  const aqiLevel = getAQILevel(aqi);
  const combinedInfo = `
      <div>
        <h5>${i18next.t("Weather_and_Air_Quality_Information")}</h5>
        <p>${i18next.t("Temperature")}: ${weatherData.main.temp}°C</p>
        <p>${i18next.t("Humidity")}: ${weatherData.main.humidity}%</p>
        <p>${i18next.t("Weather")}: ${weatherData.weather[0].description}</p>
        <p>${i18next.t("AQI")}: ${aqi}</p>
        <p>${i18next.t("AQI_Level")}: ${aqiLevel}</p>
      </div>
    `;

  // Create an InfoWindow to show combined data
  const infoWindow = new google.maps.InfoWindow({
    content: combinedInfo,
  });

  // Open the InfoWindow at the marker's position
  infoWindow.open(map, marker);
}

function getAQILevel(aqi) {
  if (aqi <= 50) return i18next.t("Good");
  if (aqi <= 100) return i18next.t("Moderate");
  if (aqi <= 150) return i18next.t("Unhealthy_for_Sensitive_Groups");
  if (aqi <= 200) return i18next.t("Unhealthy");
  if (aqi <= 300) return i18next.t("Very_Unhealthy");
  return i18next.t("Hazardous");
}

window.initMap = initMap;
