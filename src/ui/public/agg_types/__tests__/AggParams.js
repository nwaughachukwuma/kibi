describe('AggParams class', function () {
  let _ = require('lodash');
  let ngMock = require('ngMock');
  let expect = require('expect.js');

  let AggParams;
  let BaseAggParam;
  let FieldAggParam;
  let OptionedAggParam;
  let RegexAggParam;

  beforeEach(ngMock.module('kibana'));
  // stub out the param classes before we get the AggParams
  beforeEach(ngMock.inject(require('./utils/_stub_agg_params')));
  // fetch out deps
  beforeEach(ngMock.inject(function (Private) {
    AggParams = Private(require('ui/agg_types/AggParams'));
    BaseAggParam = Private(require('ui/agg_types/param_types/base'));
    FieldAggParam = Private(require('ui/agg_types/param_types/field'));
    OptionedAggParam = Private(require('ui/agg_types/param_types/optioned'));
    RegexAggParam = Private(require('ui/agg_types/param_types/regex'));
  }));

  describe('constructor args', function () {
    it('accepts an array of param defs', function () {
      let params = [
        { name: 'one' },
        { name: 'two' }
      ];
      let aggParams = new AggParams(params);

      expect(aggParams).to.have.length(params.length);
      expect(aggParams).to.be.an(Array);
      expect(aggParams.byName).to.have.keys(['one', 'two']);
    });
  });

  describe('AggParam creation', function () {
    it('Uses the FieldAggParam class for params with the name "field"', function () {
      let params = [
        { name: 'field' }
      ];
      let aggParams = new AggParams(params);

      expect(aggParams).to.have.length(params.length);
      expect(aggParams[0]).to.be.a(FieldAggParam);
    });

    it('Uses the OptionedAggParam class for params of type "optioned"', function () {
      let params = [
        {
          name: 'interval',
          type: 'optioned'
        }
      ];
      let aggParams = new AggParams(params);

      expect(aggParams).to.have.length(params.length);
      expect(aggParams[0]).to.be.a(OptionedAggParam);
    });

    it('Uses the RegexAggParam class for params of type "regex"', function () {
      let params = [
        {
          name: 'exclude',
          type: 'regex'
        }
      ];
      let aggParams = new AggParams(params);

      expect(aggParams).to.have.length(params.length);
      expect(aggParams[0]).to.be.a(RegexAggParam);
    });

    it('Always converts the params to a BaseAggParam', function () {
      let params = [
        {
          name: 'height',
          editor: '<blink>high</blink>'
        },
        {
          name: 'weight',
          editor: '<blink>big</blink>'
        },
        {
          name: 'waist',
          editor: '<blink>small</blink>'
        }
      ];
      let aggParams = new AggParams(params);

      expect(BaseAggParam).to.have.property('callCount', params.length);
      expect(FieldAggParam).to.have.property('callCount', 0);
      expect(OptionedAggParam).to.have.property('callCount', 0);

      expect(aggParams).to.have.length(params.length);
      aggParams.forEach(function (aggParam) {
        expect(aggParam).to.be.a(BaseAggParam);
      });
    });
  });
});
