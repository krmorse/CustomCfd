Ext.define('CustomCfdApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    items: [
        {
            xtype: 'container',
            itemId: 'header',
            height: 26
        },
        {
            xtype: 'container',
            itemId: 'filterContainer',
        },
        {
            xtype: 'container',
            itemId: 'chartContainer',
            flex: 1
        }
    ],

    config: {
        defaultSettings: {
            types: 'HierarchicalRequirement,Defect',
            aggregationField: 'ScheduleState',
            aggregationType: 'count',
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

        this.down('#header').add({
            xtype: 'rallyinlinefiltercontrol',
            context: this.getContext(),
            height: 26,
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

    _onWsapiDataRetrieved: function(store) {
        this.down('#chartContainer').setLoading(false);
        var oids = _.map(store.getRange(), function(record) {
            return record.getId();
        });
        
        this._addChart(oids);
    },

    _addChart: function (oids) {
        this.add({ 
            xtype: 'cfdchart',
            storeType: 'Rally.data.lookback.SnapshotStore',
            context: this.getContext(),
            storeConfig: {
                find: {
                    _TypeHierarchy: { $in: this._getTypesSetting() },
                    ObjectID: { $in: oids },
                    Children: null //only applies to stories
                },
                fetch: [this.getSetting('aggregationField'), 'PlanEstimate'],
                hydrate: [this.getSetting('aggregationField')],
                compress: true
            },
            calculatorConfig: {
                stateFieldName: this.getSetting('aggregationField'),
                stateFieldValues: ['Defined', 'In-Progress', 'Completed', 'Accepted'] //TODO: from settings
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
