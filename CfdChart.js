Ext.define('CfdChart', {
    xtype: 'cfdchart',
    extend: 'Rally.ui.chart.Chart',
    requires: [
        'CfdCalculator'
    ],

    config: {
        calculatorType: 'CfdCalculator',
        chartConfig: {
            chart: {
                type: 'area'
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                tickmarkPlacement: 'on',
                tickInterval: 15,
                title: {
                    text: 'Date'
                }
            },
            yAxis: [
                {
                    title: {
                        text: 'Points' //TODO: or count
                    }
                }
            ],
            plotOptions: {
                series: {
                    marker: {
                        enabled: false
                    }
                },
                area: {
                    stacking: 'normal'
                }
            }
        }
    },

    constructor: function (config) {
        config = config || {};
        this.mergeConfig(config);

        this.callParent([this.config]);
    }
});
