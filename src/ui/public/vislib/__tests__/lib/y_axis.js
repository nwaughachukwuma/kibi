let _ = require('lodash');
let d3 = require('d3');
let $ = require('jquery');
let ngMock = require('ngMock');
let expect = require('expect.js');

let YAxis;
let Data;
let persistedState;
let el;
let buildYAxis;
let yAxis;
let yAxisDiv;

let timeSeries = [
  1408734060000,
  1408734090000,
  1408734120000,
  1408734150000,
  1408734180000,
  1408734210000,
  1408734240000,
  1408734270000,
  1408734300000,
  1408734330000
];

let defaultGraphData = [
  [ 8, 23, 30, 28, 36, 30, 26, 22, 29, 24 ],
  [ 2, 13, 20, 18, 26, 20, 16, 12, 19, 14 ]
];

function makeSeriesData(data) {
  return timeSeries.map(function (timestamp, i) {
    return {
      x: timestamp,
      y: data[i] || 0
    };
  });
}

function createData(seriesData) {
  let data = {
    hits: 621,
    label: 'test',
    ordered: {
      date: true,
      interval: 30000,
      max: 1408734982458,
      min: 1408734082458
    },
    series: seriesData.map(function (series) {
      return { values: makeSeriesData(series) };
    }),
    xAxisLabel: 'Date Histogram',
    yAxisLabel: 'Count'
  };

  let node = $('<div>').css({
    height: 40,
    width: 40
  })
  .appendTo('body')
  .addClass('y-axis-wrapper')
  .get(0);

  el = d3.select(node).datum(data);

  yAxisDiv = el.append('div')
  .attr('class', 'y-axis-div');

  let dataObj = new Data(data, {
    defaultYMin: true
  }, persistedState);

  buildYAxis = function (params) {
    return new YAxis(_.merge({}, params, {
      el: node,
      yMin: dataObj.getYMin(),
      yMax: dataObj.getYMax(),
      _attr: {
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        defaultYMin: true,
        setYExtents: false,
        yAxis: {}
      }
    }));
  };

  yAxis = buildYAxis();
}

