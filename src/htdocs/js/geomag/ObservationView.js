'use strict';

var Collection = require('mvc/Collection'),
    ModalView = require('mvc/ModalView'),
    Util = require('util/Util'),
    View = require('mvc/View'),

    Calculator = require('geomag/ObservationBaselineCalculator'),
    Formatter = require('geomag/Formatter'),
    ObservationMetaView = require('geomag/ObservationMetaView'),
    ObservatoryFactory = require('geomag/ObservatoryFactory'),
    ReadingGroupView = require('geomag/ReadingGroupView'),
    RealtimeDataFactory = require('geomag/RealtimeDataFactory'),
    User = require('geomag/User');


var _DEFAULTS = {
  calculator: null,
  factory: null,
  observationId: null,
  realtimeDataFactory: null
};


/**
 * Callback to show publish success in modal dialog.
 *
 * @param status {Integer}
 *        http error status code.
 * @param xhr {XMLHttpRequest}
 *        XHR object with error information.
 */
var __saveSuccess = function () {
  (ModalView(
    '<h3>Success!</h3><p>Your observation has been saved.</p>',
    {
      title: 'Save Successful',
      classes: ['modal-success'],
      closable: true
    }
  )).show();
};

/**
 * Callback to show publish erros in modal dialog.
 *
 * @param status {Integer}
 *        http error status code.
 * @param xhr {XMLHttpRequest}
 *        XHR object with error information.
 */
var __saveError = function (status, xhr) {
  (ModalView(
    '<h3>Error</h3><p>' + xhr.response + '</p>',
    {
      title: 'Save Failed',
      classes: ['modal-error'],
      closable: true
    }
  )).show();
};

/**
 * Callback to show publish success in modal dialog.
 *
 */
var __publishSuccess = function () {
  (ModalView(
    '<h3>Success!</h3><p>Observation marked as reviewed.</p>',
    {
      title: 'Observation successfully marked as reviewed',
      classes: ['modal-success'],
      closable: true
    }
  )).show();
};

/**
 * Callback to show publish errors in modal dialog.
 *
 * @param status {Integer}
 *        http error status code.
 * @param xhr {XMLHttpRequest}
 *        XHR object with error information.
 */
var __publishError = function (status, xhr) {
  (ModalView(
    '<h3>Error</h3><p>' + xhr.response + '</p>',
    {
      title: 'Failed to mark observation as reviewed',
      classes: ['modal-error'],
      closable: true
    }
  )).show();
};


/**
 * Callback to show publish success in modal dialog.
 *
 * @param status {Integer}
 *        http error status code.
 * @param xhr {XMLHttpRequest}
 *        XHR object with error information.
 */
var __getRealtimeDataSuccess = function () {
  (ModalView(
    '<h3>Success!</h3><p>Realtime data updated.</p>',
    {
      title: 'Realtime Data Update Successful',
      classes: ['modal-success'],
      closable: true
    }
  )).show();
};

/**
 * Callback to show publish erros in modal dialog.
 *
 * @param status {Integer}
 *        http error status code.
 * @param xhr {XMLHttpRequest}
 *        XHR object with error information.
 */
var __getRealtimeDataError = function (status, xhr) {
  (ModalView(
    '<h3>Error</h3><p>' + xhr.response + '</p>',
    {
      title: 'Realtime Data Update Failed',
      classes: ['modal-error'],
      closable: true
    }
  )).show();
};


/**
 * Construct a new ObservationView.
 *
 * @param options {Object}
 *        view options.
 * @param options.calculator {geomag.ObservationBaselineCalculator}
 *        the calculator to use.
 * @param options.factory {geomag.ObservatoryFactory}
 *        the factory to use.
 */
