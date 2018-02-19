var Functional = require('underscore');

var Locales = require('../config/localeConfig');

var LogMessageProvider = (function (locales) {
  var logResources = require('../resources/locales/'.concat(locales.default, '/log'));

  function compose(format, _) {
    var argsCount = arguments.length - 1;
    var result = format;

    for (var i = 0; i < argsCount; i += 1) {
      var regex = new RegExp('\\{' + i + '\\}', 'g');
      var value = arguments[i + 1];

      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      result = result.replace(regex, value);
    }

    return result;
  }

  function loadLocale(locale) {
    if (typeof locale === undefined || locale === null || Functional.contains(locales.supported, locale) === false) {
      locale = locales.default;
    }
    
    logResources = require('../resources/locales/'.concat(locale, '/log'));

    return false;
  }

  function getMessageLog(key, parameters) {
    var format = logResources[key];

    parameters.unshift(format);

    return compose.apply(null, parameters);
  }

  function applyMessageLog(parameters) {
    var key = parameters[0];
    var format = logResources[key];
    var newParameters = parameters.slice(); // For copying original array

    newParameters[0] = format;

    return compose.apply(null, newParameters);
  }

  return {
    loadLocale: function (locale) {
      loadLocale(locale);
      return false;
    },

    getMessageLog: function (key, parameters) {
      return getMessageLog(key, parameters);
    },

    applyMessageLog: function (parameters) {
      return applyMessageLog(parameters);
    }
  };
})(Locales);

module.exports = LogMessageProvider;

// TODO: Think about cases where a key does not exists in the resource file.