describe('Vislib yAxis Class Test Suite', function () {
  beforeEach(ngMock.module('kibana'));

  beforeEach(ngMock.inject(function (Private) {
    Data = Private(require('ui/vislib/lib/data'));
    persistedState = new (Private(require('ui/persisted_state/persisted_state')))();
    YAxis = Private(require('ui/vislib/lib/y_axis'));

    expect($('.y-axis-wrapper')).to.have.length(0);
  }));

  afterEach(function () {
    el.remove();
    yAxisDiv.remove();
  });

  describe('render Method', function () {
    beforeEach(function () {
      createData(defaultGraphData);
      expect(d3.select(yAxis.el).selectAll('.y-axis-div')).to.have.length(1);
      yAxis.render();
    });

    it('should append an svg to div', function () {
      expect(el.selectAll('svg').length).to.be(1);
    });

    it('should append a g element to the svg', function () {
      expect(el.selectAll('svg').select('g').length).to.be(1);
    });

    it('should append ticks with text', function () {
      expect(!!el.selectAll('svg').selectAll('.tick text')).to.be(true);
    });
  });

  describe('getYScale Method', function () {
    let yScale;
    let graphData;
    let domain;
    let height = 50;

    function checkDomain(min, max) {
      let domain = yScale.domain();
      expect(domain[0]).to.be.lessThan(min + 1);
      expect(domain[1]).to.be.greaterThan(max - 1);
      return domain;
    }

    function checkRange() {
      expect(yScale.range()[0]).to.be(height);
      expect(yScale.range()[1]).to.be(0);
    }

    describe('API', function () {
      beforeEach(function () {
        createData(defaultGraphData);
        yScale = yAxis.getYScale(height);
      });

      it('should return a function', function () {
        expect(_.isFunction(yScale)).to.be(true);
      });
    });

    describe('should return log values', function () {
      let domain;
      let extents;

      it('should return 1', function () {
        yAxis._attr.scale = 'log';
        extents = [0, 400];
        domain = yAxis._getExtents(extents);

        // Log scales have a yMin value of 1
        expect(domain[0]).to.be(1);
      });
    });

    describe('positive values', function () {
      beforeEach(function () {
        graphData = defaultGraphData;
        createData(graphData);
        yScale = yAxis.getYScale(height);
      });


      it('should have domain between 0 and max value', function () {
        let min = 0;
        let max = _.max(_.flattenDeep(graphData));
        let domain = checkDomain(min, max);
        expect(domain[1]).to.be.greaterThan(0);
        checkRange();
      });
    });

    describe('negative values', function () {
      beforeEach(function () {
        graphData = [
          [ -8, -23, -30, -28, -36, -30, -26, -22, -29, -24 ],
          [ -22, -8, -30, -4, 0, 0, -3, -22, -14, -24 ]
        ];
        createData(graphData);
        yScale = yAxis.getYScale(height);
      });

      it('should have domain between min value and 0', function () {
        let min = _.min(_.flattenDeep(graphData));
        let max = 0;
        let domain = checkDomain(min, max);
        expect(domain[0]).to.be.lessThan(0);
        checkRange();
      });
    });

    describe('positive and negative values', function () {
      beforeEach(function () {
        graphData = [
          [ 8, 23, 30, 28, 36, 30, 26, 22, 29, 24 ],
          [ 22, 8, -30, -4, 0, 0, 3, -22, 14, 24 ]
        ];
        createData(graphData);
        yScale = yAxis.getYScale(height);
      });

      it('should have domain between min and max values', function () {
        let min = _.min(_.flattenDeep(graphData));
        let max = _.max(_.flattenDeep(graphData));
        let domain = checkDomain(min, max);
        expect(domain[0]).to.be.lessThan(0);
        expect(domain[1]).to.be.greaterThan(0);
        checkRange();
      });
    });

    describe('validate user defined values', function () {
      beforeEach(function () {
        yAxis._attr.mode = 'stacked';
        yAxis._attr.setYExtents = false;
        yAxis._attr.yAxis = {};
      });

      it('should throw a NaN error', function () {
        let min = 'Not a number';
        let max = 12;

        expect(function () {
          yAxis._validateUserExtents(min, max);
        }).to.throwError();
      });

      it('should return a decimal value', function () {
        yAxis._attr.mode = 'percentage';
        yAxis._attr.setYExtents = true;
        domain = [];
        domain[0] = yAxis._attr.yAxis.min = 20;
        domain[1] = yAxis._attr.yAxis.max = 80;
        let newDomain = yAxis._validateUserExtents(domain);

        expect(newDomain[0]).to.be(domain[0] / 100);
        expect(newDomain[1]).to.be(domain[1] / 100);
      });

      it('should return the user defined value', function () {
        domain = [20, 50];
        let newDomain = yAxis._validateUserExtents(domain);

        expect(newDomain[0]).to.be(domain[0]);
        expect(newDomain[1]).to.be(domain[1]);
      });
    });

    describe('should throw an error when', function () {
      it('min === max', function () {
        let min = 12;
        let max = 12;

        expect(function () {
          yAxis._validateAxisExtents(min, max);
        }).to.throwError();
      });

      it('min > max', function () {
        let min = 30;
        let max = 10;

        expect(function () {
          yAxis._validateAxisExtents(min, max);
        }).to.throwError();
      });
    });
  });

  describe('getScaleType method', function () {
    let fnNames = ['linear', 'log', 'square root'];

    it('should return a function', function () {
      fnNames.forEach(function (fnName) {
        expect(yAxis._getScaleType(fnName)).to.be.a(Function);
      });

      // if no value is provided to the function, scale should default to a linear scale
      expect(yAxis._getScaleType()).to.be.a(Function);
    });

    it('should throw an error if function name is undefined', function () {
      expect(function () {
        yAxis._getScaleType('square');
      }).to.throwError();
    });
  });

  describe('_logDomain method', function () {
    it('should throw an error', function () {
      expect(function () {
        yAxis._logDomain(-10, -5);
      }).to.throwError();
      expect(function () {
        yAxis._logDomain(-10, 5);
      }).to.throwError();
      expect(function () {
        yAxis._logDomain(0, -5);
      }).to.throwError();
    });

    it('should return a yMin value of 1', function () {
      let yMin = yAxis._logDomain(0, 200)[0];
      expect(yMin).to.be(1);
    });
  });

  describe('getYAxis method', function () {
    let mode;
    let yMax;
    let yScale;
    beforeEach(function () {
      createData(defaultGraphData);
      mode = yAxis._attr.mode;
      yMax = yAxis.yMax;
      yScale = yAxis.getYScale;
    });

    afterEach(function () {
      yAxis._attr.mode = mode;
      yAxis.yMax = yMax;
      yAxis.getYScale = yScale;
    });

    it('should use percentage format for percentages', function () {
      yAxis._attr.mode = 'percentage';
      let tickFormat = yAxis.getYAxis().tickFormat();
      expect(tickFormat(1)).to.be('100%');
    });

    it('should use decimal format for small values', function () {
      yAxis.yMax = 1;
      let tickFormat = yAxis.getYAxis().tickFormat();
      expect(tickFormat(0.8)).to.be('0.8');
    });

    it('should throw an error if yScale is NaN', function () {
      yAxis.getYScale = function () { return NaN; };
      expect(function () {
        yAxis.getYAxis();
      }).to.throwError();
    });
  });

  describe('draw Method', function () {
    beforeEach(function () {
      createData(defaultGraphData);
    });

    it('should be a function', function () {
      expect(_.isFunction(yAxis.draw())).to.be(true);
    });
  });

  describe('tickScale Method', function () {
    beforeEach(function () {
      createData(defaultGraphData);
    });

    it('should return the correct number of ticks', function () {
      expect(yAxis.tickScale(1000)).to.be(11);
      expect(yAxis.tickScale(40)).to.be(3);
      expect(yAxis.tickScale(20)).to.be(0);
    });
  });

  describe('#tickFormat()', function () {
    let formatter = function () {};

    it('returns a basic number formatter by default', function () {
      let yAxis = buildYAxis();
      expect(yAxis.tickFormat()).to.not.be(formatter);
      expect(yAxis.tickFormat()(1)).to.be('1');
    });

    it('returns the yAxisFormatter when passed', function () {
      let yAxis = buildYAxis({
        yAxisFormatter: formatter
      });
      expect(yAxis.tickFormat()).to.be(formatter);
    });

    it('returns a percentage formatter when the vis is in percentage mode', function () {
      let yAxis = buildYAxis({
        yAxisFormatter: formatter,
        _attr: {
          mode: 'percentage'
        }
      });

      expect(yAxis.tickFormat()).to.not.be(formatter);
      expect(yAxis.tickFormat()(1)).to.be('100%');
    });
  });
});
