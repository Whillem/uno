// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.core')

/**
 * @ngdoc service
 * @name $mmText
 * @module mm.core
 * @description
 * This service provides functions related to text, like formatting texts from Moodle.
 */
.factory('$mmText', function($q, $mmSite, $mmLang, $translate) {

    var self = {};

    /**
     * Convert size in bytes into human readable format
     * http://codeaid.net/javascript/convert-size-in-bytes-to-human-readable-format-(javascript)
     *
     * @module mm.core
     * @ngdoc method
     * @name $mmText#bytesToSize
     * @param {Number} bytes         Number of bytes to convert.
     * @param {Number} [precision=2] Number of digits after the decimal separator.
     * @return {String}              Size in human readable format.
     */
    self.bytesToSize = function(bytes, precision) {

        if (typeof bytes == 'undefined' || bytes < 0) {
            return $translate.instant('mm.core.notapplicable');
        }

        if (typeof precision == 'undefined' || precision < 0) {
            precision = 2;
        }

        var keys = ['mm.core.sizeb', 'mm.core.sizekb', 'mm.core.sizemb', 'mm.core.sizegb', 'mm.core.sizetb'];
        var units = $translate.instant(keys);
        var posttxt = 0;
        if (bytes >= 1024) {
            while (bytes >= 1024) {
                posttxt++;
                bytes = bytes / 1024;
            }
            bytes = Number(Math.round(bytes+'e+'+precision) + 'e-'+precision); // Round to "precision" decimals if needed.
        }
        return $translate.instant('mm.core.humanreadablesize', {size: Number(bytes), unit: units[keys[posttxt]]});
    };

    /**
     * Function to clean HTML tags.
     *
     * @module mm.core
     * @ngdoc method
     * @name $mmText#cleanTags
     * @param  {String}  text         The text to be cleaned.
     * @param  {Boolean} [singleLine] True if new lines should be removed (all the text in a single line).
     * @return {String}               Text cleaned.
     */
    self.cleanTags = function(text, singleLine) {
        // First, we use a regexpr.
        text = text.replace(/(<([^>]+)>)/ig,"");
        // Then, we rely on the browser. We need to wrap the text to be sure is HTML.
        text = angular.element('<p>').html(text).text(); // Get directive's content.
        // Recover or remove new lines.
        text = self.replaceNewLines(text, singleLine ? ' ' : '<br />');
        return text;
    };

    /**
     * Replace all the new lines on a certain text.
     *
     * @module mm.core
     * @ngdoc method
     * @name $mmText#replaceNewLines
     * @param  {String}  text     The text to be treated.
     * @param  {Boolean} newValue Text to place on each new line.
     * @return {String}           Treated text.
     */
    self.replaceNewLines = function(text, newValue) {
        return text.replace(/(?:\r\n|\r|\n)/g, newValue);
    }

    /**
     * Formats a text, treating multilang tags and cleaning HTML if needed.
     *
     * @module mm.core
     * @ngdoc method
     * @name $mmText#formatText
     * @param  {String} text             Text to format.
     * @param  {Boolean} clean           True if HTML tags should be removed, false otherwise.
     * @param  {Boolean} [singleLine]    True if new lines should be removed. Only valid if clean is true.
     * @param  {Number}  [shortenLength] Number of characters to shorten the text.
     * @return {Promise}                 Promise resolved with the formatted text.
     */
    self.formatText = function(text, clean, singleLine, shortenLength) {
        return self.treatMultilangTags(text).then(function(formatted) {
            if (clean) {
                formatted = self.cleanTags(formatted, singleLine);
            }
            if (shortenLength && parseInt(shortenLength) > 0) {
                formatted = self.shortenText(formatted, parseInt(shortenLength));
            }
            return formatted;
        });
    };

    /**
     * Shortens a text to length and adds an ellipsis.
     *
     * @module mm.core
     * @ngdoc method
     * @name $mmText#shortenText
     * @param  {String} text The text to be shortened.
     * @param  {Number} length The desired length.
     * @return {String} Shortened text.
     */
    self.shortenText = function(text, length) {
        if (text.length > length) {
            text = text.substr(0, length);

            // Now, truncate at the last word boundary (if exists).
            var lastWordPos = text.lastIndexOf(' ');
            if (lastWordPos > 0) {
                text = text.substr(0, lastWordPos);
            }
            text += '&hellip;';
        }
        return text;
    };

    /**
     * Treat the multilang tags from a HTML code, leaving only the current language.
     *
     * @param {String} text   The text to be formatted.
     * @param {String} siteId ID of the site to use. If not set, use current site.
     * @return {Promise}      Promise resolved with the formatted text.
     */
    self.treatMultilangTags = function(text) {

        var deferred = $q.defer();

        if (!text) {
            deferred.resolve('');
            return deferred.promise;
        }

        return $mmLang.getCurrentLanguage().then(function(language) {
            // Multilang tags.
            // Match the current language
            var re = new RegExp('<(?:lang|span)[^>]+lang="' + language + '"[^>]*>(.*?)<\/(?:lang|span)>',"g");
            text = text.replace(re, "$1");
            // Delete the rest of languages
            text = text.replace(/<(?:lang|span)[^>]+lang="([a-zA-Z0-9_-]+)"[^>]*>(.*?)<\/(?:lang|span)>/g,"");
            return text;
        });
    };

    return self;
});
