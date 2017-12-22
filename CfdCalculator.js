Ext.define('CfdCalculator', {
    extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',

    config: {
        stateFieldValues: [],
        stateFieldName: '',
        pointsOrCount: 'points'
    },

    constructor: function (config) {
        config = config || {};
        this.mergeConfig(config);

        this.callParent([this.config]);
    },

    getMetrics: function () {
        return _.map(this.stateFieldValues, function (stateFieldValue) {
                return  {
                    field: 'PlanEstimate',
                    as: stateFieldValue,
                    f: this.pointsOrCount === 'points' ? 'filteredSum' : 'filteredCount',
                    filterField: this.stateFieldName,
                    filterValues: [stateFieldValue],
                    display: 'area'
                };
            }, this);
    }
});