Ext.define('CustomCfdApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    items: [
        {
            xtype: 'rallyleftright',
            itemId: 'header',
            height: 30
        },
        {
            xtype: 'container',
            itemId: 'filterContainer',
        },
        {
            xtype: 'container',
            itemId: 'chartContainer',
            layout: 'fit',
            flex: 1
        }
    ],

    config: {
        defaultSettings: {
            types: 'HierarchicalRequirement,Defect',
            aggregationField: 'ScheduleState',
            aggregationFieldValues: 'Idea,Defined,In-Progress,Completed,Accepted,Released',
            aggregationType: 'points',
            startDate: '',
            endDate: '',
            query: ''
        }
    },

    getSettingsFields: function () {
        return Settings.getSettingsFields(this.getContext());
    },

    launch: function () {
        Rally.data.wsapi.ModelFactory.getModels({
            types: this._getTypesSetting(),
            context: this.getContext().getDataContext()
        }).then({
            success: this._onModelsLoaded,
            scope: this
        });
    },

    _onModelsLoaded: function (models) {
        this.models = _.values(models);
        var blackListFields = [],
            whiteListFields = ['Milestones', 'Tags'],
            modelNames = this._getTypesSetting();

        this.down('#header').getLeft().add({
            xtype: 'rallyinlinefiltercontrol',
            context: this.getContext(),
            height: 26,
            align: 'left',
            inlineFilterButtonConfig: {
                stateful: true,
                stateId: this.getContext().getScopedStateId('inline-filter'),
                context: this.getContext(),
                modelNames: modelNames,
                filterChildren: false,
                inlineFilterPanelConfig: {
                    quickFilterPanelConfig: {
                        defaultFields: ['ModelType', 'ArtifactSearch'],
                        addQuickFilterConfig: {
                            blackListFields: blackListFields,
                            whiteListFields: whiteListFields
                        }
                    },
                    advancedFilterPanelConfig: {
                        advancedFilterRowsConfig: {
                            propertyFieldConfig: {
                                blackListFields: blackListFields,
                                whiteListFields: whiteListFields
                            }
                        }
                    }
                },
                listeners: {
                    inlinefilterchange: this._onFilterChange,
                    inlinefilterready: this._onFilterReady,
                    scope: this
                }
            }
        });
        this.down('#header').getRight().add({
            xtype: 'rallybutton',
            cls: 'secondary rly-small',
            margin: '3px 20px 0 0',
            frame: false,
            iconCls: 'icon-export',
            toolTipConfig: {
                html: 'Export',
                anchor: 'top',
                hideDelay: 0
            },
            listeners: {
                click: this._onExportClick,
                scope: this
            }
        });
    },

    _onFilterReady: function (inlineFilterPanel) {
        this.down('#filterContainer').add(inlineFilterPanel);
    },

    _onFilterChange: function (inlineFilterButton) {
        this.filterInfo = inlineFilterButton.getTypesAndFilters();
        this._loadData();
    },

    _loadData: function () {
        this.down('#chartContainer').removeAll(true);
        this.down('#chartContainer').setLoading(true);

        Ext.create('Rally.data.wsapi.artifact.Store', {
            autoLoad: true,
            context: this.getContext().getDataContext(),
            limit: Infinity,
            pageSize: 2000,
            models: this.filterInfo.types,
            filters: this.filterInfo.filters.concat(this._getFilters()),
            fetch: ['ObjectID'],
            listeners: {
                load: this._onWsapiDataRetrieved,
                scope: this
            }
        });
    },

    _onWsapiDataRetrieved: function (store) {
        var oids = _.map(store.getRange(), function (record) {
            return record.getId();
        });

        this._addChart(oids);
    },

    _onExportClick: function () {
        var link = document.createElement('a');
        var chartData = this.down('rallychart').chartData;
        var data = _.reduce(chartData.categories, function(accum, category, i) {
            var row = [category];
            _.each(chartData.series, function(series) {
                row.push(series.data[i]);
            });
            accum.push(row.join(','));
            return accum;
        }, [['Date'].concat(_.pluck(chartData.series, 'name')).join(',')]);
        link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURI(data.join('\n')));
        link.setAttribute('download', 'cfd.csv');
        link.click();
    },

    _addChart: function (oids) {
        var startDate = this.getSetting('startDate'),
            endDate = this.getSetting('endDate');
            
        this.down('#chartContainer').add({
            xtype: 'cfdchart',
            loadMask: false,
            pointsOrCount: this.getSetting('aggregationType'),
            storeType: 'Rally.data.lookback.SnapshotStore',
            context: this.getContext(),
            storeConfig: {
                find: {
                    _TypeHierarchy: { $in: this._getTypesSetting() },
                    ObjectID: { $in: oids },
                    Children: null //only applies to stories
                },
                fetch: ['_ValidFrom', '_ValidTo', this.getSetting('aggregationField'), 'PlanEstimate'],
                hydrate: [this.getSetting('aggregationField')],
                compress: true,
                useHttpPost: true,
                listeners: {
                    load: function () {
                        this.down('#chartContainer').setLoading(false);
                    },
                    scope: this
                }
            },
            calculatorConfig: {
                stateFieldName: this.getSetting('aggregationField'),
                stateFieldValues: this.getSetting('aggregationFieldValues').split(','),
                pointsOrCount: this.getSetting('aggregationType'),
                startDate: moment(startDate || new Date()).toDate(),
                endDate: moment(endDate || new Date()).toDate(),
            }
        });
    },

    _getTypesSetting: function () {
        return this.getSetting('types').split(',');
    },

    onTimeboxScopeChange: function () {
        this.callParent(arguments);

        this._loadData(this.down('#filterButton').getTypesAndFilters());
    },

    _getFilters: function () {
        var queries = [],
            timeboxScope = this.getContext().getTimeboxScope();
        if (this.getSetting('query')) {
            queries.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
        }
        if (timeboxScope && _.every(this.models, timeboxScope.isApplicable, timeboxScope)) {
            queries.push(timeboxScope.getQueryFilter());
        }
        return queries;
    }
});
