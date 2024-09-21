function initPage() {
  const txtCity = document.getElementById("text-city");
  const btnSearch = document.getElementById("btn-search");
  const txtName = document.getElementById("txt-city-name");
  const selTempUnit = document.getElementById("selTempUnit");
  const selWindUnit = document.getElementById("selWindUnit");
  const contentAdvancedSearch = document.getElementById(
    "content-advanced-search"
  );
  const btnAdvancedSearch = document.getElementById("btn-advanced-search");
  const showTemperature = document.getElementById("show_temperature");
  const showHumidity = document.getElementById("show_humidity");
  const showWindSpeed = document.getElementById("show_wind_speed");
  var currentTemp = null;
  var currentWind = null;
  var forecastWeather = [];
  const currentPicEl = document.getElementById("current-pic");
  const currentTempEl = document.getElementById("temperature");
  const currentHumidityEl = document.getElementById("humidity");
  const currentWindEl = document.getElementById("wind-speed");
  const weatherInfoEl = document.getElementById("weather-info");
  const currentUVEl = document.getElementById("UV-index");
  var fivedayEl = document.getElementById("fiveday-header");
  var todayweatherEl = document.getElementById("today-weather");
  const aqiInfoEl = document.getElementById("aqi-info");
  let preference = {
    temp: localStorage.getItem("temp") ? localStorage.getItem("temp") : "C",
    wind: localStorage.getItem("wind") ? localStorage.getItem("wind") : "ms",
  };
  selTempUnit.value = preference.temp;
  selWindUnit.value = preference.wind;
  // Assigning a unique API to a variable
  const APIKey = "8cc48b29732e9b93c55cb8d7c75a78bf";
  const AQIKey = "9ddec3b0-1fcf-4616-a9bb-590bef1cadfe";

  function getWeather(cityName) {
    // Execute a current weather get request from open weather api
    let queryURL =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      cityName +
      "&appid=" +
      APIKey;
    axios
      .get(queryURL)
      .then(function (response) {
        todayweatherEl.classList.remove("d-none");
        // Parse response to display current weather
        const currentDate = new Date(response.data.dt * 1000);
        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const hours = currentDate.getHours();
        const minutes = currentDate.getMinutes();
        const seconds = currentDate.getSeconds();
        txtName.innerHTML =
          response.data.name + " (" + month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds + ") ";
        const weatherPic = response.data.weather[0].icon;
        currentPicEl.setAttribute(
          "src",
          "https://openweathermap.org/img/wn/" + weatherPic + "@2x.png"
        );
        currentPicEl.setAttribute("alt", response.data.weather[0].description);
        currentTemp = response.data.main.temp;
        currentWind = response.data.wind.speed;
        displayCurTemp();
        displayCurWind();
        if(showHumidity.checked) {
          currentHumidityEl.innerHTML =
            "Humidity: " + response.data.main.humidity + "%";
        } else {
          currentHumidityEl.innerHTML = '';
        }
        weatherInfoEl.innerHTML =
          "Weather: " + response.data.weather[0].description;

        // Get UV Index
        const lat = response.data.coord.lat;
        const lon = response.data.coord.lon;
        const UVQueryURL =
          "https://api.openweathermap.org/data/2.5/uvi/forecast?lat=" +
          lat +
          "&lon=" +
          lon +
          "&appid=" +
          APIKey +
          "&cnt=1";
        axios.get(UVQueryURL).then(function (response) {
          const UVIndex = document.createElement("span");

          // When UV Index is good, shows green, when ok shows yellow, when bad shows red
          if (response.data[0].value < 4) {
            UVIndex.setAttribute("class", "badge badge-success");
          } else if (response.data[0].value < 8) {
            UVIndex.setAttribute("class", "badge badge-warning");
          } else {
            UVIndex.setAttribute("class", "badge badge-danger");
          }
          UVIndex.innerHTML = response.data[0].value;
          currentUVEl.innerHTML = "UV Index: ";
          currentUVEl.append(UVIndex);
        });

        // Get AQI Data
        fetchAQIData(response.data.coord.lat, response.data.coord.lon);

        // Get 5 day forecast for this city
        const cityID = response.data.id;
        const forecastQueryURL =
          "https://api.openweathermap.org/data/2.5/forecast?id=" +
          cityID +
          "&appid=" +
          APIKey;
        axios.get(forecastQueryURL).then(function (response) {
          fivedayEl.classList.remove("d-none");

          //  Parse response to display forecast for next 5 days
          forecastWeather = response.data.list;

          displayForcastWeather();
        });
        // Add Marker to Map
        addMarker(lat, lon, cityName);
      })
      .catch((error) => {
        console.log(error);
        /*if (cityName.trim() != "") {
          alert("Location not found");
        }*/
      });
  }
  function fetchAQIData(lat, lon) {
    const aqiUrl = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${AQIKey}`;

    axios
      .get(aqiUrl)
      .then((response) => {
        displayAQIData(response.data);
      })
      .catch((error) => console.error("Error fetching AQI data:", error));
  }

  function displayAQIData(data) {
    const aqi = data.data.current.pollution.aqius; // or 'aqicn' for AQI CN
    const aqiInfo = `
      <div>
        <h5>${i18next.t("air_quality_index")}</h5>
        <p>${i18next.t("AQI")}: ${aqi}</p>
        <p>${i18next.t("level")}: ${getAQILevel(aqi)}</p>
      </div>
    `;
    aqiInfoEl.innerHTML = aqiInfo;
  }

  function getAQILevel(aqi) {
    if (aqi <= 50) return i18next.t("Good");
    if (aqi <= 100) return i18next.t("Moderate");
    if (aqi <= 150) return i18next.t("Unhealthy_for_Sensitive_Groups");
    if (aqi <= 200) return i18next.t("Unhealthy");
    if (aqi <= 300) return i18next.t("Very_Unhealthy");
    return i18next.t("Hazardous");
  }

  txtCity.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const searchTerm = txtCity.value;
      getWeather(searchTerm);
    }
  });

  btnSearch.addEventListener("click", function () {
    const searchTerm = txtCity.value;
    getWeather(searchTerm);
  });

  showTemperature.addEventListener("change", function () {
    const searchTerm = txtCity.value;
    getWeather(searchTerm);
  });

  showHumidity.addEventListener("change", function () {
    const searchTerm = txtCity.value;
    getWeather(searchTerm);
  });

  showWindSpeed.addEventListener("change", function () {
    const searchTerm = txtCity.value;
    getWeather(searchTerm);
  });

  selTempUnit.addEventListener("change", function () {
    preference.temp = this.value;
    addPreferenceToLocalStorage("temp", this.value);
    displayCurTemp();
    displayForcastWeather();
  });

  selWindUnit.addEventListener("change", function () {
    preference.wind = this.value;
    addPreferenceToLocalStorage("wind", this.value);
    displayCurWind();
    displayForcastWeather();
  });

  btnAdvancedSearch.addEventListener("click", function () {
    contentAdvancedSearch.classList.toggle("d-none");
  });

  document.addEventListener("DOMContentLoaded", () => {
    const toggleThemeButton = document.getElementById("toggle-theme");

    // Check for saved theme preference in local storage
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme) {
      document.body.classList.toggle("dark-mode", currentTheme === "dark");
    }

    toggleThemeButton.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");

      // Save the current theme in local storage
      const isDarkMode = document.body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    });
  });

  //add element to local storage
  function addPreferenceToLocalStorage(key, value) {
    localStorage.setItem(key, value);
  }

  function displayForcastWeather() {
    const forecastEls = document.querySelectorAll(".forecast");
    for (i = 0; i < forecastEls.length; i++) {
      forecastEls[i].innerHTML = "";
      const forecastIndex = i * 8 + 4;
      const forecastDate = new Date(forecastWeather[forecastIndex].dt * 1000);
      const forecastDay = forecastDate.getDate();
      const forecastMonth = forecastDate.getMonth() + 1;
      const forecastYear = forecastDate.getFullYear();
      const forecastDateEl = document.createElement("p");
      forecastDateEl.setAttribute("class", "mt-3 mb-0 forecast-date");
      forecastDateEl.innerHTML =
        forecastMonth + "/" + forecastDay + "/" + forecastYear;
      forecastEls[i].append(forecastDateEl);

      // Icon for current weather
      const forecastWeatherEl = document.createElement("img");
      forecastWeatherEl.setAttribute(
        "src",
        "https://openweathermap.org/img/wn/" +
          forecastWeather[forecastIndex].weather[0].icon +
          "@2x.png"
      );
      forecastWeatherEl.setAttribute(
        "alt",
        forecastWeather[forecastIndex].weather[0].description
      );
      forecastEls[i].append(forecastWeatherEl);
      if (showTemperature.checked) {
        const forecastTempEl = document.createElement("p");
        forecastTempEl.innerHTML =
          `${i18next.t("Temp")}:` +
          convertTemp(
            forecastWeather[forecastIndex].main.temp,
            selTempUnit.value
          ) +
          (selTempUnit.value == "F" ? " &#176F" : " &#176C");
        forecastEls[i].append(forecastTempEl);
      }
      if (showHumidity.checked) {
        const forecastHumidityEl = document.createElement("p");
        forecastHumidityEl.innerHTML =
          `${i18next.t("Humidity")}:` +
          forecastWeather[forecastIndex].main.humidity +
          "%";
        forecastEls[i].append(forecastHumidityEl);
      }
      if (showWindSpeed.checked) {
        const forecastWindEl = document.createElement("p");
        forecastWindEl.innerHTML =
          `${i18next.t("Wind")}:` +
          convertWind(
            forecastWeather[forecastIndex].wind.speed,
            selWindUnit.value
          ) +
          (selWindUnit.value == "ms" ? " miles/h" : " km/h");
        forecastEls[i].append(forecastWindEl);
      }
    }
  }

  function displayCurTemp() {
    if(showTemperature.checked) {
      const U = selTempUnit.value;
      currentTempEl.innerHTML =
        `${i18next.t("Temperature")}:` +
        convertTemp(currentTemp, U) +
        (U == "F" ? " &#176F" : " &#176C");
    } else {
      currentTempEl.innerHTML = '';
    }
  }

  function convertTemp(K, U) {
    switch (U) {
      case "F":
        return k2f(K);
      case "C":
        return k2c(K);
      default:
        return k2c(K);
    }
  }

  function k2f(K) {
    return Math.floor((K - 273.15) * 1.8 + 32);
  }

  function k2c(K) {
    return Math.floor(K - 273.15);
  }

  function displayCurWind() {
    if(showWindSpeed.checked) {
      const U = selWindUnit.value;
      currentWindEl.innerHTML =
        `${i18next.t("Wind_Speed")}:` +
        convertWind(currentWind, U) +
        (U == "ms" ? " miles/h" : " km/h");
    } else {
      currentWindEl.innerHTML = '';
    }
  }

  function convertWind(K, U) {
    switch (U) {
      case "ms":
        return k2m(K);
      case "kms":
        return k2km(K);
      default:
        return k2km(K);
    }
  }

  function k2m(K) {
    return Math.floor(K * 0.621371);
  }

  function k2km(K) {
    return K;
  }
}

initPage();
