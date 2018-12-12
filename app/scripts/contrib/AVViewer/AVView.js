define(['backbone.marionette',
    'communicator',
    'app',
    'models/AVModel',
    'globals',
    'd3',
    'graphly',
    'analytics'
], function(Marionette, Communicator, App, AVModel, globals) {
    'use strict';
    var AVView = Marionette.View.extend({
        model: new AVModel.AVModel(),
        className: 'analytics',
        initialize: function() {
            this.isClosed = true;
            this.requestUrl = '';
            this.plotType = 'scatter';
            this.sp = undefined;

            $(window).resize(function() {
                if(this.graph1){
                    this.graph1.resize();
                }
                if(this.graph2 && $('#graph_2').is(":visible")){
                    this.graph2.resize();
                }
            }.bind(this));
            this.connectDataEvents();
        },

        onShow: function() {
            var that = this;
            this.stopListening(Communicator.mediator, 'change:axis:parameters', this.onChangeAxisParameters);
            this.listenTo(Communicator.mediator, 'change:axis:parameters', this.onChangeAxisParameters);

            this.isClosed = false;
            this.selectionList = [];
            this.plotdata = [];
            this.requestUrl = '';
            this.img = null;
            this.overlay = null;
            this.activeWPSproducts = [];
            this.plotType = 'scatter';
            this.prevParams = [];

            this.reloadUOM();


            if (typeof this.graph1 === 'undefined' && 
                typeof this.graph2 === 'undefined') {
                this.$el.append('<div class="d3canvas"></div>');
                this.$('.d3canvas').append('<div id="graph_container"></div>');
                this.$('#graph_container').append('<div id="graph_1"></div>');
                this.$('#graph_container').append('<div id="graph_2"></div>');

                this.$('#graph_1').append('<div id="analyticsSavebuttonTop"><i class="fa fa-floppy-o analyticsSavebutton" aria-hidden="true"></i></div>');
                this.$('#graph_2').append('<div id="analyticsSavebuttonBottom"><i class="fa fa-floppy-o analyticsSavebutton" aria-hidden="true"></i></div>');



                $('#analyticsSavebuttonTop').click(function(){
                    var bodyContainer = $('<div/>');

                    var typeContainer = $('<div id="typeSelectionContainer"></div>')
                    var filetypeSelection = $('<select id="filetypeSelection"></select>');
                    filetypeSelection.append($('<option/>').html('png'));
                    filetypeSelection.append($('<option/>').html('jpeg'));
                    filetypeSelection.append($('<option/>').html('svg'));
                    typeContainer.append(
                        $('<label for="filetypeSelection" style="margin-right:10px;">Output type</label>')
                    );
                    typeContainer.append(filetypeSelection);
                    var w = $('#graph_1').width();
                    var h = $('#graph_1').height();

                    var resolutionContainer = $('<div id="resolutionSelectionContainer"></div>')
                    var resolutionSelection = $('<select id="resolutionSelection"></select>');
                    resolutionSelection.append($('<option/>').html('normal ('+w+'x'+h+')').val(1));
                    resolutionSelection.append($('<option/>').html('large ('+w*2+'x'+h*2+')').val(2));
                    resolutionSelection.append($('<option/>').html('very large ('+w*3+'x'+h*3+')').val(3));
                    resolutionContainer.append(
                        $('<label for="resolutionSelection" style="margin-right:10px;">Resolution</label>')
                    );
                    resolutionContainer.append(resolutionSelection);

                    bodyContainer.append(typeContainer);
                    bodyContainer.append(resolutionContainer);

                    var okbutton = $('<button style="margin-right:5px;">Ok</button>');
                    var cancelbutton = $('<button style="margin-left:5px;">Cancel</button>');
                    var buttons = $('<div/>');
                    buttons.append(okbutton);
                    buttons.append(cancelbutton);

                    if (that.graph1){
                        var saveimagedialog = w2popup.open({
                            body: bodyContainer,
                            buttons: buttons,
                            title       : w2utils.lang('Image configuration'),
                            width       : 400,
                            height      : 200
                        });

                        okbutton.click(function(){
                            var selectedType = $('#filetypeSelection')
                                .find(":selected").text();
                            var selectedRes = $('#resolutionSelection')
                                .find(":selected").val();
                            that.graph1.saveImage(selectedType, selectedRes);
                            bodyContainer.remove();
                            saveimagedialog.close();
                        });
                        cancelbutton.click(function(){
                            bodyContainer.remove();
                            saveimagedialog.close();
                        });
                    }
                });

                $('#analyticsSavebuttonBottom').click(function(){
                    var bodyContainer = $('<div/>');

                    var typeContainer = $('<div id="typeSelectionContainer"></div>')
                    var filetypeSelection = $('<select id="filetypeSelection"></select>');
                    filetypeSelection.append($('<option/>').html('png'));
                    filetypeSelection.append($('<option/>').html('jpeg'));
                    filetypeSelection.append($('<option/>').html('svg'));
                    typeContainer.append(
                        $('<label for="filetypeSelection" style="margin-right:10px;">Output type</label>')
                    );
                    typeContainer.append(filetypeSelection);
                    var w = $('#graph_1').width();
                    var h = $('#graph_1').height();

                    var resolutionContainer = $('<div id="resolutionSelectionContainer"></div>')
                    var resolutionSelection = $('<select id="resolutionSelection"></select>');
                    resolutionSelection.append($('<option/>').html('normal ('+w+'x'+h+')').val(1));
                    resolutionSelection.append($('<option/>').html('large ('+w*2+'x'+h*2+')').val(2));
                    resolutionSelection.append($('<option/>').html('very large ('+w*3+'x'+h*3+')').val(3));
                    resolutionContainer.append(
                        $('<label for="resolutionSelection" style="margin-right:10px;">Resolution</label>')
                    );
                    resolutionContainer.append(resolutionSelection);

                    bodyContainer.append(typeContainer);
                    bodyContainer.append(resolutionContainer);

                    var okbutton = $('<button style="margin-right:5px;">Ok</button>');
                    var cancelbutton = $('<button style="margin-left:5px;">Cancel</button>');
                    var buttons = $('<div/>');
                    buttons.append(okbutton);
                    buttons.append(cancelbutton);
                    
                    if (that.graph2){
                        var saveimagedialog = w2popup.open({
                            body: bodyContainer,
                            buttons: buttons,
                            title       : w2utils.lang('Image configuration'),
                            width       : 400,
                            height      : 200
                        });

                        okbutton.click(function(){
                            var selectedType = $('#filetypeSelection')
                                .find(":selected").text();
                            var selectedRes = $('#resolutionSelection')
                                .find(":selected").val();
                            that.graph2.saveImage(selectedType, selectedRes);
                            bodyContainer.remove();
                            saveimagedialog.close();
                        });
                        cancelbutton.click(function(){
                            bodyContainer.remove();
                            saveimagedialog.close();
                        });
                    }
                });

                

                this.$('.d3canvas').append('<div id="filterDivContainer"></div>');
                this.$el.append('<div id="nodataavailable"></div>');
                $('#nodataavailable').text('No data available for current selection');
                this.$('#filterDivContainer').append('<div id="analyticsFilters"></div>');
            }else{
                if(this.graph1){
                    this.graph1.resize();
                }
                if(this.graph2){
                    this.graph2.resize();
                }
            }

            this.$('#filterDivContainer').append('<div id="filterSelectDrop"></div>');
            var filterList = localStorage.getItem('selectedFilterList');
            if(filterList !== null){
                filterList = JSON.parse(filterList);
                this.selectedFilterList = filterList;
            } else {
                this.selectedFilterList = [
                    // L1B
                    'mie_bin_quality_flag', 'mie_HLOS_wind_speed',
                    'geoid_separation','velocity_at_DEM_intersection',
                    'rayleigh_bin_quality_flag', 'rayleigh_HLOS_wind_speed',
                    // L2A
                    'rayleigh_altitude_obs',
                    'SCA_backscatter','SCA_QC_flag',
                    'SCA_extinction_variance', 'SCA_backscatter_variance','SCA_LOD_variance',
                    'mie_altitude_obs','MCA_LOD',
                    // L2B, L2C
                    'mie_wind_result_SNR', 'mie_wind_result_HLOS_error',
                    'mie_wind_result_COG_range',
                    'mie_wind_result_QC_flags_1',
                    'rayleigh_wind_result_HLOS_error', 'rayleigh_wind_result_COG_range',
                    'rayleigh_wind_result_QC_flags_1',
                    // AUX MRC RRC
                    'measurement_response', 
                    'measurement_error_mie_response',
                    'reference_pulse_response', 
                    'mie_core_measurement_FWHM',
                    'measurement_error_rayleigh_response',
                    'reference_pulse_error_rayleigh_response',
                    'ground_measurement_response',
                    'ground_measurement_error_rayleigh_response',
                    'reference_pulse_error_mie_response',
                    'rayleigh_channel_A_response', 'rayleigh_channel_B_response',
                    'fizeau_transmission','mie_response','mean_laser_energy_mie',
                    'mean_laser_energy_rayleigh','FWHM_mie_core_2',
                    // AUX ZWC
                    'mie_ground_correction_velocity','rayleigh_ground_correction_velocity',
                    'mie_avg_ground_echo_bin_thickness_above_DEM', 'rayleigh_avg_ground_echo_bin_thickness_above_DEM',
                    'ZWC_result_type',
                    // AUX MET
                    'surface_wind_component_u_off_nadir',
                    'surface_wind_component_u_nadir',
                    'surface_wind_component_v_off_nadir',
                    'surface_wind_component_v_nadir',
                    'surface_pressure_off_nadir','surface_pressure_nadir',
                    'surface_altitude_off_nadir', 'surface_altitude_nadir'
                ]
            }

            this.renderSettings = {
                rayleigh: {
                    xAxis: ['time'],
                    yAxis: [
                        'rayleigh_altitude'
                    ],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    combinedParameters: {
                        rayleigh_altitude: ['rayleigh_altitude_start', 'rayleigh_altitude_end'],
                        rayleigh_range: ['rayleigh_range_start', 'rayleigh_range_end'],
                        latitude_of_DEM_intersection: [
                            'latitude_of_DEM_intersection_start',
                            'latitude_of_DEM_intersection_end'
                        ],
                        longitude_of_DEM_intersection: [
                            'longitude_of_DEM_intersection_start',
                            'longitude_of_DEM_intersection_end'
                        ],
                        time: ['time_start', 'time_end'],
                    },
                    colorAxis: ['rayleigh_HLOS_wind_speed'],
                    positionAlias: {
                        'latitude': 'latitude_of_DEM_intersection',
                        'longitude': 'longitude_of_DEM_intersection',
                        'altitude': 'rayleigh_altitude'
                    }

                },
                mie: {
                    xAxis: ['time'],
                    yAxis: [
                        'mie_altitude'
                    ],
                    //y2Axis: [],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    combinedParameters: {
                        mie_altitude: ['mie_altitude_start', 'mie_altitude_end'],
                        mie_range: ['mie_range_start', 'mie_range_end'],
                        latitude_of_DEM_intersection: [
                            'latitude_of_DEM_intersection_start',
                            'latitude_of_DEM_intersection_end'
                        ],
                        longitude_of_DEM_intersection: [
                            'longitude_of_DEM_intersection_start',
                            'longitude_of_DEM_intersection_end'
                        ],
                        time: ['time_start', 'time_end'],
                    },
                    colorAxis: ['mie_HLOS_wind_speed'],
                    positionAlias: {
                        'latitude': 'latitude_of_DEM_intersection',
                        'longitude': 'longitude_of_DEM_intersection',
                        'altitude': 'mie_altitude'
                    }

                },
                'ALD_U_N_2A_mie': {
                    xAxis: 'MCA_time',
                    yAxis: [ 'mie_altitude'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    combinedParameters: {
                        mie_altitude: ['mie_altitude_obs_top', 'mie_altitude_obs_bottom'],
                        MCA_time: ['MCA_time_obs_start', 'MCA_time_obs_stop']
                    },
                    colorAxis: ['MCA_extinction'],
                    positionAlias: {
                        'latitude': 'latitude_of_DEM_intersection_obs',
                        'longitude': 'longitude_of_DEM_intersection_obs',
                        'altitude': 'mie_altitude'
                    }

                },
                'ALD_U_N_2A_rayleigh': {
                    xAxis: 'SCA_time',
                    yAxis: [ 'rayleigh_altitude'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    combinedParameters: {
                        rayleigh_altitude: ['rayleigh_altitude_obs_top', 'rayleigh_altitude_obs_bottom'],
                        SCA_time: ['SCA_time_obs_start', 'SCA_time_obs_stop'],
                    },
                    colorAxis: ['SCA_extinction'],
                    positionAlias: {
                        'latitude': 'latitude_of_DEM_intersection_obs',
                        'longitude': 'longitude_of_DEM_intersection_obs',
                        'altitude': 'rayleigh_altitude'
                    }

                },
                'ALD_U_N_2B_mie': {
                    xAxis: 'time',
                    yAxis: [ 'mie_altitude'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    combinedParameters: {
                        mie_altitude: ['mie_wind_result_bottom_altitude', 'mie_wind_result_top_altitude'],
                        time: ['mie_wind_result_start_time', 'mie_wind_result_stop_time'],
                        mie_wind_result_range: ['mie_wind_result_top_range', 'mie_wind_result_bottom_range'],
                        mie_wind_result_range_bin_number: [
                            'mie_wind_result_range_bin_number_start',
                            'mie_wind_result_range_bin_number_end'
                        ],
                        mie_wind_result_COG_range: ['mie_wind_result_COG_range_start', 'mie_wind_result_COG_range_end']
                    },
                    colorAxis: ['mie_wind_result_wind_velocity'],
                    positionAlias: {
                        'latitude': 'mie_wind_result_start_latitude',
                        'longitude': 'mie_wind_result_start_longitude',
                        'altitude': 'mie_altitude'
                    }

                },
                'ALD_U_N_2B_rayleigh': {
                    xAxis: 'time',
                    yAxis: [ 'rayleigh_altitude'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    combinedParameters: {
                        rayleigh_altitude: ['rayleigh_wind_result_bottom_altitude', 'rayleigh_wind_result_top_altitude'],
                        time: ['rayleigh_wind_result_start_time', 'rayleigh_wind_result_stop_time'],
                        rayleigh_wind_result_range: ['rayleigh_wind_result_top_range', 'rayleigh_wind_result_bottom_range'],
                        rayleigh_wind_result_range_bin_number: [
                            'rayleigh_wind_result_range_bin_number_start',
                            'rayleigh_wind_result_range_bin_number_end'
                        ],
                        rayleigh_wind_result_COG_range: ['rayleigh_wind_result_COG_range_start', 'rayleigh_wind_result_COG_range_end']
                    },
                    colorAxis: ['rayleigh_wind_result_wind_velocity'],
                    positionAlias: {
                        'latitude': 'rayleigh_wind_result_start_latitude',
                        'longitude': 'rayleigh_wind_result_start_longitude',
                        'altitude': 'rayleigh_altitude'
                    }

                },
                'ALD_U_N_2C_mie': {
                    xAxis: 'time',
                    yAxis: [ 'mie_altitude'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    combinedParameters: {
                        mie_altitude: ['mie_wind_result_bottom_altitude', 'mie_wind_result_top_altitude'],
                        time: ['mie_wind_result_start_time', 'mie_wind_result_stop_time'],
                        mie_wind_result_range: ['mie_wind_result_top_range', 'mie_wind_result_bottom_range'],
                        mie_wind_result_range_bin_number: [
                            'mie_wind_result_range_bin_number_start',
                            'mie_wind_result_range_bin_number_end'
                        ]
                    },
                    colorAxis: ['mie_wind_result_wind_velocity']

                },
                'ALD_U_N_2C_rayleigh': {
                    xAxis: 'time',
                    yAxis: [ 'rayleigh_altitude'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    combinedParameters: {
                        rayleigh_altitude: ['rayleigh_wind_result_bottom_altitude', 'rayleigh_wind_result_top_altitude'],
                        time: ['rayleigh_wind_result_start_time', 'rayleigh_wind_result_stop_time'],
                        rayleigh_wind_result_range: ['rayleigh_wind_result_top_range', 'rayleigh_wind_result_bottom_range'],
                        rayleigh_wind_result_range_bin_number: [
                            'rayleigh_wind_result_range_bin_number_start',
                            'rayleigh_wind_result_range_bin_number_end'
                        ]
                    },
                    colorAxis: ['rayleigh_wind_result_wind_velocity']

                },
                AUX_MRC_1B: {
                    xAxis: ['frequency_offset'],
                    yAxis: ['measurement_response'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    colorAxis: [ null ],
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection',
                        'altitude': 'altitude'
                    }
                },
                AUX_MRC_1B_error: {
                    xAxis: ['frequency_offset'],
                    yAxis: ['measurement_error_mie_response'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    colorAxis: [ null ],
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection',
                        'altitude': 'altitude'
                    }
                },
                AUX_RRC_1B: {
                    xAxis: ['frequency_offset'],
                    yAxis: ['measurement_response'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    colorAxis: [ null ],
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection',
                        'altitude': 'altitude'
                    }
                },
                AUX_RRC_1B_error: {
                    xAxis: ['frequency_offset'],
                    yAxis: ['measurement_error_rayleigh_response'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    colorAxis: [ null ],
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection',
                        'altitude': 'altitude'
                    }
                },
                AUX_ISR_1B: {
                    xAxis: 'laser_frequency_offset',
                    yAxis: ['rayleigh_channel_A_response', 'rayleigh_channel_B_response'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    colorAxis: [ null, null ]
                },
                AUX_ZWC_1B: {
                    xAxis: 'observation_index',
                    yAxis: ['mie_ground_correction_velocity', 'rayleigh_ground_correction_velocity'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    colorAxis: [ null, null ],
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection'
                    }
                },
                'AUX_MET_12_nadir': {
                    xAxis: 'time_nadir',
                    yAxis: ['surface_wind_component_u_nadir'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    colorAxis: [ null, null ]
                },
                'AUX_MET_12_off_nadir': {
                    xAxis: 'time_off_nadir',
                    yAxis: ['surface_wind_component_u_off_nadir'],
                    additionalXTicks: [],
                    additionalYTicks: [],
                    colorAxis: [ null, null ]
                }
            };


            this.dataSettings = globals.dataSettings;

            // Check for already defined data settings
            globals.products.each(function(product) {

                // If the product is a WMS view we can ignore it
                if(product.get('views')[0].protocol === 'WMS'){
                    return;
                }

                var currProd = globals.products.find(
                    function(p){
                        return p.get('download').id === product.get('download').id;
                    }
                );

                var parameters = currProd.get('parameters');
                var band;
                var keys = _.keys(parameters);
                _.each(keys, function(key){
                    if(parameters[key].hasOwnProperty('colorscale')){
                        this.dataSettings[key].colorscale = parameters[key].colorscale;
                    }
                    if(parameters[key].hasOwnProperty('range')){
                        this.dataSettings[key].extent = parameters[key].range;
                    }
                }, this);
            }, this);

            if (this.graph1 === undefined){

                this.filterManager = globals.swarm.get('filterManager');
                this.filterManager.visibleFilters = this.selectedFilterList;

                this.graph1 = new graphly.graphly({
                    el: '#graph_1',
                    margin: {top: 10, left: 100, bottom: 50, right: 40},
                    dataSettings: this.dataSettings,
                    renderSettings: this.renderSettings.mie,
                    filterManager: globals.swarm.get('filterManager'),
                    displayParameterLabel: false,
                    ignoreParameters: [/rayleigh_.*/, 'positions', 'stepPositions', /.*_jumps/],
                    enableSubXAxis: true,
                    enableSubYAxis: true
                });
                globals.swarm.get('filterManager').setRenderNode('#analyticsFilters');
                this.graph1.on('pointSelect', function(values){
                    Communicator.mediator.trigger('cesium:highlight:point', values);
                });
            }

            if (this.graph2 === undefined){
                this.graph2 = new graphly.graphly({
                    el: '#graph_2',
                    margin: {top: 10, left: 100, bottom: 50, right: 40},
                    dataSettings: this.dataSettings,
                    renderSettings: this.renderSettings.rayleigh,
                    filterManager: globals.swarm.get('filterManager'),
                    displayParameterLabel: false,
                    connectedGraph: this.graph1,
                    ignoreParameters: [/mie_.*/, 'positions', 'stepPositions', /.*_jumps/],
                    enableSubXAxis: true,
                    enableSubYAxis: true
                });
                this.graph1.connectGraph(this.graph2);
                this.graph2.on('pointSelect', function(values){
                    Communicator.mediator.trigger('cesium:highlight:point', values);
                });
            }

            var data = globals.swarm.get('data');

            if(localStorage.getItem('filterSelection') !== null){
                var filters = JSON.parse(localStorage.getItem('filterSelection'));
                var brushes = {};
                // Check for combined filters
                for (var f in filters){
                    var parentFilter = null;
                    var parM = this.filterManager.filterSettings.parameterMatrix;
                    for (var rel in parM){
                        if(parM[rel].indexOf(f)!==-1){
                            parentFilter = rel;
                        }
                    }
                    if(parentFilter !== null){
                        brushes[parentFilter] = filters[f];
                    }else{
                        brushes[f] = filters[f];
                    }
                }
                

                this.filterManager.brushes = brushes;
                if(this.graph1){
                    this.graph1.filters = globals.swarm.get('filters');
                }
                if(this.graph2){
                    this.graph2.filters = globals.swarm.get('filters');
                }
                this.filterManager.filters = globals.swarm.get('filters');
            }

            this.filterManager.on('filterChange', function(filters){
                var filterRanges = {};
                for (var f in this.brushes){
                    // check if filter is a combined filter
                    var parM = this.filterSettings.parameterMatrix;
                    if(parM.hasOwnProperty(f)){
                        for (var i = 0; i < parM[f].length; i++) {
                            filterRanges[parM[f][i]] = this.brushes[f];
                        }
                    } else {
                        filterRanges[f] = this.brushes[f];
                    }
                }

                // Check if a binary mask filter was set
                for (var mf in this.maskParameter){
                    var mfobj = this.maskParameter[mf];
                    if(mfobj.hasOwnProperty('selection')){
                        filterRanges[mf] = mfobj.selection;
                    }
                }

                var tosave = {};
                for(var key in filterRanges){
                    if(!this.filterSettings.maskParameter.hasOwnProperty(key)){
                        tosave[key] = filterRanges[key];
                    }
                }
                
                localStorage.setItem('filterSelection', JSON.stringify(tosave));
                Communicator.mediator.trigger('analytics:set:filter', filterRanges);
                globals.swarm.set({filters: filters});

            });

            this.filterManager.on('removeFilter', function(filter){
                var index = that.selectedFilterList.indexOf(filter);
                if(index !== -1){
                    that.selectedFilterList.splice(index, 1);
                    // Check if filter was set
                    if (that.filterManager.filters.hasOwnProperty(filter)){
                        delete that.filterManager.filters[filter];
                        delete that.filterManager.brushes[filter];
                    }
                    that.filterManager._filtersChanged();
                    localStorage.setItem(
                        'selectedFilterList',
                        JSON.stringify(that.selectedFilterList)
                    );
                }
                that.renderFilterList();
            });

            if(Object.keys(data).length > 0){
                // This scope is called when data already available when showing
                // the analytics panel, normally when switching views

                $('#nodataavailable').hide();
                this.reloadData(null, data);


            }
            return this;
        }, //onShow end

        connectDataEvents: function(){
            globals.swarm.on('change:data', this.reloadData.bind(this));
        },

        separateVector: function(key, previousKey, vectorChars, separator){
            if (this.sp.uom_set.hasOwnProperty(previousKey)){
                _.each(vectorChars, function(k){
                    this.sp.uom_set[key+separator+k] = 
                        $.extend({}, this.sp.uom_set[previousKey]);
                    this.sp.uom_set[key+separator+k].name = 
                        'Component of '+this.sp.uom_set[previousKey].name;
                }, this);
            }
        },

        checkPrevious: function(key, previousIndex, newIndex, replace){
            replace = defaultFor(replace, false);
            if( previousIndex === -1 && newIndex !== -1){
                if(this.sp.sel_y.indexOf(key)===-1){
                    if(!replace){
                        this.sp.sel_y.push(key);
                    }else{
                        this.sp.sel_y = [key];
                    }
                }
            }
        },

        handleItemSelected: function handleItemSelected(evt){
            var selected = $('#inputAnalyticsAddfilter').val();
            if(selected !== ''){
                this.selectedFilterList.push(selected);
                var setts = this.filterManager.filterSettings;
                setts.visibleFilters = this.selectedFilterList;
                this.filterManager.updateFilterSettings(setts);
                localStorage.setItem(
                    'selectedFilterList',
                    JSON.stringify(this.selectedFilterList)
                );
                this.renderFilterList();
            }
        },

        changeFilterDisplayStatus: function changeFilterDisplayStatus(){

            var that = this;
            var height = '99%';
            var opacity = 0.0;
            var direction = 'up';

            if($('#minimizeFilters').hasClass('minimized')){
                height = ($('#graph_container').height() - 270)+'px';
                opacity = 1.0;
                direction = 'down';
                $('#minimizeFilters').attr('class', 'visible');
            } else {
                $('#minimizeFilters').attr('class', 'minimized');
            }

            $('#filterSelectDrop').animate({ opacity: opacity  }, 1000);

            $('#analyticsFilters').animate({ opacity: opacity  }, 1000);

            $('#graph_container').animate({ height: height  }, {
                step: function( now, fx ) {
                    //that.graph1.resize();
                },
                done: function(){
                    $('#minimizeFilters i').attr('class', 
                        'fa fa-chevron-circle-'+direction
                    );
                    that.graph1.resize();
                    if($('#graph_2').is(":visible")){
                        that.graph2.resize();
                    }
                }
            },1000);

                
        },

        renderFilterList: function renderFilterList() {

            var that = this;
            this.$el.find("#filterSelectDrop").empty();
            var filCon = this.$el.find("#filterSelectDrop");

            $('#resetFilters').off();
            filCon.append('<button id="resetFilters" type="button" class="btn btn-success darkbutton">Reset filters</button>');
            $('#resetFilters').click(function(){
                that.filterManager.resetManager();
            });


            $('#minimizeFilters').off();
            $('#minimizeFilters').remove();
            $('#filterDivContainer').append(
                '<div id="minimizeFilters" class="visible"><i class="fa fa-chevron-circle-down" aria-hidden="true"></i></div>'
            );

            $('#minimizeFilters').click(this.changeFilterDisplayStatus.bind(this));

            filCon.find('.w2ui-field').remove();

            var aUOM = {};
            // Clone object
            _.each(globals.swarm.get('uom_set'), function(obj, key){
                aUOM[key] = obj;
            });

            // Remove currently visible filters from list
            for (var i = 0; i < this.selectedFilterList.length; i++) {
              if(aUOM.hasOwnProperty(this.selectedFilterList[i])){
                delete aUOM[this.selectedFilterList[i]];
              }
            }

            // Show only filters for currently available data
            for (var key in aUOM) {
              if(this.currentKeys && this.currentKeys.indexOf(key) === -1){
                delete aUOM[key];
              }
            }


            // Remove unwanted parameters
            /*if(aUOM.hasOwnProperty('Timestamp')){delete aUOM.Timestamp;}
            if(aUOM.hasOwnProperty('timestamp')){delete aUOM.timestamp;}
            if(aUOM.hasOwnProperty('q_NEC_CRF')){delete aUOM.q_NEC_CRF;}
            if(aUOM.hasOwnProperty('GPS_Position')){delete aUOM.GPS_Position;}
            if(aUOM.hasOwnProperty('LEO_Position')){delete aUOM.LEO_Position;}
            if(aUOM.hasOwnProperty('Spacecraft')){delete aUOM.Spacecraft;}
            if(aUOM.hasOwnProperty('id')){delete aUOM.id;}*/

            $('#filterSelectDrop').prepend(
              '<div class="w2ui-field"> <button id="analyticsAddFilter" type="button" class="btn btn-success darkbutton dropdown-toggle">Add filter <span class="caret"></span></button> <input type="list" id="inputAnalyticsAddfilter"></div>'
            );

            $( "#analyticsAddFilter" ).click(function(){
                $('.w2ui-field-helper input').css('text-indent', '0em');
                $("#inputAnalyticsAddfilter").focus();
            });

            var that = this;
            $('#inputAnalyticsAddfilter').off();

            $('#inputAnalyticsAddfilter').w2field('list', { 
              items: _.keys(aUOM).sort(),
              renderDrop: function (item, options) {
                var html = '<b>'+(item.id)+'</b>';
                if(aUOM[item.id].uom != null){
                  html += ' ['+aUOM[item.id].uom+']';
                }
                if(aUOM[item.id].name != null){
                  html+= ': '+aUOM[item.id].name;
                }
                return html;
              },
              compare: function(item){
                var userIn = $('.w2ui-field-helper input').val();
                //console.log(item, $('.w2ui-field-helper input').val());
                if (userIn.length === 0){
                    return true;
                } else {
                    userIn = userIn.toLowerCase();
                    var par = aUOM[item.id];
                    var inputInId = item.id.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
                        .includes(userIn.replace(/[^a-zA-Z0-9]/g, ''));
                    var inputInUOM = par.hasOwnProperty('uom') && 
                        par.uom !== null && 
                        par.uom.toLowerCase().includes(userIn);
                    var inputInName = par.hasOwnProperty('name') && 
                        par.name !== null && 
                        par.name.toLowerCase().includes(userIn);
                    if(inputInId || inputInUOM || inputInName){
                        return true;
                    } else {
                        return false;
                    }
                }
                
              }
            });

            $('.w2ui-field-helper input').attr('placeholder', 'Type to search');

            $('#inputAnalyticsAddfilter').change(this.handleItemSelected.bind(this));

        },

        onLayerParametersChanged: function(layer){

            // Parameters only apply for L1B curtains (possibly L2B)
            if(layer === 'ALD_U_N_1B' || layer === 'ALD_U_N_2A' ||
                layer === 'ALD_U_N_2B' || layer === 'ALD_U_N_2C'){
                var currProd = globals.products.find(
                    function(p){return p.get('download').id === layer;}
                );

                var parameters = currProd.get('parameters');
                var band;
                var keys = _.keys(parameters);
                _.each(keys, function(key){
                    if(parameters[key].selected){
                        band = key;
                    }
                });
                var style = parameters[band].colorscale;
                var range = parameters[band].range;

                this.dataSettings[band].colorscale = style;
                this.dataSettings[band].extent = range;
                //this.graph.dataSettings = this.dataSettings;
                // Reset colorcache
                for(var k in this.graph1.colorCache){
                    delete this.graph1.colorCache[k];
                }
                for(var k in this.graph2.colorCache){
                    delete this.graph2.colorCache[k];
                }
                this.graph1.dataSettings = this.dataSettings;
                this.graph1.renderData();
                this.graph1.createColorScales();
                this.graph2.dataSettings = this.dataSettings;
                this.graph2.renderData();
                this.graph2.createColorScales();
            }
        },

        reloadData: function(model, data) {
            // If element already has plot rendering
            if( $(this.el).html()){

                //this.filterManager.initManager();
                var idKeys = Object.keys(data);
                if(idKeys.length>0){
                    this.currentKeys = Object.keys(data[idKeys[0]]);
                }

                var firstLoad = false;
                if(this.prevParams === null){
                    // First time loading data we set previous to current data
                    this.prevParams = idKeys;
                    firstLoad = true;
                }

                // If data parameters have changed
                if (!firstLoad && !_.isEqual(this.prevParams, idKeys)){
                    // Define which parameters should be selected defaultwise as filtering

                        // Check if configured filters apply to new data
                        /*for (var fKey in this.filterManager.brushes){
                            if(idKeys.indexOf(fKey) === -1){
                                delete this.filterManager.brushes[fKey];
                            }
                        }

                        for(var filKey in this.filterManager.filters){
                            if(idKeys.indexOf(filKey) === -1){
                                delete this.filterManager.filters[fKey];
                            }
                        }

                        for(var filgraphKey in this.filters){
                            if(idKeys.indexOf(filgraphKey) === -1){
                                delete this.graph.filters[fKey];
                            }
                        }

                        for (var i = filterstouse.length - 1; i >= 0; i--) {
                            if(this.selectedFilterList.indexOf(filterstouse[i]) === -1){
                                this.selectedFilterList.push(filterstouse[i]);
                            }
                        }*/

                        var setts = this.filterManager.filterSettings;
                        setts.visibleFilters = this.selectedFilterList;


                        this.filterManager.updateFilterSettings(setts);
                        localStorage.setItem(
                            'selectedFilterList',
                            JSON.stringify(this.selectedFilterList)
                        );
                        this.renderFilterList();
                }

                if(idKeys.length > 0){
                    // Cleanup info button
                    $('#additionalProductInfo').off();
                    $('#additionalProductInfo').remove();
                    $('#analyticsProductTooltip').remove();

                    // Use descriptions and uom from download parameters
                    var mergedDataSettings = globals.dataSettings;

                    globals.products.each(function(prod) {
                        if(prod.get('visible') && prod.get('download_parameters')) {
                            var params = prod.get('download_parameters');
                            for(var par in params){
                                if(mergedDataSettings.hasOwnProperty(par)){
                                    mergedDataSettings[par].uom = params[par].uom;
                                    mergedDataSettings[par].name = params[par].name;
                                } else{
                                    mergedDataSettings[par] = params[par];
                                }
                            }
                        }
                    });
                    

                    $('#nodataavailable').hide();
                    //this.graph.loadData(data);
                    // TODO: Iterate through all ids and load to corresponding graphs
                    if(idKeys[0] === 'ALD_U_N_1B'){
                        this.graph1.renderSettings =  this.renderSettings.mie;
                        this.graph2.renderSettings =  this.renderSettings.rayleigh;
                        $('#graph_1').css('height', '49%');
                        $('#graph_2').css('height', '49%');
                        $('#graph_2').show();
                        this.graph1.debounceActive = true;
                        this.graph2.debounceActive = true;
                        this.graph1.ignoreParameters = [/rayleigh_.*/, 'positions', 'stepPositions', /.*_jumps/, 'signCross'];
                        this.graph2.ignoreParameters = [/mie_.*/, 'positions', 'stepPositions', /.*_jumps/, 'signCross'];
                        this.graph1.dataSettings = mergedDataSettings;
                        this.graph2.dataSettings = mergedDataSettings;
                        this.graph1.loadData(data['ALD_U_N_1B']);
                        this.graph2.loadData(data['ALD_U_N_1B']);
                        this.graph1.fileSaveString = 'ALD_U_N_1B_mie_plot';
                        this.graph2.fileSaveString = 'ALD_U_N_1B_rayleigh_plot';
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data['ALD_U_N_1B']);

                     }else if(idKeys[0] === 'ALD_U_N_2A'){

                        this.graph1.renderSettings =  this.renderSettings.ALD_U_N_2A_mie;
                        this.graph2.renderSettings =  this.renderSettings.ALD_U_N_2A_rayleigh;
                        $('#graph_1').css('height', '49%');
                        $('#graph_2').css('height', '49%');
                        $('#graph_2').show();
                        this.graph1.debounceActive = true;
                        this.graph2.debounceActive = true;
                        this.graph1.ignoreParameters = [/rayleigh_.*/, /SCA.*/, 'positions', 'stepPositions', /.*_orig/, /.*jumps/, 'signCross'];
                        this.graph2.ignoreParameters = [/mie_.*/, /MCA.*/, 'positions', 'stepPositions', /.*_orig/, /.*jumps/, 'signCross'];
                        this.graph1.dataSettings = mergedDataSettings;
                        this.graph2.dataSettings = mergedDataSettings;
                        this.graph1.loadData(data['ALD_U_N_2A']);
                        this.graph2.loadData(data['ALD_U_N_2A']);
                        this.graph1.fileSaveString = 'ALD_U_N_2A_mie_plot';
                        this.graph2.fileSaveString = 'ALD_U_N_2A_rayleigh_plot';
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data['ALD_U_N_2A']);

                     }else if(idKeys[0] === 'ALD_U_N_2B'){

                        this.graph1.renderSettings =  this.renderSettings.ALD_U_N_2B_mie;
                        this.graph2.renderSettings =  this.renderSettings.ALD_U_N_2B_rayleigh;
                        $('#graph_1').css('height', '49%');
                        $('#graph_2').css('height', '49%');
                        $('#graph_2').show();
                        this.graph1.debounceActive = true;
                        this.graph2.debounceActive = true;
                        this.graph1.ignoreParameters = [/rayleigh_.*/, 'positions', 'stepPositions', /.*_jumps/, /.*SignCross/];
                        this.graph2.ignoreParameters = [/mie_.*/, 'positions', 'stepPositions', /.*_jumps/, /.*SignCross/];
                        this.graph1.dataSettings = mergedDataSettings;
                        this.graph2.dataSettings = mergedDataSettings;
                        this.graph1.loadData(data['ALD_U_N_2B']);
                        this.graph2.loadData(data['ALD_U_N_2B']);
                        this.graph1.fileSaveString = 'ALD_U_N_2B_mie_plot';
                        this.graph2.fileSaveString = 'ALD_U_N_2B_rayleigh_plot';
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data['ALD_U_N_2B']);

                     }else if(idKeys[0] === 'ALD_U_N_2C'){

                        this.graph1.renderSettings =  this.renderSettings.ALD_U_N_2C_mie;
                        this.graph2.renderSettings =  this.renderSettings.ALD_U_N_2C_rayleigh;
                        $('#graph_1').css('height', '49%');
                        $('#graph_2').css('height', '49%');
                        $('#graph_2').show();
                        this.graph1.debounceActive = true;
                        this.graph2.debounceActive = true;
                        this.graph1.ignoreParameters = [/rayleigh_.*/, 'positions', 'stepPositions', /.*_jumps/, /.*SignCross/];
                        this.graph2.ignoreParameters = [/mie_.*/, 'positions', 'stepPositions', /.*_jumps/, /.*SignCross/];
                        this.graph1.dataSettings = mergedDataSettings;
                        this.graph2.dataSettings = mergedDataSettings;
                        this.graph1.loadData(data['ALD_U_N_2C']);
                        this.graph2.loadData(data['ALD_U_N_2C']);
                        this.graph1.fileSaveString = 'ALD_U_N_2C_mie_plot';
                        this.graph2.fileSaveString = 'ALD_U_N_2C_rayleigh_plot';
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data['ALD_U_N_2C']);

                     }else if(idKeys[0] === 'AUX_MRC_1B' || idKeys[0] === 'AUX_RRC_1B'){

                        this.graph1.renderSettings =  this.renderSettings[idKeys[0]];
                        this.graph2.renderSettings =  this.renderSettings[(idKeys[0]+'_error')];
                        $('#graph_2').show();
                        $('#graph_1').css('height', '49%');
                        $('#graph_2').css('height', '49%');
                        this.graph1.debounceActive = false;
                        this.graph2.debounceActive = false;
                        this.graph1.ignoreParameters = [];
                        this.graph2.ignoreParameters = [];
                        this.graph1.dataSettings = mergedDataSettings;
                        this.graph2.dataSettings = mergedDataSettings;
                        this.graph1.loadData(data[idKeys[0]]);
                        this.graph2.loadData(data[idKeys[0]]);
                        this.graph1.fileSaveString = idKeys[0]+'_top';
                        this.graph2.fileSaveString = idKeys[0]+'_bottom';
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data[idKeys[0]]);

                    } else if(idKeys[0] === 'AUX_MET_12'){
                        this.graph1.renderSettings =  this.renderSettings[(idKeys[0]+'_nadir')];
                        this.graph2.renderSettings =  this.renderSettings[(idKeys[0]+'_off_nadir')];
                        $('#graph_2').show();
                        $('#graph_1').css('height', '49%');
                        $('#graph_2').css('height', '49%');
                        this.graph1.ignoreParameters = [];
                        this.graph2.ignoreParameters = [];
                        this.graph1.debounceActive = true;
                        this.graph1.dataSettings = mergedDataSettings;
                        this.graph2.dataSettings = mergedDataSettings;
                        this.graph2.debounceActive = true;
                        this.graph1.loadData(data[idKeys[0]]);
                        this.graph2.loadData(data[idKeys[0]]);
                        this.graph1.fileSaveString = idKeys[0]+'_top';
                        this.graph2.fileSaveString = idKeys[0]+'_bottom';
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data[idKeys[0]]);

                    }else /*if(idKeys[0] === 'AUX_MRC_1B')*/{
                        this.graph2.data = {};
                        $('#graph_1').css('height', '99%');
                        $('#graph_2').hide();
                        this.graph1.ignoreParameters = [];
                        this.graph2.ignoreParameters = [];
                        this.graph1.debounceActive = false;
                        this.graph2.debounceActive = false;
                        this.graph1.connectGraph(false);
                        this.graph2.connectGraph(false);
                        this.graph1.dataSettings = mergedDataSettings;
                        this.graph1.renderSettings = this.renderSettings[idKeys[0]];
                        this.graph1.loadData(data[idKeys[0]]);
                        this.graph1.fileSaveString = idKeys[0];
                        this.filterManager.loadData(data[idKeys[0]]);
                    }

                    if(data[idKeys[0]].hasOwnProperty('singleValues')){
                        // Add additional info of single values of products
                        this.$el.append('<div id="additionalProductInfo"><i class="fa fa-info-circle" aria-hidden="true"></i></div>');
                        var that = this;
                        $('#additionalProductInfo').click(function(){
                            if($('#analyticsProductTooltip').length){
                                $('#analyticsProductTooltip').remove();
                            }else {
                                $('#analyticsProductTooltip').remove();
                                that.$el.append('<div id="analyticsProductTooltip"></div>');
                                var singleValues = data[idKeys[0]].singleValues;

                                
                                var currDiv = $('<div class="paramTable"></div>');
                                $('#analyticsProductTooltip').append(currDiv);
                                var table = $('<table></table>');
                                currDiv.append(table);

                                //var headers = Object.keys(products[p][0]);
                                var headers = [
                                    'Paramter name', 'Value', 'Unit'
                                ];
                                var tr = $('<tr></tr>');
                                for (var i = 0; i < headers.length; i++) {
                                    tr.append('<th>'+headers[i]+'</th>');
                                }
                                table.append(tr);
                                
                                    
                                for (var k in singleValues){
                                    tr = $('<tr></tr>');
                                    tr.append('<td>'+k+'</td>');
                                    tr.append('<td>'+singleValues[k]+'</td>');
                                    if(that.dataSettings.hasOwnProperty(k) && 
                                        that.dataSettings[k].hasOwnProperty('uom') &&
                                        that.dataSettings[k].uom!==null){
                                        tr.append('<td>'+that.dataSettings[k].uom+'</td>');
                                    }else{
                                        tr.append('<td>-</td>');
                                    }
                                    table.append(tr);
                                }
                                

                                
                                var pos = $('#additionalProductInfo').position();
                                $('#analyticsProductTooltip').css('top', pos.top+'px');
                                $('#analyticsProductTooltip').css('left', (pos.left+30)+'px' );
                            }
                            
                        });
                    }

                }else{
                    $('#nodataavailable').show();

                }


                this.renderFilterList();
            }
        },

        reloadUOM: function(){
            // Prepare to create list of available parameters
            var availableParameters = {};
            var activeParameters = {};
            this.sp = {
                uom_set: {}
            };
            globals.products.each(function(prod) {
                if(prod.get('download_parameters')){
                    var par = prod.get('download_parameters');
                    var newKeys = _.keys(par);
                    _.each(newKeys, function(key){
                        availableParameters[key] = par[key];
                        if(prod.get('visible')){
                            activeParameters[key] = par[key];
                        }
                    });
                    
                }
            });
            this.sp.uom_set = availableParameters;
            this.activeParameters = activeParameters;

            // TODO: Remove unwanted parameters

            globals.swarm.set('uom_set', this.sp.uom_set);
        },

        onChangeAxisParameters: function (selection) {
            this.sp.sel_y=selection;
            this.sp.render();
        },

        close: function() {
            if(this.graph1){
                this.graph1.destroy();
            }
            if(this.graph2){
                this.graph2.destroy();
            }

            delete this.graph1;
            delete this.graph2;
            this.isClosed = true;
            this.$el.empty();
            this.triggerMethod('view:disconnect');
        }
    });
    return AVView;
});