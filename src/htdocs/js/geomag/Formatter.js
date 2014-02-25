/*global define*/
define([
], function (
) {
	'use strict';


	var NANOTESLAS = 'nT',
		DEGREES = '°',
		MINUTES = '\'',
		DEFAULT_DIGITS = 2;

	var Formatter = {};

	/*Formatter._degreeUnits = function (degrees) {
		var buf = [];

		buf.push(degrees, '<span class="units">°</span>');

		return buf.join('');
	};

	Formatter._minuteUnits = function (minutes) {
		var buf = [];

		buf.push(minutes, '<span class="units">\'</span>');

		return buf.join('');
	};

	Formatter._ntUnits = function (nt_value) {
		return [nt_value, this._units(NANOTESLAS)].join('');
	};*/

	Formatter._units = function (units){
		return ['<span class="units">', units, '</span>'].join('');
	};


	/////////////////////////////////////////////////////////////////////////////
	// CONVERSIONS
	/////////////////////////////////////////////////////////////////////////////


	/**
	 * Decimal angle to degrees, minutes, seconds
	 *
	 * @param angle {Number} Decimal degrees
	 *
	 * @return {Array of Integers}
	 *
	 * @see MeasurementViewTest#degree_inversion_check
	 */
	Formatter.decimalToDms = function (angle) {
		var degrees = parseInt(angle, 10),
		    minutes = (angle - degrees) * 60,
		    seconds = Math.round((minutes - parseInt(minutes, 10)) * 60, 10);

		minutes = parseInt(minutes, 10);

		// Correct any errors due to floating point
		minutes += parseInt(seconds / 60, 10);
		seconds = seconds % 60;

		return [degrees, minutes, seconds];
	};

	/**
	 * Degrees, minutes, seconds to decimal angle
	 *
	 * @param degs {Number}
	 *        The degree portion of the angle value. If this is a decimal,
	 *        then the fractional portion is converted to minutes.
	 * @param mins {Number}
	 *        The minutes portion of the angle value. If this is a decimal,
	 *        then the fractional portion is converted to seconds.
	 * @param secs {Integer}
	 *        The seconds portion of the angle value.
	 *
	 * @return {Decimal}
	 *        The decimal degrees for the given DMS value.
	 *
	 * @see MeasurementViewTest#degree_inversion_check
	 */
	Formatter.dmsToDecimal = function (degs, mins, secs) {
		return (parseInt(secs, 10) / 3600) + (parseFloat(mins) / 60) +
				parseFloat(degs);
	};

	/**
	 * Parse a date string into an epoch timestamp.
	 *
	 * @param date {String}
	 *        UTC date in format 'YYYY-MM-DD'.
	 * @return {Number} corresponding epoch timestamp (for 00:00:00), or null.
	 */
	Formatter.parseDate = function(date) {
		if (date !== '') {
			var parts = date.split('-');
			return Date.UTC(parseInt(parts[0], 10),
					parseInt(parts[1], 10) - 1,
					parseInt(parts[2], 10));
		}
		return null;
	};

	/**
	 * Relative Time
	 *
	 * @param time {String}
	 *      The formatted time string to parse. The date for the returned time
	 *      is inherited from the observation "begin" attribute.
	 *
	 * @return {Integer}
	 *      The millisecond timestamp since the epoch.
	 */
	Formatter.parseRelativeTime = function (time, offset) {
		var timeString = time.replace(/[^\d]/g, ''),
		    hours = 0,
		    minutes = 0,
		    seconds = 0;

		// Offset should default to 0 if it doesn't exist
		if (typeof offset === 'undefined' || offset === null) {
			offset = new Date();
		}

		if (timeString.length === 4) {
			// HHMM
			hours = parseInt(timeString.substr(0, 2), 10);
			minutes = parseInt(timeString.substr(2, 2), 10);
		} else if (timeString.length === 5) {
			// HMMSS
			hours = parseInt(timeString.substr(0, 1), 10);
			minutes = parseInt(timeString.substr(1, 2), 10);
			seconds = parseInt(timeString.substr(3, 2), 10);
		} else if (timeString.length === 6) {
			// HHMMSS
			hours = parseInt(timeString.substr(0, 2), 10);
			minutes = parseInt(timeString.substr(2, 2), 10);
			seconds = parseInt(timeString.substr(4, 2), 10);
		} else {
			throw new Error('Unexpected time string');
		}
		offset = Date.UTC(offset.getUTCFullYear(),
					offset.getUTCMonth(), offset.getUTCDate(),
					hours, minutes, seconds, 0);

		return offset;
	};


	/////////////////////////////////////////////////////////////////////////////
	// FORMATS
	/////////////////////////////////////////////////////////////////////////////


	/**
	 * Degrees, as an angle
	 *
	 * @param angle {Number} Decimal degrees
	 *
	 * @return formatted number with units
	 *    {Float} Angle degrees, 2 decimal places
	 */
	Formatter.degrees = function (angle, digits) {
		if (typeof decimal_places === 'undefined') {
			digits = DEFAULT_DIGITS;
		}
		return this.rawDegrees(angle.toFixed(digits));
	};

	/**
	 * Degrees, as an angle, no rounding
	 *
	 * @param angle {Number|String}
	 *
	 * @return formatted number with units
	 *    {Float} Angle degrees
	 */
	Formatter.rawDegrees = function (angle) {
		var buf = [];

		buf.push(
				'<span class="deg">',
					angle, this._units(DEGREES),
				'</span>');

		return buf.join('');
	};

	/**
	 * Minutes, as an angle
	 *
	 * @param angle {Number} Decimal minutes
	 *
	 * @return formatted number with units
	 *    {Float} Angle minutes, 2 decimal places
	 */
	Formatter.minutes = function (angle, digits) {
		if (typeof decimal_places === 'undefined') {
			digits = DEFAULT_DIGITS;
		}
		return this.rawMinutes(angle.toFixed(digits));
	};

	/**
	 * Minutes, as an angle
	 *
	 * @param angle {Number|String}
	 *
	 * @return formatted number with units
	 *    {Float} Angle minutes, 2 decimal places
	 */
	Formatter.rawMinutes = function (angle) {
		var buf = [];

		buf.push(
				'<span class="minutes">',
					angle, this._units(MINUTES),
				'</span>');

		return buf.join('');
	};

	/**
	 * Degrees Minutes, as an angle
	 *
	 * @param angle {Number} Decimal degrees
	 *
	 * @return 2 formatted numbers with units
	 *    {Int} Angle degrees
	 *    {Float} Decimal angle minutes, 2 decimal places
	 */
	Formatter.degreesMinutes = function (angle) {
		var buf = [],
		    degrees,
		    minutes;

		degrees = parseInt(angle, 10);
		minutes = (angle - degrees) * 60;

		buf.push(
				this.rawDegrees(degrees),
				'&nbsp;',
				this.minutes(minutes));

		return buf.join('');
	};

	/**
	 * Degrees and Degrees Minutes, as an angle
	 *
	 * @param angle {Number} Decimal degrees
	 *
	 * @return 3 formatted numbers with units
	 *    {Float} Decimal angle degrees, 2 decimal places
	 *    {Int} Angle degrees
	 *    {Float} Decimal angle minutes, 2 decimal places
	 */
	Formatter.degreesAndDegreesMinutes = function (angle) {
		var buf = [];

		buf.push(
				this.degrees(angle),
				'<span class="degrees-minutes">',
					this.degreesMinutes(angle),
				'</span>');

		return buf.join('');
	};

	/**
	 * nT (nano-teslas)
	 *
	 * @param {Number} nT
	 *
	 * @return formatted number with units
	 *    {Float} nT, 2 decimal places
	 */
	Formatter.nanoteslas = function (nT, digits) {
		if (typeof decimal_places === 'undefined') {
			digits = DEFAULT_DIGITS;
		}

		return this.rawNanoteslas(nT.toFixed(digits));
	};

	/**
	 * nT (nano-teslas), no rounding
	 *
	 * @param {Number} nT
	 *
	 * @return formatted number with units
	 *    {Float} nT
	 */
	Formatter.rawNanoteslas = function (nT) {
		var buf = [];

		buf.push(
				'<span class="nano-teslas">',
					nT, this._units(NANOTESLAS),
				'</span>');

		return buf.join('');
	};

	/**
	 * Date to String
	 *
	 * @param date {Integer}
	 *      Timestamp (in milliseconds) since the epoch.
	 *
	 * @return {String}
	 *      A string formatted as "YYYY-MM-DD" representing the input time.
	 */
	Formatter.date = function (time) {
		var offset = new Date(time),
		    y = offset.getUTCFullYear(),
		    m = offset.getUTCMonth() + 1,
		    d = offset.getUTCDate();

		return [y, (m<10?'-0':'-'), m, (d<10?'-0':'-'), d].join('');
	};

	/**
	 * Time to String
	 *
	 * @param time {Integer}
	 *      Timestamp (in milliseconds) since the epoch.
	 *
	 * @return {String}
	 *      A string formatted as "HH:mm:ss" representing the input time.
	 */
	Formatter.time = function (time) {
		var offset = new Date(time),
		    h = offset.getUTCHours(),
		    m = offset.getUTCMinutes(),
		    s = offset.getUTCSeconds();

		return [(h<10?'0':''), h, (m<10?':0':':'), m, (s<10?':0':':'), s].join('');
	};

	/**
	 * Date Time to String
	 *
	 * @param date time {Integer}
	 *      Timestamp (in milliseconds) since the epoch.
	 *
	 * @return {String}
	 *      A string formatted as "YYYY-MM-DD HH:mm:ss"
	 *      representing the input time.
	 */
	Formatter.dateTime = function (time) {
		return this.date(time) + ' ' + this.time(time);
	};

	return Formatter;
});
