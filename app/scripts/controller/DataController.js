/* eslint-disable indent */


(function() {
  'use strict';

  var root = this;

  root.require([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/wps_dataRequest',
    'app',
    'papaparse',
    'msgpack',
    'graphly'
  ],

  function( Backbone, Communicator, globals, wps_dataRequestTmpl, App, Papa) {

    var DataController = Backbone.Marionette.Controller.extend({

      initialize: function(options){

        this.selection_list = [];
        this.activeWPSproducts = {};
        this.wpsProdChange = false;
        this.activeModels = [];
        this.selected_time = null;
        this.previousCollection = '';
        this.firstLoad = true;

        this.xhr = null;

        this.dataSettings = globals.dataSettings;

        var filterSettings = {
            parameterMatrix: {
               /* 'height': [
                    'mie_altitude_start', 'mie_altitude_end'
                ],
                'latitude': [
                    'mie_latitude', 'rayleigh_latitude'
                ],
                'longitude': [
                   'mie_longitude'
                ], 
                'geoid_separation': [
                    'rayleigh_geoid_separation', 'mie_geoid_separation'
                ],
                'velocity_at_DEM_intersection': [
                    'rayleigh_velocity_at_DEM_intersection', 'mie_velocity_at_DEM_intersection'
                ]*/
            },
            dataSettings: this.dataSettings,

            filterRelation: [
                [
                  'mie_time_start', 'mie_time_end',
                  'mie_latitude_of_DEM_intersection_start', 'mie_latitude_of_DEM_intersection_end',
                  'mie_longitude_of_DEM_intersection_start','mie_longitude_of_DEM_intersection_end',
                  'mie_altitude_start', 'mie_altitude_end',
                  'mie_range', 'mie_velocity_at_DEM_intersection',
                  'mie_AOCS_pitch_angle', 'mie_AOCS_roll_angle', 'mie_AOCS_yaw_angle',
                  'mie_HLOS_wind_speed', 'mie_signal_intensity',
                  'mie_ground_velocity',
                  'mie_bin_quality_flag', 'mie_HBE_ground_velocity', 
                  'mie_total_ZWC', 
                  'mie_scattering_ratio', 'mie_SNR', 'mie_error_quantifier', 
                  'mie_average_laser_energy', 'mie_laser_frequency', 
                  'mie_bin_quality_flag',
                  'mie_reference_pulse_quality_flag',
                  'mie_origin',
                  'time','time_start', 'time_end',
                  'latitude_of_DEM_intersection','longitude_of_DEM_intersection',
                  'altitude_of_DEM_intersection',
                  'velocity_at_DEM_intersection',
                  'AOCS_pitch_angle', 'AOCS_roll_angle', 'AOCS_yaw_angle',
                  'average_laser_energy', 'laser_frequency'
                ],
                [
                  'rayleigh_time_start','rayleigh_time_end',
                  'rayleigh_latitude_of_DEM_intersection_start','rayleigh_latitude_of_DEM_intersection_end',
                  'rayleigh_longitude_of_DEM_intersection_start','rayleigh_longitude_of_DEM_intersection_end',
                  'rayleigh_altitude_start','rayleigh_altitude_end',
                  'rayleigh_range', 'rayleigh_velocity_at_DEM_intersection',
                  'rayleigh_AOCS_pitch_angle', 'rayleigh_AOCS_roll_angle', 'rayleigh_AOCS_yaw_angle',
                  'rayleigh_HLOS_wind_speed', 'rayleigh_signal_channel_A_intensity',
                  'rayleigh_signal_channel_B_intensity', /*'rayleigh_signal_intensity',*/
                  'rayleigh_ground_velocity', 'rayleigh_HBE_ground_velocity',
                  'rayleigh_total_ZWC',
                  'rayleigh_channel_A_SNR', 'rayleigh_channel_B_SNR', /*'rayleigh_SNR',*/
                  'rayleigh_bin_quality_flag', 'rayleigh_error_quantifier',
                  'rayleigh_average_laser_energy', 'rayleigh_laser_frequency', 
                  'rayleigh_bin_quality_flag', 'rayleigh_reference_pulse_quality_flag',
                  'rayleigh_origin',
                  'time','time_start', 'time_end',
                  'latitude_of_DEM_intersection','longitude_of_DEM_intersection',
                  'altitude_of_DEM_intersection',
                  'velocity_at_DEM_intersection',
                  'AOCS_pitch_angle', 'AOCS_roll_angle', 'AOCS_yaw_angle',
                  'average_laser_energy', 'laser_frequency'
                ],
                [
                  'time_off_nadir',
                  'surface_wind_component_u_off_nadir',
                  'surface_wind_component_v_off_nadir',
                  'surface_pressure_off_nadir',
                  'surface_altitude_off_nadir',
                  'latitude_nadir',
                  'longitude_nadir'
                ],
                [
                  'time_nadir',
                  'surface_wind_component_u_nadir',
                  'surface_wind_component_v_nadir',
                  'surface_pressure_nadir',
                  'surface_altitude_nadir',
                  'latitude_off_nadir',
                  'longitude_off_nadir'
                ],
                [
                  'SCA_LOD_variance',
                  'SCA_middle_bin_extinction_variance',
                  'SCA_middle_bin_backscatter_variance',
                  'SCA_middle_bin_LOD_variance',
                  'SCA_middle_bin_BER_variance',
                  'ICA_QC_flag',
                  'SCA_LOD',
                  'SCA_SR',
                  'SCA_middle_bin_extinction',
                  'SCA_middle_bin_backscatter',
                  'SCA_middle_bin_LOD',
                  'SCA_middle_bin_BER',
                  'SCA_time_obs',
                  'SCA_time_obs_start', 'SCA_time_obs_stop',
                  'rayleigh_altitude_obs',
                  'rayleigh_altitude_obs_top','rayleigh_altitude_obs_bottom',
                  'SCA_extinction', 'SCA_backscatter','SCA_QC_flag',
                  'SCA_extinction_variance', 'SCA_backscatter_variance',
                  'albedo_off_nadir'
                ], 
                [
                  'MCA_clim_BER',
                  'MCA_time_obs',
                  'MCA_time_obs_start', 'MCA_time_obs_stop',
                  'mie_altitude_obs',
                  'mie_altitude_obs_top', 'mie_altitude_obs_bottom',
                  'MCA_extinction', 'MCA_LOD',
                  'albedo_off_nadir'
                ],
                [
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
                [
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
                  'rayleigh_wind_result_albedo_off_nadir',
                ],
                // TODO: Add some way to ignore fata keys in analytics, for now
                // we can separete it here to be ignored by other filters
                ['singleValues']
            ],
            visibleFilters: [
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


                // 'measurement_response_valid','reference_pulse_response_valid',

            ],
            boolParameter: ['SCA_QC_flag'/*'measurement_response_valid','reference_pulse_response_valid'*/],
            maskParameter: {
              'mie_bin_quality_flag': {
                  values: [
                      ['Bit 1', 'Overall validity. Data invalid 1, otherwise 0'],
                      ['Bit 2', 'Set to 1 if signal-to-noise below SNR_Threshold, default 0'],
                      ['Bit 3', 'Data saturation found 1, otherwise 0'],
                      ['Bit 4', 'Data spike found 1, otherwise 0'],
                      ['Bit 5', 'Reference pulse invalid 1, otherwise 0'],
                      ['Bit 6', 'Source packet invalid 1, otherwise 0'],
                      ['Bit 7', 'Number of corresponding valid pulses is below Meas_Cavity_Lock_Status_Thresh 1, otherwise 0'],
                      ['Bit 8', 'Spacecraft attitude not on target 1, otherwise 0'],
                      ['Bit 9', 'Peak not found 1, otherwise 0'],
                      ['Bit 10','Set to 1 if the absolute wind velocity above Wind_Velocity_Threshold, default 0 '],
                      ['Bit 11','Set to 1 if polynomial fit of error responses was used but no valid root of the polynomial was found, otherwise 0'],
                      ['Bit 12','Bin was detected as ground bin, otherwise 0. '],
                      ['Bit 13','Spare, set to 0'],
                      ['Bit 14','Spare, set to 0'],
                      ['Bit 15','Spare, set to 0'],
                      ['Bit 16','Spare, set to 0']
                  ]
              },
              'rayleigh_bin_quality_flag': {
                  values: [
                      ['Bit 1', 'Overall validity. Data invalid 1, otherwise 0 '],
                      ['Bit 2', 'Set to 1 if signal-to-noise below SNR_Threshold, default 0 '],
                      ['Bit 3', 'Data saturation found 1, otherwise 0 '],
                      ['Bit 4', 'Data spike found 1, otherwise 0 '],
                      ['Bit 5', 'Reference pulse invalid 1, otherwise 0 '],
                      ['Bit 6', 'Source packet invalid 1, otherwise 0 '],
                      ['Bit 7', 'Number of corresponding valid pulses is below Meas_Cavity_Lock_Status_Thresh 1, otherwise 0 '],
                      ['Bit 8', 'Spacecraft attitude not on target 1, otherwise 0 '],
                      ['Bit 9', 'Rayleigh response not found 1, otherwise 0'],
                      ['Bit 10','Set to 1 if the absolute wind velocity above Wind_Velocity_Threshold, default 0 '],
                      ['Bit 11','Set to 1 if polynomial fit of error responses was used but no valid root of the polynomial was found, otherwise 0. '],
                      ['Bit 12','Bin was detected as ground bin, otherwise 0. '],
                      ['Bit 13','Spare, set to 0'],
                      ['Bit 14','Spare, set to 0'],
                      ['Bit 15','Spare, set to 0'],
                      ['Bit 16','Spare, set to 0']
                  ]
              },
              'rayleigh_wind_result_QC_flags_1': {
                values: [
                    ['Bit 1', 'missing usefull reference pulse signal Rayleigh Channel A'],
                    ['Bit 2', 'missing usefull reference pulse signal Rayleigh Channel B'],
                    ['Bit 3', 'missing usefull signal Rayleigh Channel A'],
                    ['Bit 4', 'missing usefull signal Rayleigh Channel B'],
                    ['Bit 5', 'threshold check on RRmes weighted failed'],
                    ['Bit 6', 'missing RRmes weighted value'],
                    ['Bit 7', 'missing RR RefPulse weighted value'],
                    ['Bit 8', 'missing p ref value']
                ]
              },
              'mie_wind_result_QC_flags_1': {
                values: [
                    ['Bit 1', 'MaxItLorFit threshold reached for measurement fit'],
                    ['Bit 2', 'ResErrThresh threshold reached for measurement fit'],
                    ['Bit 3', 'MaxItNonLinOpt threshold reached for measurement fit'],
                    ['Bit 4', 'PeakHeightLoThresh threshold reached for measurement fit'],
                    ['Bit 5', 'PeakHeightUpThresh threshold reached for measurement fit'],
                    ['Bit 6', 'FWHMLoThresh threshold reached formeasurement fit'],
                    ['Bit 7', 'FWHMUpThresh threshold reached for measurement fit'],
                    ['Bit 8', 'PeakLocThresh threshold reached for measurement fit']
                ]
              }
          },
          choiceParameter: {
              'origin': {
                options: [
                    {'name': 'original', value:'original'},
                    {'name': 'user_upload', value:'user_upload'}
                ],
                selected: -1
              },
              'mie_origin': {
                options: [
                    {'name': 'original', value:'original'},
                    {'name': 'user_upload', value:'user_upload'}
                ],
                selected: -1
              },
              'rayleigh_origin': {
                options: [
                    {'name': 'original', value:'original'},
                    {'name': 'user_upload', value:'user_upload'}
                ],
                selected: -1
              },
              'ZWC_result_type': {
                options: [
                    {'name': 'ZWC_Both', value:'ZWC_Both'},
                    {'name': 'ZWC_Mie', value:'ZWC_Mie'},
                    {'name': 'ZWC_Rayleigh', value:'ZWC_Rayleigh'}
                ],
                selected: -1
              }
          }
        };

        this.filterManager = new FilterManager({
            filterSettings: filterSettings,
            replaceUnderlines: true,
            filterAxisTickFormat: '.2s'
        });

        globals.swarm.set('filterManager', this.filterManager);

        this.listenTo(Communicator.mediator, "map:layer:change",this.changeLayer);
        this.listenTo(Communicator.mediator, "map:multilayer:change",this.multiChangeLayer);
        this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChanged);
        this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
        this.listenTo(Communicator.mediator, 'manual:init', this.onManualInit);

        this.listenTo(Communicator.mediator, "analytics:set:filter", this.onAnalyticsFilterChanged);
        this.listenTo(Communicator.mediator, 'layer:parameters:changed', this.onLayerParametersChanged);
        this.listenTo(Communicator.mediator, 'layer:granularity:changed', this.onLayerGranularityChanged);
        
       
      },

      onManualInit: function(){

        // Check if area is saved and selected when loading
        var bbox = JSON.parse(localStorage.getItem('areaSelection'));
        if(bbox !== null){
          this.selection_list.push(bbox);
        }

        // TODO: Check to see if already active products are configured
        for (var i = 0; i < globals.products.models.length; i++) {
          if(globals.products.models[i].get('model') && globals.products.models[i].get('visible')){
            this.activeModels.push(globals.products.models[i].get("download").id);
          }
          var product = globals.products.models[i];
          if (product.get('process')){
            if(product.get('visible')){
              this.changeLayer(product.attributes);
            }
            //this.activeWPSproducts.push(product.get('process'));
            /*this.activeWPSproducts.push({
              collectionId: product.get('download').id,
              id: product.get('process')
            });*/
          }
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
            _.each(keys, function(key){
                if(parameters[key].hasOwnProperty('colorscale')){
                    this.dataSettings[key].colorscale = parameters[key].colorscale;
                }
                if(parameters[key].hasOwnProperty('range')){
                    this.dataSettings[key].extent = parameters[key].range;
                }
            }, this);
        }, this);
      },

      checkModelValidity: function(){
        // Added some checks here to see if model is outside validity
        $(".validitywarning").remove();
        var invalid_models = [];

        if(this.activeModels.length>0){
          var that = this;
          for (var i = this.activeModels.length - 1; i >= 0; i--) {
            var model = globals.products.find(function(model) { return model.get('download').id == that.activeModels[i]; });
            if(model.get("validity")){
              var val = model.get("validity");
              var start = new Date(val.start);
              var end = new Date(val.end);
              if(this.selected_time && (this.selected_time.start < start || this.selected_time.end > end)){
                invalid_models.push({
                  model: model.get('download').id,
                  start: start,
                  end: end
                });
              }
            }
          }
        }

        if(invalid_models.length>0){
          var invalid_models_string = '';
          for (var i = invalid_models.length - 1; i >= 0; i--) {
            invalid_models_string += invalid_models[i].model+' validity:  ' + 
              getISODateTimeString(invalid_models[i].start).slice(0, -5) +'Z - ' + 
              getISODateTimeString(invalid_models[i].end).slice(0, -5) + 'Z<br>';
          }

          showMessage('warning', (
            'The current time selection is outside the validity of the model, '+
                'data is displayed for the last valid date, please take this into consideration when analysing the data.<br>'+
                invalid_models_string+
                'Tip: You can see the validity of the model in the time slider.'
            
)          , 30, 'validitywarning');

        }
      },

      updateLayerResidualParameters: function () {
        // Manage additional residual parameter for Swarm layers
        globals.products.each(function(product) {

          if(product.get("satellite")=="Swarm"){

            // Get Layer parameters
            var pars = product.get("parameters");

            var selected = null;

            // Remove already added model residuals
            var keys = _.keys(pars);
            for (var i = keys.length - 1; i >= 0; i--) {
              if(pars[keys[i]].residuals){
                if(pars[keys[i]].selected){
                  selected = keys[i];
                }
                delete pars[keys[i]];
              }
            }

            for (var i = this.activeModels.length - 1; i >= 0; i--) {
              
              pars[this.activeModels[i]] = {
                  "range": [-10, 40],
                  "uom":"nT",
                  "colorscale": "jet",
                  "name": ("Residuals to "+this.activeModels[i]),
                  "residuals": true
              };
              if(this.activeModels[i] == selected){
                pars[this.activeModels[i]].selected = true;
              }

              product.set({"parameters": pars});
            }
          }
        }, this);
        // Make sure any possible opened settings are updated
        Communicator.mediator.trigger("layer:settings:changed");
      },


      changeLayer: function(options) {
        if (!options.isBaseLayer){
          var product = globals.products.find(function(model) { return model.get('name') == options.name; });
          if (product){
            if(options.visible){
              // Make sure correct albedo map is set for active product
              var pId = product.get('download').id;
              var albedoProd = globals.products.find(
                function(model) { return model.get('download').id == 'ADAM_albedo'; }
              );
              var albedoPars = albedoProd.get('parameters');
              if(pId === 'AUX_MRC_1B' || pId === 'AUX_RRC_1B'){
                if(albedoPars.offnadir.hasOwnProperty('selected')){
                  delete albedoPars.offnadir.selected;
                  albedoPars.nadir.selected = true;
                  albedoProd.set('parameters', albedoPars);
                }
                Communicator.mediator.trigger("layer:parameters:changed", 'ADAM_albedo');
              }else if(pId === 'ALD_U_N_1B' || pId === 'ALD_U_N_2A' ||
                       pId === 'ALD_U_N_2B' || pId === 'ALD_U_N_2C' ||
                       pId === 'AUX_ISR_1B' || pId === 'AUX_ZWC_1B' ||
                       pId === 'AUX_MET_1B'){
                if(albedoPars.nadir.hasOwnProperty('selected')){
                  delete albedoPars.nadir.selected;
                  albedoPars.offnadir.selected = true;
                  albedoProd.set('parameters', albedoPars);
                  Communicator.mediator.trigger("layer:parameters:changed", 'ADAM_albedo');
                }
              }
              
              if (product.get("model")){
                this.activeModels.push(product.get("download").id);
                this.updateLayerResidualParameters();
                
              }

              if (product.get('process')){
                this.activeWPSproducts[product.get('download').id] = product.get('process');
                this.wpsProdChange = true;
              }


            }else{
              if (this.activeModels.indexOf(product.get("download").id)!=-1){
                this.activeModels.splice(this.activeModels.indexOf(product.get("download").id), 1);
                this.updateLayerResidualParameters();
              }
              if (this.activeWPSproducts.hasOwnProperty(product.get("download").id)){
                delete this.activeWPSproducts[product.get("download").id];
                this.wpsProdChange = true;
              }
            }
          }
        }

        //this.checkModelValidity();
        this.checkSelections();
      },


      onLayerParametersChanged: function(layer){
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

        // If layer is not WMS apply normal filter changes
        if(currProd.get('views')[0].protocol !== 'WMS'){
          this.filterManager.dataSettings[band].extent = range;
          this.filterManager._initData();
          this.filterManager._renderFilters();
        }


      },

      onLayerGranularityChanged: function(layer){
        this.wpsProdChange = true;
        this.checkSelections();
      },
      

      multiChangeLayer: function(layers) {
        /*this.activeWPSproducts = [];
        for (var i = layers.length - 1; i >= 0; i--) {
          var product = globals.products.find(function(model) { return model.get('download').id == layers[i]; });
          if (product){
              if (product.get("processes")){
                _.each(product.get("processes"), function(process){
                  this.activeWPSproducts.push(process.layer_id);
                },this);
              } 
          }
        }
        localStorage.setItem('swarmProductSelection', JSON.stringify(this.activeWPSproducts));
        this.checkSelections();
        this.checkModelValidity();*/
      },

      onSelectionChanged: function(bbox) {
        this.wpsProdChange = true;
        if(bbox){
          this.selection_list.push(bbox);
          this.checkSelections();
        }else{
          this.plotdata = [];
          this.selection_list = [];
          this.checkSelections();
        }

        
      },

      onAnalyticsFilterChanged: function (filters) {
        //globals.swarm.set({filters: filters});
      },

      checkSelections: function(){
        if (this.selected_time == null)
          this.selected_time = Communicator.reqres.request('get:time');

        var prodKeys = Object.keys(this.activeWPSproducts);

        if (prodKeys.length > 0 && this.selected_time && this.wpsProdChange){
          this.wpsProdChange = false;
          for (var i = 0; i < prodKeys.length; i++) {
            this.sendRequest(prodKeys[i]);
          }
          //this.sendRequest(id);
        }else if(this.wpsProdChange){
          globals.swarm.set({data:[]});
          //Communicator.mediator.trigger("map:clear:image");
          //$(".colorlegend").empty();
        }
      },

      onTimeChange: function (time) {
        this.wpsProdChange = true;
        this.selected_time = time;
        this.checkSelections();
        this.checkModelValidity();
      },

      checkFlatteningComplete: function(){
        if(this.processedParameters === this.totalLength){
          var resData = {};
          resData[this.collectionId] = this.tmpdata;

          // TODO: Merge data for filtermanager?
          this.filterManager.loadData(resData);
          this.filterManager._initData();

          globals.swarm.set({data: resData});
        }
      },

      proxyFlattenObservationArraySE: function(
        keyStart, keyEnd, input, proxy, jumps, signCross
      ){
        var start = [];
        var end = [];
        for (var i = 1; i < proxy.length; i++) {

          var currJump = jumps.indexOf(i);
          if(currJump!==-1 && !signCross[currJump]){
            continue;
          }

          if(keyEnd !== false){
            for (var j = 0; j < proxy[i].length-1; j++) {
              start.push(input[i-1]);
              end.push(input[i]);
            }
          }else{
            for (var j = 0; j < proxy[i].length-1; j++) {
              start.push(input[i-1]);
            }
          }
        }
        this.processedParameters++;
        this.tmpdata[keyStart] = start;
        if(keyEnd !== false){
          this.tmpdata[keyEnd] = end;
        }
        this.checkFlatteningComplete();
      },

      flattenObservationArraySE: function(
        keyStart, keyEnd, input, jumps, signCross
      ){
        var start = [];
        var end = [];
        for (var i = 0; i < input.length-1; i++) {

          var currJump = jumps.indexOf(i);
          if(currJump!==-1 && !signCross[currJump]){
            continue;
          }
          if(keyEnd !== false){
            for (var j = 0; j < input[i].length-1; j++) {
              start.push(input[i][j+1]);
              end.push(input[i][j]);
            }
          } else {
            for (var j = 0; j < input[i].length-1; j++) {
              start.push(input[i][j]);
            }
          }
          
        }
        this.processedParameters++;
        this.tmpdata[keyStart] = start;
        if(keyEnd !== false){
          this.tmpdata[keyEnd] = end;
        }
        this.checkFlatteningComplete();
      },

      findObservationJumps: function(input, jumps, signCross){
        var resultJumps = [];
        var counter = 0;
        for (var i = 0; i < input.length-1; i++) {

          //start and end of jump
          var currJump = jumps.indexOf(i);
          if(currJump!==-1 && jumps[jumps.length-1]!==counter){
            if(signCross[currJump]){
              resultJumps.push(counter);
              resultJumps.push(counter-(input[i].length-1));
            } else {
              resultJumps.push(counter);
              resultJumps.push(counter-(input[i].length-1));
            }
          }else{
            counter += input[i].length-1;
          }
          
        }
        return resultJumps;
      },

      flattenObservationArray: function(key, input, jumps, signCross){
        var output = [];
        for (var i = 0; i < input.length-1; i++) {
          var currJump = jumps.indexOf(i);
          if(currJump!==-1 && !signCross[currJump]){
            continue;
          }
          for (var j = 0; j < input[i].length; j++) {
            output.push(input[i][j]);
          }
        }

        this.processedParameters++;
        this.tmpdata[key] = output;
        this.checkFlatteningComplete();
      },


      handleL2ADataResponse: function(product, data, collectionId){
        var ds = data[collectionId];
        var keys = Object.keys(ds);
        var resData = {};
        var gran = product.get('granularity');

        if(typeof USERVARIABLE !== 'undefined'){
          var userCollId = 'user_collection_'+ USERVARIABLE;
          var dataGranularity = gran + '_data';

          if(data.hasOwnProperty(userCollId)) {
            var userdataKeys = Object.keys(data[userCollId]);

            // Check if only user uploaded data is avaialbe
            if($.isEmptyObject(ds)){
              ds = data[userCollId];
              keys = Object.keys(ds);

            } else if(!$.isEmptyObject(data[userCollId])){

              // Only create these groups if userdata contains any data
              var diffV = [
                'SCA_extinction_variance',
                'SCA_backscatter_variance',
                'SCA_LOD_variance',
                'SCA_middle_bin_extinction_variance',
                'SCA_middle_bin_backscatter_variance',
                'SCA_middle_bin_LOD_variance',
                'SCA_middle_bin_BER_variance',
                'SCA_extinction',
                'SCA_backscatter',
                'SCA_LOD',
                'SCA_SR',
                'SCA_middle_bin_extinction',
                'SCA_middle_bin_backscatter',
                'SCA_middle_bin_LOD',
                'SCA_middle_bin_BER',
                'MCA_clim_BER',
                'MCA_extinction',
                'MCA_LOD',
              ];

              for (var kk = 0; kk < diffV.length; kk++) {
                if(data[userCollId][dataGranularity].hasOwnProperty(diffV[kk])){
                  ds[dataGranularity][diffV[kk]+'_user'] = data[userCollId][dataGranularity][diffV[kk]];
                  ds[dataGranularity][diffV[kk]+'_diff'] = [];
                  var block;
                  for (var p = 0; p < ds[dataGranularity][diffV[kk]].length; p++) {
                    block = [];
                    for (var y = 0; y < ds[dataGranularity][diffV[kk]][p].length; y++) {
                      block.push(
                        ds[dataGranularity][diffV[kk]][p][y]-data[userCollId][dataGranularity][diffV[kk]][p][y]
                      );
                    }
                    ds[dataGranularity][diffV[kk]+'_diff'].push(block);
                  }
                }
              }
            }
          }
        }

        // Switch between granularities

        if(gran === 'group'){
          // L2A
          var meas_start = [];
          var meas_end = [];
          var alt_start = [];
          var alt_end = [];
          var gD = data.ALD_U_N_2A.group_data;
          var oD = data.ALD_U_N_2A.observation_data;
          var observationOffset = gD.group_start_obs[0]-1;
          for (var i = 0; i < gD.group_start_obs.length; i++) {
              var currObsStart = (gD.group_start_obs[i]-1)-observationOffset;
              //var currObsEnd = gD.group_end_obs[i]; // Not needed yet as start and end is equal
              var currMeasStart = ((currObsStart+observationOffset)*30) + gD.group_start_meas_obs[i];
              var currMeasEnd = ((currObsStart+observationOffset)*30) + gD.group_end_meas_obs[i];
              var heighBinIndex = gD.group_height_bin_index[i]-1;
              if(typeof oD.mie_altitude_obs[currObsStart] !== 'undefined'){
                var currAltStart = oD.mie_altitude_obs[currObsStart][heighBinIndex];
                var currAltEnd = oD.mie_altitude_obs[currObsStart][heighBinIndex+1];
                
                // TODO: In theory we should filter out -1 values, not sure if these
                // apply equally to all parameters...
                //if(gD.group_backscatter[i] !==-1){}

                meas_start.push(currMeasStart);
                meas_end.push(currMeasEnd);
                alt_start.push(currAltEnd);
                alt_end.push(currAltStart);
              }
              
           }

          resData.alt_start = alt_start;
          resData.alt_end = alt_end;
          resData.meas_start = meas_start;
          resData.meas_end = meas_end;
          resData.group_backscatter_variance = gD.group_backscatter_variance;
          resData.group_extinction_variance = gD.group_extinction_variance;
          resData.group_extinction = gD.group_extinction;
          resData.group_backscatter = gD.group_backscatter;
          resData.group_LOD_variance = gD.group_LOD_variance;
          resData.group_LOD = gD.group_LOD;
          resData.group_SR = gD.group_SR;

        } else {

          for (var k = 0; k < keys.length; k++) {
            var subK = Object.keys(ds[keys[k]]);
            for (var l = 0; l < subK.length; l++) {
              var curArr = ds[keys[k]][subK[l]];
              if( Array.isArray(curArr[0]) ){
                if(subK[l].includes('altitude')){
                  // Create bottom and top arrays
                  var tmpArrBottom = [];
                  var tmpArrTop = [];
                  for (var i = 0; i < curArr.length; i++) {
                    for (var j = 0; j < 24; j++) {
                      tmpArrBottom.push(curArr[i][j]);
                      tmpArrTop.push(curArr[i][j+1]);
                    }
                  }
                  resData[subK[l]+'_bottom'] = tmpArrBottom;
                  resData[subK[l]+'_top'] = tmpArrTop;
                } else {
                  resData[subK[l]] = [].concat.apply([], ds[keys[k]][subK[l]]);
                }
              }else{

                var tmpArr = [];
                for (var i = 0; i < curArr.length; i++) {
                  for (var j = 0; j < 24; j++) {
                    tmpArr.push(curArr[i]);
                  }
                }
                resData[subK[l]+'_orig'] = curArr;
                resData[subK[l]] = tmpArr;
              }
            }
          }

          // Check if data is actually available
          if((resData.hasOwnProperty('SCA_time_obs') && resData['SCA_time_obs'].length > 0) && 
             (resData.hasOwnProperty('MCA_time_obs') && resData['MCA_time_obs'].length > 0) ) {
                                
            // Create new start and stop time to allow rendering
            resData['SCA_time_obs_start'] = resData['SCA_time_obs'].slice();
            resData['SCA_time_obs_stop'] = resData['SCA_time_obs'].slice(24, resData['SCA_time_obs'].length);
            resData['MCA_time_obs_start'] = resData['MCA_time_obs'].slice();
            resData['MCA_time_obs_stop'] = resData['MCA_time_obs'].slice(24, resData['MCA_time_obs'].length);

            resData['SCA_time_obs_orig_start'] = resData['SCA_time_obs_orig'].slice();
            resData['SCA_time_obs_orig_stop'] = resData['SCA_time_obs_orig'].slice(1, resData['SCA_time_obs_orig'].length);
            resData['MCA_time_obs_orig_start'] = resData['MCA_time_obs_orig'].slice();
            resData['MCA_time_obs_orig_stop'] = resData['MCA_time_obs_orig'].slice(1, resData['MCA_time_obs_orig'].length);
            // Add element with additional 12ms as it should be the default
            // time interval between observations
            // TODO: make sure this is acceptable! As there seems to be some 
            // minor deviations at start and end of observations
            var lastValSCA =  resData['SCA_time_obs_orig'].slice(-1)[0]+12;
            var lastValMCA =  resData['MCA_time_obs_orig'].slice(-1)[0]+12;
            for (var i = 0; i < 24; i++) {
              resData['SCA_time_obs_stop'].push(lastValSCA);
              resData['MCA_time_obs_stop'].push(lastValMCA);
            }
            resData['SCA_time_obs_orig_stop'].push(lastValSCA);
            resData['MCA_time_obs_orig_stop'].push(lastValMCA);

            var lonStep = 15;
            var latStep = 15;



            var jumpPos = [];
            var signCross = [];
            for (var i = 1; i < resData.latitude_of_DEM_intersection_obs_orig.length; i++) {
              var latdiff = Math.abs(
                resData.latitude_of_DEM_intersection_obs_orig[i-1]-
                resData.latitude_of_DEM_intersection_obs_orig[i]
              );
              var londiff = Math.abs(
                resData.longitude_of_DEM_intersection_obs_orig[i-1]-
                resData.longitude_of_DEM_intersection_obs_orig[i]
              ); 
              // TODO: slicing not working correctly for L2a
              if (latdiff >= latStep) {
                signCross.push(latdiff>160);
                jumpPos.push(i);
              }else if (londiff >= lonStep) {
                signCross.push(londiff>340);
                jumpPos.push(i);
              }
            }

            var jumpPos2 = [];
            var signCross2 = [];
            for (var i = 1; i < resData.latitude_of_DEM_intersection_obs.length; i++) {
              var latdiff = Math.abs(
                resData.latitude_of_DEM_intersection_obs[i-1]-
                resData.latitude_of_DEM_intersection_obs[i]
              );
              var londiff = Math.abs(
                resData.longitude_of_DEM_intersection_obs[i-1]-
                resData.longitude_of_DEM_intersection_obs[i]
              ); 

              if (latdiff >= latStep) {
                signCross2.push(latdiff>160);
                jumpPos2.push(i);
              }else if (londiff >= lonStep) {
                signCross2.push(londiff>340)
                jumpPos2.push(i);
              }
            }

            // Remove elements where there is a jump
            for (var j = 0; j < jumpPos2.length; j++) {
              if(!signCross2[j]){
                for (var key in resData){
                  resData[key].splice(jumpPos2[j]-24,24);
                }
              }
            }
            resData.jumps = jumpPos;
            resData.signCross = signCross;
          }

        }

        return resData;
      },

      handleL2BCDataResponse: function(product, data, collectionId){

        var ds = data[collectionId];
        var keys = Object.keys(ds);
        var resData = {};
        var gran = product.get('granularity');

        if(typeof USERVARIABLE !== 'undefined'){
          var userCollId = 'user_collection_'+ USERVARIABLE;
          var dataGranularity = product.get('granularity')+'_data';

          if(data.hasOwnProperty(userCollId)) {
            var userdataKeys = Object.keys(data[userCollId]);

            // Check if only user uploaded data is avaialbe
            if($.isEmptyObject(ds)){
              ds = data[userCollId];
              keys = Object.keys(ds);

            } else if(!$.isEmptyObject(data[userCollId])){

              // Only create these groups if userdata contains any data
              var diffV = [
                'mie_wind_result_HLOS_error',
                'mie_wind_result_SNR',
                'mie_wind_result_scattering_ratio',
                'mie_wind_result_observation_type',
                'mie_wind_result_validity_flag',
                'mie_wind_result_wind_velocity',
                'mie_wind_result_integration_length',
                'mie_wind_result_num_of_measurements',
                'rayleigh_wind_result_HLOS_error',
                'rayleigh_wind_result_scattering_ratio',
                'rayleigh_wind_result_observation_type',
                'rayleigh_wind_result_validity_flag',
                'rayleigh_wind_result_wind_velocity',
                'rayleigh_wind_result_integration_length',
                'rayleigh_wind_result_num_of_measurements',
                'rayleigh_wind_result_reference_pressure',
                'rayleigh_wind_result_reference_temperature',
                'rayleigh_wind_result_reference_backscatter_ratio'
              ];

              for (var kk = 0; kk < diffV.length; kk++) {
                var dataGranularity = 'mie_wind_data';
                if(data[userCollId][dataGranularity].hasOwnProperty(diffV[kk])){
                  ds[dataGranularity][diffV[kk]+'_user'] = data[userCollId][dataGranularity][diffV[kk]];
                  ds[dataGranularity][diffV[kk]+'_diff'] = [];
                  var block;
                  for (var p = 0; p < ds[dataGranularity][diffV[kk]].length; p++) {
                    block = [];
                    for (var y = 0; y < ds[dataGranularity][diffV[kk]][p].length; y++) {
                      block.push(
                        ds[dataGranularity][diffV[kk]][p][y]-data[userCollId][dataGranularity][diffV[kk]][p][y]
                      );
                    }
                    ds[dataGranularity][diffV[kk]+'_diff'].push(block);
                  }
                }
                dataGranularity = 'rayleigh_wind_data';
                if(data[userCollId][dataGranularity].hasOwnProperty(diffV[kk])){
                  ds[dataGranularity][diffV[kk]+'_user'] = data[userCollId][dataGranularity][diffV[kk]];
                  ds[dataGranularity][diffV[kk]+'_diff'] = [];
                  var block;
                  for (var p = 0; p < ds[dataGranularity][diffV[kk]].length; p++) {
                    block = [];
                    for (var y = 0; y < ds[dataGranularity][diffV[kk]][p].length; y++) {
                      block.push(
                        ds[dataGranularity][diffV[kk]][p][y]-data[userCollId][dataGranularity][diffV[kk]][p][y]
                      );
                    }
                    ds[dataGranularity][diffV[kk]+'_diff'].push(block);
                  }
                }
              }
            }
          }
        }

        if(gran === 'group'){

          var mie_bins_start = [];
          var mie_bins_end = [];
          var mie_meas_start = [];
          var mie_meas_end = [];
          var mie_measurement_map = [];
          var mie_obs_start = [];


          var mGD = ds.mie_grouping_data.mie_grouping_start_obs;

          for (var i = 0; i < mGD.length; i++) {

              var measStart = mGD[i]*30;
              var obs_mie_bins_start = [];
              var obs_mie_bins_end = [];
              var obs_mie_meas_start = [];
              var obs_mie_meas_end = [];
              var obs_mie_measurement_map = [];
              mie_obs_start.push(mGD[i]);

              if(measStart>=ds.measurement_data.mie_measurement_map.length){
                continue;
              }

              for (var j=0; j<ds.measurement_data.mie_measurement_map[measStart].length; j++){

                // Iterate over the 30 measurements of the observation
                for (var m=0; m<30; m++) {

                  if(ds.measurement_data.mie_measurement_map[measStart+m][j] !== 0){
                      obs_mie_bins_start.push(j);
                      obs_mie_bins_end.push(j+1);
                      obs_mie_meas_start.push(measStart+m);
                      obs_mie_meas_end.push((measStart+m+1));
                      obs_mie_measurement_map.push(
                        ds.measurement_data.mie_measurement_map[measStart+m][j]
                      );
                  }
                }
              }
              mie_bins_start.push(obs_mie_bins_start);
              mie_bins_end.push(obs_mie_bins_end);
              mie_meas_start.push(obs_mie_meas_start);
              mie_meas_end.push(obs_mie_meas_end);
              mie_measurement_map.push(obs_mie_measurement_map);

          }

          resData.mie_bins_start = mie_bins_start;
          resData.mie_bins_end = mie_bins_end;
          resData.mie_meas_start = mie_meas_start;
          resData.mie_meas_end = mie_meas_end;
          resData.mie_meas_map = mie_measurement_map;
          resData.mie_obs_start = mie_obs_start;

          var rayleigh_bins_start = [];
          var rayleigh_bins_end = [];
          var rayleigh_meas_start = [];
          var rayleigh_meas_end = [];
          var rayleigh_measurement_map = [];
          var rayleigh_obs_start = [];

          var rGD = ds.rayleigh_grouping_data.rayleigh_grouping_start_obs;

          for (var i = 0; i < rGD.length; i++) {

              var measStart = rGD[i]*30;
              var obs_rayleigh_bins_start = [];
              var obs_rayleigh_bins_end = [];
              var obs_rayleigh_meas_start = [];
              var obs_rayleigh_meas_end = [];
              var obs_rayleigh_measurement_map = [];
              rayleigh_obs_start.push(rGD[i]);

              if(measStart>=ds.measurement_data.rayleigh_measurement_map.length){
                continue;
              }

              for (var j=0; j<ds.measurement_data.rayleigh_measurement_map[measStart].length; j++){

                // Iterate over the 30 measurements of the observation
                for (var m=0; m<30; m++) {

                  if(ds.measurement_data.rayleigh_measurement_map[measStart+m][j] !== 0){
                      obs_rayleigh_bins_start.push(j);
                      obs_rayleigh_bins_end.push(j+1);
                      obs_rayleigh_meas_start.push(measStart+m);
                      obs_rayleigh_meas_end.push((measStart+m+1));
                      obs_rayleigh_measurement_map.push(
                        ds.measurement_data.rayleigh_measurement_map[measStart+m][j]
                      );
                  }
                }
              }
              rayleigh_bins_start.push(obs_rayleigh_bins_start);
              rayleigh_bins_end.push(obs_rayleigh_bins_end);
              rayleigh_meas_start.push(obs_rayleigh_meas_start);
              rayleigh_meas_end.push(obs_rayleigh_meas_end);
              rayleigh_measurement_map.push(obs_rayleigh_measurement_map);

          }

          resData.rayleigh_bins_start = rayleigh_bins_start;
          resData.rayleigh_bins_end = rayleigh_bins_end;
          resData.rayleigh_meas_start = rayleigh_meas_start;
          resData.rayleigh_meas_end = rayleigh_meas_end;
          resData.rayleigh_meas_map = rayleigh_measurement_map;
          resData.rayleigh_obs_start = rayleigh_obs_start;

        } else {
          var startEndVarsBins = [
              'mie_wind_result_range_bin_number',
              'rayleigh_wind_result_range_bin_number',
          ];

          var startEndVars = [
            'mie_wind_result_COG_range',
            'rayleigh_wind_result_COG_range',
          ];

          for (var k = 0; k < keys.length; k++) {

            var subK = Object.keys(ds[keys[k]]);

            for (var l = 0; l < subK.length; l++) {
              
              if(subK[l] === 'mie_wind_result_wind_velocity' ||
                 subK[l] === 'rayleigh_wind_result_wind_velocity'){
                // Convert from cm/s to m/s
                resData[subK[l]]= ds[keys[k]][subK[l]].map(
                  function(x) { return x / 100; }
                );
            //  } else if(
            //     subK[l] === 'mie_wind_result_COG_range' ||
            //     subK[l] === 'rayleigh_wind_result_COG_range'){
            //    // Convert from m to km
            //    resData[subK[l]]= ds[keys[k]][subK[l]].map(function(x) { return x / 1000; });
              } else if(startEndVarsBins.indexOf(subK[l]) !== -1){
                resData[subK[l]+'_start'] = ds[keys[k]][subK[l]];
                resData[subK[l]+'_end'] = ds[keys[k]][subK[l]].map(
                  function(x) { return x+1; }
                );
              } else if(startEndVars.indexOf(subK[l]) !== -1){
                resData[subK[l]+'_start'] = ds[keys[k]][subK[l]];
                var endArray = [];
                for (var idx = 1; idx < ds[keys[k]][subK[l]].length; idx++) {
                  if(ds[keys[k]][subK[l]][idx] - ds[keys[k]][subK[l]][idx-1] > 0){
                    endArray.push(ds[keys[k]][subK[l]][idx]);
                  } else {
                    endArray.push(ds[keys[k]][subK[l]][idx-1]+20);
                  }
                }
                resData[subK[l]+'_end'] = endArray;
              } else {
                resData[subK[l]] = ds[keys[k]][subK[l]];
              }
            }
          }
          var lonStep = 15;
          var latStep = 15;

          var mieSignCross = []; 
          var mieJumpPositions = [];
          if(ds.hasOwnProperty('mie_wind_data') && 
             ds.mie_wind_data.hasOwnProperty('mie_wind_result_lat_of_DEM_intersection') &&
             ds.mie_wind_data.hasOwnProperty('mie_wind_result_lon_of_DEM_intersection') ){

            var miewindLat = ds.mie_wind_data.mie_wind_result_lat_of_DEM_intersection;
            var miewindLon = ds.mie_wind_data.mie_wind_result_lon_of_DEM_intersection;
            for (var i = 1; i < miewindLat.length; i++) {
              var latdiff = Math.abs(
                miewindLat[i-1] - miewindLat[i]
              );
              var londiff = Math.abs(
                miewindLon[i-1] - miewindLon[i]
              ); 

              if (latdiff >= latStep) {
                mieSignCross.push(latdiff>160);
                mieJumpPositions.push(i);
              }else if (londiff >= lonStep) {
                mieSignCross.push(londiff>340)
                mieJumpPositions.push(i);
              }
            }
            resData.mie_jumps = mieJumpPositions;
            resData.mieSignCross = mieSignCross;

            var rayleighSignCross = [];
            var rayleighJumpPositions = [];
            var raywindLat = ds.rayleigh_wind_data.rayleigh_wind_result_lat_of_DEM_intersection;
            var raywindLon = ds.rayleigh_wind_data.rayleigh_wind_result_lon_of_DEM_intersection;

            for (var i = 1; i < raywindLat.length; i++) {
              var latdiff = Math.abs(
                raywindLat[i-1] - raywindLat[i]
              );
              var londiff = Math.abs(
                raywindLon[i-1] - raywindLon[i]
              ); 

              if (latdiff >= latStep) {
                rayleighSignCross.push(latdiff>160);
                rayleighJumpPositions.push(i);
              }else if (londiff >= lonStep) {
                rayleighSignCross.push(londiff>340)
                rayleighJumpPositions.push(i);
              }
            }
            resData.rayleigh_jumps = rayleighJumpPositions;
            resData.rayleighSignCross = rayleighSignCross;
          }
        }

        return resData;
      },

      sendRequest: function(prodId){
       
        var process = {
          collectionId: prodId,
          id: this.activeWPSproducts[prodId]
        };
        $('#auxmetScalfactor').remove();

        var product = globals.products.find(
            function(p){return p.get('download').id === process.collectionId;}
        );

        var urlBase = product.get('download').url;

        var collectionId = product.get('download').id;

        var fieldsList = {
          'ALD_U_N_1B': {
            'observation_fields': [
              'time',
              'longitude_of_DEM_intersection',
              'latitude_of_DEM_intersection',
              'altitude_of_DEM_intersection',
              'mie_longitude',
              'mie_latitude',
              'rayleigh_longitude',
              'rayleigh_latitude',
              'mie_altitude',
              'rayleigh_altitude',
              'mie_range',
              'rayleigh_range',
              'geoid_separation',
              'velocity_at_DEM_intersection',
              'AOCS_pitch_angle',
              'AOCS_roll_angle',
              'AOCS_yaw_angle',
              'mie_HLOS_wind_speed',
              'rayleigh_HLOS_wind_speed',
              'mie_signal_intensity',
              'rayleigh_signal_channel_A_intensity',
              'rayleigh_signal_channel_B_intensity',
              //'rayleigh_signal_intensity',
              'mie_ground_velocity',
              'rayleigh_ground_velocity',
              'mie_HBE_ground_velocity',
              'rayleigh_HBE_ground_velocity',
              'mie_total_ZWC',
              'rayleigh_total_ZWC',
              'mie_scattering_ratio',
              'mie_SNR',
              'rayleigh_channel_A_SNR',
              'rayleigh_channel_B_SNR',
              //'rayleigh_SNR',
              'mie_error_quantifier',
              'rayleigh_error_quantifier',
              'average_laser_energy',
              'laser_frequency',
              'rayleigh_bin_quality_flag',
              'mie_bin_quality_flag',
              'rayleigh_reference_pulse_quality_flag',
              'mie_reference_pulse_quality_flag',
              'albedo_off_nadir'
            ].join(),
            'measurement_fields': [
              'time',
              'longitude_of_DEM_intersection',
              'latitude_of_DEM_intersection',
              'altitude_of_DEM_intersection',
              'mie_longitude',
              'mie_latitude',
              'rayleigh_longitude',
              'rayleigh_latitude',
              'mie_altitude',
              'rayleigh_altitude',
              'velocity_at_DEM_intersection',
              'AOCS_pitch_angle',
              'AOCS_roll_angle',
              'AOCS_yaw_angle',
              'mie_HLOS_wind_speed',
              'rayleigh_HLOS_wind_speed',
              'mie_mean_emitted_frequency',
              'rayleigh_mean_emitted_frequency',
              'mie_emitted_frequency_std_dev',
              'rayleigh_emitted_frequency_std_dev',
              //'mie_signal_intensity',
              //'rayleigh_signal_channel_A_intensity',
              //'rayleigh_signal_channel_B_intensity',
              //'rayleigh_signal_intensity',
              'mie_ground_velocity',
              'rayleigh_ground_velocity',
              'mie_scattering_ratio',
              /*'mie_SNR',
              'rayleigh_channel_A_SNR',
              'rayleigh_channel_B_SNR',
              'rayleigh_SNR',*/
              'average_laser_energy',
              'laser_frequency',
              'rayleigh_bin_quality_flag',
              'mie_bin_quality_flag',
              'rayleigh_reference_pulse_quality_flag',
              'mie_reference_pulse_quality_flag',
              'albedo_off_nadir'
            ].join()
          },
          'ALD_U_N_2A': {
            // ICA have different size, for now disabled
            'observation_fields': [
              'L1B_start_time_obs',
              'L1B_centroid_time_obs',
              'SCA_time_obs',
              //'ICA_time_obs',
              'MCA_time_obs',
              'longitude_of_DEM_intersection_obs',
              'latitude_of_DEM_intersection_obs',
              'altitude_of_DEM_intersection_obs',
              'geoid_separation_obs',
              'mie_altitude_obs',
              'rayleigh_altitude_obs',
              'SCA_middle_bin_altitude_obs',
              'L1B_num_of_meas_per_obs',
              'SCA_QC_flag',
              'SCA_extinction_variance',
              'SCA_backscatter_variance',
              'SCA_LOD_variance',
              'SCA_middle_bin_extinction_variance',
              'SCA_middle_bin_backscatter_variance',
              'SCA_middle_bin_LOD_variance',
              'SCA_middle_bin_BER_variance',
              //'ICA_QC_flag',
              'SCA_extinction',
              'SCA_backscatter',
              'SCA_LOD',
              'SCA_SR',
              'SCA_middle_bin_extinction',
              'SCA_middle_bin_backscatter',
              'SCA_middle_bin_LOD',
              'SCA_middle_bin_BER',
              /*'ICA_filling_case',
              'ICA_extinction',
              'ICA_backscatter',
              'ICA_LOD',*/
              'MCA_clim_BER',
              'MCA_extinction',
              'MCA_LOD',
              'albedo_off_nadir'
            ].join(),
            'measurement_fields': [
              'L1B_time_meas',
              'longitude_of_DEM_intersection_meas',
              'latitude_of_DEM_intersection_meas',
              'altitude_of_DEM_intersection_meas',
              'mie_altitude_meas',
              'rayleigh_altitude_meas',
              'albedo_off_nadir'
            ].join(),
              'group_fields': [
              'group_start_obs',
              'group_end_obs',
              'group_start_meas_obs',
              'group_end_meas_obs',
              'group_start_time',
              'group_end_time',
              'group_height_bin_index',
              'group_backscatter',
              'group_backscatter_variance',
              'group_extinction_variance'
              /*'group_start_time',
              'group_end_time',
              'group_centroid_time',
              'group_middle_bin_start_altitude',
              'group_middle_bin_stop_altitude',
              'group_start_obs',
              'group_start_meas_obs',
              'group_end_obs',
              'group_end_meas_obs',
              'group_height_bin_index',
              'group_extinction_variance',
              'group_backscatter_variance',
              'group_LOD_variance',
              'group_middle_bin_extinction_variance_top',
              'group_middle_bin_backscatter_variance_top',
              'group_middle_bin_LOD_variance_top',
              'group_middle_bin_BER_variance_top',
              'group_middle_bin_extinction_variance_bottom',
              'group_middle_bin_backscatter_variance_bottom',
              'group_middle_bin_LOD_variance_bottom',
              'group_middle_bin_BER_variance_bottom',
              'group_extinction',
              'group_backscatter',
              'group_LOD',
              'group_SR',
              'group_middle_bin_extinction_top',
              'group_middle_bin_backscatter_top',
              'group_middle_bin_LOD_top',
              'group_middle_bin_BER_top',
              'group_middle_bin_extinction_bottom',
              'group_middle_bin_backscatter_bottom',
              'group_middle_bin_LOD_bottom',
              'group_middle_bin_BER_bottom',
              //'scene_classification_aladin_cloud_flag',
              'scene_classification_NWP_cloud_flag',
              'scene_classification_group_class_reliability'*/
            ].join(),
          },
          'ALD_U_N_2B': {
              'mie_profile_fields': [
                'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                'mie_profile_datetime_start', 'mie_profile_datetime_stop'
              ].join(),
              'mie_wind_fields': [
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
                'mie_wind_result_albedo_off_nadir'
              ].join(),
              'rayleigh_wind_fields': [
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
                'rayleigh_wind_result_albedo_off_nadir'
              ].join(),
              'rayleigh_profile_fields': [
                'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'
              ].join()
          },
          'ALD_U_N_2C': {
               'mie_profile_fields': [
                'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                'mie_profile_datetime_start', 'mie_profile_datetime_stop'
              ].join(),
              'mie_wind_fields': [
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
              ].join(),
              'rayleigh_profile_fields': [
                'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'
              ].join(),
              'rayleigh_wind_fields': [
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
                'rayleigh_wind_result_albedo_off_nadir',
              ].join(),
           },
          'AUX_MRC_1B': [
            'lat_of_DEM_intersection',
            'lon_of_DEM_intersection',
            'time_freq_step',
            // 'altitude', //2D data
            // 'satellite_range', //2D data
            'frequency_offset',
            'frequency_valid',
            'measurement_response',
            'measurement_response_valid',
            'measurement_error_mie_response',
            'reference_pulse_response',
            'reference_pulse_response_valid',
            'reference_pulse_error_mie_response',
            // 'normalised_useful_signal', //2D data
            // 'mie_scattering_ratio', //2D data
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
            'mie_core_measurement_offset',
          ].join(),
          'AUX_RRC_1B': [
            'lat_of_DEM_intersection',
            'lon_of_DEM_intersection',
            'time_freq_step',
            // 'altitude', //2D data
            // 'satellite_range', //2D data
            //'geoid_separation_obs',
            //'geoid_separation_freq_step',
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
            // 'normalised_useful_signal', //2D data
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
          ].join(),
          'AUX_ISR_1B': [
            'time',
            'freq_mie_USR_closest_to_rayleigh_filter_centre',
            'frequency_rayleigh_filter_centre',
            'num_of_valid_mie_results',
            'num_of_valid_rayleigh_results',
            'laser_frequency_offset',
            'mie_valid',
            'rayleigh_valid',
            'fizeau_transmission',
            'mie_response',
            'rayleigh_channel_A_response',
            'rayleigh_channel_B_response',
            'num_of_raw_reference_pulses',
            'num_of_mie_reference_pulses',
            'num_of_rayleigh_reference_pulses',
            'accumulated_laser_energy_mie',
            'mean_laser_energy_mie',
            'accumulated_laser_energy_rayleigh',
            'mean_laser_energy_rayleigh',
            'laser_energy_drift',
            'downhill_simplex_used',
            'num_of_iterations_mie_core_1',
            'last_peak_difference_mie_core_1',
            'FWHM_mie_core_2',
            'num_of_iterations_mie_core_2',
            'downhill_simplex_quality_flag',
            'rayleigh_spectrometer_temperature_9',
            'rayleigh_spectrometer_temperature_10',
            'rayleigh_spectrometer_temperature_11',
            'rayleigh_thermal_hood_temperature_1',
            'rayleigh_thermal_hood_temperature_2',
            'rayleigh_thermal_hood_temperature_3',
            'rayleigh_thermal_hood_temperature_4',
            'rayleigh_optical_baseplate_avg_temperature'
          ].join(),
          'AUX_ZWC_1B': [
            'time',
            'lat_of_DEM_intersection',
            'lon_of_DEM_intersection',
            'roll_angle',
            'pitch_angle',
            'yaw_angle',
            //'mie_range',
            //'rayleigh_range',
            'ZWC_result_type',
            'mie_ground_correction_velocity',
            'rayleigh_ground_correction_velocity',
            'num_of_mie_ground_bins',
            'mie_avg_ground_echo_bin_thickness',
            'rayleigh_avg_ground_echo_bin_thickness',
            'mie_avg_ground_echo_bin_thickness_above_DEM',
            'rayleigh_avg_ground_echo_bin_thickness_above_DEM',
            'mie_top_ground_bin_obs',
            'rayleigh_top_ground_bin_obs',
            'mie_bottom_ground_bin_obs',
            'rayleigh_bottom_ground_bin_obs',
            // Commented out pseudo 2D data for now
            //'mie_measurements_used',
            //'mie_top_ground_bin_meas',
            //'mie_bottom_ground_bin_meas',
            //'mie_DEM_ground_bin',
            //'mie_height_difference_top_to_DEM_ground_bin',
            //'mie_ground_bin_SNR_meas',
            //'rayleigh_measurements_used',
            //'rayleigh_top_ground_bin_meas',
            //'rayleigh_bottom_ground_bin_meas',
            //'rayleigh_DEM_ground_bin',
            //'rayleigh_height_difference_top_to_DEM_ground_bin',
            //'rayleigh_channel_A_ground_SNR_meas',
            //'rayleigh_channel_B_ground_SNR_meas',
            //'DEM_height'
          ].join(),
          'AUX_MET_12': [
            'time_off_nadir', 'time_nadir',
            'surface_wind_component_u_off_nadir',
            'surface_wind_component_u_nadir',
            'surface_wind_component_v_off_nadir',
            'surface_wind_component_v_nadir',
            'surface_pressure_off_nadir','surface_pressure_nadir',
            'surface_altitude_off_nadir', 'surface_altitude_nadir',
            'latitude_nadir',
            'longitude_nadir',
            'latitude_off_nadir',
            'longitude_off_nadir'
          ]

        };

        var requestOptions = {
          l2a_group: {
            //measurement_fields: 'altitude_of_DEM_intersection_meas,mie_altitude_meas',
            observation_fields: 'altitude_of_DEM_intersection_obs,mie_altitude_obs,rayleigh_altitude_obs'/*+'latitude_of_DEM_intersection_obs,longitude_of_DEM_intersection_obs'*/,
            group_fields: 'group_start_obs,group_end_obs,group_start_meas_obs,group_end_meas_obs,group_start_time,group_end_time,group_height_bin_index,'+
                          'group_extinction,group_backscatter,group_backscatter_variance,group_extinction_variance,group_LOD_variance,group_LOD,group_SR'

          },
          l2b_group: {
            measurement_fields: 'mie_measurement_map,rayleigh_measurement_map',
            mie_grouping_fields: 'mie_grouping_start_obs,mie_grouping_end_obs,mie_grouping_start_meas_per_obs,mie_grouping_end_meas_per_obs',
            rayleigh_grouping_fields: 'rayleigh_grouping_start_obs,rayleigh_grouping_end_obs,rayleigh_grouping_start_meas_per_obs,rayleigh_grouping_end_meas_per_obs'
          }
        };
        
        var collections = [collectionId];
        if(typeof USERVARIABLE !== 'undefined'){
            collections.push('user_collection_'+ USERVARIABLE);
        }

        var options = {
          processId: process.id,
          collection_ids: JSON.stringify(collections),
          begin_time: getISODateTimeString(this.selected_time.start),
          end_time: getISODateTimeString(this.selected_time.end),
        };

        if(this.selection_list.length > 0){
          var bb = this.selection_list[0];
          options["bbox"] = true;
          options["bbox_lower"] = bb.w + " " + bb.s;
          options["bbox_upper"] = bb.e + " " + bb.n;
        }


        var gran = product.get('granularity');
        if(collectionId === 'ALD_U_N_2A'  && gran === 'group'){
          $.extend(options, requestOptions.l2a_group);
        } else if(collectionId === 'ALD_U_N_2B'  && gran === 'group'){
          $.extend(options, requestOptions.l2b_group);
        } else if(collectionId.indexOf('AUX')===-1){
          if(gran === 'wind-accumulation-result'){
            options['mie_wind_fields'] = fieldsList[collectionId]['mie_wind_fields'];
            options['rayleigh_wind_fields'] = fieldsList[collectionId]['rayleigh_wind_fields'];
          } else {
            var fields = gran+'_fields';
            options[fields] = fieldsList[collectionId][fields];
          }
        } else {
          options['fields'] = fieldsList[collectionId];
        }

        // Add subsampling depending on selected time if AUX MET product selected
        if(collectionId === 'AUX_MET_12'){
          
          // Seelct which fields are necessary based on parameter selected
          // for product
          var parameters = product.get('parameters');
          var selectedParameter;
          var keys = _.keys(parameters);
          _.each(keys, function(key){
              if(parameters[key].selected){
                  selectedParameter = key;
              }
          });
          
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

          var parameter2Dselected = false;

          if(params2DNadir.indexOf(selectedParameter) !== -1){
            options['fields'] = ['time_nadir', 'latitude_nadir', 'longitude_nadir'];
            options['fields'].push(selectedParameter);
            options['fields'].push('layer_altitude_nadir');
            parameter2Dselected = true;
          }

          if(params2DOffNadir.indexOf(selectedParameter) !== -1){
            options['fields'] = ['time_off_nadir', 'latitude_off_nadir', 'longitude_off_nadir'];
            options['fields'].push(selectedParameter);
            options['fields'].push('layer_altitude_off_nadir');
            parameter2Dselected = true;
          }

          options['fields'] = options['fields'].join();


          var scaleFactor = 1.0 - (
            (this.selected_time.end.getTime() - 
            this.selected_time.start.getTime()) / (24*60*60*1000)
          );
          
          scaleFactor = Number(scaleFactor.toPrecision(3));

          if(parameter2Dselected){

            if(scaleFactor >= 0.98){
              scaleFactor = 1.0;
            } else if(scaleFactor >= 0.5){
              scaleFactor = Math.pow(scaleFactor,5);
            } else if(scaleFactor > 0.0){
              scaleFactor = Math.pow(scaleFactor,3);
            } 

            if (scaleFactor <= 0.1){
              scaleFactor = 0.1;
            }
            scaleFactor = Number(scaleFactor.toPrecision(4));
          } else {
            if(scaleFactor>0.8){
              scaleFactor = 1.0;
            }
            if(scaleFactor<=0.2){
              scaleFactor = 0.2;
            }
          }

          $('#topBar').append(
            '<div id="auxmetScalfactor">AUX_MET Scale factor: '+
            scaleFactor +
            '</div>'
          );

          options.scalefactor = scaleFactor;
        }



        options.mimeType = 'application/msgpack';

        var body = wps_dataRequestTmpl(options);

        if(this.xhr !== null){
          // A request has been sent that is not yet been returned so we need to cancel it
          Communicator.mediator.trigger("progress:change", false);
          this.xhr.abort();
          this.xhr = null;
        }

        this.xhr = new XMLHttpRequest();
        this.xhr.open('POST', urlBase, true);
        this.xhr.responseType = 'arraybuffer';
        var that = this;
        var request = this.xhr;

        this.xhr.onreadystatechange = function() {
       
          if(request.readyState == 4) {
            if(request.status == 200) {

                that.tmpdata = {};

                Communicator.mediator.trigger("progress:change", false);
                var tmp = new Uint8Array(this.response);
                var data = msgpack.decode(tmp);

                var ds = data[collectionId];

                if(that.previousCollection !== collectionId){
                  that.previousCollection = collectionId;
                  if(that.firstLoad){
                    that.firstLoad = false;
                  } else {
                    that.filterManager.resetManager();
                  }
                }

                if(collectionId === 'ALD_U_N_1B'){

                  // TODO: Here we need to differentiate between observations and measurements
                  //ds = ds['observation_data'];
                  var dataGranularity = product.get('granularity')+'_data';
                  ds = ds[dataGranularity];

                  // Check if user data is also available, if yes save sizes for 
                  // each to be able to create referene objects and concatenate
                  // user data to registered data
                  // Check for possible user uploaded data
                  var mieUserLength = 0;
                  var mieOrigLength = 0;
                  var rayleighUserLength = 0;
                  var rayleighOrigLength = 0;
                  var mieDiffVars, rayleighDiffVars;

                  if(typeof USERVARIABLE !== 'undefined'){
                    var userCollId = 'user_collection_'+ USERVARIABLE;
                    

                    if(data.hasOwnProperty(userCollId)) {
                      var userdataKeys = Object.keys(data[userCollId][dataGranularity]);
                      // Check if only user uploaded data is avaialbe
                      if($.isEmptyObject(ds)){
                        ds = data[userCollId][dataGranularity];
                        keys = Object.keys(ds);


                      } else if(!$.isEmptyObject(data[userCollId][dataGranularity])){

                        // Only create these groups if userdata contains any data
                        mieDiffVars = [
                          'mie_HLOS_wind_speed', 'mie_signal_intensity',
                          'mie_scattering_ratio', 'mie_SNR', 'mie_error_quantifier', 
                          'mie_mean_emitted_frequency', 'mie_emitted_frequency_std_dev'
                        ];

                        rayleighDiffVars = [
                          'rayleigh_HLOS_wind_speed', 'rayleigh_signal_channel_A_intensity',
                          'rayleigh_signal_channel_B_intensity', 
                          'rayleigh_total_ZWC',
                          'rayleigh_channel_A_SNR', 'rayleigh_channel_B_SNR', 
                          'rayleigh_error_quantifier',
                          'rayleigh_mean_emitted_frequency', 'rayleigh_emitted_frequency_std_dev'
                        ];

                        var diffV = mieDiffVars.concat(rayleighDiffVars);

                        for (var kk = 0; kk < diffV.length; kk++) {
                          if(data[userCollId][dataGranularity].hasOwnProperty(diffV[kk])){
                            ds[diffV[kk]+'_user'] = data[userCollId][dataGranularity][diffV[kk]];
                            ds[diffV[kk]+'_diff'] = [];
                            var block;
                            for (var p = 0; p < ds[diffV[kk]].length; p++) {
                              block = [];
                              for (var y = 0; y < ds[diffV[kk]][p].length; y++) {
                                block.push(
                                  ds[diffV[kk]][p][y]-data[userCollId][dataGranularity][diffV[kk]][p][y]
                                );
                              }
                              ds[diffV[kk]+'_diff'].push(block);
                            }
                          }
                        }
                      }
                    }
                  }

                  if(product.get('granularity') === 'measurement'){
                    // Flatten everything equally, ignore empty arrays
                    var tmpdata = {};
                    for(var key in ds){
                      for (var i = 0; i < ds[key].length; i++) {
                        
                        if(tmpdata.hasOwnProperty(key)){
                          if(ds[key][i].length>0){
                            tmpdata[key] = tmpdata[key].concat(ds[key][i]);
                          }
                        }else{
                          if(ds[key][i].length>0){
                            tmpdata[key] = ds[key][i];
                          }
                        }
                      }
                      
                    }
                    ds = tmpdata;
                  }

                  if($.isEmptyObject(ds)){
                    globals.swarm.set({data: {}});
                    return;
                  } else {
                    // Check if returned parameters are empty (e.g. bbox selection)
                    // over area where no curtain is available
                    var keys = Object.keys(ds);
                    if(ds[keys[0]].length === 0){
                      globals.swarm.set({data: {}});
                      return;
                    }
                  }


                  // First thing we need to find possible jumps in data and handle them
                  var positions = [];
                  for (var i = 0; i < ds.latitude_of_DEM_intersection.length; i++) {
                    positions.push(ds.longitude_of_DEM_intersection[i]);
                    positions.push(ds.latitude_of_DEM_intersection[i]);
                  }

                  var lonStep = 10;
                  var latStep = 10;

                  var stepPositions = [];
                  var signCross = [];


                  for (var i = 2; i < positions.length; i++) {
                    var diff = Math.abs(positions[i]-positions[i-2]);
                    if (i%2===0 && diff>=lonStep) {
                      signCross.push(diff>350 && Math.abs(positions[i+1]-positions[i-1])<latStep);
                      if(diff>350){
                        stepPositions.push(parseInt(i/2)+2);
                      } else {
                        stepPositions.push(parseInt(i/2));
                      }
                      
                    }else if (i%2===1 && diff>=latStep) {
                      if(stepPositions.length>0 && stepPositions[stepPositions.length-1]!=parseInt((i-1)/2)){
                        stepPositions.push(parseInt((i)/2));
                        signCross.push(diff>160); 
                      }else if(stepPositions.length === 0){
                        stepPositions.push(parseInt(i/2));
                        signCross.push(diff>160); 
                      }
                    }
                  }

                  for (var t = 1; t < ds.time.length; t++) {
                    var timediff = ds.time[t]-ds.time[t-1];
                    if(timediff>100){

                      if(stepPositions.indexOf(t) === -1){
                        // Find where to insert new step position
                        var insPos;
                        for (var i = 0; i < stepPositions.length; i++) {
                          if(t > stepPositions[i]){
                            // The first time the value is higher we save the
                            // previous point and exit the loop
                            insPos = i-1;
                            break;
                          }
                        }
                        if(insPos>=0){
                          stepPositions.splice(insPos, 0, t);
                          signCross.splice(insPos, 0, false);
                        } else {
                          // Insert into first position
                          stepPositions.splice(0, 0, t);
                          signCross.splice(0, 0, false);
                        }
                      }

                    }
                  }

                  var mie_jumps = that.findObservationJumps(ds.mie_altitude, stepPositions, signCross);

                  var mieVars = [
                    'time','latitude_of_DEM_intersection','longitude_of_DEM_intersection',
                    'altitude_of_DEM_intersection', 'albedo_off_nadir',
                    'mie_altitude', 'mie_range', 'velocity_at_DEM_intersection',
                    'AOCS_pitch_angle', 'AOCS_roll_angle', 'AOCS_yaw_angle',
                    'mie_HLOS_wind_speed', 'mie_signal_intensity',
                    'mie_ground_velocity',
                    'mie_bin_quality_flag', 'mie_HBE_ground_velocity', 
                    'mie_total_ZWC', 
                    'mie_scattering_ratio', 'mie_SNR', 'mie_error_quantifier', 
                    'average_laser_energy', 'laser_frequency', 
                    'mie_reference_pulse_quality_flag',
                    'mie_mean_emitted_frequency', 'mie_emitted_frequency_std_dev'
                  ];

                  if(mieDiffVars){
                    for (var i = 0; i < mieDiffVars.length; i++) {
                      mieVars.push(mieDiffVars[i]+'_user');
                      mieVars.push(mieDiffVars[i]+'_diff');
                    }
                  }

                  var rayleighVars = [
                    'rayleigh_altitude', 'rayleigh_range',
                    'rayleigh_HLOS_wind_speed', 'rayleigh_signal_channel_A_intensity',
                    'rayleigh_signal_channel_B_intensity', //'rayleigh_signal_intensity',
                    'rayleigh_ground_velocity', 'rayleigh_HBE_ground_velocity',
                    'rayleigh_total_ZWC',
                    'rayleigh_channel_A_SNR', 'rayleigh_channel_B_SNR', //'rayleigh_SNR',
                    'rayleigh_bin_quality_flag', 'rayleigh_error_quantifier',
                    'rayleigh_reference_pulse_quality_flag',
                    'rayleigh_mean_emitted_frequency', 'rayleigh_emitted_frequency_std_dev'
                  ];

                  if(rayleighDiffVars){
                    for (var i = 0; i < rayleighDiffVars.length; i++) {
                      rayleighVars.push(rayleighDiffVars[i]+'_user');
                      rayleighVars.push(rayleighDiffVars[i]+'_diff');
                    }
                  }

                  var startEndVars = [
                    'time','latitude_of_DEM_intersection','longitude_of_DEM_intersection',
                    'rayleigh_altitude', 'rayleigh_range', 'mie_altitude', 'mie_range'
                  ];


                  // Three data structures possible:
                  // 1: 1D flat array (each "profile")
                  // 2: Array of n-sized arrays (2D) containing "bin" values
                  // 3: Array of (n+1)-sized arrays (2D) containing "start/end" bin values
                  var nSize = 24;
                  var startKey, endKey;

                  that.totalLength = mieVars.length + rayleighVars.length-2;
                  that.processedParameters = 0;
                  that.collectionId = collectionId;

                  var pseudoKey = null;


                  that.tmpdata.stepPositions = stepPositions;
                  that.tmpdata.signCross = signCross;
                  that.tmpdata.mie_jumps = mie_jumps;

                  for (var i = 0; i < mieVars.length; i++) {

                    if(!ds.hasOwnProperty(mieVars[i])){
                      that.processedParameters++;
                      that.checkFlatteningComplete();
                      continue;
                    }
                    if(mieVars[i].indexOf('mie')!==-1){
                      pseudoKey = mieVars[i];
                    } else {
                      pseudoKey = /*'mie_'+*/mieVars[i];
                    }
                    if(Array.isArray(ds[mieVars[i]][0])){

                      var arrLen = ds[mieVars[i]][0].length;
                      if(arrLen > nSize){ // case 3
                        
                        if(startEndVars.indexOf(mieVars[i]) !== -1){
                          startKey = pseudoKey+'_start';
                          endKey = pseudoKey+'_end';
                        }  else {
                          startKey = pseudoKey;
                          endKey = false;
                        }
                        setTimeout(
                          that.flattenObservationArraySE(
                            startKey, endKey,
                            ds[mieVars[i]], stepPositions, signCross
                          ),
                          0
                        );

                      } else if (arrLen === nSize){ //case 2
                        setTimeout(
                          that.flattenObservationArray(
                            pseudoKey, ds[mieVars[i]], stepPositions, signCross
                          ),
                          0
                        );
                      }
                    } else { // case 1

                      if(startEndVars.indexOf(mieVars[i]) !== -1){
                        startKey = pseudoKey+'_start';
                        endKey = pseudoKey+'_end';
                      }  else {
                        startKey = pseudoKey;
                        endKey = false;
                      }

                      setTimeout(
                        that.proxyFlattenObservationArraySE(
                          startKey, endKey,
                          ds[mieVars[i]], ds.mie_altitude, stepPositions, signCross
                        ),
                        0
                      );

                    }

                  } // End of mie variables for loop


                  // Rayleigh

                  var rayleigh_jumps = that.findObservationJumps(
                    ds.rayleigh_altitude, stepPositions, signCross
                  );

                  that.tmpdata.rayleigh_jumps = rayleigh_jumps;
                  that.tmpdata.positions = positions;

                  for (var i = 0; i < rayleighVars.length; i++) {

                    if(!ds.hasOwnProperty(rayleighVars[i])){
                      that.processedParameters++;
                      that.checkFlatteningComplete();
                      continue;
                    }
                    if(rayleighVars[i].indexOf('rayleigh')!==-1){
                      pseudoKey = rayleighVars[i];
                    } else {
                      pseudoKey = /*'rayleigh_'+*/rayleighVars[i];
                    }

                    if(Array.isArray(ds[rayleighVars[i]][0])){

                      var arrLen = ds[rayleighVars[i]][0].length;
                      if(arrLen > nSize){ // case 3
                        
                        if(startEndVars.indexOf(rayleighVars[i]) !== -1){
                          startKey = pseudoKey+'_start';
                          endKey = pseudoKey+'_end';
                        }  else {
                          startKey = pseudoKey;
                          endKey = false;
                        }
                        setTimeout(
                          that.flattenObservationArraySE(
                            startKey, endKey,
                            ds[rayleighVars[i]], stepPositions, signCross
                          ),
                          0
                        );

                      } else if (arrLen === nSize){ //case 2
                        setTimeout(
                          that.flattenObservationArray(
                            pseudoKey, ds[rayleighVars[i]], stepPositions, signCross
                          ),
                          0
                        );
                      }
                    } else { // case 1

                      if(startEndVars.indexOf(rayleighVars[i]) !== -1){
                        startKey = pseudoKey+'_start';
                        endKey = pseudoKey+'_end';
                      }  else {
                        startKey = pseudoKey;
                        endKey = false;
                      }

                      setTimeout(
                        that.proxyFlattenObservationArraySE(
                          startKey, endKey,
                          ds[rayleighVars[i]], ds.mie_altitude, stepPositions, signCross
                        ),
                        0
                      );

                    }

                  } // Closing for loop of raylegh vars

                  

                  // TODO: Getting the object and setting one parameter does not trigger
                  // change event, need to think about using multiple objects for different
                  // ids instead of one object with multiple parameters 


                } else {
                  var resData = {};
                  var keys = Object.keys(ds);

                  // ZWC data is structured differently to the other 3 AUX types
                  if(collectionId === 'AUX_ZWC_1B'){

                    if(typeof USERVARIABLE !== 'undefined'){
                      var userCollId = 'user_collection_'+ USERVARIABLE;
                      if(data.hasOwnProperty(userCollId)) {
                        // Check if only user uploaded data is avaialbe
                        if($.isEmptyObject(ds)){
                          ds = data[userCollId];
                          keys = Object.keys(ds);
                           // We create some additional data for ZWC data
                          var obsIndex = [];
                          for (var j = 1; j <= ds[keys[0]].length; j++) {
                            obsIndex.push(j);
                          }
                          ds['observation_index'] = obsIndex;
                        } else {
                          // Check fo max length of data
                          var origLength, userLength;
                          if(ds.hasOwnProperty(keys[0])){
                            origLength = ds[keys[0]].length;
                          }
                          if(data[userCollId].hasOwnProperty(keys[0])){
                            userLength = data[userCollId][keys[0]].length;
                          }

                          if(typeof origLength !== 'undefined' && 
                             typeof userLength !== 'undefined'){
                            // Add identifier array for data
                            ds['observation_index'] = [];
                            data[userCollId]['observation_index'] = [];
                            for (var i = 0; i < origLength; i++) {
                              //ds.origin.push('original');
                              ds.observation_index.push(i);
                            }
                            for (var i = 0; i < userLength; i++) {
                              //data[userCollId].origin.push('user_upload');
                              data[userCollId].observation_index.push(i);
                            }
                            for (var param in ds){
                              if(data[userCollId].hasOwnProperty(param)){
                                ds[param+'_user'] = data[userCollId][param];
                                ds[param+'_diff'] = [];
                                for (var p = 0; p < ds[param].length.length; p++) {
                                  ds[param+'_diff'].push(ds[param][p]-data[userCollId][param][p]);
                                }
                              }
                            }
                            keys.push('observation_index');
                          }
                        }
                      }
                    }
                    resData = {};
                    for (var k = 0; k < keys.length; k++) {
                      if(!Array.isArray(ds[keys[k]])){
                        // Single value property save to be displayed as text 
                        if(resData.hasOwnProperty('singleValues')){
                          resData.singleValues[keys[k]] = ds[keys[k]];
                        } else {
                          var obj = {};
                          obj[keys[k]] = ds[keys[k]];
                          resData.singleValues = obj;
                        }
                      }else {
                        if(!Array.isArray(ds[keys[k]][0])){
                          if(resData.hasOwnProperty(keys[k])){
                            resData[keys[k]] = resData[keys[k]].concat(ds[keys[k]]);
                          } else {
                            resData[keys[k]] = ds[keys[k]];
                          }
                        } else {
                          console.log(keys[k]);
                          // TODO: Handle 2D AUX Data
                        }
                      }
                    }

                    if(!resData.hasOwnProperty('observation_index')){
                      var obsIndex = [];
                      for (var j = 1; j <= resData[keys[0]].length; j++) {
                        obsIndex.push(j);
                      }
                      resData['observation_index'] = obsIndex;
                    }

                  } else if(collectionId === 'AUX_MET_12'){

                    var data2D = [
                      'layer_temperature_nadir',
                      'layer_validity_flag_nadir',
                      'layer_wind_component_u_nadir',
                      'layer_wind_component_v_nadir',
                      'layer_rel_humidity_nadir',
                      'layer_spec_humidity_nadir',
                      'layer_cloud_cover_nadir',
                      'layer_cloud_liquid_water_content_nadir',
                      'layer_cloud_ice_water_content_nadir',
                      
                      'layer_temperature_off_nadir',
                      'layer_validity_flag_off_nadir',
                      'layer_wind_component_u_off_nadir',
                      'layer_wind_component_v_off_nadir',
                      'layer_rel_humidity_off_nadir',
                      'layer_spec_humidity_off_nadir',
                      'layer_cloud_cover_off_nadir',
                      'layer_cloud_liquid_water_content_off_nadir',
                      'layer_cloud_ice_water_content_off_nadir'
                    ];

                    var startEndData = [
                      'layer_altitude_nadir',
                      'layer_altitude_off_nadir',
                      //'layer_pressure_nadir',
                      //'layer_pressure_off_nadir',

                    ];

                    var ySize = 137;
                    for (var key in ds) {
                      if( data2D.indexOf(key) !== -1 ){
                        resData[key] = [];
                        for (var x = 0; x < ds[key].length-1; x++) {
                          for (var y = 0; y < ds[key][x].length-1; y++) {
                            resData[key].push(ds[key][x][y]);
                          }
                        }
                      } else if ( startEndData.indexOf(key) !== -1) {
                        resData[key+'_start'] = [];
                        resData[key+'_end'] = [];
                        for (var x = 0; x < ds[key].length-1; x++) {
                          for (var y = 0; y < ds[key][x].length-1; y++) {
                            resData[key+'_start'].push(ds[key][x][y]);
                            resData[key+'_end'].push(ds[key][x][y+1]);
                          }
                        }
                      } else {
                        resData[key] = ds[key];
                        if(key === 'time_nadir' || key === 'time_off_nadir'){
                          resData[key+'_start'] = [];
                          resData[key+'_end'] = [];
                          for (var x = 0; x < ds[key].length-1; x++) {
                            for (var y = 0; y < ySize-1; y++) {
                              resData[key+'_start'].push(ds[key][x]);
                              resData[key+'_end'].push(ds[key][x+1]);
                            }
                          }
                        }
                      }
                    }

                    var lonStep = 15;
                    var latStep = 15;

                    var jumpPos = [];
                    var signCross = [];

                    if(resData.hasOwnProperty('latitude_nadir')){
                      for (var i = 1; i < resData.latitude_nadir.length; i++) {
                        var latdiff = Math.abs(
                          resData.latitude_nadir[i-1]-
                          resData.latitude_nadir[i]
                        );
                        var londiff = Math.abs(
                          resData.longitude_nadir[i-1]-
                          resData.longitude_nadir[i]
                        ); 

                        if (latdiff >= latStep) {
                          signCross.push(latdiff>160);
                          jumpPos.push(i);
                        }else if (londiff >= lonStep) {
                          signCross.push(londiff>340);
                          jumpPos.push(i);
                        }
                      }

                      resData['nadir_jumps'] = jumpPos;
                      resData['nadirSignCross'] = signCross;
                    }

                    if(resData.hasOwnProperty('latitude_off_nadir')){
                      jumpPos = [];
                      signCross = [];
                      for (var i = 1; i < resData.latitude_off_nadir.length; i++) {
                        latdiff = Math.abs(
                          resData.latitude_off_nadir[i-1]-
                          resData.latitude_off_nadir[i]
                        );
                        londiff = Math.abs(
                          resData.longitude_off_nadir[i-1]-
                          resData.longitude_off_nadir[i]
                        ); 

                        if (latdiff >= latStep) {
                          signCross.push(latdiff>160);
                          jumpPos.push(i);
                        }else if (londiff >= lonStep) {
                          signCross.push(londiff>340);
                          jumpPos.push(i);
                        }
                      }

                      resData['off_nadir_jumps'] = jumpPos;
                      resData['off_nadirSignCross'] = signCross;
                    }


                  } else if(collectionId === 'ALD_U_N_2A'){

                    resData = that.handleL2ADataResponse(product, data, collectionId);

                  } else if(collectionId === 'ALD_U_N_2B' || collectionId === 'ALD_U_N_2C'){

                    resData = that.handleL2BCDataResponse(product, data, collectionId);

                  } else {
                    // We land here for MRC, RRC and ISR

                    // Check for possible user uploaded data
                    if(typeof USERVARIABLE !== 'undefined'){
                      var userCollId = 'user_collection_'+ USERVARIABLE;
                      if(data.hasOwnProperty(userCollId)) {
                        // Check if only user uploaded data is avaialbe
                        if($.isEmptyObject(ds)){
                          ds = data[userCollId];
                          keys = Object.keys(ds);
                        } else {
                          // Check fo max length of data, for MRC and RRC we can 
                          // look at frequency offset
                          var origLength, userLength;
                          if(ds.hasOwnProperty('frequency_offset')){
                            origLength = ds.frequency_offset[0].length;
                          }
                          if(data[userCollId].hasOwnProperty('frequency_offset')){
                            userLength = ds.frequency_offset[0].length;
                          }

                          if(ds.hasOwnProperty('laser_frequency_offset')){
                            origLength = ds.laser_frequency_offset[0].length;
                          }
                          if(data[userCollId].hasOwnProperty('laser_frequency_offset')){
                            userLength = ds.laser_frequency_offset[0].length;
                          }

                          if(typeof origLength !== 'undefined' && 
                             typeof userLength !== 'undefined'){
                            // Add identifier array for data
                            //ds['origin'] = [[]];
                            //data[userCollId]['origin'] = [[]];

                            var dsK = Object.keys(ds);
                            for (var kk = 0; kk < dsK.length; kk++) {
                              if(data[userCollId].hasOwnProperty(dsK[kk])){
                                ds[dsK[kk]+'_user'] = data[userCollId][dsK[kk]];
                                ds[dsK[kk]+'_diff'] = [[]];
                                keys.push(dsK[kk]+'_user');
                                keys.push(dsK[kk]+'_diff');
                                for (var p = 0; p < ds[dsK[kk]][0].length; p++) {
                                  ds[dsK[kk]+'_diff'][0].push(
                                    ds[dsK[kk]][0][p]-data[userCollId][dsK[kk]][0][p]
                                  );
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    // Flatten structure as we do not need the different levels
                    // to render the data
                    for (var k = 0; k < keys.length; k++) {
                      for (var l = 0; l < ds[keys[k]].length; l++) {
                        if(!Array.isArray(ds[keys[k]][l])){
                          // Single value property save to be displayed as text 
                          if(resData.hasOwnProperty('singleValues')){
                            resData.singleValues[keys[k]] = ds[keys[k]][l];
                          } else {
                            var obj = {};
                            obj[keys[k]] = ds[keys[k]][l];
                            resData.singleValues = obj;
                          }
                        }else {
                          if(!Array.isArray(ds[keys[k]][l][0])){
                            if(resData.hasOwnProperty(keys[k])){
                              resData[keys[k]] = resData[keys[k]].concat(ds[keys[k]][l]);
                            } else {
                              resData[keys[k]] = ds[keys[k]][l];
                            }
                          } else {
                            console.log(keys[k]);
                            // TODO: Handle 2D AUX Data
                          }

                        }
                      }
                    }

                  }

                  var tmpdata = {};
                  tmpdata[collectionId] = resData;

                  // Check if all arrays are empty
                  var empty = true;
                  for (var k in resData){
                    if(resData[k].length !== 0){
                      empty = false;
                    }
                  }

                  if($.isEmptyObject(resData) || empty){
                    globals.swarm.set({data: {}});
                  } else {
                    globals.swarm.set({data: tmpdata});
                  }
                  // TODO: Merge data for filtermanager?
                  that.filterManager.loadData(resData);

                }
                that.xhr = null;

              } else if(request.status!== 0 && request.responseText != "") {
                  Communicator.mediator.trigger("progress:change", false);
                  globals.swarm.set({data: {}});
                  var error_text = request.responseText.match("<ows:ExceptionText>(.*)</ows:ExceptionText>");
                  if (error_text && error_text.length > 1) {
                      error_text = error_text[1];
                  } else {
                      error_text = 'Please contact feedback@vires.services if issue persists.'
                  }
                  that.xhr = null;
                  showMessage('danger', ('Problem retrieving data: ' + error_text), 35);
                  return;
                }

            } else if(request.readyState == 2) {
                if(request.status == 200) {
                    request.responseType = 'arraybuffer';
                } else {
                    request.responseType = 'text';
                }
            }
            that.xhr = null;
            //Communicator.mediator.trigger("progress:change", false);
        };

        Communicator.mediator.trigger("progress:change", true);
        this.xhr.send(body);

      },

    });
    return new DataController();
  });

}).call( this );
