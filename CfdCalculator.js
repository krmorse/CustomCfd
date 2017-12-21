Ext.define('CfdCalculator', {
    extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',

    getMetrics: function () {
        return _.map(this.stateFieldValues, function (stateFieldValue) {
                return  {
                    field: 'PlanEstimate', //TODO: handle count
                    as: stateFieldValue,
                    f: 'filteredSum',
                    filterField: this.stateFieldName,
                    filterValues: [stateFieldValue],
                    display: 'area'
                };
            }, this);
    }
});