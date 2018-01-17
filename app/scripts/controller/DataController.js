(function() {
  'use strict';

  var root = this;

  root.require([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/wps_fetchData',
    'app',
    'papaparse',
    'msgpack',
    'graphly'
  ],

  function( Backbone, Communicator, globals, wps_fetchDataTmpl, App, Papa) {

    var DataController = Backbone.Marionette.Controller.extend({

      initialize: function(options){

        this.selection_list = [];
        this.activeWPSproducts = [];
        this.activeModels = [];
        this.selected_time = null;

        this.dataSettings = {

          // L1b

          time: {
              scaleFormat: 'time',
              timeFormat: 'MJD2000_S'
          },

          rayleigh_HLOS_wind_speed: {
              uom: 'm/s',
              colorscale: 'viridis',
              extent: [-40,40]
              //outline: false
          },
          rayleigh_time_start: {
              scaleFormat: 'time',
              timeFormat: 'MJD2000_S'
          },

          rayleigh_time_end: {
              scaleFormat: 'time',
              timeFormat: 'MJD2000_S'
          },
          rayleigh_altitude:{
              name: 'altitude',
              uom: 'm'
          },



          mie_time_start: {
              scaleFormat: 'time',
              timeFormat: 'MJD2000_S'
          },
          mie_time_end: {
              scaleFormat: 'time',
              timeFormat: 'MJD2000_S'
          },


          mie_HLOS_wind_speed: {
              uom: 'm/s',
              colorscale: 'viridis',
              extent: [-20,20]
              //outline: false
          },

          mie_altitude:{
              name: 'altitude',
              uom: 'm'
          },


          // AUX MRC
          Frequency_Valid: {
              extent: [0, 1],
              uom: 'bool',
              colorscale: 'redblue',
              name: 'Frequency Valid'
          },
          Reference_Pulse_Response_Valid: {
              range: [0, 1],
              uom: 'bool',
              colorscale: 'redblue',
              name: 'Reference Pulse Response Valid'
          },
          Measurement_Response_Valid: {
              range: [0, 1],
              uom: 'bool',
              colorscale: 'redblue',
              name: 'Measurement Response Valid'
          },

          // AUx RRC
          Frequency_Valid: {
              extent: [0, 1],
              uom: 'boolean',
              colorscale: 'redblue',
              name: 'Frequency Valid'
          },
          Ground_Frequency_Valid: {
              extent: [0, 1],
              uom: 'bool',
              colorscale: 'redblue',
              name: 'Ground Frequency Valid'
          },
          Measurement_Response_Valid: {
              extent: [0, 1],
              uom: 'bool',
              colorscale: 'redblue',
              name: 'Measurement Response Valid'
          },
          Reference_Pulse_Response_Valid: {
              extent: [0, 1],
              uom: 'bool',
              colorscale: 'redblue',
              name: 'Reference Pulse Response Valid'
          },
          Ground_Measurement_Response_Valid: {
              extent: [0, 1],
              uom: 'bool',
              colorscale: 'redblue',
              name: 'Ground Measurement Response Valid'
          },

          // AUX IRC

          

          // AUX ZWC
          Mie_Ground_Correction_Velocity: {
              selected: true,
              range: [0, 1],
              uom: 'm/s',
              colorscale: 'redblue',
              name: 'Mie Ground Correction Velocity'
          },
          Rayleigh_Ground_Correction_Velocity: {
              selected: true,
              range: [0, 1],
              uom: 'm/s',
              colorscale: 'redblue',
              name: 'Rayleigh Ground Correction Velocity'
          }
      };


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
                    'mie_quality_flag_data', 'mie_HLOS_wind_speed',
                    'mie_altitude_start', 'mie_altitude_end',
                    'mie_time_start', 'mie_time_end', 'mie_latitude_of_DEM_intersection_start',
                    'mie_latitude_of_DEM_intersection_end',
                    'mie_geoid_separation','mie_velocity_at_DEM_intersection'
                ],
                [
                    'rayleigh_quality_flag_data', 'rayleigh_HLOS_wind_speed',
                    'rayleigh_altitude_start', 'rayleigh_altitude_end',
                    'rayleigh_time_start', 'rayleigh_time_end', 'rayleigh_latitude_of_DEM_intersection_start',
                    'rayleigh_latitude_of_DEM_intersection_end',
                    'rayleigh_geoid_separation','rayleigh_velocity_at_DEM_intersection'
                ]
            ],
            visibleFilters: [
                'mie_quality_flag_data', 'mie_HLOS_wind_speed',
                'geoid_separation','velocity_at_DEM_intersection',
                'rayleigh_quality_flag_data', 'rayleigh_HLOS_wind_speed'
            ],
            //boolParameter: [],
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
              }
          },
            //choiceParameter: {}
        };

        this.filterManager = new FilterManager({
            filterSettings: filterSettings
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
          this.activeWPSproducts = [];
          var product = globals.products.find(function(model) { return model.get('name') == options.name; });
          if (product){
            if(options.visible){
              if (product.get("model")){
                this.activeModels.push(product.get("download").id);
                this.updateLayerResidualParameters();
                
              }

              if (product.get('process')){
                //this.activeWPSproducts.push(product.get('process'));
                this.activeWPSproducts.push({
                  collectionId: product.get('download').id,
                  id: product.get('process')
                });
              }


            }else{
              if (this.activeModels.indexOf(product.get("download").id)!=-1){
                this.activeModels.splice(this.activeModels.indexOf(product.get("download").id), 1);
                this.updateLayerResidualParameters();
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

        //this.filterManager.dataSettings[band].colorscale = style;
        this.filterManager.dataSettings[band].extent = range;

        //this.filterManager.updateDataSettings(this.filterManager.dataSettings);
        //this.filterManager.updateDataSettings(this.filterManager.dataSettings);
        this.filterManager._initData();
        this.filterManager._renderFilters();

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
        globals.swarm.set({filters: filters});
      },

      checkSelections: function(){
        if (this.selected_time == null)
          this.selected_time = Communicator.reqres.request('get:time');

        if (this.activeWPSproducts.length > 0 && this.selected_time){
          for (var i = 0; i < this.activeWPSproducts.length; i++) {
            this.sendRequest(this.activeWPSproducts[i]);
          }
          //this.sendRequest(id);
        }else{
          globals.swarm.set({data:[]});
          //Communicator.mediator.trigger("map:clear:image");
          //$(".colorlegend").empty();
        }
      },

      onTimeChange: function (time) {
        this.selected_time = time;
        this.checkSelections();
        this.checkModelValidity();
      },

      proxyFlattenObservationArraySE: function(input, proxy, jumps){
        var start = [];
        var end = [];
        for (var i = 0; i < proxy.length-1; i++) {
          if(jumps.indexOf(i)!==-1){
            continue;
          }
          for (var j = 0; j < proxy[i].length-1; j++) {
            if (j===proxy[i].length-1){
              start.push(input[i]);
              end.push(input[i+1]);
              /*if(Math.abs(input[i]-input[i+1])>15){
                var a=1;
              }*/
            }else{
              start.push(input[i]);
              end.push(input[i+1]);
              /*if(Math.abs(input[i]-input[i+1])>15){
                var a=1;
              }*/
            }
          }
        }
        return [start, end];
      },

      flattenObservationArraySE: function(input, jumps){
        var start = [];
        var end = [];
        for (var i = 0; i < input.length-1; i++) {
          if(jumps.indexOf(i)!==-1){
            continue;
          }
          for (var j = 0; j < input[i].length-1; j++) {
            if(j===input[i].length-1){
              start.push(input[i][j]);
              end.push(input[i+1][0]);
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
            resultJumps.push(counter);
            resultJumps.push(counter+input[i].length-1);
          }else{
            counter += input[i].length-1;
          }
          
        }
        return resultJumps;
      },

      flattenObservationArray: function(input, jumps){
        var output = [];
        for (var i = 0; i < input.length-1; i++) {
          if(jumps.indexOf(i)!==-1){
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

      sendRequest: function(process){
        var xhr = new XMLHttpRequest();

        var product = globals.products.find(
            function(p){return p.get('download').id === process.collectionId;}
        );

        var urlBase = product.get('download').url;

        var url = urlBase + '?service=wps&request=execute&identifier='+process.id+
        '&DataInputs=collection_ids=["AEOLUS"];'+
        'begin_time='+getISODateTimeString(this.selected_time.start)+
        ';end_time='+getISODateTimeString(this.selected_time.end)+
        ';observation_fields=time,latitude_of_DEM_intersection,longitude_of_DEM_intersection'+
        ',mie_HLOS_wind_speed,mie_altitude,mie_bin_quality_flag,mie_signal_intensity,mie_ground_velocity'+
        ',rayleigh_HLOS_wind_speed,rayleigh_altitude,rayleigh_bin_quality_flag,rayleigh_signal_channel_A_intensity,rayleigh_signal_channel_B_intensity,rayleigh_ground_velocity'+
        ',geoid_separation,velocity_at_DEM_intersection'+
        //';measurement_fields=time,mie_HLOS_wind_speed,latitude_of_DEM_intersection,mie_altitude,mie_bin_quality_flag'+//'bbox=0,1,2,3,urn:ogc:def:crs:EPSG::3857'+
        //';measurement_fields=time'+//'bbox=0,1,2,3,urn:ogc:def:crs:EPSG::3857'+
        '&RawDataOutput=output';




        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        var that = this;
        var collectionId = process.collectionId;

        xhr.onload = function(e) {
            var tmp = new Uint8Array(this.response);
            var data = msgpack.decode(tmp);

            var ds = data.AEOLUS[0];

            if($.isEmptyObject(ds)){
              globals.swarm.set({data: {}});
              return;
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
                  stepPositions.push(parseInt((i-1)/2));
                }
              }
            }


            var mie_jumps = that.findObservationJumps(ds.mie_altitude, stepPositions);

            // MIE
            var mie_time = that.proxyFlattenObservationArraySE(ds.time, ds.mie_altitude, stepPositions);
            var mie_HLOS_wind_speed = that.flattenObservationArray(ds.mie_HLOS_wind_speed, stepPositions);
            //var mie_latitude = that.flattenMeasurementArraySE(data.AEOLUS[1].mie_latitude);
            var mie_latitude_of_DEM_intersection = that.proxyFlattenObservationArraySE(
              ds.latitude_of_DEM_intersection,
              ds.mie_altitude,
              stepPositions
            );
            

            var mie_altitude = that.flattenObservationArraySE(ds.mie_altitude, stepPositions);
            var mie_bin_quality_flag = that.flattenObservationArray(ds.mie_bin_quality_flag, stepPositions);

            var mie_geoid_separation = that.proxyFlattenObservationArraySE(
              ds.geoid_separation,
              ds.mie_altitude,
              stepPositions
            );
            var mie_velocity_at_DEM_intersection = that.proxyFlattenObservationArraySE(
              ds.velocity_at_DEM_intersection,
              ds.mie_altitude,
              stepPositions
            );



            // RAYLEIGH
            var ray_time = that.proxyFlattenObservationArraySE(ds.time, ds.rayleigh_altitude, stepPositions);
            var ray_HLOS_wind_speed = that.flattenObservationArray(ds.rayleigh_HLOS_wind_speed, stepPositions);
            //var mie_latitude = that.flattenMeasurementArraySE(data.AEOLUS[1].mie_latitude);
            var ray_latitude_of_DEM_intersection = that.proxyFlattenObservationArraySE(
              ds.latitude_of_DEM_intersection,
              ds.rayleigh_altitude,
              stepPositions
            );
            var ray_altitude = that.flattenObservationArraySE(ds.rayleigh_altitude, stepPositions);
            var ray_bin_quality_flag = that.flattenObservationArray(ds.rayleigh_bin_quality_flag, stepPositions);

            var ray_geoid_separation = that.proxyFlattenObservationArraySE(
              ds.geoid_separation,
              ds.rayleigh_altitude,
              stepPositions
            );
            var ray_velocity_at_DEM_intersection = that.proxyFlattenObservationArraySE(
              ds.velocity_at_DEM_intersection,
              ds.rayleigh_altitude,
              stepPositions
            );

            var ray_jumps = that.findObservationJumps(ds.rayleigh_altitude, stepPositions);


            var tmpdata = {
              mie_time_start: mie_time[0],
              mie_time_end: mie_time[1],
              mie_latitude_of_DEM_intersection_start: mie_latitude_of_DEM_intersection[1],
              mie_latitude_of_DEM_intersection_end: mie_latitude_of_DEM_intersection[0],
              mie_HLOS_wind_speed: mie_HLOS_wind_speed,
              mie_quality_flag_data: mie_bin_quality_flag,
              mie_altitude_start: mie_altitude[1],
              mie_altitude_end: mie_altitude[0],
              mie_geoid_separation:mie_geoid_separation[0],
              mie_velocity_at_DEM_intersection: mie_velocity_at_DEM_intersection[0],
              positions: positions,
              stepPositions: stepPositions,
              mie_jumps: mie_jumps,

              /*geoid_separation: geoid_separation[0],
              velocity_at_DEM_intersection: velocity_at_DEM_intersection[0]*/
              rayleigh_time_start: ray_time[0],
              rayleigh_time_end: ray_time[1],
              rayleigh_latitude_of_DEM_intersection_start: ray_latitude_of_DEM_intersection[1],
              rayleigh_latitude_of_DEM_intersection_end: ray_latitude_of_DEM_intersection[0],
              rayleigh_HLOS_wind_speed: ray_HLOS_wind_speed,
              rayleigh_quality_flag_data: ray_bin_quality_flag,
              rayleigh_altitude_start: ray_altitude[1],
              rayleigh_altitude_end: ray_altitude[0],
              rayleigh_geoid_separation: ray_geoid_separation[0],
              rayleigh_velocity_at_DEM_intersection: ray_velocity_at_DEM_intersection[0],
              rayleigh_jumps: ray_jumps
            };

            // TODO: Getting the object and setting one parameter does not trigger
            // change event, need to think about using multiple objects for different
            // ids instead of one object with multiple parameters 
            var resData = {};//globals.swarm.get('data');
            resData[collectionId] = tmpdata;

            globals.swarm.set({data: resData});

            // TODO: Merge data for filtermanager?
            that.filterManager.loadData(tmpdata);
        };

        xhr.send();

      },

    });
    return new DataController();
  });

}).call( this );
