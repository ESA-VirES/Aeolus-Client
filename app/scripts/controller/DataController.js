(function() {
  'use strict';

  var root = this;

  root.require([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/wps_fetchData',
    'hbs!tmpl/wps_l1b',
    'app',
    'papaparse',
    'msgpack',
    'graphly'
  ],

  function( Backbone, Communicator, globals, wps_fetchDataTmpl, wps_l1bTmpl, App, Papa) {

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
                'height': [
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
                ]
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
                  'mie_reference_pulse_quality_flag'
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
                  'rayleigh_bin_quality_flag', 'rayleigh_reference_pulse_quality_flag'
                ],
                [
                  'surface_wind_component_u_off_nadir',
                  'surface_wind_component_v_off_nadir',
                  'surface_pressure_off_nadir',
                  'surface_altitude_off_nadir'
                ],
                [
                  'surface_wind_component_u_nadir',
                  'surface_wind_component_v_nadir',
                  'surface_pressure_nadir',
                  'surface_altitude_nadir'
                ],
                [
                  'SCA_time_obs_start', 'SCA_time_obs_stop',
                  'rayleigh_altitude_obs_top','rayleigh_altitude_obs_bottom',
                  'SCA_extinction', 'SCA_backscatter','SCA_QC_flag',
                  'SCA_extinction_variance', 'SCA_backscatter_variance','SCA_LOD_variance'
                ], 
                [
                  'MCA_time_obs_start', 'MCA_time_obs_stop',
                  'mie_altitude_obs_start', 'mie_altitude_obs_stop',
                  'MCA_extinction', 'MCA_LOD'
                ],
                [
                  'mie_wind_result_wind_velocity', 'mie_wind_result_start_time',
                  'mie_wind_result_stop_time', 'mie_wind_result_bottom_altitude',
                  'mie_wind_result_top_altitude',
                  'mie_wind_result_SNR', 'mie_wind_result_HLOS_error', 'mie_wind_result_COG_altitude',
                  'mie_wind_result_COG_range', 'mie_wind_result_QC_flags_1',
                  'mie_wind_result_QC_flags_2', 'mie_wind_result_QC_flags_3'
                ],
                [
                  'rayleigh_wind_result_wind_velocity', 'rayleigh_wind_result_start_time',
                  'rayleigh_wind_result_stop_time', 'rayleigh_wind_result_bottom_altitude',
                  'rayleigh_wind_result_top_altitude',
                  'rayleigh_wind_result_HLOS_error', 'rayleigh_wind_result_COG_altitude',
                  'rayleigh_wind_result_COG_range', 'rayleigh_wind_result_QC_flags_1',
                  'rayleigh_wind_result_QC_flags_2', 'rayleigh_wind_result_QC_flags_3',
                ],
                // TODO: Add some way to ignore fata keys in analytics, for now
                // we can separete it here to be ignored by other filters
                ['singleValues']
            ],
            visibleFilters: [
                // L1B
                'mie_quality_flag_data', 'mie_HLOS_wind_speed',
                'geoid_separation','velocity_at_DEM_intersection',
                'rayleigh_quality_flag_data', 'rayleigh_HLOS_wind_speed',
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
              'mie_quality_flag_data': {
                  values: [
                      ['Bit 1', 'Overall validity. Data invalid 1, otherwise 0 '],
                      ['Bit 2', 'Set to 1 if signal-to-noise below SNR_Threshold, default 0 '],
                      ['Bit 3', 'Data saturation found 1, otherwise 0 '],
                      ['Bit 4', 'Data spike found 1, otherwise 0 '],
                      ['Bit 5', 'Reference pulse invalid 1, otherwise 0 '],
                      ['Bit 6', 'Source packet invalid 1, otherwise 0 '],
                      ['Bit 7', 'Number of corresponding valid pulses is below Meas_Cavity_Lock_Status_Thresh 1, otherwise 0 '],
                      ['Bit 8', 'Spacecraft attitude not on target 1, otherwise 0 '],
                      ['Bit 9', 'For Mie, peak not found 1, otherwise 0. For Rayleigh, rayleigh response not found 1, otherwise 0 '],
                      ['Bit 10','Set to 1 if the absolute wind velocity above Wind_Velocity_Threshold, default 0 '],
                      ['Bit 11','Set to 1 if polynomial fit of error responses was used but no valid root of the polynomial was found, otherwise 0. '],
                      ['Bit 12','Bin was detected as ground bin, otherwise 0. '],
                      ['Bit 13','Spare, set to 0'],
                      ['Bit 14','Spare, set to 0'],
                      ['Bit 15','Spare, set to 0'],
                      ['Bit 16','Spare, set to 0']
                  ]
              },
              'rayleigh_quality_flag_data': {
                  values: [
                      ['Bit 1', 'Overall validity. Data invalid 1, otherwise 0 '],
                      ['Bit 2', 'Set to 1 if signal-to-noise below SNR_Threshold, default 0 '],
                      ['Bit 3', 'Data saturation found 1, otherwise 0 '],
                      ['Bit 4', 'Data spike found 1, otherwise 0 '],
                      ['Bit 5', 'Reference pulse invalid 1, otherwise 0 '],
                      ['Bit 6', 'Source packet invalid 1, otherwise 0 '],
                      ['Bit 7', 'Number of corresponding valid pulses is below Meas_Cavity_Lock_Status_Thresh 1, otherwise 0 '],
                      ['Bit 8', 'Spacecraft attitude not on target 1, otherwise 0 '],
                      ['Bit 9', 'For Mie, peak not found 1, otherwise 0. For Rayleigh, rayleigh response not found 1, otherwise 0 '],
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
             'ZWC_result_type': {
                options: [
                    {'name': 'ZWC_Both', value:'ZWC_Both'},
                    {'name': 'ZWC_Mie', value:'ZWC_Mie'},
                    {'name': 'ZWC_Rayleigh', value:'ZWC_Rayleigh'}
                ],
                selected: 'ZWC_Both'
              }
          }
        };

        this.filterManager = new FilterManager({
            filterSettings: filterSettings,
            replaceUnderlines: true
        });

        globals.swarm.set('filterManager', this.filterManager);

        this.listenTo(Communicator.mediator, "map:layer:change",this.changeLayer);
        this.listenTo(Communicator.mediator, "map:multilayer:change",this.multiChangeLayer);
        this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChanged);
        this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
        this.listenTo(Communicator.mediator, 'manual:init', this.onManualInit);

        this.listenTo(Communicator.mediator, "analytics:set:filter", this.onAnalyticsFilterChanged);
        this.listenTo(Communicator.mediator, 'layer:parameters:changed', this.onLayerParametersChanged);
       
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

      proxyFlattenObservationArraySE: function(input, proxy, jumps){
        var start = [];
        var end = [];
        for (var i = 0; i < proxy.length-1; i++) {
          if(jumps.indexOf(i)!==-1 || jumps.indexOf(i+1)!==-1){
            continue;
          }
          for (var j = 0; j < proxy[i].length-1; j++) {
            if (j===proxy[i].length-1){
              /*start.push(input[i]);
              end.push(input[i+1]);*/
            }else{
              start.push(input[i]);
              end.push(input[i+1]);
            }
          }
        }
        return [start, end];
      },

      flattenObservationArraySE: function(input, jumps){
        var start = [];
        var end = [];
        for (var i = 0; i < input.length-1; i++) {
          if(jumps.indexOf(i)!==-1 || jumps.indexOf(i+1)!==-1){
            continue;
          }
          for (var j = 0; j < input[i].length-1; j++) {
            if(j===input[i].length-1){
              /*start.push(input[i][j]);
              end.push(input[i+1][0]);*/
            }else{
              start.push(input[i][j]);
              end.push(input[i][j+1]);
            }
          }
        }
        return [start, end];
      },

      findObservationJumps: function(input, jumps){
        var resultJumps = [];
        var counter = 0;
        for (var i = 0; i < input.length-1; i++) {

          //start and end of jump
          if(jumps.indexOf(i)!==-1 && jumps[jumps.length-1]!==counter){
            resultJumps.push(counter-input[i].length-1);
            resultJumps.push(counter);
          }else{
            counter += input[i].length-1;
          }
          
        }
        return resultJumps;
      },

      flattenObservationArray: function(input, jumps){
        var output = [];
        for (var i = 0; i < input.length-1; i++) {
          if(jumps.indexOf(i)!==-1 || jumps.indexOf(i+1)!==-1){
            continue;
          }
          for (var j = 0; j < input[i].length; j++) {
            output.push(input[i][j]);
          }
        }
        return output;
      },

      proxyFlattenMeasurementArraySE: function(input, proxy){
        var start = [];
        var end = [];
        for (var i = 0; i < proxy.length-1; i++) {
          for (var j = 0; j < proxy[i].length; j++) {
            for (var k = 0; k < proxy[i][j].length-1; k++) {
              if (j===proxy[i].length-1){
                start.push(input[i][j]);
                end.push(input[i+1][0]);
              }else{
                start.push(input[i][j]);
                end.push(input[i][j+1]);
              }
              
            }
          }
        }
        return [start, end];
      },

      flattenMeasurementArraySE: function(input){
        var start = [];
        var end = [];
        for (var i = 0; i < input.length-1; i++) {
          for (var j = 0; j < input[i].length; j++) {
            for (var k = 0; k < input[i][j].length-1; k++) {
              if(j===input[i].length-1){
                start.push(input[i][j][k]);
                end.push(input[i+1][0][k+1]);
              }else{
                start.push(input[i][j][k]);
                end.push(input[i][j][k+1]);
              }
              
            }
          }
        }
        return [start, end];
      },

      flattenMeasurementArray: function(input){
        var output = [];
        for (var i = 0; i < input.length; i++) {
          for (var j = 0; j < input[i].length; j++) {
            for (var k = 0; k < input[i][j].length; k++) {
              output.push(input[i][j][k]);
            }
          }
        }

        return output;
      },

      sendRequest: function(prodId){
       
        var process = {
          collectionId: prodId,
          id: this.activeWPSproducts[prodId]
        }

        var product = globals.products.find(
            function(p){return p.get('download').id === process.collectionId;}
        );

        var urlBase = product.get('download').url;

        var collectionId = product.get('download').id;
        var parameters = '';
        var fieldsList = {
          'ALD_U_N_1B': [
              'time','latitude_of_DEM_intersection','longitude_of_DEM_intersection',
              'mie_altitude', 'rayleigh_altitude',
              'mie_range', 'rayleigh_range', 'velocity_at_DEM_intersection',
              'AOCS_pitch_angle', 'AOCS_roll_angle', 'AOCS_yaw_angle',
              'mie_HLOS_wind_speed', 'rayleigh_HLOS_wind_speed',
              'mie_signal_intensity', 'rayleigh_signal_channel_A_intensity',
              'rayleigh_signal_channel_B_intensity', /*'rayleigh_signal_intensity',*/
              'mie_ground_velocity', 'rayleigh_ground_velocity', 'mie_scattering_ratio',
              'mie_bin_quality_flag', 'mie_HBE_ground_velocity', 'rayleigh_HBE_ground_velocity',
              'mie_total_ZWC', 'rayleigh_total_ZWC',
              'mie_SNR',
              'rayleigh_channel_A_SNR', 'rayleigh_channel_B_SNR', /*'rayleigh_SNR',*/
              'mie_error_quantifier', 
              'rayleigh_bin_quality_flag', 'rayleigh_error_quantifier',
              'average_laser_energy', 'laser_frequency', 
              'rayleigh_bin_quality_flag','mie_bin_quality_flag',
              'rayleigh_reference_pulse_quality_flag','mie_reference_pulse_quality_flag'
          ].join(),
          'ALD_U_N_2A': {
            'observation_fields': [
              'mie_altitude_obs','rayleigh_altitude_obs',
              'longitude_of_DEM_intersection_obs', 'latitude_of_DEM_intersection_obs',
              'altitude_of_DEM_intersection_obs', 
              'SCA_extinction', 'SCA_time_obs','SCA_backscatter','SCA_LOD', 
              'SCA_extinction_variance', 'SCA_backscatter_variance','SCA_LOD_variance', 
              'MCA_extinction', 'MCA_time_obs', 'MCA_LOD',
              'SCA_QC_flag'
            ].join()
          },
          'ALD_U_N_2B': {
              'mie_profile_fields': [
                'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                'mie_profile_datetime_start', 'mie_profile_datetime_stop'
              ].join(),
              'mie_wind_fields': [
                'mie_wind_result_wind_velocity', 'mie_wind_result_start_time',
                'mie_wind_result_stop_time', 'mie_wind_result_bottom_altitude',
                'mie_wind_result_top_altitude',
                'mie_wind_result_SNR', 'mie_wind_result_HLOS_error', 'mie_wind_result_COG_altitude',
                'mie_wind_result_COG_range', 'mie_wind_result_QC_flags_1',
                'mie_wind_result_QC_flags_2', 'mie_wind_result_QC_flags_3',
              ].join(),
              'rayleigh_profile_fields': [
                'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'
              ].join(),
              'rayleigh_wind_fields': [
                'rayleigh_wind_result_wind_velocity', 'rayleigh_wind_result_start_time',
                'rayleigh_wind_result_stop_time', 'rayleigh_wind_result_bottom_altitude',
                'rayleigh_wind_result_top_altitude',
                'rayleigh_wind_result_HLOS_error', 'rayleigh_wind_result_COG_altitude',
                'rayleigh_wind_result_COG_range', 'rayleigh_wind_result_QC_flags_1',
                'rayleigh_wind_result_QC_flags_2', 'rayleigh_wind_result_QC_flags_3',
              ].join(),
          },
          'ALD_U_N_2C': {
               'mie_profile_fields': [
                'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                'mie_profile_datetime_start', 'mie_profile_datetime_stop'
              ].join(),
              'mie_wind_fields': [
                'mie_wind_result_wind_velocity', 'mie_wind_result_start_time',
                'mie_wind_result_stop_time', 'mie_wind_result_bottom_altitude',
                'mie_wind_result_top_altitude',
                'mie_wind_result_SNR', 'mie_wind_result_HLOS_error', 'mie_wind_result_COG_altitude',
                'mie_wind_result_COG_range', 'mie_wind_result_QC_flags_1',
                'mie_wind_result_QC_flags_2', 'mie_wind_result_QC_flags_3',
              ].join(),
              'rayleigh_profile_fields': [
                'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'
              ].join(),
              'rayleigh_wind_fields': [
                'rayleigh_wind_result_wind_velocity', 'rayleigh_wind_result_start_time',
                'rayleigh_wind_result_stop_time', 'rayleigh_wind_result_bottom_altitude',
                'rayleigh_wind_result_top_altitude',
                'rayleigh_wind_result_HLOS_error', 'rayleigh_wind_result_COG_altitude',
                'rayleigh_wind_result_COG_range', 'rayleigh_wind_result_QC_flags_1',
                'rayleigh_wind_result_QC_flags_2', 'rayleigh_wind_result_QC_flags_3',
              ].join(),
           },
          'AUX_MRC_1B': [
            'lat_of_DEM_intersection',
            'lon_of_DEM_intersection',
            'time_freq_step',
            'altitude',
            'satellite_range',
            'frequency_offset',
            'frequency_valid',
            'measurement_response',
            'measurement_response_valid',
            'measurement_error_mie_response',
            'reference_pulse_response',
            'reference_pulse_response_valid',
            'reference_pulse_error_mie_response',
            'normalised_useful_signal',
            'mie_scattering_ratio',
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
            'altitude',
            'satellite_range',
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
            'normalised_useful_signal',
            'num_measurements_usable',
            'num_valid_measurements',
            'num_reference_pulses_usable',
            'num_measurements_valid_ground',
            'measurement_mean_sensitivity',
            'measurement_zero_frequency',
            'measurement_error_rayleigh_response_std_dev',
            'measurement_offset_frequency',
            //'measurement_error_fit_coefficient',  // Out of bounds error
            'reference_pulse_mean_sensitivity',
            'reference_pulse_zero_frequency',
            'reference_pulse_error_rayleigh_response_std_dev',
            'reference_pulse_offset_frequency',
            //'reference_pulse_error_fit_coefficient', // Out of bounds error
            'ground_measurement_mean_sensitivity',
            'ground_measurement_zero_frequency',
            'ground_measurement_error_rayleigh_response_std_dev',
            'ground_measurement_offset_frequency',
            //'ground_measurement_error_fit_coefficient', // Out of bounds error
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
            'rayleigh_channel_A_response', 'rayleigh_channel_B_response',
            'laser_frequency_offset',
            'fizeau_transmission','mie_response','mean_laser_energy_mie',
            'mean_laser_energy_rayleigh','FWHM_mie_core_2'
          ].join(),
          'AUX_ZWC_1B': [
            'lat_of_DEM_intersection', 'lon_of_DEM_intersection',
            'mie_ground_correction_velocity',
            'rayleigh_ground_correction_velocity',
            'roll_angle', 'pitch_angle','yaw_angle','num_of_mie_ground_bins',
            'rayleigh_avg_ground_echo_bin_thickness',
            'mie_avg_ground_echo_bin_thickness_above_DEM', 'rayleigh_avg_ground_echo_bin_thickness_above_DEM',
            'rayleigh_channel_A_ground_SNR_meas', 'mie_DEM_ground_bin',
            'ZWC_result_type'
            // issue 'min_avg_ground_echo_thickness', 'mie_channel_A_ground_SNR_meas'
            // 2D 'mie_range', 'rayleigh_range',
          ].join(),
          'AUX_MET_12': [
            'time_off_nadir', 'time_nadir',
            'surface_wind_component_u_off_nadir',
            'surface_wind_component_u_nadir',
            'surface_wind_component_v_off_nadir',
            'surface_wind_component_v_nadir',
            'surface_pressure_off_nadir','surface_pressure_nadir',
            'surface_altitude_off_nadir', 'surface_altitude_nadir'
            // TODO: 2D data is very big, how can we handle it?
          ].join()

        }

        var options = {
          processId: process.id,
          collection_ids: JSON.stringify([collectionId]),
          begin_time: getISODateTimeString(this.selected_time.start),
          end_time: getISODateTimeString(this.selected_time.end),
        };

        if(this.selection_list.length > 0){
          var bb = this.selection_list[0];
          options["bbox"] = true;
          options["bbox_lower"] = bb.w + " " + bb.s;
          options["bbox_upper"] = bb.e + " " + bb.n;
        }

        if(collectionId === 'ALD_U_N_1B'){
          options["observation_fields"] = fieldsList[collectionId];
        } else if(collectionId === 'ALD_U_N_2A'){
          options = Object.assign(options, fieldsList[collectionId]);
        } else if(collectionId === 'ALD_U_N_2C' || collectionId === 'ALD_U_N_2B'){
          options = Object.assign(options, fieldsList[collectionId]);
          options["filters"] = JSON.stringify({
            mie_wind_result_validity_flag: {
              min: 1,
              max: 1
            }, 
            rayleigh_wind_result_validity_flag: {
              min: 1,
              max: 1
            }
          });
        } else {
          var auxType = collectionId.slice(4, -3);
          options["fields"] = fieldsList[collectionId];
          options['aux_type'] = auxType;

        }

        options.mimeType = 'application/msgpack';

        var body = wps_l1bTmpl(options);

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
                Communicator.mediator.trigger("progress:change", false);
                var tmp = new Uint8Array(this.response);
                var data = msgpack.decode(tmp);

                var ds = data[collectionId];

                /*if($.isEmptyObject(ds)){
                  globals.swarm.set({data: {}});
                  return;
                }*/
                var empty = true;
                for (var k in ds){
                  if(!$.isEmptyObject(ds[k])){
                    empty = false;
                  }
                }
                if (empty){
                  globals.swarm.set({data: {}});
                  return;
                }

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
                  ds = ds[0];

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
                  for (var i = 2; i < positions.length; i++) {
                    if (i%2===0 && Math.abs(positions[i]-positions[i-2])>=Math.abs(lonStep)+2.5) {
                      stepPositions.push(parseInt(i/2));
                    }else if (i%2===1 && Math.abs(positions[i]-positions[i-2])>=Math.abs(latStep)+2.5) {
                      if(stepPositions.length>0 && stepPositions[stepPositions.length-1]!=parseInt((i-1)/2)){
                        stepPositions.push(parseInt((i+1)/2));
                      }else if(stepPositions.length === 0){
                        stepPositions.push(parseInt(i/2));
                      }
                    }
                  }

                  var mie_jumps = that.findObservationJumps(ds.mie_altitude, stepPositions);

                  var mieVars = [
                    'time','latitude_of_DEM_intersection','longitude_of_DEM_intersection',
                    'mie_altitude', 'mie_range', 'velocity_at_DEM_intersection',
                    'AOCS_pitch_angle', 'AOCS_roll_angle', 'AOCS_yaw_angle',
                    'mie_HLOS_wind_speed', 'mie_signal_intensity',
                    'mie_ground_velocity',
                    'mie_bin_quality_flag', 'mie_HBE_ground_velocity', 
                    'mie_total_ZWC', 
                    'mie_scattering_ratio', 'mie_SNR', 'mie_error_quantifier', 
                    'average_laser_energy', 'laser_frequency', 
                    'mie_bin_quality_flag',
                    'mie_reference_pulse_quality_flag'
                  ];

                  var rayleighVars = [
                    'time','latitude_of_DEM_intersection','longitude_of_DEM_intersection',
                    'rayleigh_altitude', 'rayleigh_range', 'velocity_at_DEM_intersection',
                    'AOCS_pitch_angle', 'AOCS_roll_angle', 'AOCS_yaw_angle',
                    'rayleigh_HLOS_wind_speed', 'rayleigh_signal_channel_A_intensity',
                    'rayleigh_signal_channel_B_intensity', /*'rayleigh_signal_intensity',*/
                    'rayleigh_ground_velocity', 'rayleigh_HBE_ground_velocity',
                    'rayleigh_total_ZWC',
                    'rayleigh_channel_A_SNR', 'rayleigh_channel_B_SNR', /*'rayleigh_SNR',*/
                    'rayleigh_bin_quality_flag', 'rayleigh_error_quantifier',
                    'average_laser_energy', 'laser_frequency', 
                    'rayleigh_bin_quality_flag', 'rayleigh_reference_pulse_quality_flag'
                  ];

                  var startEndVars = [
                    'time','latitude_of_DEM_intersection','longitude_of_DEM_intersection',
                    'rayleigh_altitude', 'mie_altitude'
                  ];

                  // Mie 
                  /*var mieNSize = 0;
                  for (var i = 0; i < mieVars.length; i++) {
                    if(Array.isArray(ds[mieVars[i]][0])){
                      var arrLen = ds[mieVars[i]][0].length-1;
                      if(mieNSize < arrLen){
                        mieNSize = arrLen;
                      }
                    }
                  }*/
                  // Three data structures possible:
                  // 1: 1D flat array (each "profile")
                  // 2: Array of n-sized arrays (2D) containing "bin" values
                  // 3: Array of (n+1)-sized arrays (2D) containing "start/end" bin values
                  var nSize = 24;

                  var tmpdata = {};
                  var pseudoKey = null;

                  for (var i = 0; i < mieVars.length; i++) {
                    if(mieVars[i].indexOf('mie')!==-1){
                      pseudoKey = mieVars[i];
                    } else {
                      pseudoKey = 'mie_'+mieVars[i];
                    }
                    if(Array.isArray(ds[mieVars[i]][0])){
                      var arrLen = ds[mieVars[i]][0].length;
                      if(arrLen > nSize){ // case 3
                        var tuple = that.flattenObservationArraySE(
                          ds[mieVars[i]], stepPositions
                        );

                        if(startEndVars.indexOf(mieVars[i]) !== -1){
                          tmpdata[(pseudoKey+'_start')] = tuple[1];
                          tmpdata[(pseudoKey+'_end')] = tuple[0];
                        }  else {
                          tmpdata[pseudoKey] = tuple[0];
                        }

                      } else if (arrLen === nSize){ //case 2
                        tmpdata[pseudoKey] = that.flattenObservationArray(
                          ds[mieVars[i]], stepPositions
                        );
                      }
                    } else { // case 1
                      var tuple = that.proxyFlattenObservationArraySE(
                        ds[mieVars[i]], ds.mie_altitude, stepPositions
                      );
                      if(startEndVars.indexOf(mieVars[i]) !== -1){
                        tmpdata[(pseudoKey+'_start')] = tuple[0];
                        tmpdata[(pseudoKey+'_end')] = tuple[1];
                      }  else {
                        tmpdata[pseudoKey] = tuple[0];
                      }
                      
                    }
                  }

                  tmpdata.stepPositions = stepPositions;
                  tmpdata.mie_jumps = mie_jumps;

                  // Rayleigh

                  var rayleigh_jumps = that.findObservationJumps(
                    ds.rayleigh_altitude, stepPositions
                  );


                  for (var i = 0; i < rayleighVars.length; i++) {
                    if(rayleighVars[i].indexOf('rayleigh')!==-1){
                      pseudoKey = rayleighVars[i];
                    } else {
                      pseudoKey = 'rayleigh_'+rayleighVars[i];
                    }
                    if(Array.isArray(ds[rayleighVars[i]][0])){
                      var arrLen = ds[rayleighVars[i]][0].length;
                      if(arrLen > nSize){ // case 3
                        var tuple = that.flattenObservationArraySE(
                          ds[rayleighVars[i]], stepPositions
                        );
                        if(startEndVars.indexOf(rayleighVars[i]) !== -1){
                          tmpdata[(pseudoKey+'_start')] = tuple[1];
                          tmpdata[(pseudoKey+'_end')] = tuple[0];
                        }  else {
                          tmpdata[pseudoKey] = tuple[0];
                        }

                      } else if (arrLen === nSize){ //case 2
                        tmpdata[pseudoKey] = that.flattenObservationArray(
                          ds[rayleighVars[i]], stepPositions
                        );
                      }
                    } else { // case 1
                      var tuple = that.proxyFlattenObservationArraySE(
                        ds[rayleighVars[i]], ds.rayleigh_altitude, stepPositions
                      );
                      if(startEndVars.indexOf(rayleighVars[i]) !== -1){
                        tmpdata[(pseudoKey+'_start')] = tuple[0];
                        tmpdata[(pseudoKey+'_end')] = tuple[1];
                      }  else {
                        tmpdata[pseudoKey] = tuple[0];
                      }
                    }
                  }

                  tmpdata.rayleigh_jumps = rayleigh_jumps;

                  tmpdata.positions = positions;

                  // TODO: Getting the object and setting one parameter does not trigger
                  // change event, need to think about using multiple objects for different
                  // ids instead of one object with multiple parameters 
                  
                  var resData = {};
                  resData[collectionId] = tmpdata;

                  // TODO: Merge data for filtermanager?
                  that.filterManager.loadData(resData);
                  that.filterManager._initData();


                  globals.swarm.set({data: resData});


                } else {
                  var resData = {};
                  var keys = Object.keys(ds);

                  // ZWC data is structured differently to the other 3 AUX types
                  if(collectionId === 'AUX_ZWC_1B'){
                    resData = ds;
                    // We create some additional data for ZWC data
                    var obsIndex = [];
                    for (var j = 1; j <= resData[keys[0]].length; j++) {
                      obsIndex.push(j);
                    }
                    resData['observation_index'] = obsIndex;

                  } else if(collectionId === 'AUX_MET_12'){
                    resData = ds;

                  } else if(collectionId === 'ALD_U_N_2A'){

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
                    for (var i = 1; i < resData.latitude_of_DEM_intersection_obs_orig.length; i++) {
                      if (Math.abs(
                          resData.latitude_of_DEM_intersection_obs_orig[i-1]-
                          resData.latitude_of_DEM_intersection_obs_orig[i]) >= Math.abs(latStep)) {
                        jumpPos.push(i);
                      }else if (Math.abs(
                          resData.longitude_of_DEM_intersection_obs_orig[i-1]-
                          resData.longitude_of_DEM_intersection_obs_orig[i]) >= Math.abs(latStep)) {
                        jumpPos.push(i);
                      }
                    }
                    resData['jumps'] = jumpPos;

                  } else if(collectionId === 'ALD_U_N_2C' || collectionId === 'ALD_U_N_2B'){

                    for (var k = 0; k < keys.length; k++) {
                      var subK = Object.keys(ds[keys[k]]);
                      for (var l = 0; l < subK.length; l++) {
                        
                        if(subK[l] === 'mie_wind_result_wind_velocity' ||
                           subK[l] === 'rayleigh_wind_result_wind_velocity' ||
                           subK[l] === 'mie_wind_result_COG_range' ||
                           subK[l] === 'rayleigh_wind_result_COG_range'){
                          // Convert from cm/s to m/s
                          resData[subK[l]]= ds[keys[k]][subK[l]].map(function(x) { return x / 100; });
                        } else {
                          resData[subK[l]] = ds[keys[k]][subK[l]];
                        }
                      }
                    }
                    var lonStep = 15;
                    var latStep = 15;

                    var mieJumpPositions = [];
                    for (var i = 1; i < ds.mie_profile_data.mie_profile_lat_of_DEM_intersection.length; i++) {
                      if (Math.abs(
                          ds.mie_profile_data.mie_profile_lat_of_DEM_intersection[i-1]-
                          ds.mie_profile_data.mie_profile_lat_of_DEM_intersection[i]) >= Math.abs(latStep)) {
                        mieJumpPositions.push(i);
                      }else if (Math.abs(
                          ds.mie_profile_data.mie_profile_lon_of_DEM_intersection[i-1]-
                          ds.mie_profile_data.mie_profile_lon_of_DEM_intersection[i]) >= Math.abs(lonStep)) {
                        mieJumpPositions.push(i);
                      }
                    }
                    resData['mie_jumps'] = mieJumpPositions;

                    var rayleighJumpPositions = [];
                    for (var i = 1; i < ds.rayleigh_profile_data.rayleigh_profile_lat_of_DEM_intersection.length; i++) {
                      if (Math.abs(
                          ds.rayleigh_profile_data.rayleigh_profile_lat_of_DEM_intersection[i-1]-
                          ds.rayleigh_profile_data.rayleigh_profile_lat_of_DEM_intersection[i]) >= Math.abs(latStep)) {
                        rayleighJumpPositions.push(i);
                      }else if (Math.abs(
                          ds.rayleigh_profile_data.rayleigh_profile_lon_of_DEM_intersection[i-1]-
                          ds.rayleigh_profile_data.rayleigh_profile_lon_of_DEM_intersection[i]) >= Math.abs(lonStep)) {
                        rayleighJumpPositions.push(i);
                      }
                    }
                    resData['rayleigh_jumps'] = rayleighJumpPositions;

                  } else {
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
                            // TODO: Handle 2D AUX Data
                          }

                        }
                      }
                    }

                  }

                  var tmpdata = {};
                  tmpdata[collectionId] = resData;

                  //resData[collectionId] = ds;
                  globals.swarm.set({data: tmpdata});
                  // TODO: Merge data for filtermanager?
                  that.filterManager.loadData(tmpdata[collectionId]);

                }
                that.xhr = null;

              } else if(request.status!== 0 && request.responseText != "") {
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
