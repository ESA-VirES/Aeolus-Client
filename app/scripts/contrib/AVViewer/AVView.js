define(['backbone.marionette',
    'communicator',
    'app',
    'models/AVModel',
    'globals',
    'd3',
    'graphly',
    'underscore',
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
            this.requestedListChanged = false;

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
                'reversedYAxis',
                JSON.stringify(graph.renderSettings.reversedYAxis)
            );

            localStorage.setItem(
                'reversedY2Axis',
                JSON.stringify(graph.renderSettings.reversedY2Axis)
            );

            localStorage.setItem(
                'groupSelected',
                JSON.stringify(graph.renderSettings.groups)
            );

            localStorage.setItem(
                'additionalXTicks',
                JSON.stringify(graph.renderSettings.additionalXTicks)
            );
            localStorage.setItem(
                'additionalYTicks',
                JSON.stringify(graph.renderSettings.additionalYTicks)
            );
            if(typeof graph.yAxisLabel !== 'undefined'){
                localStorage.setItem(
                    'yAxisLabel',
                    JSON.stringify(graph.yAxisLabel)
                );
            }
            if(typeof graph.y2AxisLabel !== 'undefined'){
                localStorage.setItem(
                    'y2AxisLabel',
                    JSON.stringify(graph.y2AxisLabel)
                );
            }
            if(typeof graph.xAxisLabel !== 'undefined'){
                localStorage.setItem(
                    'xAxisLabel',
                    JSON.stringify(graph.xAxisLabel)
                );
            }

            if(typeof graph.renderSettings.reversedYAxis !== 'undefined'){
                localStorage.setItem(
                    'reversedYAxis',
                    JSON.stringify(graph.renderSettings.reversedYAxis)
                );
            }
            if(typeof graph.renderSettings.reversedY2Axis !== 'undefined'){
                localStorage.setItem(
                    'reversedY2Axis',
                    JSON.stringify(graph.renderSettings.reversedY2Axis)
                );
            }
            if(typeof graph.logY !== 'undefined'){
                localStorage.setItem(
                    'logY',
                    JSON.stringify(graph.logY)
                );
            }
            if(typeof graph.logY2 !== 'undefined'){
                localStorage.setItem(
                    'logY2',
                    JSON.stringify(graph.logY2)
                );
            }
            if(typeof graph.logX !== 'undefined'){
                localStorage.setItem(
                    'logX',
                    JSON.stringify(graph.logX)
                );
            }
        },

        extendSettings: function(settings){

            var currSets = settings;

            var allInside = true;
            var xax = JSON.parse(localStorage.getItem('xAxisSelection'));
            var yax = JSON.parse(localStorage.getItem('yAxisSelection'));
            var y2ax = JSON.parse(localStorage.getItem('y2AxisSelection'));
            var colax = JSON.parse(localStorage.getItem('colorAxisSelection'));
            var colax2 = JSON.parse(localStorage.getItem('colorAxis2Selection'));
            var groups = JSON.parse(localStorage.getItem('groupSelected'));
            var yAxisLocked = JSON.parse(localStorage.getItem('yAxisLocked'));
            var y2AxisLocked = JSON.parse(localStorage.getItem('y2AxisLocked'));
            var yAxisExtent = JSON.parse(localStorage.getItem('yAxisExtent'));
            var y2AxisExtent = JSON.parse(localStorage.getItem('y2AxisExtent'));
            var additionalXTicks = JSON.parse(localStorage.getItem('additionalXTicks'));
            var additionalYTicks = JSON.parse(localStorage.getItem('additionalYTicks'));
            var yAxisLabel = JSON.parse(localStorage.getItem('yAxisLabel'));
            var y2AxisLabel = JSON.parse(localStorage.getItem('y2AxisLabel'));
            var xAxisLabel = JSON.parse(localStorage.getItem('xAxisLabel'));
            var logY = JSON.parse(localStorage.getItem('logY'));
            var logY2 = JSON.parse(localStorage.getItem('logY2'));
            var logX = JSON.parse(localStorage.getItem('logX'));

            var revY = null;
            var revY2 = null;
            if(localStorage.getItem('reversedYAxis') !== 'undefined'){
                revY = JSON.parse(localStorage.getItem('reversedYAxis'));
            }
            if(localStorage.getItem('reversedYAxis') !== 'undefined'){
                revY2 = JSON.parse(localStorage.getItem('reversedY2Axis'));
            }

            var comb = [].concat(xax, yax, y2ax, colax);
            comb = _.flatten(comb);
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
                                comb.splice(i, 1);
                            }
                        }
                    } else if (settings.hasOwnProperty('sharedParameters') &&  settings.sharedParameters!== false){
                        if(!settings.sharedParameters.hasOwnProperty(parameter)){
                            allInside = false;
                            comb.splice(i, 1);
                        } else {
                            // Check if the related shared parameters are inside
                            // of the current selection
                            for (var sp = 0; sp < settings.sharedParameters[parameter].length; sp++) {
                                var sps = settings.sharedParameters[parameter][sp];
                                if(settings.combinedParameters.hasOwnProperty(sps)){
                                    var combined = settings.combinedParameters[sps];
                                    for (var cc = combined.length - 1; cc >= 0; cc--) {
                                        if(this.currentKeys.indexOf(combined[cc]) === -1){
                                            allInside = false;
                                            comb.splice(i, 1);
                                        }
                                    }
                                } else if(this.currentKeys.indexOf(sps) === -1){
                                    allInside = false;
                                    comb.splice(i, 1);
                                }
                            }
                        }
                    } else {
                        allInside = false;
                        comb.splice(i, 1);
                    }
                }
            }

            if(!allInside){

                if(comb.indexOf(xax) !== -1){
                    // Empty y axis are fine, need to make sure settings are "balanced"
                    // remove all parameters not available
                    for (var yy = yax.length - 1; yy >= 0; yy--) {
                        for (var suby = yax[yy].length - 1; suby >= 0; suby--) {
                            if(comb.indexOf(yax[yy][suby]) === -1){
                                yax[yy].splice(suby, 1);
                                // Remove corresponding colorscale
                                colax[yy].splice(suby, 1);
                            }
                        }
                    }

                    for (var yy2 = y2ax.length - 1; yy2 >= 0; yy2--) {
                        for (var suby2 = y2ax[yy2].length - 1; suby2 >= 0; suby2--) {
                            if(comb.indexOf(y2ax[yy2][suby2]) === -1){
                                y2ax[yy2].splice(suby2, 1);
                                // Remove corresponding colorscale
                                colax2[yy2].splice(suby2, 1);
                            }
                        }
                    }

                    // Replace missing colorscale parameters with null
                    for (var cc = colax.length - 1; cc >= 0; cc--) {
                        for (var csub = colax[cc].length - 1; csub >= 0; csub--) {
                            if(comb.indexOf(colax[cc][csub]) === -1){
                                colax[cc][csub] = null;
                            }
                        }
                    }
                    for (var cc2 = colax2.length - 1; cc2 >= 0; cc2--) {
                        for (var csub2 = colax2[cc2].length - 1; csub2 >= 0; csub2--) {
                            if(comb.indexOf(colax2[cc2][csub2]) === -1){
                                colax2[cc2][csub2] = null;
                            }
                        }
                    }
                } else {
                    return settings;
                }
                // Once new settings are set we need to save them to localstorage
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
            if (revY !== null) {
                currSets.reversedYAxis = revY;
            }
            if (revY2 !== null) {
                currSets.reversedY2Axis = revY2;
            }

            if (logY !== null) {
                currSets.logY = logY;
            }
            if (logY2 !== null) {
                currSets.logY2 = logY2;
            }
            if (logX !== null) {
                currSets.logX = logX;
            }

            if (additionalXTicks !== null) {
                // Check to see if selected parameters are still available
                for (var i = additionalXTicks.length - 1; i >= 0; i--) {
                    if(this.currentKeys.indexOf(additionalXTicks[i]) === -1){
                        additionalXTicks.splice(i, 1);
                    }
                }
                currSets.additionalXTicks = additionalXTicks;
            }
            if (additionalYTicks !== null) {
                // Check to see if selected parameters are still available
                for (var i = additionalYTicks.length - 1; i >= 0; i--) {
                    for (var yy = additionalYTicks.length - 1; yy >= 0; yy--) {
                        if(Array.isArray(additionalYTicks[i]) && additionalYTicks[i].lenght>=yy){
                            if(this.currentKeys.indexOf(additionalYTicks[i][yy]) === -1){
                                additionalYTicks[i].splice(yy, 1);
                            }
                        }
                    }
                }
                currSets.additionalYTicks = additionalYTicks;
            }
            // Apply custom subticks in the size of the amount of plots
            // subticks are not saved at the moment
            if (groups !== null) {
                if(additionalYTicks !== null && additionalYTicks.length !== currSets.yAxis.length){
                    var yticks = [];
                    for (var i = 0; i < currSets.yAxis.length; i++) {
                        yticks.push([]);
                    }
                    currSets.additionalYTicks = yticks;
                }
            }
            if (yAxisLabel !== null) {
                currSets.yAxisLabel = yAxisLabel;
            }
            if (y2AxisLabel !== null) {
                currSets.y2AxisLabel = y2AxisLabel;
            }
            if (xAxisLabel !== null) {
                currSets.xAxisLabel = xAxisLabel;
            }


            currSets.yAxisLocked = yAxisLocked;
            currSets.y2AxisLocked = y2AxisLocked;
            currSets.yAxisExtent = yAxisExtent;
            currSets.y2AxisExtent = y2AxisExtent;

            return currSets;
        },

        onShow: function() {
            var that = this;
            this.stopListening(Communicator.mediator, 'change:axis:parameters', this.onChangeAxisParameters);
            this.listenTo(Communicator.mediator, 'change:axis:parameters', this.onChangeAxisParameters);

            this.stopListening(Communicator.mediator, 'layer:parameterlist:changed', this.onRequestedListChanged);
            this.listenTo(Communicator.mediator, 'layer:parameterlist:changed', this.onRequestedListChanged);
            
            this.isClosed = false;
            this.selectionList = [];
            this.plotdata = [];
            this.requestUrl = '';
            this.img = null;
            this.overlay = null;
            this.activeWPSproducts = [];
            this.plotType = 'scatter';
            this.prevParams = null;
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

            this.originalSelectedFilterList = [
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

            this.$('#filterDivContainer').append('<div id="filterSelectDrop"></div>');
            var filterList = localStorage.getItem('selectedFilterList');
            if(filterList !== null){
                filterList = JSON.parse(filterList);
                this.selectedFilterList = filterList;
            } else {
                this.selectedFilterList = JSON.parse(
                    JSON.stringify(this.originalSelectedFilterList)
                );
            }

            this.renderSettings = {
                'ALD_U_N_1B':{
                    xAxis: 'time',
                    yAxis: [['rayleigh_altitude'], ['mie_altitude']],
                    y2Axis: [[], []],
                    groups: ['rayleigh', 'mie'],
                    colorAxis: [['rayleigh_HLOS_wind_speed'], ['mie_HLOS_wind_speed']],
                    yAxisLocked: [false, false],
                    yAxisExtent: [null, null],
                    colorAxis2: [[], []],
                    y2AxisLocked: [false, false],
                    y2AxisExtent: [null, null],
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    combinedParameters: {
                        rayleigh_altitude: ['rayleigh_altitude_start', 'rayleigh_altitude_end'],
                        latitude_of_DEM_intersection: ['latitude_of_DEM_intersection_start', 'latitude_of_DEM_intersection_end'],
                        longitude_of_DEM_intersection: ['longitude_of_DEM_intersection_end', 'longitude_of_DEM_intersection_start'],
                        mie_time: ['mie_time_start', 'mie_time_end'],
                        rayleigh_time: ['rayleigh_time_start', 'rayleigh_time_end'],
                        mie_altitude: ['mie_altitude_start', 'mie_altitude_end'],
                        rayleigh_range: ['rayleigh_range_start', 'rayleigh_range_end'],
                        mie_range: ['mie_range_start', 'mie_range_end'],
                        range_bin_number: ['range_bin_number_start', 'range_bin_number_end']
                    },
                    renderGroups: {
                        mie: {
                            parameters: [
                                'mie_time',
                                'mie_time_start',
                                'mie_time_end',
                                'longitude_of_DEM_intersection_start',
                                'longitude_of_DEM_intersection_end',
                                'latitude_of_DEM_intersection_start',
                                'latitude_of_DEM_intersection_end',
                                'altitude_of_DEM_intersection',
                                'argument_of_latitude_of_dem_intersection',
                                'mie_longitude',
                                'mie_latitude',
                                'mie_altitude',
                                'mie_altitude_start',
                                'mie_altitude_end',
                                'mie_range',
                                'mie_range_start',
                                'mie_range_end',
                                'bin_number',
                                'range_bin_number_start',
                                'range_bin_number_end',
                                'geoid_separation',
                                'velocity_at_DEM_intersection',
                                'AOCS_pitch_angle',
                                'AOCS_roll_angle',
                                'AOCS_yaw_angle',
                                'mie_HLOS_wind_speed',
                                'mie_HLOS_wind_speed_normalised',
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
                                'mie_signal_intensity_normalised',

                                'laser_frequency_offset_std_dev',
                                'uv_energy_std_dev',
                                'aht_22_tel_m1',
                                'aht_23_tel_m1',
                                'aht_24_tel_m1',
                                'aht_25_tel_m1',
                                'aht_26_tel_m1',
                                'aht_27_tel_m1',
                                'tc_18_tel_m11',
                                'tc_19_tel_m12',
                                'tc_20_tel_m13',
                                'tc_21_tel_m14',
                                'tc_25_tm15_ths1y',
                                'tc_27_tm16_ths1y',
                                'tc_29_ths2',
                                'tc_23_ths1',
                                'tc_32_ths3',

                                'mie_ground_fwhm',
                                'mie_ground_useful_signal',
                                'mie_ground_signal_to_noise_ratio',
                                'mie_ground_refined_signal_to_noise_ratio',
                                'mie_average_ground_wind_bin_thickness',
                                'mie_average_ground_wind_bin_thickness_above_dem',
                                'mie_num_invalid_reference_pulse',
                                'mie_ref_pulse_signal_to_noise_ratio',
                                'mie_ref_pulse_refined_signal_to_noise_ratio',
                                'mie_num_peak_invalid',
                                'mie_corrected_reference_pulse_response',
                            ],
                            positionAlias: {
                                'latitude': 'mie_latitude',
                                'longitude': 'mie_longitude',
                                'altitude': 'mie_altitude'
                            },
                            defaults: {
                                yAxis: 'mie_altitude',
                                colorAxis: 'mie_HLOS_wind_speed'
                            }
                        },
                        rayleigh: {
                            parameters: [
                                'rayleigh_time',
                                'rayleigh_time_start',
                                'rayleigh_time_end',
                                'longitude_of_DEM_intersection_start',
                                'longitude_of_DEM_intersection_end',
                                'latitude_of_DEM_intersection_start',
                                'latitude_of_DEM_intersection_end',
                                'altitude_of_DEM_intersection',
                                'argument_of_latitude_of_dem_intersection',
                                'rayleigh_longitude',
                                'rayleigh_latitude',
                                'rayleigh_altitude',
                                'rayleigh_altitude_start',
                                'rayleigh_altitude_end',
                                'rayleigh_range',
                                'rayleigh_range_start',
                                'rayleigh_range_end',
                                'bin_number',
                                'range_bin_number_start',
                                'range_bin_number_end',
                                'geoid_separation',
                                'velocity_at_DEM_intersection',
                                'AOCS_pitch_angle',
                                'AOCS_roll_angle',
                                'AOCS_yaw_angle',
                                'rayleigh_HLOS_wind_speed',
                                'rayleigh_HLOS_wind_speed_normalised',
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
                                'rayleigh_signal_intensity_normalised',

                                'laser_frequency_offset_std_dev',
                                'uv_energy_std_dev',
                                'aht_22_tel_m1',
                                'aht_23_tel_m1',
                                'aht_24_tel_m1',
                                'aht_25_tel_m1',
                                'aht_26_tel_m1',
                                'aht_27_tel_m1',
                                'tc_18_tel_m11',
                                'tc_19_tel_m12',
                                'tc_20_tel_m13',
                                'tc_21_tel_m14',
                                'tc_25_tm15_ths1y',
                                'tc_27_tm16_ths1y',
                                'tc_29_ths2',
                                'tc_23_ths1',
                                'tc_32_ths3',

                                'rayleigh_topocentric_azimuth_of_height_bin',
                                'rayleigh_topocentric_elevation_of_height_bin',
                                'rayleigh_target_to_sun_visibility_flag',
                                'rayleigh_ground_useful_signal',
                                'rayleigh_ground_signal_to_noise_ratio',
                                'rayleigh_average_ground_wind_bin_thickness',
                                'rayleigh_average_ground_wind_bin_thickness_above_dem',
                                'rayleigh_num_invalid_reference_pulse',
                                'rayleigh_ref_pulse_signal_to_noise_ratio_channel_a',
                                'rayleigh_ref_pulse_signal_to_noise_ratio_channel_b',
                                'rayleigh_corrected_reference_pulse_response',

                            ],
                            positionAlias: {
                                'latitude': 'rayleigh_latitude',
                                'longitude': 'rayleigh_longitude',
                                'altitude': 'rayleigh_altitude'
                            },
                            defaults: {
                                yAxis: 'rayleigh_altitude',
                                colorAxis: 'rayleigh_HLOS_wind_speed'
                            }
                        }
                    },
                    sharedParameters: {
                        'time': [
                            'mie_time', 'rayleigh_time'
                        ],
                        /*'altitude': [
                            'rayleigh_altitude', 'mie_altitude'
                        ],*/
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
                    availableParameters: false
                },
                //sca extintction, mca extinction and sca backscatter.
                'ALD_U_N_2A': {
                    xAxis: 'time',
                    yAxis: [['rayleigh_altitude'], ['rayleigh_altitude'], ['mie_altitude']],
                    y2Axis: [[], [], []],
                    additionalXTicks: [],
                    additionalYTicks: [[],[], []],
                    yAxisLocked: [false, false, false],
                    yAxisExtent: [null, null, null],
                    colorAxis: [['SCA_extinction'], ['SCA_backscatter'], ['MCA_extinction']],
                    colorAxis2: [[], [], []],
                    y2AxisLocked: [false, false, false],
                    y2AxisExtent: [null, null, null],
                    groups: ['SCA', 'SCA', 'MCA'],
                    combinedParameters: {
                        mie_altitude: ['mie_altitude_obs_top', 'mie_altitude_obs_bottom'],
                        MCA_mie_altitude: ['MCA_mie_altitude_obs_top','MCA_mie_altitude_obs_bottom'],
                        MCA_time: ['MCA_time_obs_start', 'MCA_time_obs_stop'],
                        rayleigh_altitude: ['rayleigh_altitude_obs_top', 'rayleigh_altitude_obs_bottom'],
                        SCA_time: ['SCA_time_obs_start', 'SCA_time_obs_stop'],
                        SCA_middle_bin_altitude: ['SCA_middle_bin_altitude_obs_top', 'SCA_middle_bin_altitude_obs_bottom'],
                        SCA_middle_bin_time: ['SCA_middle_bin_time_obs_start', 'SCA_middle_bin_time_obs_stop']
                    },
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
                                'geoid_separation_obs',
                                'L1B_num_of_meas_per_obs',
                                'MCA_clim_BER',
                                'MCA_extinction',
                                'MCA_LOD',
                                'longitude_of_DEM_intersection_obs',
                                'latitude_of_DEM_intersection_obs',
                                'altitude_of_DEM_intersection_obs',
                                'albedo_off_nadir'
                            ],
                            defaults: {
                                yAxis: 'MCA_mie_altitude',
                                colorAxis: 'MCA_extinction'
                            },
                            positionAlias: {
                                'latitude': 'latitude_of_DEM_intersection_obs',
                                'longitude': 'longitude_of_DEM_intersection_obs',
                                'altitude': 'MCA_mie_altitude'
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
                                'sca_latitude_of_DEM_intersection_obs',
                                'sca_longitude_of_DEM_intersection_obs',
                                'longitude_of_DEM_intersection_obs',
                                'latitude_of_DEM_intersection_obs',
                                'altitude_of_DEM_intersection_obs',
                                'albedo_off_nadir',
                                'SCA_processing_qc_flag',
                                'SCA_extinction_valid',
                                'SCA_backscatter_valid',
                                'SCA_mie_SNR_valid',
                                'SCA_rayleigh_SNR_valid',
                                'SCA_extinction_error_bar_valid',
                                'SCA_backscatter_error_bar_valid',
                                'SCA_cumulative_LOD_valid',
                            ],
                            defaults: {
                                yAxis: 'rayleigh_altitude',
                                colorAxis: 'SCA_extinction'
                            },
                            positionAlias: {
                                'latitude': 'sca_latitude_of_DEM_intersection_obs',
                                'longitude': 'sca_longitude_of_DEM_intersection_obs',
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
                                'SCA_middle_bin_BER',
                                'longitude_of_DEM_intersection_obs',
                                'latitude_of_DEM_intersection_obs',
                                'altitude_of_DEM_intersection_obs',
                                'albedo_off_nadir',
                                'SCA_middle_bin_processing_qc_flag',
                                'SCA_middle_bin_extinction_valid',
                                'SCA_middle_bin_backscatter_valid',
                                'SCA_middle_bin_BER_valid',
                                'SCA_middle_bin_mie_SNR_valid',
                                'SCA_middle_bin_rayleigh_SNR_valid',
                                'SCA_middle_bin_extinction_error_bar_valid',
                                'SCA_middle_bin_backscatter_error_bar_valid',
                                'SCA_middle_bin_cumulative_LOD_valid',
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
                        }
                    },
                    sharedParameters: {
                        'time': [
                            'MCA_time', 'SCA_time', 'SCA_middle_bin_time'
                        ]
                    },
                    availableParameters: false
                },
                'ALD_U_N_2A_group':{
                    xAxis: ['time'],
                    yAxis: [
                        ['altitude'],
                    ],
                    combinedParameters: {
                        altitude: ['alt_start', 'alt_end'],
                        measurements: ['meas_start', 'meas_end'],
                        time: ['group_start_time', 'group_end_time'],
                    },
                    colorAxis: [
                        ['group_backscatter']
                    ],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    yAxisLocked: [false],
                    yAxisExtent: [null],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    y2AxisLocked: [false],
                    y2AxisExtent: [null],
                    groups: false,
                    renderGroups: false,
                    sharedParameters: false,
                    availableParameters: false
                },
                'ALD_U_N_2B': {
                    xAxis: 'time',
                    yAxis: [['rayleigh_altitude'], ['mie_altitude']],
                    y2Axis: [[], []],
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    yAxisLocked: [false, false],
                    yAxisExtent: [null, null],
                    colorAxis: [['rayleigh_wind_result_wind_velocity'], ['mie_wind_result_wind_velocity']],
                    colorAxis2: [[], []],
                    y2AxisLocked: [false, false],
                    y2AxisExtent: [null, null],
                    groups: ['rayleigh', 'mie'],
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
                    renderGroups: {
                        mie: {
                            parameters: [
                                'mie_altitude',
                                'mie_time',
                                'mie_wind_result_range',

                                /*'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                                'mie_profile_datetime_start', 'mie_profile_datetime_stop'*/

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
                                'mie_wind_result_arg_of_lat_of_DEM_intersection',
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

                                'mie_wind_result_reference_hlos',
                                'mie_wind_result_extinction',
                                'mie_wind_result_background_high',
                                'mie_wind_result_observation_type',
                                'mie_wind_result_applied_spacecraft_los_corr_velocity',
                                'mie_wind_result_applied_m1_temperature_corr_velocity',
                                'mie_aht_22',
                                'mie_aht_23',
                                'mie_aht_24',
                                'mie_aht_25',
                                'mie_aht_26',
                                'mie_aht_27',
                                'mie_tc_18',
                                'mie_tc_19',
                                'mie_tc_20',
                                'mie_tc_21',
                                'mie_tc_23',
                                'mie_tc_25',
                                'mie_tc_27',
                                'mie_tc_29',
                                'mie_tc_32',
                            ],
                            defaults: {
                                yAxis: 'mie_altitude',
                                colorAxis: 'mie_wind_result_wind_velocity'
                            },
                            positionAlias: {
                                'latitude': 'mie_wind_result_lat_of_DEM_intersection',
                                'longitude': 'mie_wind_result_lon_of_DEM_intersection',
                                'altitude': 'mie_altitude'
                            }
                        },
                        rayleigh: {
                            parameters: [
                                'rayleigh_altitude',
                                'rayleigh_time',
                                'rayleigh_wind_result_range',

                                /*'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                                'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'*/

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
                                'rayleigh_wind_result_arg_of_lat_of_DEM_intersection',
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

                                'rayleigh_wind_result_reference_hlos',
                                'rayleigh_wind_result_background_high',
                                'rayleigh_wind_result_wind_to_pressure',
                                'rayleigh_wind_result_wind_to_temperature',
                                'rayleigh_wind_result_wind_to_backscatter_ratio',
                                'rayleigh_wind_result_applied_spacecraft_los_corr_velocity',
                                'rayleigh_wind_result_applied_rdb_corr_velocity',
                                'rayleigh_wind_result_applied_ground_corr_velocity',
                                'rayleigh_wind_result_applied_m1_temperature_corr_velocity',
                                'rayleigh_aht_22',
                                'rayleigh_aht_23',
                                'rayleigh_aht_24',
                                'rayleigh_aht_25',
                                'rayleigh_aht_26',
                                'rayleigh_aht_27',
                                'rayleigh_tc_18',
                                'rayleigh_tc_19',
                                'rayleigh_tc_20',
                                'rayleigh_tc_21',
                                'rayleigh_tc_23',
                                'rayleigh_tc_25',
                                'rayleigh_tc_27',
                                'rayleigh_tc_29',
                                'rayleigh_tc_32',
                            ],
                            defaults: {
                                yAxis: 'rayleigh_altitude',
                                colorAxis: 'rayleigh_wind_result_wind_velocity'
                            },
                            positionAlias: {
                                'latitude': 'rayleigh_wind_result_lat_of_DEM_intersection',
                                'longitude': 'rayleigh_wind_result_lon_of_DEM_intersection',
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
                    reversedYAxis: [true],
                    reversedY2Axis: [false],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    yAxisLocked: [false],
                    yAxisExtent: [null],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    y2AxisLocked: [false],
                    y2AxisExtent: [null],
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
                    yAxis: [['rayleigh_altitude'], ['mie_altitude']],
                    y2Axis: [[], []],
                    colorAxis: [['rayleigh_wind_result_wind_velocity'], ['mie_wind_result_wind_velocity']],
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    yAxisLocked: [false, false],
                    yAxisExtent: [null, null],
                    colorAxis2: [[], []],
                    y2AxisLocked: [false, false],
                    y2AxisExtent: [null, null],
                    availableParameters: false,
                    groups: ['rayleigh', 'mie'],
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
                                'mie_wind_result_arg_of_lat_of_DEM_intersection',
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
                                'mie_wind_result_wind_velocity_normalised',
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
                                'mie_wind_result_albedo_off_nadir',

                                'mie_wind_result_reference_hlos',
                                'mie_wind_result_extinction',
                                'mie_wind_result_background_high',
                                'mie_wind_result_observation_type',
                                'mie_wind_result_applied_spacecraft_los_corr_velocity',
                                'mie_wind_result_applied_m1_temperature_corr_velocity',
                                'mie_aht_22',
                                'mie_aht_23',
                                'mie_aht_24',
                                'mie_aht_25',
                                'mie_aht_26',
                                'mie_aht_27',
                                'mie_tc_18',
                                'mie_tc_19',
                                'mie_tc_20',
                                'mie_tc_21',
                                'mie_tc_23',
                                'mie_tc_25',
                                'mie_tc_27',
                                'mie_tc_29',
                                'mie_tc_32',
                            ],
                            defaults: {
                                yAxis: 'mie_altitude',
                                colorAxis: 'mie_wind_result_wind_velocity'
                            },
                            positionAlias: {
                                'latitude': 'mie_wind_result_lat_of_DEM_intersection',
                                'longitude': 'mie_wind_result_lon_of_DEM_intersection',
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
                                'rayleigh_wind_result_arg_of_lat_of_DEM_intersection',
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
                                'rayleigh_wind_result_wind_velocity_normalised',
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
                                'rayleigh_wind_result_albedo_off_nadir',

                                'rayleigh_wind_result_reference_hlos',
                                'rayleigh_wind_result_background_high',
                                'rayleigh_wind_result_wind_to_pressure',
                                'rayleigh_wind_result_wind_to_temperature',
                                'rayleigh_wind_result_wind_to_backscatter_ratio',
                                'rayleigh_wind_result_applied_spacecraft_los_corr_velocity',
                                'rayleigh_wind_result_applied_rdb_corr_velocity',
                                'rayleigh_wind_result_applied_ground_corr_velocity',
                                'rayleigh_wind_result_applied_m1_temperature_corr_velocity',
                                'rayleigh_aht_22',
                                'rayleigh_aht_23',
                                'rayleigh_aht_24',
                                'rayleigh_aht_25',
                                'rayleigh_aht_26',
                                'rayleigh_aht_27',
                                'rayleigh_tc_18',
                                'rayleigh_tc_19',
                                'rayleigh_tc_20',
                                'rayleigh_tc_21',
                                'rayleigh_tc_23',
                                'rayleigh_tc_25',
                                'rayleigh_tc_27',
                                'rayleigh_tc_29',
                                'rayleigh_tc_32',
                            ],
                            defaults: {
                                yAxis: 'rayleigh_altitude',
                                colorAxis: 'rayleigh_wind_result_wind_velocity'
                            },
                            positionAlias: {
                                'latitude': 'rayleigh_wind_result_lat_of_DEM_intersection',
                                'longitude': 'rayleigh_wind_result_lon_of_DEM_intersection',
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
                    reversedYAxis: [true],
                    reversedY2Axis: [false],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    yAxisLocked: [false],
                    yAxisExtent: [null],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    y2AxisLocked: [false],
                    y2AxisExtent: [null],
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
                    yAxisLocked: [false, false],
                    yAxisExtent: [null, null],
                    colorAxis: [ [null], [null] ],
                    y2Axis: [[], []],
                    colorAxis2: [[], []],
                    y2AxisLocked: [false, false],
                    y2AxisExtent: [null, null],
                    combinedParameters: {
                        'altitude': ['altitude_start', 'altitude_end'],
                        'satellite_range': ['satellite_range_start', 'satellite_range_end'],
                        'frequency_offset_combined': ['frequency_offset_start', 'frequency_offset_end']
                    },
                    groups: ['1d_parameters', '1d_parameters'],
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection',
                        'altitude': 'altitude'
                    },
                    renderGroups: {
                        '1d_parameters': {
                            parameters: [
                                'lat_of_DEM_intersection',
                                'lon_of_DEM_intersection',
                                'time_freq_step',
                                'frequency_offset',
                                'frequency_valid',
                                'measurement_response',
                                'measurement_response_valid',
                                'measurement_error_mie_response',
                                'reference_pulse_response',
                                'reference_pulse_response_valid',
                                'reference_pulse_error_mie_response',
                                'num_measurements_usable',
                                'num_valid_measurements',
                                'num_reference_pulses_usable',
                                'num_mie_core_algo_fails_measurements',
                                'num_ground_echoes_not_detected_measurements',
                                'measurement_mean_sensitivity',
                                'measurement_zero_frequency',
                                'measurement_error_mie_response_std_dev',
                                'measurement_offset_frequency',
                                'reference_pulse_mean_sensitivity',
                                'reference_pulse_zero_frequency',
                                'reference_pulse_error_mie_response_std_dev',
                                'reference_pulse_offset_frequency',
                                'satisfied_min_valid_freq_steps_per_cal',
                                'freq_offset_data_monotonic',
                                'num_of_valid_frequency_steps',
                                'measurement_mean_sensitivity_valid',
                                'measurement_error_response_std_dev_valid',
                                'measurement_zero_frequency_response_valid',
                                'measurement_data_monotonic',
                                'reference_pulse_mean_sensitivity_valid',
                                'reference_pulse_error_response_std_dev_valid',
                                'reference_pulse_zero_frequency_response_valid',
                                'reference_pulse_data_monotonic',
                                'mie_core_measurement_FWHM',
                                'mie_core_measurement_amplitude',
                                'mie_core_measurement_offset'
                            ],
                            defaults: {
                                yAxis: 'measurement_response',
                                colorAxis: null
                            }
                        },
                        '2d_parameter': {
                            parameters: [
                                'altitude_start',
                                'altitude_end',
                                'satellite_range',
                                'normalised_useful_signal',
                                'mie_scattering_ratio',
                                'frequency_offset_combined'
                            ],
                            defaults: {
                                yAxis: 'altitude',
                                colorAxis: 'mie_scattering_ratio'
                            }
                        }
                    },
                    sharedParameters: {
                        'frequency_offset': [
                            'frequency_offset_combined', 'frequency_offset'
                        ],
                    },
                    availableParameters: false,
                },
                AUX_RRC_1B: {
                    xAxis: ['frequency_offset'],
                    yAxis: [['measurement_response'], ['measurement_error_rayleigh_response']],
                    additionalXTicks: [],
                    additionalYTicks: [[],[]],
                    yAxisLocked: [false, false],
                    yAxisExtent: [null, null],
                    colorAxis: [ [null], [null] ],
                    y2Axis: [[], []],
                    colorAxis2: [[], []],
                    y2AxisLocked: [false, false],
                    y2AxisExtent: [null, null],
                    combinedParameters: {
                        'altitude': ['altitude_start', 'altitude_end'],
                        'satellite_range': ['satellite_range_start', 'satellite_range_end'],
                        'frequency_offset_combined': ['frequency_offset_start', 'frequency_offset_end']
                    },
                    positionAlias: {
                        'latitude': 'lat_of_DEM_intersection',
                        'longitude': 'lon_of_DEM_intersection',
                        'altitude': 'altitude'
                    },
                    groups: ['1d_parameters', '1d_parameters'],
                    renderGroups: {
                        '1d_parameters': {
                            parameters: [
                                'lat_of_DEM_intersection',
                                'lon_of_DEM_intersection',
                                'time_freq_step',
                                'frequency_offset',
                                'frequency_valid',
                                'ground_frequency_valid',
                                'measurement_response',
                                'measurement_response_valid',
                                'measurement_error_rayleigh_response',
                                'reference_pulse_response',
                                'reference_pulse_response_valid',
                                'reference_pulse_error_rayleigh_response',
                                'ground_measurement_response',
                                'ground_measurement_response_valid',
                                'ground_measurement_error_rayleigh_response',
                                'num_measurements_usable',
                                'num_valid_measurements',
                                'num_reference_pulses_usable',
                                'num_measurements_valid_ground',
                                'measurement_mean_sensitivity',
                                'measurement_zero_frequency',
                                'measurement_error_rayleigh_response_std_dev',
                                'measurement_offset_frequency',
                                'measurement_error_fit_coefficient',
                                'reference_pulse_mean_sensitivity',
                                'reference_pulse_zero_frequency',
                                'reference_pulse_error_rayleigh_response_std_dev',
                                'reference_pulse_offset_frequency',
                                'reference_pulse_error_fit_coefficient',
                                'ground_measurement_mean_sensitivity',
                                'ground_measurement_zero_frequency',
                                'ground_measurement_error_rayleigh_response_std_dev',
                                'ground_measurement_offset_frequency',
                                'ground_measurement_error_fit_coefficient', 
                                'satisfied_min_valid_freq_steps_per_cal',
                                'satisfied_min_valid_ground_freq_steps_per_cal',
                                'freq_offset_data_monotonic',
                                'num_of_valid_frequency_steps',
                                'num_of_valid_ground_frequency_steps',
                                'measurement_mean_sensitivity_valid',
                                'measurement_error_response_std_dev_valid',
                                'measurement_zero_frequency_response_valid',
                                'measurement_data_monotonic',
                                'reference_pulse_mean_sensitivity_valid',
                                'reference_pulse_error_response_std_dev_valid',
                                'reference_pulse_zero_frequency_response_valid',
                                'reference_pulse_data_monotonic',
                                'ground_measurement_mean_sensitivity_valid',
                                'ground_measurement_error_response_std_dev_valid',
                                'ground_measurement_zero_frequency_response_valid',
                                'ground_measurement_data_monotonic',
                                'rayleigh_spectrometer_temperature_9',
                                'rayleigh_spectrometer_temperature_10',
                                'rayleigh_spectrometer_temperature_11',
                                'rayleigh_thermal_hood_temperature_1',
                                'rayleigh_thermal_hood_temperature_2',
                                'rayleigh_thermal_hood_temperature_3',
                                'rayleigh_thermal_hood_temperature_4',
                                'rayleigh_optical_baseplate_avg_temperature'
                            ],
                            defaults: {
                                yAxis: 'measurement_response',
                                colorAxis: null
                            }
                        },
                        '2d_parameter': {
                            parameters: [
                                'altitude_start',
                                'altitude_end',
                                'satellite_range', 
                                'geoid_separation_obs',
                                //'geoid_separation_freq_step',
                                'normalised_useful_signal',
                                'frequency_offset_combined'
                            ],
                            defaults: {
                                yAxis: 'altitude',
                                colorAxis: 'normalised_useful_signal'
                            }
                        }
                    },
                    sharedParameters: {
                        'frequency_offset': [
                            'frequency_offset_combined', 'frequency_offset'
                        ],
                    },
                    availableParameters: false,
                },
                AUX_ISR_1B: {
                    xAxis: ['laser_frequency_offset'],
                    yAxis: [['rayleigh_channel_A_response', 'rayleigh_channel_B_response']],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    yAxisLocked: [false],
                    yAxisExtent: [null],
                    groups: false,
                    renderGroups: false,
                    sharedParameters: false,
                    colorAxis: [ [null, null] ],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    y2AxisLocked: [false],
                    y2AxisExtent: [null],
                    combinedParameters: {},
                    availableParameters: false,
                },
                AUX_ZWC_1B: {
                    xAxis: ['observation_index'],
                    yAxis: [['mie_ground_correction_velocity', 'rayleigh_ground_correction_velocity']],
                    additionalXTicks: [],
                    additionalYTicks: [[]],
                    yAxisLocked: [false],
                    yAxisExtent: [null],
                    colorAxis: [ [null, null] ],
                    y2Axis: [[]],
                    colorAxis2: [[]],
                    y2AxisLocked: [false],
                    y2AxisExtent: [null],
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
                    yAxisLocked: [false, false],
                    yAxisExtent: [null, null],
                    colorAxis: [ [null], [null] ],
                    y2Axis: [[],[]],
                    y2AxisLocked: [false, false],
                    y2AxisExtent: [null, null],
                    colorAxis2: [[],[]],
                    groups: ['surface_nadir', 'surface_off_nadir'],
                    renderGroups: {
                        surface_nadir: {
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
                        surface_off_nadir: {
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
                        },
                        layer_nadir: {
                            parameters: [
                                'time_nadir_combined',
                                'layer_validity_flag_nadir',
                                'layer_altitude_nadir_end',
                                'layer_altitude_nadir_start',
                                'layer_temperature_nadir',
                                'layer_wind_component_u_nadir',
                                'layer_wind_component_v_nadir',
                                'layer_rel_humidity_nadir',
                                'layer_spec_humidity_nadir',
                                'layer_cloud_cover_nadir',
                                'layer_cloud_liquid_water_content_nadir',
                                'layer_cloud_ice_water_content_nadir'
                            ],
                            defaults: {
                                yAxis: 'layer_altitude_nadir',
                                colorAxis: null
                            }
                        },
                        layer_off_nadir: {
                            parameters: [
                                'layer_altitude_off_nadir_end',
                                'layer_altitude_off_nadir_start',
                                'time_off_nadir_combined',
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
                            ],
                            defaults: {
                                yAxis: 'layer_altitude_off_nadir',
                                colorAxis: null
                            }
                        }
                    },
                    sharedParameters: {
                        'time': [
                            'time_nadir_combined', 'time_off_nadir_combined', 'time_nadir', 'time_off_nadir'
                        ]
                    },
                    combinedParameters: {
                        time_nadir_combined: ['time_nadir_start', 'time_nadir_end'],
                        layer_altitude_nadir: ['layer_altitude_nadir_end', 'layer_altitude_nadir_start'],
                        time_off_nadir_combined: ['time_off_nadir_start', 'time_off_nadir_end'],
                        layer_altitude_off_nadir: ['layer_altitude_off_nadir_end', 'layer_altitude_off_nadir_start']
                    },
                    availableParameters: false
                }
            };


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

                var prod = globals.products.find(
                    function(p){return (p.get('visible') && p.get('name')!=='ADAM_albedo');}
                );
                var activeProd = 'ALD_U_N_1B';
                if(typeof prod !== 'undefined'){
                    activeProd = prod.get('download').id;
                }

                globals.filterManager.visibleFilters = this.selectedFilterList;

                var settings = iterationCopy(this.renderSettings[activeProd]);

                this.graph = new graphly.graphly({
                    el: '#graph',
                    margin: {top: 30, left: 100, bottom: 50, right: 70},
                    dataSettings: globals.dataSettings[activeProd],
                    renderSettings: settings,
                    filterManager: globals.filterManager,
                    displayParameterLabel: false,
                    multiYAxis: true,
                    ignoreParameters: [ /jumps.*/, /SignCross.*/, 'positions', 'stepPositions', 'singleValues'],
                    enableSubXAxis: 'time',
                    enableSubYAxis: ['mie_altitude','rayleigh_altitude'],
                    colorAxisTickFormat: 'customExp',
                    defaultAxisTickFormat: 'customExp',
                    replaceUnderscore: true,
                    allowLockingAxisScale: true,
                    enableMaskParameters: true,
                    //debug: true,
                });

                // Save applied settings
                localStorage.setItem(
                    'yAxisExtent', JSON.stringify(settings.yAxisExtent)
                );
                localStorage.setItem(
                    'y2AxisExtent', JSON.stringify(settings.y2AxisExtent)
                );
                localStorage.setItem(
                    'yAxisLocked', JSON.stringify(settings.yAxisLocked)
                );
                localStorage.setItem(
                    'y2AxisLocked', JSON.stringify(settings.y2AxisLocked)
                );

                for(var cskey in additionalColorscales){
                    this.graph.addColorScale(
                        cskey, 
                        additionalColorscales[cskey][0],
                        additionalColorscales[cskey][1]
                    );
                }

                globals.filterManager.setRenderNode('#analyticsFilters');
                this.graph.on('pointSelect', function(values){
                    Communicator.mediator.trigger('cesium:highlight:point', values);
                });

                this.graph.on('maskParameterChange', function(values){
                    var currProd = globals.products.find(
                        function(p){return p.get('visible');}
                    );
                    var prodId = currProd.get('download').id;
                    // Trigger layer parameters changed to make sure globe
                    // view is updated acordingly
                    Communicator.mediator.trigger(
                        'layer:parameters:changed', prodId
                    );
                });

                this.graph.on('axisChange', function () {
                    // If a parameter should be plotted reversed in y axis we
                    // change it here
                    // TODO: It would be more effincient if we could do this
                    // before rendering was done, this way it is rendered twice
                    var parsToReverse = [
                        'range_bin_number',
                        'rayleigh_bins', 'mie_bins',
                        'mie_wind_result_range_bin_number',
                        'rayleigh_wind_result_range_bin_number'
                    ];
                    var needRerender = false;
                    var rS = that.graph.renderSettings;
                    for (var yPos = 0; yPos < rS.yAxis.length; yPos++) {
                        var revAv = false;
                        if(typeof rS.reversedYAxis!=='undefined' && rS.reversedYAxis.length >= yPos){
                            revAv = rS.reversedYAxis[yPos];
                        }
                        for (var par = 0; par < rS.yAxis[yPos].length; par++) {
                            if(parsToReverse.indexOf(rS.yAxis[yPos][par]) !== -1){
                                revAv = true;
                            }
                        }
                        if(revAv !== rS.reversedYAxis[yPos]){
                            needRerender = true;
                            rS.reversedYAxis[yPos] = revAv;
                        }
                        revAv = false;
                        for (var par = 0; par < rS.y2Axis[yPos].length; par++) {
                            if(parsToReverse.indexOf(rS.y2Axis[yPos][par]) !== -1){
                                revAv = true;
                            }
                        }
                        if(revAv !== rS.reversedY2Axis[yPos]){
                            needRerender = true;
                            rS.reversedY2Axis[yPos] = revAv;
                        }
                    }
                    if(needRerender){
                        that.graph.initAxis();
                        that.graph.renderData();
                    }
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

                this.graph.on('colorScaleChange', function(obj){

                    var currProd = globals.products.find(
                        function(p){return p.get('visible');}
                    );
                    var prodId = currProd.get('download').id;


                    var parOpts = currProd.get('parameters');
                    // Go trough product parameters and update based on data settings
                    for (var pk in parOpts){
                        if(globals.dataSettings[prodId].hasOwnProperty(pk)){
                            if(globals.dataSettings[prodId][pk].hasOwnProperty('colorscale')){
                                parOpts[pk].colorscale = globals.dataSettings[prodId][pk].colorscale;
                            }
                        }
                    }
                    currProd.set('parameters', parOpts);
                    // Trigger layer parameters changed to make sure globe
                    // view is updated acordingly
                    Communicator.mediator.trigger(
                        'layer:parameters:changed', prodId
                    );
                });

                this.graph.on('zoomUpdate', function () {
                    // TODO: Do we save the extent when axis fixed?
                    /*
                    var globeNeedsUpdate = false;
                    for (var i = 0; i < this.renderSettings.yAxisLocked.length; i++) {
                        if(this.renderSettings.yAxisLocked[i]){
                            globeNeedsUpdate = true;
                        }
                    }
                    for (var i = 0; i < this.renderSettings.y2AxisLocked.length; i++) {
                        if(this.renderSettings.y2AxisLocked[i]){
                            globeNeedsUpdate = true;
                        }
                    }
                     // Trigger layer parameters changed to make sure globe
                    // view is updated acordingly
                    // Only do this for relevant changes, i.e. if the changes
                    // affect the currently visualized parameter on globe
                    if(globeNeedsUpdate) {
                        Communicator.mediator.trigger(
                            'layer:parameters:changed', prodId
                        );
                    }
                    */

                });

                this.graph.on('axisExtentChanged', function () {

                    localStorage.setItem(
                        'yAxisExtent', JSON.stringify(this.renderSettings.yAxisExtent)
                    );
                    localStorage.setItem(
                        'y2AxisExtent', JSON.stringify(this.renderSettings.y2AxisExtent)
                    );
                    localStorage.setItem(
                        'yAxisLocked', JSON.stringify(this.renderSettings.yAxisLocked)
                    );
                    localStorage.setItem(
                        'y2AxisLocked', JSON.stringify(this.renderSettings.y2AxisLocked)
                    );

                    // Save parameter style changes
                    localStorage.setItem(
                        'dataSettings',
                        JSON.stringify(globals.dataSettings)
                    );
                    var currProd = globals.products.find(
                        function(p){return p.get('visible');}
                    );
                    var prodId = currProd.get('download').id;


                    var parOpts = currProd.get('parameters');
                    // Go trough product parameters and update based on data settings
                    for (var pk in parOpts){
                        if(globals.dataSettings[prodId].hasOwnProperty(pk)){
                            if(globals.dataSettings[prodId][pk].hasOwnProperty('extent')){
                                parOpts[pk].range = globals.dataSettings[prodId][pk].extent;
                            }
                        }
                    }
                    currProd.set('parameters', parOpts);
                    Communicator.mediator.trigger(
                        'layer:parameters:changed', prodId
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
                    var parM = globals.filterManager.filterSettings.parameterMatrix;
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
                
                globals.filterManager.brushes = brushes;
                if(this.graph){
                    this.graph.filters = globals.swarm.get('filters');
                }
                globals.filterManager.filters = globals.swarm.get('filters');
            }

            globals.filterManager.on('filterChange', function(filters){
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

            globals.filterManager.on('removeFilter', function(filter){
                var index = that.selectedFilterList.indexOf(filter);
                if(index !== -1){
                    that.selectedFilterList.splice(index, 1);
                    // Check if filter was set
                    if (globals.filterManager.filters.hasOwnProperty(filter)){
                        delete that.filterManager.filters[filter];
                        delete that.filterManager.brushes[filter];
                    }
                    // Check if mask filter was set
                    if (globals.filterManager.maskFilters.hasOwnProperty(filter)){
                        delete globals.filterManager.maskFilters[filter];
                    }
                    globals.filterManager._filtersChanged();
                    localStorage.setItem(
                        'selectedFilterList',
                        JSON.stringify(that.selectedFilterList)
                    );
                }
                that.renderFilterList();
            });

            globals.filterManager.on('parameterChange', function(filters){
                var currProd = globals.products.find(
                    function(p){return p.get('visible');}
                );
                var prodId = currProd.get('download').id;

                var filterSetts = globals.dataSettings[prodId];
                for(var key in filterSetts){
                    if(filterSetts[key].hasOwnProperty('filterExtent')){
                        globals.dataSettings[key]['filterExtent'] = filterSetts[key].filterExtent;
                    }
                }
                localStorage.setItem(
                    'dataSettings',
                    JSON.stringify(globals.dataSettings)
                );
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
                var setts = globals.filterManager.filterSettings;
                setts.visibleFilters = this.selectedFilterList;
                globals.filterManager.updateFilterSettings(setts);
                // If it is a mask filter it probably has default filters
                // we need to redraw
                if (setts.hasOwnProperty('maskParameter')) {
                    if (setts.maskParameter.hasOwnProperty(selected)) {
                        globals.filterManager._filtersChanged();
                    }
                }
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

        onRequestedListChanged: function onRequestedListChanged(){
            this.requestedListChanged = true;
        },

        renderFilterList: function renderFilterList() {

            var currProd = globals.products.find(
                function(p){return p.get('visible');}
            );
            var prodId;
            if(currProd){
                prodId = currProd.get('download').id;
            }

            var that = this;
            this.$el.find("#filterSelectDrop").empty();
            var filCon = this.$el.find("#filterSelectDrop");

            $('#resetFilters').off();
            filCon.append('<button id="resetFilters" type="button" class="btn btn-success darkbutton" title="Reset filters to default values (i.e. validity flags)">Reset filters</button>');
            $('#resetFilters').click(function(){
                var setts = JSON.parse(JSON.stringify(
                    globals.swarm.get('originalFilterSettings')
                ));
                globals.filterManager.filterSettings = setts;
                if(setts.hasOwnProperty('boolParameter')){
                    globals.filterManager.boolParameter = setts.boolParameter;
                }
                if(setts.hasOwnProperty('maskParameter')){
                    globals.filterManager.maskParameter = setts.maskParameter;
                }
                globals.filterManager.resetManager();
            });

            $('#clearFilters').off();
            filCon.append('<button id="clearFilters" type="button" class="btn btn-success darkbutton" title="Clear all filters">Clear filters</button>');
            $('#clearFilters').click(function(){

                var setts = JSON.parse(JSON.stringify(
                    globals.swarm.get('originalFilterSettings')
                ));
                if(setts.hasOwnProperty('maskParameter')){
                    var maskPar = setts.maskParameter;
                    for (var key in maskPar){
                        if(maskPar[key].hasOwnProperty('enabled')){
                            for (var i = 0; i < maskPar[key].enabled.length; i++) {
                                maskPar[key].enabled[i] = false;
                            }
                        }
                    }
                }
                if(setts.hasOwnProperty('boolParameter')){
                    var boolPar = setts.boolParameter;
                    if(boolPar.hasOwnProperty('enabled')){
                        for (var i = 0; i < boolPar.enabled.length; i++) {
                            boolPar.enabled[i] = false;
                        }
                    }
                }
                globals.filterManager.initManager();
                globals.filterManager.filterSettings = setts;
                globals.filterManager.maskParameter = setts.maskParameter;
                globals.filterManager.boolParameter = setts.boolParameter;
                globals.filterManager._filtersChanged();
                globals.filterManager._renderFilters();
                globals.filterManager._filtersChanged();
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


            var groupKeys = [];
            // Iterate over grouped items and see if their components are available
            for(var confKey in this.renderSettings){
                if(this.renderSettings[confKey].hasOwnProperty('combinedParameters')){
                    for (var combKey in this.renderSettings[confKey].combinedParameters){
                        var gkeys = this.renderSettings[confKey].combinedParameters[combKey];
                        if(gkeys.length ===2){
                            if(this.currentKeys && 
                                this.currentKeys.indexOf(gkeys[0]) !== -1 &&
                                this.currentKeys.indexOf(gkeys[0]) !== -1){
                                groupKeys.push(combKey);
                            }
                        }

                    }
                }
            }

            // Get current datasettings
            var aUOM = {};

            if(typeof prodId !== 'undefined'){
                // Clone object
                _.each(currProd.get('download_parameters'), function(obj, key){
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
                  // Check if we have global dataSettings information to use
                  if(globals.dataSettings[prodId].hasOwnProperty(key)){
                    if(globals.dataSettings[prodId][key].hasOwnProperty('modifiedUOM')){
                        aUOM[key].modifiedUOM = globals.dataSettings[prodId][key].modifiedUOM;
                    }
                  }
                  if(this.currentKeys && this.currentKeys.indexOf(key) === -1){
                    if(groupKeys.indexOf(key) === -1){
                      delete aUOM[key];
                    }
                  }
                  /*
                  // Remove also mask and boolparameter from list
                  if(globals.filterManager.maskParameter.hasOwnProperty(key)){
                    delete aUOM[key];
                  }
                  if(globals.filterManager.boolParameter.parameters.indexOf(key) !== -1){
                    delete aUOM[key];
                  }
                  if(globals.filterManager.choiceParameter.hasOwnProperty(key)){
                    delete aUOM[key];
                  }
                  */
                }
            }



            $('#filterSelectDrop').append(
              '<div class="w2ui-field" id="analyticsFilterSelect"> <button id="analyticsAddFilter" type="button" class="btn btn-success darkbutton dropdown-toggle">Add filter <span class="caret"></span></button> <input type="list" id="inputAnalyticsAddfilter"></div>'
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
                var html = '<b>'+(item.id.replace(/_/g, ' '))+'</b>';
                if(aUOM[item.id].modifiedUOM != null){
                    html += ' ['+aUOM[item.id].modifiedUOM+']';
                } else if(aUOM[item.id].uom != null){
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

            if(layer !== 'ADAM_albedo'){
                var currProd = globals.products.find(
                    function(p){return p.get('visible');}
                );
                var prodId = currProd.get('download').id;
                this.graph.dataSettings = globals.dataSettings[prodId];
                globals.filterManager.dataSettings = globals.dataSettings[prodId];
                globals.filterManager._initData();
                globals.filterManager._renderFilters();
                var data = globals.swarm.get('data');
                var datkey = Object.keys(data)[0];
                if(typeof datkey !== 'undefined'){
                    var parkeys = Object.keys(data[datkey]);
                    if(parkeys.length>0){
                        this.graph.renderData();
                    }
                }
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
                slicedData[key] = _.flatten(
                    ds[key].slice(pos, ((pos+pageSize)))
                );
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
            $('.y2Axis.axisLabel').hide();


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
                    slicedData[key] = _.flatten(
                        ds[key].slice(pos, ((pos+pageSize)))
                    );
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
                $('.y2Axis.axisLabel').hide();
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
                    slicedData[key] = _.flatten(
                        ds[key].slice(pos, ((pos+pageSize)))
                    );
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
            $('.y2Axis.axisLabel').show();

            // If element already has plot rendering
            if( $(this.el).html()){

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
                if(this.requestedListChanged){
                    firstLoad = true;
                    this.requestedListChanged = false;
                }

                this.graph.removeGroupArrows();
                this.graph.margin.bottom = 50;

                $('#graphSelect').remove();

                // If data parameters have changed
                if (!firstLoad && !_.isEqual(this.prevParams, idKeys)){
                    // Define which parameters should be selected defaultwise as filtering
                    var setts = globals.filterManager.filterSettings;
                    setts.visibleFilters = this.selectedFilterList;


                    globals.filterManager.updateFilterSettings(setts);
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
                    return;
                }

                if(idKeys.length > 0){
                    // Cleanup info button
                    $('#additionalProductInfo').off();
                    $('#additionalProductInfo').remove();
                    $('#analyticsProductTooltip').remove();

                    var currProd = globals.products.find(
                        function(p){return p.get('download').id === idKeys[0];}
                    );
                    var prodId = currProd.get('download').id;

                    // Re-set datasettings
                    this.graph.dataSettings = globals.dataSettings[prodId];

                    $('#nodataavailable').hide();

                    var cP = idKeys[0];
                    var gran = currProd.get('granularity');

                    $('#graph').css('height', '100%');

                    var renderSettings;
                    if(gran === 'group'){
                        renderSettings =  iterationCopy(this.renderSettings[cP+'_group']);
                    } else {
                        renderSettings = iterationCopy(this.renderSettings[cP]);
                        // We add here for groups possible difference and user keys
                        if(renderSettings.hasOwnProperty('renderGroups') && renderSettings.renderGroups !== false){
                            var rG = renderSettings.renderGroups;
                            for(var gK in rG){
                                var diffusrpars = [];
                                for (var pI=0; pI<rG[gK].parameters.length; pI++){
                                    diffusrpars.push(rG[gK].parameters[pI]+'_diff');
                                    diffusrpars.push(rG[gK].parameters[pI]+'_user');
                                }
                                for (var i = 0; i < diffusrpars.length; i++) {
                                    if(rG[gK].parameters.indexOf(diffusrpars[i])===-1){
                                        rG[gK].parameters.push(diffusrpars[i]);
                                    }
                                }
                            }
                        }
                    }
                    if(prodId === this.previousCollection ||
                        typeof this.previousCollection === 'undefined'){
                        // If there was no collection change try to adapt settings
                        // to conserve as much of the user config as possible
                        // We also need to check if there was a granularity change
                        if(gran === this.previousGranularity ||
                            typeof this.previousGranularity === 'undefined'){
                            this.extendSettings(renderSettings);
                        }
                    }
                    this.graph.setRenderSettings(renderSettings);
                    if(renderSettings.hasOwnProperty('logY')){
                        this.graph.logY = renderSettings.logY;
                    }
                    if(renderSettings.hasOwnProperty('logY2')){
                        this.graph.logY2 = renderSettings.logY2;
                    }
                    if(renderSettings.hasOwnProperty('logX')){
                        this.graph.logX = renderSettings.logX;
                    }

                    if(cP === 'ALD_U_N_1B' || cP === 'ALD_U_N_2A'){

                        this.graph.debounceActive = true;
                        this.graph.fileSaveString = cP+'_'+gran+'_'+timeString;
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
                            this.graph.debounceActive = true;
                            this.graph.fileSaveString = cP+'_'+gran+'_'+timeString;
                            this.graph.loadData(data[cP]);
                        }

                    } else if(idKeys[0] === 'AUX_MRC_1B' || idKeys[0] === 'AUX_RRC_1B'){

                        this.graph.renderSettings = iterationCopy(this.renderSettings[(idKeys[0])]);

                        if(this.currentKeys.indexOf('altitude_start') !== -1){
                            // TODO: should we show 2d data by default?
                            /*this.graph.renderSettings.groups[0] = '2d_parameter';
                            this.graph.renderSettings.yAxis[0] = ['altitude'];
                            this.graph.renderSettings.colorAxis[0] = [currpar2d];*/
                        } else {
                            // We disable group selection completely if no 2D data is available
                            this.graph.renderSettings.groups = false;
                            this.graph.renderSettings.renderGroups = false;
                            this.graph.renderSettings.sharedParameters = false;
                            this.graph.renderSettings.availableParameters = false;
                        }

                        // Remove diff if no longer available
                        if(this.graph.renderSettings.yAxis.length>0 && this.graph.renderSettings.yAxis[0].length>0){
                            var curraxis = this.graph.renderSettings.yAxis[0][0];
                            if(curraxis.indexOf('_diff') !== -1){
                                this.graph.renderSettings.yAxis[0][0] = curraxis.replace('_diff', '');
                            }
                            
                            // Add diff if user uploaded data is avaialble
                            if(this.currentKeys.indexOf(curraxis+'_diff') !== -1){
                                this.graph.renderSettings.yAxis[0][0] = curraxis+'_diff';
                            }

                        }


                        this.graph.debounceActive = false;
                        this.graph.loadData(data[idKeys[0]]);
                        this.graph.fileSaveString = idKeys[0]+'_top'+'_'+timeString;

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
                        var param2DNadir, param2DOffNadir = null;
                        
                        for (var i = 0; i < this.currentKeys.length; i++) {
                            if(params2DNadir.indexOf(this.currentKeys[i]) !== -1){
                                contains2DNadir = true;
                                param2DNadir = this.currentKeys[i];
                            }
                            if(params2DOffNadir.indexOf(this.currentKeys[i]) !== -1){
                                contains2DOffNadir = true;
                                param2DOffNadir = this.currentKeys[i];
                            }
                        }
                        this.graph.renderSettings = iterationCopy(this.renderSettings[idKeys[0]]);
                        this.graph.debounceActive = true;

                        if(contains2DNadir){
                            this.graph.renderSettings.groups[0] = 'layer_nadir';
                            this.graph.renderSettings.yAxis[0] = ['layer_altitude_nadir'];
                            this.graph.renderSettings.colorAxis[0] = [param2DNadir];
                        } else {
                            delete this.graph.renderSettings.renderGroups.layer_nadir;
                        }

                        if(contains2DOffNadir){
                            this.graph.renderSettings.groups[1] = 'layer_off_nadir';
                            this.graph.renderSettings.yAxis[1] = ['layer_altitude_off_nadir'];
                            this.graph.renderSettings.colorAxis[1] = [param2DOffNadir];
                        } else {
                            delete this.graph.renderSettings.renderGroups.layer_off_nadir;
                        }

                        this.graph.loadData(data[idKeys[0]]);
                        this.graph.fileSaveString = idKeys[0]+'_top'+'_'+timeString;


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
                        this.graph.renderSettings = iterationCopy(this.renderSettings[idKeys[0]]);
                        this.graph.loadData(data[idKeys[0]]);
                        this.graph.fileSaveString = idKeys[0]+'_'+timeString;
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
                                    if(globals.dataSettings[prodId].hasOwnProperty(k) && 
                                        globals.dataSettings[prodId][k].hasOwnProperty('uom') &&
                                        globals.dataSettings[prodId][k].uom!==null){
                                        tr.append('<td>'+globals.dataSettings[prodId][k].uom+'</td>');
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

                    // Make sure applied render settings are saved to localstorage
                    var crs = this.graph.renderSettings;

                    this.savePlotConfig(this.graph);

                    this.previousCollection = prodId;
                    this.previousGranularity = gran;
                    this.previousKeys = this.currentKeys;

                }else{
                    $('#nodataavailable').show();
                    this.previousCollection = false;
                    this.previousGranularity = false;
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