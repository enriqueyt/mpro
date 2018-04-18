var Functional = require('underscore');

var Locales = require('../../config/localeConfig');

var AppMessageProvider = (function (locales) {
  var appResources = require('../resources/locales/'.concat(locales.default, '/app'));

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
    
    appResources = require('../resources/locales/'.concat(locale, '/app'));

    return false;
  }

  function getMessage(key, parameters) {
    var format = appResources[key];

    parameters.unshift(format);

    return compose.apply(null, parameters);
  }

  return {
    loadLocale: function (locale) {
      loadLocale(locale);
      return false;
    },

    getMessage: function (key, parameters) {
      return getMessage(key, parameters);
    }
  };
})(Locales);

module.exports = AppMessageProvider;

// TODO: Think about cases where a key does not exist in the resource file.