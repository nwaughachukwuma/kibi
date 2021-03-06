let expect = require('expect.js');
let filterAppliedAndUnwrap = require('ui/filter_bar/lib/filterAppliedAndUnwrap');
describe('Filter Bar Directive', function () {
  describe('filterAppliedAndUnwrap()', function () {

    let filters = [
      { meta: { apply: true }, exists: { field: '_type' } },
      { meta: { apply: false }, query: { query_string: { query: 'foo:bar' } } }
    ];

    it('should filter the applied and unwrap the filter', function () {
      let results = filterAppliedAndUnwrap(filters);
      expect(results).to.have.length(1);
      expect(results[0]).to.eql(filters[0]);
    });

  });
});
