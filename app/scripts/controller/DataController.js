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


        var filterSettings = {
            parameterMatrix: {
                'height': [
                    'mie_altitude_start', 'mie_altitude_end'
                ],
                'latitude': [
                    'mie_latitude'
                ],
                'longitude': [
                   'mie_longitude'
                ]
            },
            filterRelation: [
                [
                    /*'mie_latitude', 'mie_longitude', 'mie_altitude', 'mie_dem_altitude',
                    'mie_datetime_start', 'mie_datetime_stop', 'mie_startlat',
                    'mie_endlat','mie_altitude_top', 'mie_altitude_bottom', 'height',
                    'mie_geo_height', 'mie_wind_velocity', 'mie_observation_type',*/
                    'mie_quality_flag_data', 'mie_wind_data', 'mie_latitude', 'mie_altitude',
                    'mie_latitude_start', 'mie_latitude_end', 'mie_altitude_start', 'mie_altitude_end',
                    'time', 'time_start', 'time_end', 'latitude_of_DEM_intersection_start',
                    'latitude_of_DEM_intersection_end', 'latitude_of_DEM_intersection'
                ]/*,
                [
                    'rayleigh_latitude', 'rayleigh_longitude', 'rayleigh_altitude',
                    'rayleigh_dem_altitude', 'rayleigh_datetime_start',
                    'rayleigh_datetime_stop', 'rayleigh_startlat', 'rayleigh_endlat',
                    'rayleigh_altitude_top', 'rayleigh_altitude_bottom', 'height',
                    'rayleigh_geo_height', 'rayleigh_wind_velocity'
                ]*/
            ],
            visibleFilters: [
                'mie_quality_flag_data',
                /*'T_elec',
                'Latitude',
                'height',
                'latitude',
                'longitude',
                'rayleigh_wind_velocity',
                'mie_wind_velocity',
                'mie_observation_type',
                'Laser_Freq_Offset',
                'Mie_Valid',
                'Rayleigh_Valid',
                'Fizeau_Transmission',
                'Rayleigh_A_Response',
                'Rayleigh_B_Response',
                'Num_Mie_Used',
                'Num_Rayleigh_Used',
                'Num_Corrupt_Mie',
                'Num_Corrupt_Rayleigh',

                'Frequency_Offset',
                'Frequency_Valid',
                'Measurement_Response_Valid',
                'Reference_Pulse_Response_Valid',
                'Measurement_Response',
                'Measurement_Error_Mie_Response',
                'Reference_Pulse_Response',
                'Reference_Pulse_Error_Mie_Response',
                'Num_Valid_Measurements',
                'Num_Measurements_Usable',
                'Num_Reference_Pulses_Usable',
                'Num_Measurement_Invalid',
                'Num_Pulse_Validity_Status_Flag_False',
                'Num_Sat_Not_on_Target_Measurements',
                'Num_Corrupt_Measurement_Bins',
                'Num_Corrupt_Reference_Pulses',
                'Num_Mie_Core_Algo_Fails_Measurements',
                //'Num_Ground_Echo_Not_Detected_Measurements'*/
            ],
            //boolParameter: [],
            //maskParameter: {},
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
        this.activeWPSproducts = [];
        if (!options.isBaseLayer){
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

      proxyFlattenObservationArraySE: function(input, proxy){
        //var time = data.AEOLUS[1].time;
        var start = [];
        var end = [];
        for (var i = 0; i < proxy.length-1; i++) {
          for (var j = 0; j < proxy[i].length-1; j++) {
            if (j===proxy[i].length-1){
              start.push(input[i]);
              end.push(input[i+1]);
            }else{
              start.push(input[i]);
              end.push(input[i+1]);
            }
          }
        }
        return [start, end];
      },

      flattenObservationArraySE: function(input){
        //var time = data.AEOLUS[1].time;
        var start = [];
        var end = [];
        for (var i = 0; i < input.length-1; i++) {
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

      flattenObservationArray: function(input){
        //var time = data.AEOLUS[1].time;
        var output = [];
        for (var i = 0; i < input.length-1; i++) {
          for (var j = 0; j < input[i].length; j++) {
            output.push(input[i][j]);
          }
        }
        return output;
      },

      proxyFlattenMeasurementArraySE: function(input, proxy){
        //var time = data.AEOLUS[1].time;
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
        //var time = data.AEOLUS[1].time;
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
        //var time = data.AEOLUS[1].time;
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

        var url = 'http://localhost:9000/vires00/ows?service=wps&request=execute&identifier='+process.id+
        '&DataInputs=collection_ids=["AEOLUS"];'+
        'begin_time='+getISODateTimeString(this.selected_time.start)+
        ';end_time='+getISODateTimeString(this.selected_time.end)+
        ';observation_fields=time,mie_HLOS_wind_speed,latitude_of_DEM_intersection,longitude_of_DEM_intersection,mie_altitude,mie_bin_quality_flag'+//'bbox=0,1,2,3,urn:ogc:def:crs:EPSG::3857'+
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

            /*var time = that.flattenArraySE(ds.time);
            var mie_HLOS_wind_speed = that.flattenMeasurementArray(ds.mie_HLOS_wind_speed);
            //var mie_latitude = that.flattenMeasurementArraySE(data.AEOLUS[1].mie_latitude);
            var latitude_of_DEM_intersection = that.proxyFlattenMeasurementArraySE(
              ds.latitude_of_DEM_intersection,
              ds.mie_altitude
            );
            var mie_altitude = that.flattenMeasurementArraySE(ds.mie_altitude);
            var mie_bin_quality_flag = that.flattenMeasurementArray(ds.mie_bin_quality_flag);*/

            var time = that.proxyFlattenObservationArraySE(ds.time, ds.mie_altitude);
            var mie_HLOS_wind_speed = that.flattenObservationArray(ds.mie_HLOS_wind_speed);
            //var mie_latitude = that.flattenMeasurementArraySE(data.AEOLUS[1].mie_latitude);
            var latitude_of_DEM_intersection = that.proxyFlattenObservationArraySE(
              ds.latitude_of_DEM_intersection,
              ds.mie_altitude
            );
            var positions = [];
            for (var i = 0; i < ds.latitude_of_DEM_intersection.length; i++) {
              positions.push(ds.longitude_of_DEM_intersection[i]);
              positions.push(ds.latitude_of_DEM_intersection[i]);
            }
            var mie_altitude = that.flattenObservationArraySE(ds.mie_altitude);
            var mie_bin_quality_flag = that.flattenObservationArray(ds.mie_bin_quality_flag);

            var tmpdata = {
              time_start: time[0],
              time_end: time[1],
              latitude_of_DEM_intersection_start: latitude_of_DEM_intersection[1],
              latitude_of_DEM_intersection_end: latitude_of_DEM_intersection[0],
              mie_wind_data: mie_HLOS_wind_speed,
              mie_quality_flag_data: mie_bin_quality_flag,
              mie_altitude_start: mie_altitude[1],
              mie_altitude_end: mie_altitude[0],
              positions: positions
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
