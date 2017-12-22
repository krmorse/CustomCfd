Ext.define('Settings', {
    singleton: true,

    getSettingsFields: function (context) {
        return [
            {
                name: 'types',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                allowBlank: false,
                editable: false,
                autoSelect: false,
                validateOnChange: true,
                validateOnBlur: true,
                multiSelect: true,
                shouldRespondToScopeChange: true,
                context: context,
                storeConfig: {
                    model: 'TypeDefinition',
                    sorters: [{ property: 'DisplayName' }],
                    fetch: ['DisplayName', 'TypePath'],
                    filters: [
                        { property: 'UserListable', operator: '=', value: true },
                        { property: 'Creatable', operator: '=', value: true }
                    ],
                    autoLoad: false,
                    remoteSort: false,
                    sortOnLoad: true,
                    remoteFilter: true
                },
                displayField: 'DisplayName',
                valueField: 'TypePath',
                listeners: {
                    change: function (combo) {
                        combo.fireEvent('typeselected', combo.getValue(), combo.context);
                    },
                    ready: function (combo) {
                        combo.store.filterBy(function (record) {
                            return Rally.data.ModelTypes.isArtifact(record.get('TypePath'));
                        });

                        if (!combo.getValue().length && combo.originalValue) {
                            combo.setValue(combo.originalValue.split(','));
                            delete combo.originalValue;
                        }
                    }
                },
                bubbleEvents: ['typeselected'],
                readyEvent: 'ready',
                handlesEvents: {
                    projectscopechanged: function (context) {
                        this.refreshWithNewContext(context);
                    }
                }
            },
            {
                name: 'aggregationField', //todo: don't validate on settings load
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Field',
                readyEvent: 'ready',
                allowBlank: false,
                validateOnChange: true,
                validateOnBlur: true,
                width: 300,
                bubbleEvents: ['fieldselected'],
                displayField: 'displayName',
                valueField: 'name',
                store: {
                    fields: ['displayName', 'name'],
                    data: []
                },
                handlesEvents: {
                    typeselected: function (types, context) {
                        if (types.length) {
                            Rally.data.wsapi.ModelFactory.getModels({
                                types: types,
                                context: context.getDataContext(),
                                success: function (models) {
                                    var allModels = _.values(models);
                                    var model = allModels[0];
                                    var fields = model.getFields();
                                    var validFields = _.filter(fields, function (field) {
                                        var hasAllowedValues = field.hasAllowedValues(),
                                            existsOnAllTypes = types.length === 1 || _.every(allModels, function (model) {
                                                return model.hasField(field.name);
                                            }),
                                            isSupportedType = !field.isObject() && !field.isCollection(),
                                            isWritable = !field.readOnly,
                                            isVisible = !field.hidden;

                                        return hasAllowedValues && existsOnAllTypes && isSupportedType && isWritable && isVisible;
                                    });
                                    this.store.loadRawData(validFields);
                                    this.fireEvent('ready', this);
                                },
                                scope: this
                            });
                        } else {
                            this.store.removeAll();
                            this.reset();
                        }
                    }
                },
                listeners: {
                    ready: function (combo) {
                        var values = combo.getStore().getRange();
                        if (values.length && !combo.getValue()) {
                            combo.setValue(combo.originalValue || values[0].name);
                            delete combo.originalValue;
                        }
                    },
                    change: function (combo) {
                        combo.fireEvent('fieldselected', combo.getRecord());
                    }
                }
            },
            {
                name: 'aggregationFieldValues', //todo: don't validate on settings load
                xtype: 'rallycombobox',
                multiSelect: true,
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Field Values',
                readyEvent: 'ready',
                allowBlank: false,
                validateOnChange: true,
                validateOnBlur: true,
                width: 300,
                displayField: 'StringValue',
                valueField: 'StringValue',
                store: {
                    fields: ['StringValue'],
                    data: []
                },
                handlesEvents: {
                    fieldselected: function (field) {
                        if (field) {
                            field.raw.getAllowedValueStore().load().then({
                                success: function (values) {
                                    var validValues = _.filter(values, function (value) {
                                        return value.get('StringValue');
                                    });
                                    this.setValue([]);
                                    this.store.loadRawData(_.pluck(validValues, 'raw'));
                                    this.fireEvent('ready', this);
                                },
                                scope: this
                            });
                        } else {
                            this.store.removeAll();
                            this.reset();
                        }
                    }
                },
                listeners: {
                    ready: function (combo) {
                        if (combo.getStore().getRange().length && !combo.getValue().length && combo.originalValue) {
                            combo.setValue(combo.originalValue.split(','));
                            delete combo.originalValue;
                        }
                    }
                }
            },
            {
                name: 'aggregationType',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Aggregation Type',
                displayField: 'name',
                valueField: 'value',
                editable: false,
                allowBlank: false,
                width: 300,
                store: {
                    fields: ['name', 'value'],
                    data: [
                        { name: 'Count', value: 'count' },
                        { name: 'Points', value: 'points' }
                    ]
                },
                lastQuery: ''
            },
            { type: 'query' }
        ];
    }
});
