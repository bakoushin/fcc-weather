var CELSIUS = 'celsius';
var FAHRENHEIT = 'fahrenheit';

var loaderView = $('#loader-js');
var loaderContentView = $('#loader-content-js');
var containerView = $('#container-js');
var temperatureCurrentView = $('#temperature-current-js');
var temperatureMinView = $('#temperature-min-js');
var temperatureMaxView = $('#temperature-max-js');
var weatherTextView = $('#weather-text-js');
var weatherIconView = $('#weather-icon-js');
var locationView = $('#location-js');
var humidityView = $('#humidity-js');
var pressureView = $('#pressure-js');
var windSpeedView = $('#wind-speed-js');
var celsiusButton = $('#celsius-js');
var fahrenheitButton = $('#fahrenheit-js');
var authorView = $('#author-js');
var errorView = $('#error-js');
var errorContentView = $('#error-content-js');

var temperature = {
  celsius: {
    current: 0,
    max: 0,
    min: 0
  },
  fahrenheit: {
    current: 0,
    max: 0,
    min: 0
  },
  toggleUnits: function (params) {
    var units = params.units || CELSIUS;
    var animate = params.animate || true;
    var temp = this[units];
    if (animate) {
      temperatureCurrentView.animateValueChange(temp.current);
    } else {
      temperatureCurrentView.text(temp.current);
    }
    temperatureMaxView.text(temp.max);
    temperatureMinView.text(temp.min);
    [celsiusButton, fahrenheitButton].forEach(function(element) {
      element.removeClass('units__element--selected');
    });
    if (units == CELSIUS) {
      celsiusButton.addClass('units__element--selected');
    }
    if (units == FAHRENHEIT) {
      fahrenheitButton.addClass('units__element--selected');
    }
    this.saveUnitsInLocalStorage(units);
  },
  saveUnitsInLocalStorage: function (units) {
    if (this._isLocalStorageAvailable()) {
      localStorage.setItem(this._localStorageKey, units);
    }
  },
  restoreUnitsFromLocalStorage: function () {
    if (!this._isLocalStorageAvailable()) {
      return undefined;
    }
    return localStorage.getItem(this._localStorageKey);
  },
  _localStorageKey: 'fccLocalWeather:temperatureUnits',
  // see: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Feature-detecting_localStorage
  _isLocalStorageAvailable: function() {
    try {
      if (!window.localStorage) return false;
      else return true;
    } catch(err) {
      return false;
    }
  },
};

celsiusButton.click(function (event) {
  event.preventDefault();
  temperature.toggleUnits({
    units: CELSIUS,
    animate: true
  });
});

fahrenheitButton.click(function (event) {
  event.preventDefault();
  temperature.toggleUnits({ 
    units: FAHRENHEIT,
    animate: true
  });
});

if (!navigator.geolocation) {
  showError(`Oops! Your browser doesn't support geolocation.`);
} else {
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
      var weatherText = weatherData.weather[0].main;
      var weatherIconSrc = weatherData.weather[0].icon;
      
      temperature.celsius.current = Math.round(tempCurrent);
      temperature.celsius.max = Math.round(tempMax);
      temperature.celsius.min = Math.round(tempMin);

      temperature.fahrenheit.current = celsiusToFahrenheit(tempCurrent);
      temperature.fahrenheit.max = celsiusToFahrenheit(tempMax);
      temperature.fahrenheit.min = celsiusToFahrenheit(tempMin);

      temperature.toggleUnits({
        units: temperature.restoreUnitsFromLocalStorage(), 
        animate: false
      });
      
      weatherTextView.text(weatherText);
      if (weatherIconSrc) weatherIconView.append($(`<img src="${weatherIconSrc}" class="weather-description__icon">`));

      humidityView.text(humidity);
      pressureView.text(dPaToMmHg(pressure));
      windSpeedView.text(windSpeed);

      hideLoader();
    })
    .catch(function (error) {
      console.log(error);
    });

    weatherRequest.then(function () {
      var countryAlphaCode = weatherData.sys.country;
      return $.ajax(`https://restcountries.eu/rest/v2/alpha/${countryAlphaCode}`);
    })
    .then(function (res) {
      if (res && res.name) {
        setLocationView(res.name);
      } else {
        setLocationView();
      }
    })
    .catch(function (error) {
      setLocationView();
      console.log(error);
    });

    var setLocationView = function(country) {
      var location = weatherData.name;
      var countryName = country || weatherData.sys.country;
      locationView.text(`${location}, ${countryName}`);
    }

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
          .css('background-image', `url(${imageSrc})`)
          .removeClass('container--faded');
        // author credits
        var authorName = res.user.name;
        var authorProfile = res.user.links.html;
        var unsplashUTM = '?utm_source=freeCodeCamp-local-weather-bakoushin&utm_medium=referral&utm_campaign=api-credit';
        var author = `Photo by <a class="author__link" href="${authorProfile + unsplashUTM}" target="_blank">${authorName}</a> /
        <a class="author__link" href="https://unsplash.com${unsplashUTM}" target="_blank">Unsplash</a>`;
        authorView.html(author);
        authorView.addClass('author--visible');
      });
    })
    .catch(function (error) {
      console.log(error);
    });
  }, function(err) {
    showError(`Oops! ${err.message} (error code: ${err.code})`);
  });
}

var showError = function(text) {
  errorView.text(text);
  errorView.addClass('error--visible');
  hideLoader();
}

var hideLoader = function() {
  loaderView.addClass('loader--hidden');
  loaderContentView.addClass('loader__content--hidden');
}

// convert temperature form Celsius to Fahrenheit degrees
var celsiusToFahrenheit = function (temp) {
  return Math.round(temp * 9 / 5 + 32);
}

// convert pressure from dPa to mmHg
var dPaToMmHg = function (pressure) {
  return Math.round(pressure / 10 * 760.001 / 101.325);
}

// return true if now is daytime based on sunrise and sunset provided
var isDaytimeNow = function (sunrise, sunset) {
  var now = Date.now();
  return (now >= sunrise && now < sunset);
}

// animate incrementing/decrementing number
$.fn.extend({
  animateValueChange: function(value) {
    return this
      .prop('_counter', this.text())
      .animate({
        _counter: value
      }, {
        step: function (now) {
            $(this).text(Math.floor(now));
        }
      });
  }
});
