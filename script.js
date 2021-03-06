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

var temperature = (function() {

  var LOCAL_STORAGE_KEY = 'fccLocalWeather:temperatureUnits';
  
  var units = restoreUnitsFromLocalStorage() || CELSIUS;
  var data;
  
  return {
    setData: setData,
    setUnits: setUnits
  };

  function setData (current, max, min) {
    current = Math.round(current);
    max = Math.round(max);
    min = Math.round(min);

    data = { 
      celsius: {
        current: current,
        max: max,
        min: min
      },
      fahrenheit: {
        current: celsiusToFahrenheit(current),
        max: celsiusToFahrenheit(max),
        min: celsiusToFahrenheit(min)
      }
    };

    display({
      animate: false
    });
  }

  function setUnits(params) {
    units = params.units;
    var animate = params.animate;
    display({
      animate: animate
    })
  }

  function display (params) {
    var animate = params.animate;
    var temp = data[units];
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
    saveUnitsInLocalStorage(units);
  };

  function saveUnitsInLocalStorage (units) {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(LOCAL_STORAGE_KEY, units);
    }
  };

  function restoreUnitsFromLocalStorage () {
    if (!isLocalStorageAvailable()) {
      return undefined;
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  };

  // see: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Feature-detecting_localStorage
  function isLocalStorageAvailable () {
    try {
      if (!window.localStorage) return false;
      else return true;
    } catch(err) {
      return false;
    }
  };

  function celsiusToFahrenheit (temp) {
    return Math.round(temp * 9 / 5 + 32);
  }

})();

celsiusButton.click(function (event) {
  event.preventDefault();
  temperature.setUnits({
    units: CELSIUS,
    animate: true
  });
});

fahrenheitButton.click(function (event) {
  event.preventDefault();
  temperature.setUnits({ 
    units: FAHRENHEIT,
    animate: true
  });
});

if (!navigator.geolocation) {
  showError("Oops! Your browser doesn't support geolocation.");
} else {
  navigator.geolocation.getCurrentPosition(function (location) {
    var latitude = location.coords.latitude;
    var longitude = location.coords.longitude;
    var weatherData; // for sharing weather data between promises

    // get weather data
    var weatherRequest = $.ajax('https://fcc-weather-api.glitch.me/api/current?lat=' + latitude + '&lon=' + longitude)
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
      
      temperature.setData(tempCurrent, tempMax, tempMin);
      
      weatherTextView.text(weatherText);
      if (weatherIconSrc) {
        $('<img>').attr('src', weatherIconSrc)
          .addClass('weather-description__icon')
          .appendTo(weatherIconView);
      }

      humidityView.text(humidity);
      pressureView.text(dPaToMmHg(pressure));
      windSpeedView.text(windSpeed);

      hideLoader();
    })
    .catch(function (error) {
      showError('Oops! Could not get weather information.');
    });

    // get country full name
    var countryFullName;
    weatherRequest.then(function () {
      var countryAlphaCode = weatherData.sys.country;
      return $.ajax('https://restcountries.eu/rest/v2/alpha/' + countryAlphaCode);
    })
    .then(function (res) {
      if (res && res.name) {
        countryFullName = res.name;
      } else {
        throw new Error;
      }
    })
    .always(function () {
      var location = weatherData.name;
      var countryName = countryFullName || weatherData.sys.country;
      locationView.text(location + ', ' + countryName);
    });

    // get background image
    weatherRequest.then(function () {
      var sunrise = weatherData.sys.sunrise * 1000;
      var sunset = weatherData.sys.sunset * 1000;
      var isDaytime = isDaytimeNow(sunrise, sunset);
      var weatherDescription = weatherData.weather[0].description;
      var imageQuery = weatherDescription + ' ' + (isDaytime ? 'day' : 'night');
      return $.ajax('https://berry-drill.glitch.me/' + imageQuery);
    })
    .then(function (res) {
      // preload image before updating background
      var imageSrc = res.urls.regular;
      $('<img>').attr('src', imageSrc).on('load', function () {
        $(this).remove;
        containerView
          .css('background-image', 'url(' + imageSrc + ')')
          .removeClass('container--faded');
        // author credits
        var authorName = res.user.name;
        var authorProfile = res.user.links.html;
        var unsplashUTM = '?utm_source=freeCodeCamp-local-weather-bakoushin&utm_medium=referral&utm_campaign=api-credit';
        var author = 'Photo by <a class="author__link" href="' + authorProfile + unsplashUTM + '" target="_blank">' + authorName + '</a> / <a class="author__link" href="https://unsplash.com' + unsplashUTM + '" target="_blank">Unsplash</a>';
        authorView.html(author).addClass('author--visible');
      });
    });
  }, function(err) {
    showError('Oops! ' + err.message + ' (error code: ' + err.code + ')');
  });
}

function showError (text) {
  errorView.text(text).addClass('error--visible');
  hideLoader();
}

function hideLoader () {
  loaderView.addClass('loader--hidden');
  loaderContentView.addClass('loader__content--hidden');
}

// convert pressure from dPa to mmHg
function dPaToMmHg (pressure) {
  return Math.round(pressure / 10 * 760.001 / 101.325);
}

// return true if now is daytime based on sunrise and sunset provided
function isDaytimeNow (sunrise, sunset) {
  var now = Date.now();
  return (now >= sunrise && now < sunset);
}

// animate incrementing/decrementing number
$.fn.extend({
  animateValueChange: function(value) {
    return this.prop('_counter', this.text())
      .animate({
        _counter: value
      }, {
        step: function (now) {
            $(this).text(Math.floor(now));
        }
      });
  }
});
