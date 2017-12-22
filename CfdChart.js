Ext.define('CfdChart', {
    xtype: 'cfdchart',
    extend: 'Rally.ui.chart.Chart',
    requires: [
        'CfdCalculator'
    ],

    config: {
        calculatorType: 'CfdCalculator',
        chartColors: [
            "#FF8200", // $orange
            "#F6A900", // $gold
            "#FAD200", // $yellow
            "#8DC63F", // $lime
            "#1E7C00", // $green_dk
            "#337EC6", // $blue_link
            "#005EB8", // $blue
            "#7832A5", // $purple,
            "#DA1884",  // $pink,
            "#C0C0C0" // $grey4
        ],
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
