var containerView = $('#container-js');
var temperatureCurrentView = $('#temperature-current-js');
var temperatureMinView = $('#temperature-min-js');
var temperatureMaxView = $('#temperature-max-js');
var weatherTextView = $('#weather-text-js');
var weatherIconView = $('#weather-icon-js');
var locationView = $('#location-js');
var countryView = $('#country-js');
var humidityView = $('#humidity-js');
var pressureView = $('#pressure-js');
var windSpeedView = $('#wind-speed-js');
var windNameView = $('#wind-name-js');
var celsiusButton = $('#celsius-js');
var fahrenheitButton = $('#fahrenheit-js');
var authorView = $('#author-js');

var tempCelsius, tempFahrenheit;

var Temperature = function (current, max, min) {
  this.current = current;
  this.max = max;
  this.min = min;
}

var updateTemperatureValues = function (temperature) {
  temperatureCurrentView.text(temperature.current);
  temperatureMaxView.text(temperature.max);
  temperatureMinView.text(temperature.min);
}

celsiusButton.click(function (event) {
  event.preventDefault();
  celsiusButton.addClass('units__element--selected');
  fahrenheitButton.removeClass('units__element--selected');
  updateTemperatureValues(tempCelsius);
});

fahrenheitButton.click(function (event) {
  event.preventDefault();
  fahrenheitButton.addClass('units__element--selected');
  celsiusButton.removeClass('units__element--selected');
  updateTemperatureValues(tempFahrenheit);
});

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function (location) {
    var latitude = location.coords.latitude;
    var longitude = location.coords.longitude;
    var weatherData; // for sharing weather data between promises
    var weatherRequest = $.ajax(`https://fcc-weather-api.glitch.me/api/current?lat=${latitude}&lon=${longitude}`)
      .then(function (res) {
        weatherData = res;
        var tempCurrent = weatherData.main.temp;
        var tempMax = weatherData.main.temp_max;
        var tempMin = weatherData.main.temp_min;
        var humidity = weatherData.main.humidity;
        var pressure = weatherData.main.pressure;
        var windSpeed = weatherData.wind.speed;
        var windDeg = weatherData.wind.deg;
        var location = weatherData.name;
        var country = weatherData.sys.country;
        var weatherText = weatherData.weather[0].main;
        var weatherIconSrc = weatherData.weather[0].icon;

        locationView.text(location);
        countryView.text(country);
        
        tempCelsius = new Temperature(
          Math.round(tempCurrent),
          Math.round(tempMax),
          Math.round(tempMin)
        );
        tempFahrenheit = new Temperature(
          celsiusToFahrenheit(tempCurrent),
          celsiusToFahrenheit(tempMax),
          celsiusToFahrenheit(tempMin)
        );
        updateTemperatureValues(tempCelsius);

        weatherTextView.text(weatherText);
        if (weatherIconSrc) weatherIconView.append($(`<img src="${weatherIconSrc}">`));

        humidityView.text(humidity);
        pressureView.text(dPaToMmHg(pressure));
        windSpeedView.text(windSpeed);
        windNameView.text(windName(windDeg));

        containerView.removeClass('container--faded');
    
      })
      .catch(function (error) {
        console.log(error);
      });

    weatherRequest.then(function () {
      var countryAlphaCode = weatherData.sys.country;
      return $.ajax(`https://restcountries.eu/rest/v2/alpha/${countryAlphaCode}`);
    })
      .then(function (res) {
        var countryName = weatherData.sys.country;
        if (res && res.name) {
          countryName = res.name;
        }
        countryView.text(countryName);
      })
      .catch(function (error) {
        console.log(error);
      });

    weatherRequest.then(function () {
      var sunrise = weatherData.sys.sunrise * 1000;
      var sunset = weatherData.sys.sunset * 1000;
      var isDaytime = isDaytimeNow(sunrise, sunset);
      var weatherDescription = weatherData.weather[0].description;
      var imageQuery = weatherDescription + ' ' + (isDaytime ? 'day' : 'night');
      return $.ajax(`https://berry-drill.glitch.me/${imageQuery}`);
    })
      .then(function (res) {
        // preload image before updating background
        var imageSrc = res.urls.regular;
        $(`<img src="${imageSrc}">`).on('load', function () {
          $(this).remove;
          containerView
            .removeClass('container--faded')
            .css('background-image', `url(${imageSrc})`);
        });
        // author credits
        var authorName = res.user.name;
        var authorProfile = res.user.links.html;
        var unsplashUTM = '?utm_source=freeCodeCamp-local-weather-bakoushin&utm_medium=referral&utm_campaign=api-credit';
        var author = `Photo by <a class="author__link" href="${authorProfile + unsplashUTM}" target="_blank">${authorName}</a> /
        <a class="author__link" href="https://unsplash.com${unsplashUTM}" target="_blank">Unsplash</a>`;
        authorView.html(author);
      })
      .catch(function (error) {
        console.log(error);
      });
  });
}

// convert temperature form Celsius to Fahrenheit degrees
var celsiusToFahrenheit = function (temp) {
  return Math.round(temp * 9 / 5 + 32);
}

// convert pressure from dPa to mmHg
var dPaToMmHg = function (pressure) {
  return Math.round(pressure / 10 * 760.001 / 101.325);
}

// return wind name based on given angle
// see: https://stackoverflow.com/a/25867068/6766695
var windName = function (d) {
  var val = Math.floor(d / 22.5 + 0.5);
  var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[val % 16];
}

/*
var windName = function(d) {
  var step = 11.25;
  if (d <= step) return 'N';
  else if (d <= step * 3) return 'NNE';
  else if (d <= step * 5) return 'NE';
  else if (d <= step * 7) return 'ENE';
  else if (d <= step * 9) return 'E';
  else if (d <= step * 11) return 'ESE';
  else if (d <= step * 13) return 'SE';
  else if (d <= step * 15) return 'SSE';
  else if (d <= step * 17) return 'S';
  else if (d <= step * 19) return 'SSW';
  else if (d <= step * 21) return 'SW';
  else if (d <= step * 23) return 'WSW';
  else if (d <= step * 25) return 'W';
  else if (d <= step * 27) return 'WNW';
  else if (d <= step * 29) return 'NW';
  else if (d <= step * 31) return 'NNW';
  else if (d <= 360) return 'N';
}
*/

// returns true if now is daytime based on sunrise and sunset provided
var isDaytimeNow = function (sunrise, sunset) {
  var now = Date.now();
  return (now >= sunrise && now < sunset);
}