var ObservationView = function (options) {
  var _this,
      _initialize,

      _annotation,
      _annotationPrint,
      _calculator,
      _factory,
      _observation,
      _observatories,
      _observationMetaView,
      _publishButton,
      _readingGroupView,
      _realtimeDataFactory,
      _saveButton,
      _updateRealtimeDataButton,
      _user,

      _createControls,
      _formatMeasurementErrors,
      _getRealtimeData,
      _onChange,
      _onObservatorySelect,
      _onPublishClick,
      _onSaveClick,
      _publishObservation,
      _removeEventListeners,
      _saveObservation,
      _setObservation,
      _setObservatories,
      _updateErrorCount;


  _this = View(options);

  _initialize = function (options) {
    var el;

    el = _this.el;
    options = Util.extend({}, _DEFAULTS, options);

    _calculator = options.calculator || Calculator();
    _factory = options.factory || ObservatoryFactory();
    _observation = null;
    _observatories = null;
    _observationMetaView = null;
    _readingGroupView = null;
    _realtimeDataFactory = options.realtimeDataFactory || RealtimeDataFactory();
    _user = User.getCurrentUser();

    el.innerHTML = [
      '<section class="observation-view">',
        '<section class="observation-meta-wrapper"></section>',
        '<section class="reading-group-view-wrapper"></section>',
        '<section class="annotation">',
          '<h4>Comments</h4>',
          '<textarea id="observation-remarks" class="noprint"></textarea>',
          '<div id="observation-remarks-print" class="printonly"></div>',
        '</section>',
        '<section class="observation-view-controls"></section>',
      '</section>'
    ].join('');

    // load observation
    _factory.getObservation({
      id: options.observationId || null,
      success: _setObservation
    });
  };

  /**
   * Create a panel at the bottom of the Observation view to create, update,
   * or delete the observation.
   *
   */
  _createControls = function () {
    var controls,
        reviewed,
        status,
        statusLabel,
        tooltip;

    controls = _this.el.querySelector('.observation-view-controls');
    reviewed = _observation.get('reviewed').toLowerCase();

    statusLabel = document.createElement('span');
    statusLabel.className = 'review-status-' + reviewed;

    if (reviewed ==='y') {
      status = 'Status: Reviewed';
      tooltip = 'Observation Reviewed';
    } else if (reviewed ==='n') {
      status = 'Status: Pending Review';
      tooltip = 'Observation Pending Review';
    } else {
      status = 'Status: Unknown';
      tooltip = 'Observation in unknown review status!';
    }

    statusLabel.innerHTML = status;
    statusLabel.title = tooltip;
    controls.appendChild(statusLabel);

    _saveButton = document.createElement('button');
    _saveButton.id = 'saveButton';
    _saveButton.innerHTML = 'Save Observation';
    _saveButton.addEventListener('click', _onSaveClick);
    controls.appendChild(_saveButton);

    // Add publish button for admin users
    if (_user.get('admin') === 'Y') {
      _publishButton = document.createElement('button');
      _publishButton.innerHTML = 'Mark as Reviewed';
      controls.appendChild(_publishButton);

      _publishButton.addEventListener('click', _onPublishClick);
    }

    _updateRealtimeDataButton = document.createElement('button');
    _updateRealtimeDataButton.id = 'updateRealtimeDataButton';
    _updateRealtimeDataButton.innerHTML = 'Update Realtime Data';
    _updateRealtimeDataButton.addEventListener('click', _getRealtimeData);
    controls.appendChild(_updateRealtimeDataButton);
  };

  _formatMeasurementErrors = function (measurement) {
    var time_error = measurement.get('time_error'),
        angle_error = measurement.get('angle_error'),
        markup = [];

    if (time_error !== null) {
      markup.push(measurement.get('type') + ' - ' + time_error);
    }

    if (angle_error !== null) {
      markup.push(measurement.get('type') + ' - ' + angle_error);
    }

    if (markup.length === 0) {
      return null;
    }

    return '<li>' + markup.join('</li><li>') + '</li>';
  };

  /**
   * Get realtime data for all measurements.
   */
  _getRealtimeData = function (e) {
    var observatory = _realtimeDataFactory.get('observatory'),
        starttime = null,
        endtime = null,
        fromButton = false;

    if (observatory === null) {
      // need more information
      return;
    }

    if (e && typeof(e.preventDefault) === 'function') {
      fromButton = true;
    }

    // find times to request
    _observation.eachMeasurement(function (measurement) {
      var time = measurement.get('time');
      if (time === null) {
        return;
      }
      if (starttime === null || time < starttime) {
        starttime = time;
      }
      if (endtime === null || time > endtime) {
        endtime = time;
      }
    });
    if (starttime === null || endtime === null) {
      // need more information
      return;
    }

    // request realtime data
    starttime = Math.round(starttime / 1000);
    endtime = Math.round(endtime / 1000);

    _updateRealtimeDataButton.disabled = true;
    _realtimeDataFactory.getRealtimeData({
      starttime: Formatter.dateTimeIso(starttime * 1000),
      endtime: Formatter.dateTimeIso(endtime * 1000),
      success: function (realtimeData) {
        _updateRealtimeDataButton.disabled = false;
        // update measurement data
        _observation.eachMeasurement(function (measurement) {
          measurement.setRealtimeData(realtimeData);
        });
        if (fromButton) {
          __getRealtimeDataSuccess();
        }
      },
      error: function (status, xhr) {
        _updateRealtimeDataButton.disabled = false;
        if (fromButton) {
          __getRealtimeDataError(status, xhr);
        }
      }
    });

    // request realtime temperature data
    _realtimeDataFactory.getRealtimeTemperatureData({
      starttime: Formatter.dateTimeIso(starttime * 1000),
      endtime: Formatter.dateTimeIso(endtime * 1000),
      success: function (realtimeData) {
        var averageTime,
            minuteTime,
            values;
        // just get the average time
        averageTime = Math.floor((starttime + endtime) / 2.0);
        // temperature data is minute data.
        minuteTime = averageTime - averageTime % 60;
        // realtimeData values are in milliseconds, convert seconds to ms.
        values = realtimeData.getValues(minuteTime*1000);
        if (values.UK4 !== undefined) {
          _observation.set({'outside_temperature':values.UK4});
        }
        if (values.UK2 !== undefined) {
          _observation.set({'proton_temperature':values.UK2});
        }
        if (values.UK1 !== undefined) {
          _observation.set({'elect_temperature':values.UK1});
        }
        if (values.UK3 !== undefined) {
          _observation.set({'flux_temperature':values.UK3});
        }
      }
    });

  };

  _onChange = function () {
    _observation.set({
      annotation: _annotation.value
    });
    _annotationPrint.innerHTML = _annotation.value;
  };

  /**
   * Called when an observatory is selected.
   */
  _onObservatorySelect = function () {
    var code,
        observatory;

    code = null;

    observatory = _observatories.getSelected();
    if (observatory !== null) {
      code = observatory.get('code');
    }

    _realtimeDataFactory.set({observatory: code});
  };

  /**
   * Publish button click handler.
   */
  _onPublishClick = function () {
    try {
      _saveObservation(function () {
        _publishObservation(__publishSuccess, __publishError);
      }, __saveError);
    } catch (e) {
      __publishError('Failed to finalize baselines', e.message);
    }
  };

  /**
   * Save button click handler.
   */
  _onSaveClick = function () {
    _saveObservation(__saveSuccess, __saveError);
  };

  /**
   * Save the observation, on success publish that data to the magproc2 server.
   *
   * @param callback {Function}
   *        called after publish succeeds.
   * @param errback {Function}
   *        called after publish fails.
   */
  _publishObservation = function (callback, errback) {
    _publishButton.disabled = true;
    _factory.publishObservation({
      observation: _observation,
      user: _observation.get('reviewer_user_id'),
      success: function (observation) {
        _publishButton.disabled = false;
        _observation.set({
          reviewed: observation.get('reviewed'),
          reviewer_user_id: observation.get('reviewer_user_id')
        });
        callback();
      },
      error: function (status, xhr) {
        _publishButton.disabled = false;
        if (typeof errback === 'function') {
          errback(status, xhr);
        } else {
          throw new Error(xhr.response);
        }
      }
    });
  };

  /**
   * Save the current observation.
   *
   * @param callback {Function}
   *        called after save succeeds.
   * @param errback {Function}
   *        called after save fails.
   */
  _saveObservation = function (callback, errback) {
    // update observation reading model with calibrations before saving
    _this.updateCalibrations();

    _this.updateObservationBegin();

    _saveButton.disabled = true;
    _factory.saveObservation({
      observation: _observation,
      success: function (observation) {
        _saveButton.disabled = false;
        _observation.set({id: observation.get('id')}, {silent: true});
        callback();
      },
      error: function (status, xhr) {
        _saveButton.disabled = false;
        if (typeof errback === 'function') {
          errback(status, xhr);
        } else {
          throw new Error(xhr.response);
        }
      }
    });
  };

  /**
   * Called when observation has been loaded.
   *
   * @param observation {Observation}
   *        result of ObservatoryFactory.getObservatory().
   */
  _setObservation = function (observation) {
    var el;

    el = _this.el;

    _observation = observation;

    // calculate calibrations for summary view
    _this.updateCalibrations();

    // create reading group view
    _readingGroupView = ReadingGroupView({
      calculator: _calculator,
      el: el.querySelector('.reading-group-view-wrapper'),
      observation: _observation
    });

    // load observatories for meta view
    _observation.getObservatories({
      success: _setObservatories
    });

    // bind realtime data factory and measurements.
    _realtimeDataFactory.on('change:observatory', _getRealtimeData);
    _observation.on('change:begin', _getRealtimeData);
    _observation.eachMeasurement(function (measurement) {
      measurement.on('change:time', _getRealtimeData);
    });

    _observation.on('change', _updateErrorCount);

    // bind to measurement change
    _observation.eachMeasurement(function (measurement) {
      measurement.on('change', _updateErrorCount);
    });

    // bind calibration update to measurement change
    _observation.eachMeasurement(function (measurement) {
      measurement.on('change', _this.updateCalibrations);
    });

    _annotation = el.querySelector('.annotation > textarea');
    _annotation.innerHTML = _observation.get('annotation');
    _annotation.addEventListener('change', _onChange);

    _annotationPrint = el.querySelector('.annotation > div');
    _annotationPrint.innerHTML = _observation.get('annotation');

    _createControls();
  };

  /**
   * Called when observatories have been loaded.
   *
   * @param observatories {Array<Object>}
   *        result of ObservatoryFactory.getObservatories().
   */
  _setObservatories = function (observatories) {
    var el,
        i,
        len,
        observatory,
        observatory_id;

    el = _this.el;

    // filter observatories list for non admin users
    if (_user.get('admin') !== 'Y') {
      observatory_id = _user.get('default_observatory_id');

      if (observatory_id !== null) {
        observatory_id = parseInt(observatory_id, 10);

        for (i = 0, len = observatories.length; i < len; i++) {
          if (observatories[i].id === observatory_id) {
            observatories = [observatories[i]];
            break;
          }
        }
        if (observatories.length !== 1) {
          observatories = [];
        }
      } else {
        observatories = [];
      }
    }

    // convert to collection
    _observatories = Collection(observatories);

    // bind before select code below, so this will run for first select
    _observatories.on('select', _onObservatorySelect, this);

    // select observation observatory if set
    observatory_id = _observation.get('observatory_id');

    if (observatory_id !== null) {
      observatory = _observatories.get(observatory_id);
      if (observatory !== null) {
        _observatories.select(observatory);
      }
    }

    // create observation meta view
    _observationMetaView = ObservationMetaView({
      calculator: _calculator,
      el: el.querySelector('.observation-meta-wrapper'),
      observation: _observation,
      observatories: _observatories,
      observatoryId: parseInt(window.location.hash.replace('#', ''), 10)
    });
  };

  // Remove all event listeners
  _removeEventListeners = function () {
    // unbind calibration update to measurement change
    _observation.eachMeasurement(function (measurement) {
      measurement.removeEventListener('change', _this.updateCalibrations);
    });

    // unbind measurement change
    _observation.eachMeasurement(function (measurement) {
      measurement.removeEventListener('change', _updateErrorCount);
    });

    // unbind realtime data factory and measurements.
    _observation.removeEventListener('change', _updateErrorCount);
    _observation.eachMeasurement(function (measurement) {
      measurement.removeEventListener('change:time', _getRealtimeData);
    });
    _observation.removeEventListener('change:begin', _getRealtimeData);
    _realtimeDataFactory.removeEventListener(
        'change:observatory', _getRealtimeData);

    _annotation.removeEventListener('change', _onChange);

    // These controls are only created if the loaded observation isn't final.
    if (_publishButton) {
      _publishButton.removeEventListener('click', _onPublishClick);
    }
    if (_saveButton) {
      _saveButton.removeEventListener('click', _onSaveClick);
    }
    if (_updateRealtimeDataButton) {
      _updateRealtimeDataButton.removeEventListener('click', _getRealtimeData);
    }
  };

  _updateErrorCount = function () {
    var begin_error,
        el,
        errorDiv,
        errors,
        header,
        list,
        measurementErrors,
        readingErrors,
        setNumber;

    errors = [];
    el = _this.el.querySelector('.observation-view-controls');
    begin_error = _observation.get('begin_error');

    if (begin_error !== null) {
      errors.push('<li>' + begin_error + '</li>');
    }

    _observation.eachReading(function (reading) {
      setNumber = reading.get('set_number');
      readingErrors = [];

      reading.eachMeasurement(function (measurement) {

        // get all errors for the measurement
        measurementErrors = _formatMeasurementErrors(measurement);

        // check for number of measurement errors
        if (measurementErrors !== null) {
          // if there are errors add to total number of errors
          readingErrors.push(measurementErrors);
        }

      });

      // organize all errors by reading set
      if (readingErrors.length > 0) {
        errors.push('<li>' +
            'Set ' + setNumber + ' has error(s)' +
              '<ul>' +
                readingErrors.join('') +
              '</ul>' +
          '</li>'
        );
      }
    });

    errorDiv = el.querySelector('.error');
    // errors exist, append details
    if (errors.length > 0) {
      list = el.querySelector('.alert > ul');

      if (list) {
        list.innerHTML = errors.join('');
      } else {
        errorDiv = document.createElement('div');
        errorDiv.className = 'alert error';
        el.appendChild(errorDiv);

        header = document.createElement('header');
        header.innerHTML = 'Errors';
        errorDiv.appendChild(header);

        list = document.createElement('ul');
        list.innerHTML = errors.join('');
        errorDiv.appendChild(list);

        // disable the save button
        if (_saveButton) {
          _saveButton.setAttribute('disabled', 'disabled');
        }
        if (_updateRealtimeDataButton) {
          _updateRealtimeDataButton.setAttribute('disabled', 'disabled');
        }
      }
    } else {
        // enable the save button
        if (_saveButton) {
          _saveButton.removeAttribute('disabled');
        }
        if (_updateRealtimeDataButton) {
          _updateRealtimeDataButton.removeAttribute('disabled');
        }

        if (errorDiv) {
          errorDiv.remove();
        }
    }
  };

  /**
   * Summarize component D,H,Z and store the calibrated values on
   * the reading model object
   */
  _this.updateCalibrations = function () {
    var i,
        len,
        reading,
        readings;

    readings = _observation.get('readings').data();

    for (i = 0, len = readings.length; i < len; i++) {
      reading = readings[i];

      _factory.setCalibrationD(reading);
      _factory.setCalibrationH(reading);
      _factory.setCalibrationZ(reading);
    }
  };

  /**
   * Calculate observation begin time based on reading times.
   *
   * Should be called after updateCalibrations, which set reading times.
   */
  _this.updateObservationBegin = function () {
    var begin,
        end,
        i,
        len,
        reading,
        readings;

    // start with unreasonable defaults
    begin = Number.MAX_VALUE;
    end = Number.MIN_VALUE;

    // set reading times
    readings = _observation.get('readings').data();
    for (i = 0, len = readings.length; i < len; i++) {
      reading = readings[i];
      begin = Math.min(begin,
          reading.get('startH') || Number.MAX_VALUE,
          reading.get('startD') || Number.MAX_VALUE,
          reading.get('startZ') || Number.MAX_VALUE);
      end = Math.max(end,
          reading.get('endH') || Number.MIN_VALUE,
          reading.get('endD') || Number.MIN_VALUE,
          reading.get('endZ') || Number.MIN_VALUE);
    }

    // update based on actual measurement times
    _observation.set({
      begin: begin,
      end: end
    });
  };

  _this.destroy = Util.compose(
    // sub class destroy method
    function () {
      _removeEventListeners();

      // Clean up private methods
      _createControls = null;
      _formatMeasurementErrors = null;
      _getRealtimeData = null;
      _onChange = null;
      _onObservatorySelect = null;
      _onPublishClick = null;
      _onSaveClick = null;
      _publishObservation = null;
      _removeEventListeners = null;
      _saveObservation = null;
      _setObservation = null;
      _setObservatories = null;
      _updateErrorCount = null;

      // Clean up private variables
      _annotation = null;
      _calculator = null;
      _factory = null;
      _observation = null;
      _observatories = null;
      _observationMetaView = null;
      _publishButton = null;
      _readingGroupView = null;
      _realtimeDataFactory = null;
      _saveButton = null;
      _updateRealtimeDataButton = null;
      _user = null;
    },
    // parent class destroy method
    _this.destroy);


  _initialize(options);
  options = null;
  return _this;
};

module.exports = ObservationView;
