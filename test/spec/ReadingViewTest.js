/* global define, describe, it */
define([
	'chai',

	'geomag/Reading',
	'geomag/ReadingView'
], function (
	chai,

	Reading,
	ReadingView
) {
	'use strict';

	var expect = chai.expect;
	var viewOptions = {
		reading: new Reading()
	};

	describe('ReadingView Unit Tests', function () {
		describe('Constructor', function () {
			var m = new ReadingView(viewOptions);

			it('should be an instance of a ReadingView', function () {
				expect(m).to.be.an.instanceOf(ReadingView);
			});
		});
	});
});
