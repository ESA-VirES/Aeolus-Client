define(['backbone.marionette',
    'communicator',
    'app',
    'models/AVModel',
    'globals',
    'd3',
    'graphly'
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
            this.currentKeys = [];

            $(window).resize(function() {
                if(this.graph){
                    this.graph.resize();
                }
            }.bind(this));
            this.connectDataEvents();
        },

        savePlotConfig: function(graph){
            
            localStorage.setItem(
                'xAxisSelection',
                JSON.stringify(graph.renderSettings.xAxis)
            );
            localStorage.setItem(
                'yAxisSelection',
                JSON.stringify(graph.renderSettings.yAxis)
            );
            localStorage.setItem(
                'y2AxisSelection',
                JSON.stringify(graph.renderSettings.y2Axis)
            );

            localStorage.setItem(
                'colorAxisSelection',
                JSON.stringify(graph.renderSettings.colorAxis)
            );

            localStorage.setItem(
                'colorAxis2Selection',
                JSON.stringify(graph.renderSettings.colorAxis2)
            );

            localStorage.setItem(
                'groupSelected',
                JSON.stringify(graph.renderSettings.groups)
            )

        },

        extendSettings: function(settings){

            var currSets = $.extend(true,{},settings);

            var allInside = true;
            var xax = JSON.parse(localStorage.getItem('xAxisSelection'));
            var yax = JSON.parse(localStorage.getItem('yAxisSelection'));
            var y2ax = JSON.parse(localStorage.getItem('y2AxisSelection'));
            var colax = JSON.parse(localStorage.getItem('colorAxisSelection'));
            var colax2 = JSON.parse(localStorage.getItem('colorAxis2Selection'));
            var groups = JSON.parse(localStorage.getItem('groupSelected'));

            var comb = [].concat(xax, yax, y2ax, colax);
            comb = comb.flat();
            for (var i = comb.length - 1; i >= 0; i--) {
                var parameter = comb[i];
                if(parameter === null){
                    // Typical for colorscale
                    continue;
                }
                if(this.currentKeys.indexOf(parameter) === -1){
                    if(settings.combinedParameters.hasOwnProperty(parameter)){
                        var combined = settings.combinedParameters[parameter];
                        for (var j = combined.length - 1; j >= 0; j--) {
                            if(this.currentKeys.indexOf(combined[j]) === -1){
                                allInside = false;
                            }
                        }
                    } else if (settings.hasOwnProperty('sharedParameters') &&  settings.sharedParameters!== false){
                        if(!settings.sharedParameters.hasOwnProperty(parameter)){
                            allInside = false;
                        }
                    } else {
                        allInside = false;
                    }
                }
            }

            if(!allInside){
                return settings;
            }

            if (xax !== null) {
                currSets.xAxis = xax;
            }
            if (yax !== null) {
                currSets.yAxis = yax;
            }
            if (y2ax !== null) {
                currSets.y2Axis = y2ax;
            }
            if (colax !== null) {
                currSets.colorAxis = colax;
            }
            if (colax2 !== null) {
                currSets.colorAxis2 = colax2;
            }
            if (groups !== null) {
                currSets.groups = groups;
            }

            // Apply custom subticks in the size of the amount of plots
            // subticks are not saved at the moment
            if (groups !== null) {
                var yticks = [];
                for (var i = 0; i < currSets.yAxis.length; i++) {
                    yticks.push([]);
                }
                currSets.additionalYTicks = yticks;
            }

            return currSets;
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
            this.currentGroup = null;
            this.miePos = 0;
            this.rayleighPos = 0;

            this.reloadUOM();


            if (typeof this.graph === 'undefined') {
                this.$el.append('<div class="d3canvas"></div>');
                this.$('.d3canvas').append('<div id="graph_container"></div>');

                // Set height of graph depending on 
                var filtersMinimized = localStorage.getItem('filtersMinimized');
                if(filtersMinimized === null){
                    filtersMinimized = false;
                } else {
                    filtersMinimized = JSON.parse(filtersMinimized);
                }

                if(filtersMinimized){
                    $('#graph_container').css('height', '99%');
                }

                this.$('#graph_container').append('<div id="graph"></div>');

                this.$('#graph').append('<div id="analyticsSavebuttonTop"><i class="fa fa-floppy-o analyticsSavebutton" aria-hidden="true"></i></div>');

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
                    var w = $('#graph').width();
                    var h = $('#graph').height();

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

                    if (that.graph){
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
                            that.graph.saveImage(selectedType, selectedRes);
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
                if(this.graph){
                    this.graph.resize();
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
                    // L2A group
                    'group_backscatter_variance', 'group_extinction_variance',
                    'group_extinction', /*'group_backscatter',*/ 'group_LOD_variance',
                    'group_LOD', 'group_SR',
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
                    'surface_altitude_off_nadir', 'surface_altitude_nadir',
                    // AUX MET 2D
                    'layer_validity_flag_nadir',
                    'layer_temperature_nadir',
                    'layer_wind_component_u_nadir',
                    'layer_wind_component_v_nadir',
                    'layer_rel_humidity_nadir',
                    'layer_spec_humidity_nadir',
                    'layer_cloud_cover_nadir',
                    'layer_cloud_liquid_water_content_nadir',
                    'layer_cloud_ice_water_content_nadir',
                    'layer_validity_flag_off_nadir',
                    'layer_temperature_off_nadir',
                    'layer_wind_component_u_off_nadir',
                    'layer_wind_component_v_off_nadir',
                    'layer_rel_humidity_off_nadir',
                    'layer_spec_humidity_off_nadir',
                    'layer_cloud_cover_off_nadir',
                    'layer_cloud_liquid_water_content_off_nadir',
                    'layer_cloud_ice_water_content_off_nadir'
                ];
            }

            this.renderSettings = {
                'ALD_U_N_1B':{
                    xAxis: 'time',
                    yAxis: [['mie_altitude'], ['rayleigh_altitude']],
                    y2Axis: [[], []],
                    groups: ['mie', 'rayleigh'],
                    combinedParameters: {
                        rayleigh_altitude: ['rayleigh_altitude_start', 'rayleigh_altitude_end'],
                        latitude_of_DEM_intersection: ['latitude_of_DEM_intersection_start', 'latitude_of_DEM_intersection_end'],
                        longitude_of_DEM_intersection: ['longitude_of_DEM_intersection_end', 'longitude_of_DEM_intersection_start'],
                        mie_time: ['mie_time_start', 'mie_time_end'],
                        rayleigh_time: ['rayleigh_time_start', 'rayleigh_time_end'],
                        mie_altitude: ['mie_altitude_start', 'mie_altitude_end']
                    },
                    colorAxis: [['mie_HLOS_wind_speed'], ['rayleigh_HLOS_wind_speed']],
                    colorAxis2: [[], []],
                    renderGroups: {
                        mie: {
                            parameters: [
                                'mie_time',
                                'longitude_of_DEM_intersection',
                                'latitude_of_DEM_intersection',
                                'altitude_of_DEM_intersection',
                                'mie_longitude',
                                'mie_latitude',
                                'mie_altitude',
                                'mie_range',
                                'geoid_separation',
                                'velocity_at_DEM_intersection',
                                'AOCS_pitch_angle',
                                'AOCS_roll_angle',
                                'AOCS_yaw_angle',
                                'mie_HLOS_wind_speed',
                                'mie_signal_intensity',
                                'mie_ground_velocity',
                                'mie_HBE_ground_velocity',
                                'mie_total_ZWC',
                                'mie_scattering_ratio',
                                'mie_SNR',
                                'mie_error_quantifier',
                                'average_laser_energy',
                                'laser_frequency',
                                'mie_bin_quality_flag',
                                'mie_reference_pulse_quality_flag',
                                'albedo_off_nadir',
                                'mie_signal_intensity_range_corrected',
                                'mie_signal_intensity_normalised'
                            ],
                            positionAlias: {
                                'latitude': 'latitude',
                                'longitude': 'longitude',
                                'altitude': 'mie_altitude'
                            }
                        },
                        rayleigh: {
                            parameters: [
                                'rayleigh_time',
                                'longitude_of_DEM_intersection',
                                'latitude_of_DEM_intersection',
                                'altitude_of_DEM_intersection',
                                'rayleigh_longitude',
                                'rayleigh_latitude',
                                'rayleigh_altitude',
                                'rayleigh_range',
                                'geoid_separation',
                                'velocity_at_DEM_intersection',
                                'AOCS_pitch_angle',
                                'AOCS_roll_angle',
                                'AOCS_yaw_angle',
                                'rayleigh_HLOS_wind_speed',
                                'rayleigh_signal_channel_A_intensity',
                                'rayleigh_signal_channel_B_intensity',
                                'rayleigh_signal_intensity',
                                'rayleigh_ground_velocity',
                                'rayleigh_HBE_ground_velocity',
                                'rayleigh_total_ZWC',
                                'rayleigh_channel_A_SNR',
                                'rayleigh_channel_B_SNR',
                                'rayleigh_SNR',
                                'rayleigh_error_quantifier',
                                'average_laser_energy',
                                'laser_frequency',
                                'rayleigh_bin_quality_flag',
                                'rayleigh_reference_pulse_quality_flag',
                                'albedo_off_nadir',
                                'rayleigh_signal_intensity_range_corrected',
                                'rayleigh_signal_intensity_normalised'
                            ],
                            positionAlias: {
                                'latitude': 'latitude',
                                'longitude': 'longitude',
                                'altitude': 'rayleigh_altitude'
                            }
                        }
                    },
                    sharedParameters: {
                        'time': [
                            'mie_time', 'rayleigh_time'
                        ],
                        'altitude': [
                            'rayleigh_altitude', 'mie_altitude'
                        ],
                        'geoid_separation': ['geoid_separation'],
                        'longitude_of_DEM_intersection': ['longitude_of_DEM_intersection'],
                        'latitude_of_DEM_intersection': ['latitude_of_DEM_intersection'],
                        'altitude_of_DEM_intersection': ['altitude_of_DEM_intersection'],
                        'velocity_at_DEM_intersection': ['velocity_at_DEM_intersection'],
                        'AOCS_pitch_angle': ['AOCS_pitch_angle'],
                        'AOCS_roll_angle': ['AOCS_roll_angle'],
                        'AOCS_yaw_angle': ['AOCS_yaw_angle'],
                        'average_laser_energy': ['average_laser_energy'],
                        'laser_frequency': ['laser_frequency'],
                        'albedo_off_nadir': ['albedo_off_nadir'],
                    },
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    availableParameters: false
                },
                'ALD_U_N_2A': {
                    xAxis: 'time',
                    yAxis: [['mie_altitude'], ['rayleigh_altitude']],
                    y2Axis: [[], []],
                    groups: ['MCA', 'SCA'],
                    combinedParameters: {
                        mie_altitude: ['mie_altitude_obs_top', 'mie_altitude_obs_bottom'],
                        MCA_time: ['MCA_time_obs_start', 'MCA_time_obs_stop'],
                        rayleigh_altitude: ['rayleigh_altitude_obs_top', 'rayleigh_altitude_obs_bottom'],
                        SCA_time: ['SCA_time_obs_start', 'SCA_time_obs_stop'],
                        bins: ['ICA_bins_start', 'ICA_bins_end'],
                        ICA_time: ['ICA_time_obs_start', 'ICA_time_obs_stop'],
                        SCA_middle_bin_altitude: ['SCA_middle_bin_altitude_obs_top', 'SCA_middle_bin_altitude_obs_bottom'],
                        SCA_middle_bin_time: ['SCA_middle_bin_time_obs_start', 'SCA_middle_bin_time_obs_stop']
                    },
                    colorAxis: [['MCA_extinction'], ['SCA_extinction']],
                    colorAxis2: [[], []],
                    renderGroups: {
                        MCA: {
                            parameters: [
                                'mie_altitude', 
                                'mie_altitude_obs_top', 
                                'mie_altitude_obs_bottom',
                                'MCA_time_obs_start',
                                'MCA_time_obs_stop',
                                'L1B_start_time_obs',
                                'L1B_centroid_time_obs',
                                'MCA_time',
                                'longitude_of_DEM_intersection_obs',
                                'latitude_of_DEM_intersection_obs',
                                'altitude_of_DEM_intersection_obs',
                                'geoid_separation_obs',
                                'L1B_num_of_meas_per_obs',
                                'MCA_clim_BER',
                                'MCA_extinction',
                                'MCA_LOD',
                                'albedo_off_nadir'
                            ],
                            defaults: {
                                yAxis: 'mie_altitude',
                                colorAxis: 'MCA_extinction'
                            },
                            positionAlias: {
                                'latitude': 'latitude_of_DEM_intersection_obs',
                                'longitude': 'longitude_of_DEM_intersection_obs',
                                'altitude': 'mie_altitude'
                            }
                        },
                        SCA: {
                            parameters: [
                                'rayleigh_altitude',
                                'rayleigh_altitude_obs_top',
                                'rayleigh_altitude_obs_bottom',
                                'SCA_time_obs_start',
                                'SCA_time_obs_stop',
                                'SCA_time',
                                'SCA_QC_flag',
                                'SCA_extinction_variance',
                                'SCA_backscatter_variance',
                                'SCA_LOD_variance',
                                'SCA_extinction',
                                'SCA_backscatter',
                                'SCA_LOD',
                                'SCA_SR',
                            ],
                            defaults: {
                                yAxis: 'rayleigh_altitude',
                                colorAxis: 'SCA_extinction'
                            },
                            positionAlias: {
                                'latitude': 'latitude_of_DEM_intersection_obs',
                                'longitude': 'longitude_of_DEM_intersection_obs',
                                'altitude': 'rayleigh_altitude'
                            }
                        },
                        SCA_middle_bin: {
                            parameters: [
                                'SCA_middle_bin_time',
                                'SCA_middle_bin_altitude',
                                'SCA_middle_bin_time_obs',
                                'SCA_middle_bin_time_obs_start',
                                'SCA_middle_bin_time_obs_stop',
                                'SCA_middle_bin_altitude_obs',
                                'SCA_middle_bin_altitude_obs_top',
                                'SCA_middle_bin_altitude_obs_bottom',
                                'SCA_middle_bin_extinction_variance',
                                'SCA_middle_bin_backscatter_variance',
                                'SCA_middle_bin_LOD_variance',
                                'SCA_middle_bin_BER_variance',
                                'SCA_middle_bin_extinction',
                                'SCA_middle_bin_backscatter',
                                'SCA_middle_bin_LOD',
                                'SCA_middle_bin_BER'
                            ],
                            defaults: {
                                yAxis: 'SCA_middle_bin_altitude',
                                colorAxis: 'SCA_middle_bin_extinction'
                            },
                            positionAlias: {
                                'latitude': 'latitude_of_DEM_intersection_obs',
                                'longitude': 'longitude_of_DEM_intersection_obs',
                                'altitude': 'SCA_middle_bin_altitude'
                            }
                        },
                        ICA: {
                            parameters: [
                                'bins',
                                'ICA_bins_start',
                                'ICA_bins_end',
                                'ICA_time_obs_start',
                                'ICA_time_obs_stop',
                                'ICA_time',
                                'ICA_QC_flag',
                                'ICA_filling_case',
                                'ICA_extinction',
                                'ICA_backscatter',
                                'ICA_LOD'
                            ],
                            defaults: {
                                yAxis: 'bins',
                                colorAxis: 'ICA_backscatter'
                            }
                        }
                    },
                    sharedParameters: {
                        'time': [
                            'MCA_time', 'SCA_time', 'ICA_time', 'SCA_middle_bin_time'
                        ]
                    },
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    availableParameters: false
                },
                'ALD_U_N_2A_group':{
                    xAxis: ['measurements'],
                    yAxis: [
                        ['altitude'],
                    ],
                    combinedParameters: {
                        altitude: ['alt_start', 'alt_end'],
                        measurements: ['meas_start', 'meas_end']
                    },
                    colorAxis: [
                        ['group_backscatter_variance']
                    ],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    groups: false,
                    renderGroups: false,
                    sharedParameters: false,
                    availableParameters: false
                },
                'ALD_U_N_2B': {
                    xAxis: 'time',
                    yAxis: [['mie_altitude'], ['rayleigh_altitude']],
                    y2Axis: [[], []],
                    groups: ['mie', 'rayleigh'],
                    combinedParameters: {
                        mie_altitude: ['mie_wind_result_bottom_altitude', 'mie_wind_result_top_altitude'],
                        mie_time: ['mie_wind_result_start_time', 'mie_wind_result_stop_time'],
                        mie_wind_result_range: ['mie_wind_result_top_range', 'mie_wind_result_bottom_range'],
                        mie_wind_result_range_bin_number: [
                            'mie_wind_result_range_bin_number_start',
                            'mie_wind_result_range_bin_number_end'
                        ],
                        mie_wind_result_COG_range: ['mie_wind_result_COG_range_start', 'mie_wind_result_COG_range_end'],
                        rayleigh_altitude: ['rayleigh_wind_result_bottom_altitude', 'rayleigh_wind_result_top_altitude'],
                        rayleigh_time: ['rayleigh_wind_result_start_time', 'rayleigh_wind_result_stop_time'],
                        rayleigh_wind_result_range: ['rayleigh_wind_result_top_range', 'rayleigh_wind_result_bottom_range'],
                        rayleigh_wind_result_range_bin_number: [
                            'rayleigh_wind_result_range_bin_number_start',
                            'rayleigh_wind_result_range_bin_number_end'
                        ],
                        rayleigh_wind_result_COG_range: ['rayleigh_wind_result_COG_range_start', 'rayleigh_wind_result_COG_range_end']
                    },
                    colorAxis: [['mie_wind_result_wind_velocity'], ['rayleigh_wind_result_wind_velocity']],
                    colorAxis2: [[], []],
                    renderGroups: {
                        mie: {
                            parameters: [
                                'mie_altitude',
                                'mie_time',
                                'mie_wind_result_range',
                                'mie_wind_result_range_bin_number',
                                'mie_wind_result_COG_range',
                                'mie_wind_result_bottom_altitude',
                                'mie_wind_result_top_altitude',
                                'mie_wind_result_start_time',
                                'mie_wind_result_stop_time',
                                'mie_wind_result_top_range',
                                'mie_wind_result_bottom_range',
                                'mie_wind_result_range_bin_number_start',
                                'mie_wind_result_range_bin_number_end',
                                'mie_wind_result_COG_range_start',
                                'mie_wind_result_COG_range_end',
                                'mie_wind_result_id',
                                'mie_wind_result_range_bin_number',
                                'mie_wind_result_start_time',
                                'mie_wind_result_COG_time',
                                'mie_wind_result_stop_time',
                                'mie_wind_result_bottom_altitude',
                                'mie_wind_result_COG_altitude',
                                'mie_wind_result_top_altitude',
                                'mie_wind_result_bottom_range',
                                'mie_wind_result_COG_range',
                                'mie_wind_result_top_range',
                                'mie_wind_result_start_latitude',
                                'mie_wind_result_COG_latitude',
                                'mie_wind_result_stop_latitude',
                                'mie_wind_result_start_longitude',
                                'mie_wind_result_COG_longitude',
                                'mie_wind_result_stop_longitude',
                                'mie_wind_result_lat_of_DEM_intersection',
                                'mie_wind_result_lon_of_DEM_intersection',
                                'mie_wind_result_geoid_separation',
                                'mie_wind_result_alt_of_DEM_intersection',
                                'mie_wind_result_HLOS_error',
                                'mie_wind_result_QC_flags_1',
                                'mie_wind_result_QC_flags_2',
                                'mie_wind_result_QC_flags_3',
                                'mie_wind_result_SNR',
                                'mie_wind_result_scattering_ratio',
                                'mie_wind_result_observation_type',
                                'mie_wind_result_validity_flag',
                                'mie_wind_result_wind_velocity',
                                'mie_wind_result_integration_length',
                                'mie_wind_result_num_of_measurements',
                                'mie_wind_result_albedo_off_nadir',
                                /*'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                                'mie_profile_datetime_start', 'mie_profile_datetime_stop'*/
                            ],
                            defaults: {
                                yAxis: 'mie_altitude',
                                colorAxis: 'mie_wind_result_wind_velocity'
                            },
                            positionAlias: {
                                'latitude': 'mie_wind_result_start_latitude',
                                'longitude': 'mie_wind_result_start_longitude',
                                'altitude': 'mie_altitude'
                            }
                        },
                        rayleigh: {
                            parameters: [
                                'rayleigh_altitude',
                                'rayleigh_time',
                                'rayleigh_wind_result_range',
                                'rayleigh_wind_result_range_bin_number',
                                'rayleigh_wind_result_COG_range',
                                'rayleigh_wind_result_bottom_altitude',
                                'rayleigh_wind_result_top_altitude',
                                'rayleigh_wind_result_start_time',
                                'rayleigh_wind_result_stop_time',
                                'rayleigh_wind_result_top_range',
                                'rayleigh_wind_result_bottom_range',
                                'rayleigh_wind_result_range_bin_number_start',
                                'rayleigh_wind_result_range_bin_number_end',
                                'rayleigh_wind_result_COG_range_start',
                                'rayleigh_wind_result_COG_range_end',
                                'rayleigh_wind_result_id',
                                'rayleigh_wind_result_range_bin_number',
                                'rayleigh_wind_result_start_time',
                                'rayleigh_wind_result_COG_time',
                                'rayleigh_wind_result_stop_time',
                                'rayleigh_wind_result_bottom_altitude',
                                'rayleigh_wind_result_COG_altitude',
                                'rayleigh_wind_result_top_altitude',
                                'rayleigh_wind_result_bottom_range',
                                'rayleigh_wind_result_COG_range',
                                'rayleigh_wind_result_top_range',
                                'rayleigh_wind_result_start_latitude',
                                'rayleigh_wind_result_COG_latitude',
                                'rayleigh_wind_result_stop_latitude',
                                'rayleigh_wind_result_start_longitude',
                                'rayleigh_wind_result_COG_longitude',
                                'rayleigh_wind_result_stop_longitude',
                                'rayleigh_wind_result_lat_of_DEM_intersection',
                                'rayleigh_wind_result_lon_of_DEM_intersection',
                                'rayleigh_wind_result_geoid_separation',
                                'rayleigh_wind_result_alt_of_DEM_intersection',
                                'rayleigh_wind_result_HLOS_error',
                                'rayleigh_wind_result_QC_flags_1',
                                'rayleigh_wind_result_QC_flags_2',
                                'rayleigh_wind_result_QC_flags_3',
                                'rayleigh_wind_result_scattering_ratio',
                                'rayleigh_wind_result_observation_type',
                                'rayleigh_wind_result_validity_flag',
                                'rayleigh_wind_result_wind_velocity',
                                'rayleigh_wind_result_integration_length',
                                'rayleigh_wind_result_num_of_measurements',
                                'rayleigh_wind_result_reference_pressure',
                                'rayleigh_wind_result_reference_temperature',
                                'rayleigh_wind_result_reference_backscatter_ratio',
                                'rayleigh_wind_result_albedo_off_nadir',
                                /*'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                                'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'*/
                            ],
                            defaults: {
                                yAxis: 'rayleigh_altitude',
                                colorAxis: 'rayleigh_wind_result_wind_velocity'
                            },
                            positionAlias: {
                                'latitude': 'rayleigh_wind_result_start_latitude',
                                'longitude': 'rayleigh_wind_result_start_longitude',
                                'altitude': 'rayleigh_altitude'
                            }
                        }
                    },
                    sharedParameters: {
                        'time': [ 'mie_time', 'rayleigh_time' ],
                        'latitude_of_DEM_intersection': [
                            'mie_wind_result_lat_of_DEM_intersection',
                            'rayleigh_wind_result_lat_of_DEM_intersection'
                        ],
                        'longitude_of_DEM_intersection': [
                            'mie_wind_result_lon_of_DEM_intersection',
                            'rayleigh_wind_result_lon_of_DEM_intersection'
                        ]
                    },
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    availableParameters: false
                },
                'ALD_U_N_2B_group': {
                    xAxis: ['measurements'],
                    yAxis: [
                        ['rayleigh_bins']
                    ],
                    combinedParameters: {
                        mie_bins: ['mie_bins_end', 'mie_bins_start'],
                        mie_measurements: ['mie_meas_start', 'mie_meas_end'],
                        rayleigh_bins: ['rayleigh_bins_end', 'rayleigh_bins_start'],
                        rayleigh_measurements: ['rayleigh_meas_start', 'rayleigh_meas_end']
                    },
                    colorAxis: [
                        ['rayleigh_meas_map']
                    ],
                    groups: ['rayleigh'],
                    reversedYAxis: true,
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    renderGroups: {
                        mie: {
                            parameters: [
                                'mie_bins',
                                'mie_measurements',
                                'mie_bins_end',
                                'mie_bins_start',
                                'mie_meas_start',
                                'mie_meas_end',
                                'mie_meas_map'
                            ],
                            defaults: {
                                yAxis: 'mie_bins',
                                colorAxis: 'mie_meas_map'
                            }
                        },
                        rayleigh: {
                            parameters: [
                                'rayleigh_bins',
                                'rayleigh_measurements',
                                'rayleigh_bins_end',
                                'rayleigh_bins_start',
                                'rayleigh_meas_start',
                                'rayleigh_meas_end',
                                'rayleigh_meas_map'
                            ],
                            defaults: {
                                yAxis: 'rayleigh_bins',
                                colorAxis: 'rayleigh_meas_map'
                            }
                        }
                    },
                    sharedParameters: {
                        'measurements': [
                            'mie_measurements', 'rayleigh_measurements'
                        ],
                    },
                    availableParameters: false
                },
                'ALD_U_N_2C': {
                    xAxis: 'time',
                    yAxis: [['mie_altitude'], ['rayleigh_altitude']],
                    y2Axis: [[], []],
                    groups: ['mie', 'rayleigh'],
                    combinedParameters: {
                        mie_altitude: ['mie_wind_result_bottom_altitude', 'mie_wind_result_top_altitude'],
                        mie_time: ['mie_wind_result_start_time', 'mie_wind_result_stop_time'],
                        mie_wind_result_range: ['mie_wind_result_top_range', 'mie_wind_result_bottom_range'],
                        mie_wind_result_range_bin_number: [
                            'mie_wind_result_range_bin_number_start',
                            'mie_wind_result_range_bin_number_end'
                        ],
                        mie_wind_result_COG_range: ['mie_wind_result_COG_range_start', 'mie_wind_result_COG_range_end'],
                        rayleigh_altitude: ['rayleigh_wind_result_bottom_altitude', 'rayleigh_wind_result_top_altitude'],
                        rayleigh_time: ['rayleigh_wind_result_start_time', 'rayleigh_wind_result_stop_time'],
                        rayleigh_wind_result_range: ['rayleigh_wind_result_top_range', 'rayleigh_wind_result_bottom_range'],
                        rayleigh_wind_result_range_bin_number: [
                            'rayleigh_wind_result_range_bin_number_start',
                            'rayleigh_wind_result_range_bin_number_end'
                        ],
                        rayleigh_wind_result_COG_range: ['rayleigh_wind_result_COG_range_start', 'rayleigh_wind_result_COG_range_end']
                    },
                    colorAxis: [['mie_wind_result_wind_velocity'], ['rayleigh_wind_result_wind_velocity']],
                    colorAxis2: [[], []],
                    renderGroups: {
                        mie: {
                            parameters: [
                                'mie_altitude',
                                'mie_time',
                                'mie_wind_result_range',
                                'mie_wind_result_range_bin_number',
                                'mie_wind_result_COG_range',
                                'mie_wind_result_bottom_altitude',
                                'mie_wind_result_top_altitude',
                                'mie_wind_result_start_time',
                                'mie_wind_result_stop_time',
                                'mie_wind_result_top_range',
                                'mie_wind_result_bottom_range',
                                'mie_wind_result_range_bin_number_start',
                                'mie_wind_result_range_bin_number_end',
                                'mie_wind_result_COG_range_start',
                                'mie_wind_result_COG_range_end',
                                'mie_wind_result_id',
                                'mie_wind_result_range_bin_number',
                                'mie_wind_result_start_time',
                                'mie_wind_result_COG_time',
                                'mie_wind_result_stop_time',
                                'mie_wind_result_bottom_altitude',
                                'mie_wind_result_COG_altitude',
                                'mie_wind_result_top_altitude',
                                'mie_wind_result_bottom_range',
                                'mie_wind_result_COG_range',
                                'mie_wind_result_top_range',
                                'mie_wind_result_start_latitude',
                                'mie_wind_result_COG_latitude',
                                'mie_wind_result_stop_latitude',
                                'mie_wind_result_start_longitude',
                                'mie_wind_result_COG_longitude',
                                'mie_wind_result_stop_longitude',
                                'mie_wind_result_lat_of_DEM_intersection',
                                'mie_wind_result_lon_of_DEM_intersection',
                                'mie_wind_result_geoid_separation',
                                'mie_wind_result_alt_of_DEM_intersection',
                                'mie_wind_result_HLOS_error',
                                'mie_wind_result_QC_flags_1',
                                'mie_wind_result_QC_flags_2',
                                'mie_wind_result_QC_flags_3',
                                'mie_wind_result_SNR',
                                'mie_wind_result_scattering_ratio',
                                'mie_assimilation_L2B_QC',
                                'mie_assimilation_persistence_error',
                                'mie_assimilation_representativity_error',
                                'mie_assimilation_final_error',
                                'mie_assimilation_est_L2B_bias',
                                'mie_assimilation_background_HLOS_error',
                                'mie_assimilation_L2B_HLOS_reliability',
                                'mie_assimilation_u_wind_background_error',
                                'mie_assimilation_v_wind_background_error',
                                'mie_wind_result_observation_type',
                                'mie_wind_result_validity_flag',
                                'mie_wind_result_wind_velocity',
                                'mie_wind_result_integration_length',
                                'mie_wind_result_num_of_measurements',
                                'mie_assimilation_validity_flag',
                                'mie_assimilation_background_HLOS',
                                'mie_assimilation_background_u_wind_velocity',
                                'mie_assimilation_background_v_wind_velocity',
                                'mie_assimilation_background_horizontal_wind_velocity',
                                'mie_assimilation_background_wind_direction',
                                'mie_assimilation_analysis_HLOS',
                                'mie_assimilation_analysis_u_wind_velocity',
                                'mie_assimilation_analysis_v_wind_velocity',
                                'mie_assimilation_analysis_horizontal_wind_velocity',
                                'mie_assimilation_analysis_wind_direction',
                                'mie_wind_result_albedo_off_nadir'
                            ],
                            defaults: {
                                yAxis: 'mie_altitude',
                                colorAxis: 'mie_wind_result_wind_velocity'
                            },
                            positionAlias: {
                                'latitude': 'mie_wind_result_start_latitude',
                                'longitude': 'mie_wind_result_start_longitude',
                                'altitude': 'mie_altitude'
                            }
                        },
                        rayleigh: {
                            parameters: [
                                'rayleigh_altitude',
                                'rayleigh_time',
                                'rayleigh_wind_result_range',
                                'rayleigh_wind_result_range_bin_number',
                                'rayleigh_wind_result_COG_range',
                                'rayleigh_wind_result_bottom_altitude',
                                'rayleigh_wind_result_top_altitude',
                                'rayleigh_wind_result_start_time',
                                'rayleigh_wind_result_stop_time',
                                'rayleigh_wind_result_top_range',
                                'rayleigh_wind_result_bottom_range',
                                'rayleigh_wind_result_range_bin_number_start',
                                'rayleigh_wind_result_range_bin_number_end',
                                'rayleigh_wind_result_COG_range_start',
                                'rayleigh_wind_result_COG_range_end',
                                'rayleigh_wind_result_id',
                                'rayleigh_wind_result_range_bin_number',
                                'rayleigh_wind_result_start_time',
                                'rayleigh_wind_result_COG_time',
                                'rayleigh_wind_result_stop_time',
                                'rayleigh_wind_result_bottom_altitude',
                                'rayleigh_wind_result_COG_altitude',
                                'rayleigh_wind_result_top_altitude',
                                'rayleigh_wind_result_bottom_range',
                                'rayleigh_wind_result_COG_range',
                                'rayleigh_wind_result_top_range',
                                'rayleigh_wind_result_start_latitude',
                                'rayleigh_wind_result_COG_latitude',
                                'rayleigh_wind_result_stop_latitude',
                                'rayleigh_wind_result_start_longitude',
                                'rayleigh_wind_result_COG_longitude',
                                'rayleigh_wind_result_stop_longitude',
                                'rayleigh_wind_result_lat_of_DEM_intersection',
                                'rayleigh_wind_result_lon_of_DEM_intersection',
                                'rayleigh_wind_result_geoid_separation',
                                'rayleigh_wind_result_alt_of_DEM_intersection',
                                'rayleigh_wind_result_HLOS_error',
                                'rayleigh_wind_result_QC_flags_1',
                                'rayleigh_wind_result_QC_flags_2',
                                'rayleigh_wind_result_QC_flags_3',
                                'rayleigh_wind_result_scattering_ratio',
                                'rayleigh_assimilation_L2B_QC',
                                'rayleigh_assimilation_persistence_error',
                                'rayleigh_assimilation_representativity_error',
                                'rayleigh_assimilation_final_error',
                                'rayleigh_assimilation_est_L2B_bias',
                                'rayleigh_assimilation_background_HLOS_error',
                                'rayleigh_assimilation_L2B_HLOS_reliability',
                                'rayleigh_assimilation_u_wind_background_error',
                                'rayleigh_assimilation_v_wind_background_error',
                                'rayleigh_wind_result_observation_type',
                                'rayleigh_wind_result_validity_flag',
                                'rayleigh_wind_result_wind_velocity',
                                'rayleigh_wind_result_integration_length',
                                'rayleigh_wind_result_num_of_measurements',
                                'rayleigh_wind_result_reference_pressure',
                                'rayleigh_wind_result_reference_temperature',
                                'rayleigh_wind_result_reference_backscatter_ratio',
                                'rayleigh_assimilation_validity_flag',
                                'rayleigh_assimilation_background_HLOS',
                                'rayleigh_assimilation_background_u_wind_velocity',
                                'rayleigh_assimilation_background_v_wind_velocity',
                                'rayleigh_assimilation_background_horizontal_wind_velocity',
                                'rayleigh_assimilation_background_wind_direction',
                                'rayleigh_assimilation_analysis_HLOS',
                                'rayleigh_assimilation_analysis_u_wind_velocity',
                                'rayleigh_assimilation_analysis_v_wind_velocity',
                                'rayleigh_assimilation_analysis_horizontal_wind_velocity',
                                'rayleigh_assimilation_analysis_wind_direction',
                                'rayleigh_wind_result_albedo_off_nadir'
                            ],
                            defaults: {
                                yAxis: 'rayleigh_altitude',
                                colorAxis: 'rayleigh_wind_result_wind_velocity'
                            },
                            positionAlias: {
                                'latitude': 'rayleigh_wind_result_start_latitude',
                                'longitude': 'rayleigh_wind_result_start_longitude',
                                'altitude': 'rayleigh_altitude'
                            }
                        }
                    },
                    sharedParameters: {
                        'time': [
                            'mie_time', 'rayleigh_time'
                        ],
                        'latitude_of_DEM_intersection': [
                            'mie_wind_result_lat_of_DEM_intersection',
                            'rayleigh_wind_result_lat_of_DEM_intersection'
                        ],
                        'longitude_of_DEM_intersection': [
                            'mie_wind_result_lon_of_DEM_intersection',
                            'rayleigh_wind_result_lon_of_DEM_intersection'
                        ]
                    },
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    availableParameters: false
                },
                'ALD_U_N_2C_group': {
                    xAxis: ['measurements'],
                    yAxis: [
                        ['rayleigh_bins']
                    ],
                    combinedParameters: {
                        mie_bins: ['mie_bins_end', 'mie_bins_start'],
                        mie_measurements: ['mie_meas_start', 'mie_meas_end'],
                        rayleigh_bins: ['rayleigh_bins_end', 'rayleigh_bins_start'],
                        rayleigh_measurements: ['rayleigh_meas_start', 'rayleigh_meas_end']
                    },
                    colorAxis: [
                        ['rayleigh_meas_map']
                    ],
                    groups: ['rayleigh'],
                    reversedYAxis: true,
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    renderGroups: {
                        mie: {
                            parameters: [
                                'mie_bins',
                                'mie_measurements',
                                'mie_bins_end',
                                'mie_bins_start',
                                'mie_meas_start',
                                'mie_meas_end',
                                'mie_meas_map'
                            ],
                            defaults: {
                                yAxis: 'mie_bins',
                                colorAxis: 'mie_meas_map'
                            }
                        },
                        rayleigh: {
                            parameters: [
                                'rayleigh_bins',
                                'rayleigh_measurements',
                                'rayleigh_bins_end',
                                'rayleigh_bins_start',
                                'rayleigh_meas_start',
                                'rayleigh_meas_end',
                                'rayleigh_meas_map'
                            ],
                            defaults: {
                                yAxis: 'rayleigh_bins',
                                colorAxis: 'rayleigh_meas_map'
                            }
                        }
                    },
                    sharedParameters: {
                        'measurements': [
                            'mie_measurements', 'rayleigh_measurements'
                        ],
                    },
                    availableParameters: false
                },
                AUX_MRC_1B: {
                    xAxis: ['frequency_offset'],
                    yAxis: [['measurement_response'], ['measurement_error_mie_response']],
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    colorAxis: [ [null], [null] ],
                    y2Axis: [[], []],
                    colorAxis2: [[], []],
                    combinedParameters: {},
                    groups: false,
                    renderGroups: false,
                    sharedParameters: false,
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection',
                        'altitude': 'altitude'
                    },

                    availableParameters: false,
                },
                AUX_RRC_1B: {
                    xAxis: ['frequency_offset'],
                    yAxis: [['measurement_response'], ['measurement_error_rayleigh_response']],
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    colorAxis: [ [null], [null] ],
                    y2Axis: [[], []],
                    colorAxis2: [[], []],
                    combinedParameters: {},
                    groups: false,
                    renderGroups: false,
                    sharedParameters: false,
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection',
                        'altitude': 'altitude'
                    },

                    availableParameters: false,
                },
                AUX_ISR_1B: {
                    xAxis: ['laser_frequency_offset'],
                    yAxis: [['rayleigh_channel_A_response', 'rayleigh_channel_B_response']],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    groups: false,
                    renderGroups: false,
                    sharedParameters: false,
                    colorAxis: [ [null, null] ],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    combinedParameters: {},
                    availableParameters: false,
                },
                AUX_ZWC_1B: {
                    xAxis: ['observation_index'],
                    yAxis: [['mie_ground_correction_velocity', 'rayleigh_ground_correction_velocity']],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    colorAxis: [ [null, null] ],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    combinedParameters: {},
                    groups: false,
                    renderGroups: false,
                    sharedParameters: false,
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection'
                    },
                    availableParameters: false,
                },
                'AUX_MET_12': {
                    xAxis: ['time'],
                    yAxis: [['surface_wind_component_u_nadir'], ['surface_wind_component_u_off_nadir']],
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    colorAxis: [ [null], [null] ],
                    y2Axis: [[],[]],
                    colorAxis2: [[],[]],
                    groups: ['nadir', 'off_nadir'],
                    renderGroups: {
                        nadir: {
                            parameters: [
                                'time_nadir',
                                'surface_wind_component_u_nadir',
                                'surface_wind_component_v_nadir',
                                'surface_pressure_nadir',
                                'surface_altitude_nadir',
                                'latitude_nadir',
                                'longitude_nadir'
                            ],
                            defaults: {
                                yAxis: 'surface_wind_component_u_nadir',
                                colorAxis: null
                            },
                            positionAlias: {
                                'latitude': 'latitude_nadir',
                                'longitude': 'longitude_nadir'
                            }
                        },
                        off_nadir: {
                            parameters: [
                                'time_off_nadir',
                                'surface_wind_component_u_off_nadir',
                                'surface_wind_component_v_off_nadir',
                                'surface_pressure_off_nadir',
                                'surface_altitude_off_nadir',
                                'latitude_off_nadir',
                                'longitude_off_nadir'
                            ],
                            defaults: {
                                yAxis: 'surface_wind_component_u_off_nadir',
                                colorAxis: null
                            },
                            positionAlias: {
                                'latitude': 'latitude_off_nadir',
                                'longitude': 'longitude_off_nadir'
                            }
                        }
                    },
                    sharedParameters: {
                        'time': [
                            'time_nadir', 'time_off_nadir'
                        ]
                    },
                    combinedParameters: {
                        time_nadir_combined: ['time_nadir_start', 'time_nadir_end'],
                        layer_altitude_nadir: ['layer_altitude_nadir_end', 'layer_altitude_nadir_start'],
                        time_off_nadir_combined: ['time_off_nadir_start', 'time_off_nadir_end'],
                        layer_altitude_off_nadir: ['layer_altitude_off_nadir_end', 'layer_altitude_off_nadir_start']
                    },
                    availableParameters: false
                },
                'AUX_MET_12_nadir': {
                    xAxis: 'time_nadir',
                    yAxis: ['surface_wind_component_u_nadir'],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    colorAxis: [ null ],
                    combinedParameters: {
                        time_nadir_combined: ['time_nadir_start', 'time_nadir_end'],
                        layer_altitude_nadir: ['layer_altitude_nadir_end', 'layer_altitude_nadir_start']
                    },
                    availableParameters: false,
                },
                'AUX_MET_12_off_nadir': {
                    xAxis: 'time_off_nadir',
                    yAxis: ['surface_wind_component_u_off_nadir'],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    colorAxis: [ null ],
                    combinedParameters: {
                        time_off_nadir_combined: ['time_off_nadir_start', 'time_off_nadir_end'],
                        layer_altitude_off_nadir: ['layer_altitude_off_nadir_end', 'layer_altitude_off_nadir_start']
                    },
                }
            };

            this.groupSelected = {
                'ALD_U_N_1B': ['mie', 'rayleigh'],
                'ALD_U_N_2A': ['MCA', 'SCA'],
                'ALD_U_N_2B': ['mie', 'rayleigh'],
                'ALD_U_N_2C': ['mie', 'rayleigh'],
                'AUX_MET_12': ['nadir', 'off_nadir']
            };

            this.dataSettings = globals.dataSettings;

            // Check if styling settings have been saved
            if (localStorage.getItem('dataSettings') !== null) {
                this.dataSettings = JSON.parse(localStorage.getItem('dataSettings'));
                globals.dataSettings = this.dataSettings;
            }

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

            }, this);

            var that = this;

            if (this.graph === undefined){

                this.filterManager = globals.swarm.get('filterManager');
                this.filterManager.visibleFilters = this.selectedFilterList;

                var settings = this.renderSettings['ALD_U_N_1B'];
                settings.groups = this.groupSelected['ALD_U_N_1B'];


                this.graph = new graphly.graphly({
                    el: '#graph',
                    margin: {top: 30, left: 100, bottom: 50, right: 70},
                    dataSettings: this.dataSettings,
                    renderSettings: settings,
                    filterManager: globals.swarm.get('filterManager'),
                    displayParameterLabel: false,
                    multiYAxis: true,
                    ignoreParameters: [ /jumps.*/, /SignCross.*/, 'positions', 'stepPositions'],
                    enableSubXAxis: 'time',
                    enableSubYAxis: ['mie_altitude','rayleigh_altitude'],
                    colorAxisTickFormat: 'customExp',
                    defaultAxisTickFormat: 'customExp'
                });
                globals.swarm.get('filterManager').setRenderNode('#analyticsFilters');
                this.graph.on('pointSelect', function(values){
                    Communicator.mediator.trigger('cesium:highlight:point', values);
                });

                this.graph.on('axisChange', function () {
                    var data = globals.swarm.get('data');
                    var datkey = Object.keys(data)[0];
                    // Check to see if L2B or L2C groups are currently visualized
                    if (datkey === 'ALD_U_N_2B' || 
                        datkey === 'ALD_U_N_2C'){

                        var currProd = globals.products.find(
                            function(p){return p.get('download').id === datkey;}
                        );
                        var gran = currProd.get('granularity');

                        if(gran === 'group' && that.currentGroup !== this.renderSettings.groups[0]){
                            // There was an axis change, change the group controls
                            that.currentGroup = this.renderSettings.groups[0];
                            that.createGroupInteractionButtons(data[datkey], that.currentGroup, 3);
                        }
                    }

                    localStorage.setItem(
                        'dataSettings',
                        JSON.stringify(globals.dataSettings)
                    );

                    that.savePlotConfig(that.graph);
                });

                this.graph.on('axisExtentChanged', function () {
                    // Save parameter style changes
                    localStorage.setItem(
                        'dataSettings',
                        JSON.stringify(globals.dataSettings)
                    );
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
                if(this.graph){
                    this.graph.filters = globals.swarm.get('filters');
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
                localStorage.setItem(
                    'filtersMinimized', JSON.stringify(false)
                );
            } else {
                $('#minimizeFilters').attr('class', 'minimized');
                localStorage.setItem(
                    'filtersMinimized', JSON.stringify(true)
                );
            }

            $('#filterSelectDrop').animate({ opacity: opacity  }, 1000);
            $('#analyticsFilters').animate({ opacity: opacity  }, 1000);
            $('#graph_container').animate({ height: height  }, {
                step: function( now, fx ) {
                    //that.graph.resize();
                },
                done: function(){
                    $('#minimizeFilters i').attr('class', 
                        'fa fa-chevron-circle-'+direction
                    );
                    if(that.graph){
                        that.graph.resize();
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


            // Set height of graph depending on 
            var filtersMinimized = localStorage.getItem('filtersMinimized');
            if(filtersMinimized === null){
                filtersMinimized = false;
            } else {
                filtersMinimized = JSON.parse(filtersMinimized);
            }

            var direction = 'down';
            if(filtersMinimized){
                direction = 'up';
            }

            $('#minimizeFilters').off();
            $('#minimizeFilters').remove();
            $('#filterDivContainer').append(
                '<div id="minimizeFilters" class="visible"><i class="fa fa-chevron-circle-'+direction+'" aria-hidden="true"></i></div>'
            );

            var filtersMinimized = localStorage.getItem('filtersMinimized');
            if(filtersMinimized === null){
                filtersMinimized = false;
            } else {
                filtersMinimized = JSON.parse(filtersMinimized);
            }

            if(filtersMinimized){
                $('#minimizeFilters').addClass('minimized');
                $('#filterSelectDrop').css('opacity', 0);
                $('#analyticsFilters').css('opacity', 0);
            } else {
                $('#minimizeFilters').addClass('visible');
            }

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
                for(var k in this.graph.colorCache){
                    delete this.graph.colorCache[k];
                }

                this.graph.dataSettings = this.dataSettings;
                this.graph.renderData();
                this.graph.createColorScales();

                localStorage.setItem(
                    'dataSettings',
                    JSON.stringify(globals.dataSettings)
                );
            }
        },


        createGroupInteractionButtons: function(ds, group, pageSize){
            // Add interaction buttons to go through observation groups

            var groupLength = ds.mie_obs_start.length;
            var pos = this.miePos;
            if(group === 'rayleigh'){
                pos = this.rayleighPos;
                groupLength = ds.rayleigh_obs_start.length;
            }

            var meas_start = 'var_meas_start'.replace('var', group);
            var meas_end = 'var_meas_end'.replace('var', group);
            var groupArrows = 'var_groupArrows'.replace('var', group);

            var slicedData = {};
            var rayleighSlicedData = {};

            for (var key in ds){
                slicedData[key] = ds[key].slice(
                    pos, ((pos+pageSize))
                ).flat();
            }


            this.graph.addGroupArrows(
                ds[groupArrows].slice(pos, ((pos+pageSize)))
            );
            this.graph.setXDomain([
                d3.extent(slicedData[meas_start])[0],
                d3.extent(slicedData[meas_end])[1]
            ]);

            this.graph.margin.bottom = 80;

            this.currentGroup = group;
            this.graph.loadData(slicedData);


            $('#groupButtonContainer').remove();

            $('#graph_container').append(
                '<div id="groupButtonContainer"></div>'
            );
            $('#groupButtonContainer').append(
                '<button id="groupObservationLeft" type="button" class="btn btn-success darkbutton dropdown-toggle"><</button>'
            );
            $('#groupButtonContainer').append(
                '<div id="groupObservationLabel">'+(pos)+'-'+(pos+2)+' / '+groupLength+'</div>'
            );
            $('#groupButtonContainer').append(
                '<button id="groupObservationRight" type="button" class="btn btn-success darkbutton dropdown-toggle">></button>'
            );
            
            var that = this;

            $('#groupObservationRight').click(function(){
                pos+=3;
                if(pos>=groupLength-4){
                    $('#groupObservationRight').attr('disabled', 'disabled');
                }
                $('#groupObservationLeft').removeAttr('disabled');

                var slicedData = {};
                
                for (var key in ds){
                    slicedData[key] = ds[key].slice(
                        pos, ((pos+pageSize))
                    ).flat();
                }
                $('#groupObservationLabel').text(
                    (pos)+'-'+(pos+2)+' / '+groupLength
                );
                
                
                that.graph.addGroupArrows(
                    ds[groupArrows].slice(pos, ((pos+pageSize)))
                );

                that.graph.setXDomain([
                    d3.extent(slicedData[meas_start])[0],
                    d3.extent(slicedData[meas_end])[1]
                ]);

                if(group === 'rayleigh'){
                    that.rayleighPos = pos;
                } else if(group === 'mie'){
                    that.miePos = pos;
                }

                that.graph.loadData(slicedData);
            });

            $('#groupObservationLeft').attr('disabled', 'disabled');
            $('#groupObservationLeft').click(function(){
                pos-=3;
                if(pos<=0){
                    $('#groupObservationLeft').attr('disabled', 'disabled');
                }
                $('#groupObservationRight').removeAttr('disabled');

                var slicedData = {};
                for (var key in ds){
                    slicedData[key] = ds[key].slice(
                        pos, ((pos+pageSize))
                    ).flat();
                }
                $('#groupObservationLabel').text(
                    pos+'-'+(pos+2)+' / '+groupLength
                );
                that.graph.addGroupArrows(
                    ds[groupArrows].slice(pos, ((pos+pageSize)))
                );
                 that.graph.setXDomain([
                    d3.extent(slicedData[meas_start])[0],
                    d3.extent(slicedData[meas_end])[1]
                ]);
                if(group === 'rayleigh'){
                    that.rayleighPos = pos;
                } else if(group === 'mie'){
                    that.miePos = pos;
                }
                that.graph.loadData(slicedData);
            });

        },


        reloadData: function(model, data) {

            this.graph.clearXDomain();
            $('#groupButtonContainer').remove();
            $('#newPlotLink').show();

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

                this.graph.removeGroupArrows();
                this.graph.margin.bottom = 50;

                $('#graphSelect').remove();

                // If data parameters have changed
                if (!firstLoad && !_.isEqual(this.prevParams, idKeys)){
                    // Define which parameters should be selected defaultwise as filtering
                    var setts = this.filterManager.filterSettings;
                    setts.visibleFilters = this.selectedFilterList;


                    this.filterManager.updateFilterSettings(setts);
                    localStorage.setItem(
                        'selectedFilterList',
                        JSON.stringify(this.selectedFilterList)
                    );
                    this.renderFilterList();
                }

                var sT = Communicator.reqres.request('get:time');
                var timeString = getISODateTimeString(sT.start).slice(0,-5)+
                    '_'+getISODateTimeString(sT.end).slice(0,-5);



                if(data.length>0 && _.isEqual(this.previousKeys, this.currentKeys) ){
                    this.graph.loadData(data[idKeys[0]]);
                    this.filterManager.loadData(data[idKeys[0]]);
                    return;
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

                    var currProd = globals.products.find(
                        function(p){return p.get('download').id === idKeys[0];}
                    );


                    $('#nodataavailable').hide();

                    var cP = idKeys[0];
                    var gran = currProd.get('granularity');

                    $('#graph').css('height', '100%');

                    var renderSettings;
                    if(gran === 'group'){
                        renderSettings =  this.renderSettings[cP+'_group'];
                    } else {
                        renderSettings = this.renderSettings[cP];
                    }
                    renderSettings = this.extendSettings(renderSettings);
                    this.graph.renderSettings = renderSettings;

                    if( cP === 'ALD_U_N_1B' || cP === 'ALD_U_N_2A'){

                        this.graph.debounceActive = true;
                        this.graph.dataSettings = mergedDataSettings;
                        this.graph.fileSaveString = cP+'_'+gran+'_'+timeString;
                        this.filterManager.loadData(data[cP]);
                        this.graph.loadData(data[cP]);

                     } else if(cP === 'ALD_U_N_2B' || cP === 'ALD_U_N_2C'){

                        if(gran === 'group'){

                            // Change to "full view" if filters are shown
                            if(!$('#minimizeFilters').hasClass('minimized')){
                                this.changeFilterDisplayStatus();
                            }

                            this.miePos = 0;
                            this.rayleighPos = 0;
                            var pageSize = 3;

                            var ds = data[cP];
                            var currGroup = this.graph.renderSettings.groups[0];
                            
                            this.createGroupInteractionButtons(ds, currGroup, pageSize);
                            $('#newPlotLink').hide();
                        } else {
                            this.graph.loadData(data[cP]);
                        }

                     } else if(idKeys[0] === 'AUX_MRC_1B' || idKeys[0] === 'AUX_RRC_1B'){

                        this.graph.renderSettings = this.renderSettings[idKeys[0]];

                        // Remove diff if no longer available
                        if(this.graph.renderSettings.yAxis[0].indexOf('_diff') !== -1){
                            this.graph.renderSettings.yAxis[0] = 
                                this.graph.renderSettings.yAxis[0].substring(
                                    0, 
                                    this.graph.renderSettings.yAxis[0].length-5
                                );
                        }
                        
                        // Add diff if user uploaded data is avaialble
                        if(this.currentKeys.indexOf(this.graph.renderSettings.yAxis[0]+'_diff') !== -1){
                            this.graph.renderSettings.yAxis[0] = this.graph.renderSettings.yAxis[0]+'_diff';
                        }

                        this.graph.debounceActive = false;
                        this.graph.dataSettings = mergedDataSettings;
                        this.graph.loadData(data[idKeys[0]]);
                        this.graph.fileSaveString = idKeys[0]+'_top'+'_'+timeString;
                        this.filterManager.loadData(data[idKeys[0]]);

                    } else if(idKeys[0] === 'AUX_MET_12'){

                        // AUX MET combines 1D with 2D data so we need to sort out first
                        // what rendering settings we will actually use
                        var params2DNadir = [
                            'layer_validity_flag_nadir',
                            //'layer_pressure_nadir',
                            'layer_temperature_nadir',
                            'layer_wind_component_u_nadir',
                            'layer_wind_component_v_nadir',
                            'layer_rel_humidity_nadir',
                            'layer_spec_humidity_nadir',
                            'layer_cloud_cover_nadir',
                            'layer_cloud_liquid_water_content_nadir',
                            'layer_cloud_ice_water_content_nadir'
                        ];

                        var params2DOffNadir = [
                            'layer_validity_flag_off_nadir',
                            //'layer_pressure_off_nadir',
                            'layer_temperature_off_nadir',
                            'layer_wind_component_u_off_nadir',
                            'layer_wind_component_v_off_nadir',
                            'layer_rel_humidity_off_nadir',
                            'layer_spec_humidity_off_nadir',
                            'layer_cloud_cover_off_nadir',
                            'layer_cloud_liquid_water_content_off_nadir',
                            'layer_cloud_ice_water_content_off_nadir'
                        ];
                        var contains2DNadir = false;
                        var contains2DOffNadir = false;
                        var param2D = null;
                        
                        for (var i = 0; i < this.currentKeys.length; i++) {
                            if(params2DNadir.indexOf(this.currentKeys[i]) !== -1){
                                contains2DNadir = true;
                                param2D = this.currentKeys[i];
                            }
                            if(params2DOffNadir.indexOf(this.currentKeys[i]) !== -1){
                                contains2DOffNadir = true;
                                param2D = this.currentKeys[i];
                            }
                        }

                        if(contains2DNadir){
                            this.graph.renderSettings = {
                                xAxis: ['time_nadir_combined'],
                                yAxis: [['layer_altitude_nadir']],
                                y2Axis: [[]],
                                colorAxis2: [[]],
                                additionalXTicks: [],
                                additionalYTicks: [[]],
                                colorAxis: [ [param2D] ],
                                combinedParameters: {
                                    time_nadir_combined: ['time_nadir_start', 'time_nadir_end'],
                                    layer_altitude_nadir: ['layer_altitude_nadir_end', 'layer_altitude_nadir_start']
                                },
                                availableParameters: false,
                                groups: false,
                                renderGroups: false,
                                sharedParameters: false
                            };
                        } else if(contains2DOffNadir){
                            this.graph.renderSettings = {
                                xAxis: ['time_off_nadir_combined'],
                                yAxis: [['layer_altitude_off_nadir']],
                                y2Axis: [[]],
                                colorAxis2: [[]],
                                additionalXTicks: [],
                                additionalYTicks: [[]],
                                colorAxis: [ [param2D] ],
                                combinedParameters: {
                                    time_off_nadir_combined: ['time_off_nadir_start', 'time_off_nadir_end'],
                                    layer_altitude_off_nadir: ['layer_altitude_off_nadir_end', 'layer_altitude_off_nadir_start']
                                },
                                availableParameters: false,
                                groups: false,
                                renderGroups: false,
                                sharedParameters: false
                            };
                        } else {
                            this.graph.renderSettings = this.renderSettings[(idKeys[0])];
                        }

                        if(contains2DNadir || contains2DOffNadir) {
                            this.graph.dataSettings = mergedDataSettings;
                            this.graph.loadData(data[idKeys[0]]);
                            this.graph.fileSaveString = idKeys[0]+'_top'+'_'+timeString;
                            this.filterManager.loadData(data[idKeys[0]]);
                        } else {
                            this.graph.dataSettings = mergedDataSettings;
                            this.graph.loadData(data[idKeys[0]]);
                            this.graph.fileSaveString = idKeys[0]+'_top'+'_'+timeString;
                            this.filterManager.loadData(data[idKeys[0]]);
                        }
                        this.graph.debounceActive = true;


                    } else {

                        // Remove diff if no longer available
                        if(this.graph.renderSettings.yAxis[0].indexOf('_diff') !== -1){
                            this.graph.renderSettings.yAxis[0] = 
                                this.graph.renderSettings.yAxis[0].substring(
                                    0, 
                                    this.graph.renderSettings.yAxis[0].length-5
                                );
                        }
                        if(this.graph.renderSettings.yAxis.length>1 &&
                            this.graph.renderSettings.yAxis[1].indexOf('_diff') !== -1){
                            this.graph.renderSettings.yAxis[1] = 
                                this.graph.renderSettings.yAxis[1].substring(
                                    0, 
                                    this.graph.renderSettings.yAxis[1].length-5
                                );
                        }
                        // Add diff if user uploaded data is avaialble
                        if(this.currentKeys.indexOf(this.graph.renderSettings.yAxis[0]+'_diff') !== -1){
                            this.graph.renderSettings.yAxis[0] = this.graph.renderSettings.yAxis[0]+'_diff';
                        }
                        if(this.graph.renderSettings.yAxis.length>1 &&
                            this.currentKeys.indexOf(this.graph.renderSettings.yAxis[1]+'_diff') !== -1){
                            this.graph.renderSettings.yAxis[1] = this.graph.renderSettings.yAxis[1]+'_diff';
                        }

                        this.graph.debounceActive = false;
                        this.graph.dataSettings = mergedDataSettings;
                        this.graph.renderSettings = this.renderSettings[idKeys[0]];
                        this.graph.loadData(data[idKeys[0]]);
                        this.graph.fileSaveString = idKeys[0]+'_'+timeString;
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

                    this.previousKeys = this.currentKeys;

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
            if(this.graph){
                this.graph.destroy();
            }
            

            delete this.graph;
            this.isClosed = true;
            this.$el.empty();
            this.triggerMethod('view:disconnect');
        }
    });
    return AVView;
});