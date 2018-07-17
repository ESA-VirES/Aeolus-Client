(function() {
  'use strict';

  var INPUT_DESCRIPTIONS = {
    'collection_ids': 'Products',
    'model_ids': 'Models',
    'begin_time': 'Start time',
    'end_time': 'End time',
    'filters': 'Filters'
  }


  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'models/DownloadModel',
    'hbs!tmpl/DownloadFilter',
    'hbs!tmpl/FilterTemplate',
    'hbs!tmpl/DownloadProcess',
    'hbs!tmpl/CoverageDownloadPost',
    'hbs!tmpl/wps_l1b',
    'underscore',
    'w2ui',
    'w2popup'
  ],
  function( Backbone, Communicator, globals, m, DownloadFilterTmpl,
            FilterTmpl, DownloadProcessTmpl, CoverageDownloadPostTmpl, wps_fetchFilteredDataAsync ) {

    var DownloadProcessView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      el: '#download_processes',
      //id: "modal-start-download",
      className: "download_process",
      template: {
          type: 'handlebars',
          template: DownloadProcessTmpl
      },

      modelEvents: {
        "change": "render"
      },
      onBeforeRender: function(){
        this.collapse_open = $('#collapse-'+this.model.get('id')).hasClass('in');
      },
      onRender: function(){
        if(this.collapse_open){
          $('#collapse-'+this.model.get('id')).addClass('in');
          $('#'+this.model.get('id')+' a').removeClass('collapsed');
        }
      },

      initialize: function(options) {},
      onShow: function(view){}
    }),

    toggleDownloadButton = function(activate){
      if(!activate){
        $('#btn-start-download').prop('disabled', true);
        $('#btn-start-download').attr('title', 'Please wait until previous process is finished');
      }else{
        $('#btn-start-download').prop('disabled', false);
        $('#btn-start-download').removeAttr('title');
      }
      
    },

    DownloadProcessModel = Backbone.Model.extend({
      id: null,
      status_url: null,
      percentage: 0,
      percentage_descriptor: 'Loading ...',
      status: null,
      datainputs: null,
      creation_time: null,
      download_link: null,

      update: function() {

        var that = this;
        $.get(this.get('status_url'), 'xml')
          .done( function ( doc ){

            // Collect and fill data input information
            var datainputs = {};
            $(doc).find('DataInputs, wps\\:DataInputs').children().each(function(){
              var id = $(this).find('Identifier, ows\\:Identifier').text();

              if(id && INPUT_DESCRIPTIONS.hasOwnProperty(id)){
                var data = $(this).find('LiteralData, wps\\:LiteralData').text();
                if(data){
                  datainputs[INPUT_DESCRIPTIONS[id]] = data;
                }else{
                  data = $(this).find('ComplexData, wps\\:ComplexData').text();
                  if(data){
                    data = data.slice(1,-1);
                    datainputs[INPUT_DESCRIPTIONS[id]] = data;
                  }
                }
              }
            });

            var outf = $(doc).find('OutputDefinitions, wps\\:OutputDefinitions');
            if (outf){
              var mt = $(outf).find('Output, wps\\:Output').attr('mimeType');
              if (mt){
                datainputs['Output format'] = mt;
              }
            }

            var status = $(doc).find('Status, wps\\:Status');
            if (status && status.children().length > 0){
              if(status.children()[0].nodeName === 'wps:ProcessSucceeded'){
                if (that.get('status')=='ACCEPTED' ||  that.get('status')=='STARTED'){
                  // Previous status was still processing loading now finished
                  that.set('status', 'SUCCEEDED')
                  toggleDownloadButton(true);
                }
                that.set('percentage', 100);
                that.set('percentage_descriptor', 'Ready');
                var download_link = $(doc).find('Output, wps\\:Output').find('Reference, wps\\:Reference').attr('href');
                if(download_link){
                  that.set('download_link', download_link);
                }
              }
              if(status.children()[0].nodeName === 'wps:ProcessFailed'){
                if (that.get('status')=='ACCEPTED' ||  that.get('status')=='STARTED'){
                  // Previous status was still processing loading now finished
                  that.set('status', 'FAILED')
                  toggleDownloadButton(true);
                }
                var errmsg = $(doc).find('ExceptionText, ows\\:ExceptionText');
                if(errmsg){
                  datainputs['Error Message'] = errmsg.text();
                }

                that.set('percentage', 0);
                that.set('percentage_descriptor', 'Error while processing');
              }
              
              if (status.children().attr('percentCompleted') !== undefined){
                //toggleDownloadButton(false);
                var p = status.children().attr('percentCompleted');
                that.set('percentage', p);
                that.set('percentage_descriptor', (p+'%'));
                // Only update model if download view is open
                if(!$('#viewContent').is(':empty')){
                  setTimeout(function(){ that.update(); }, 2000);
                }
              } else if(status.children()[0].nodeName === 'wps:ProcessAccepted'){
                //toggleDownloadButton(false);
                that.set('percentage', 0);
                that.set('percentage_descriptor', 'Starting process ...');
                if(!$('#viewContent').is(':empty')){
                  setTimeout(function(){ that.update(); }, 2000);
                }
              }

            }
            if(datainputs && Object.keys(datainputs).length>0){
              that.set('datainputs', datainputs);
            }

            

          })
      }
    }),

    DownloadFilterView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "modal-start-download",
      className: "panel panel-default download",
      template: {
          type: 'handlebars',
          template: DownloadFilterTmpl
      },

      initialize: function(options) {

        this.coverages = new Backbone.Collection([]);
        this.start_picker = null;
        this.end_picker = null;
        this.models = [];
        this.swarm_prod = [];
        this.loadcounter = 0;

      },
      onShow: function(view){

        this.listenTo(this.coverages, "reset", this.onCoveragesReset);
        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({ 
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

        this.$('#btn-start-download').on("click", _.bind(this.onStartDownloadClicked, this));

        $('#validationwarning').remove();

        this.updateJobs();

        var options = {};

        // Check for filters
        var filters = this.model.get("filter");

        var aoi = this.model.get("AoI");
        if (aoi){
          if (typeof filters === 'undefined') {
            filters = {};
          }
          filters["Longitude"] = [aoi.w, aoi.e];
          filters["Latitude"] = [aoi.s, aoi.n];
        }

        if (!$.isEmptyObject(filters)){
          this.renderFilterList(filters);
        }


        this.$('.delete-filter').click(function(evt){
          var item = this.parentElement.parentElement;
          this.parentElement.parentElement.parentElement.removeChild(item);
        });

        // Check for products and models
        var products;
        this.models = [];
        this.swarm_prod = [];

        // Initialise datepickers
        $.datepicker.setDefaults({
          showOn: "both",
          dateFormat: "dd.mm.yy"
        });

        var that = this;

        var timeinterval = this.model.get("ToI");



        this.start_picker = this.$('#starttime').datepicker({
          onSelect: function() {
            var start = that.start_picker.datepicker( "getDate" );
            var end = that.end_picker.datepicker( "getDate" );
            if(start>end){
              that.end_picker.datepicker("setDate", start);
            }
          }
        });
        this.start_picker.datepicker("setDate", timeinterval.start);

        this.end_picker = this.$('#endtime').datepicker({
          onSelect: function() {
            var start = that.start_picker.datepicker( "getDate" );
            var end = that.end_picker.datepicker( "getDate" );
            if(end<start){
              that.start_picker.datepicker("setDate", end);
            }
          }
        });
        this.end_picker.datepicker("setDate", timeinterval.end);

        // Prepare to create list of available parameters
        var available_parameters = [];

        var collections = [];
        _.each(this.model.get("products"), function(prod){
            if(prod.get('visible')){
              collections.push(prod.get('download').id);
            }
        },this);


        var prod_div = this.$el.find("#products");
        prod_div.append('<div style="font-weight:bold;">Products</div>');

        prod_div.append('<ul style="padding-left:15px">');
        var ul = prod_div.find("ul");
        _.each(collections, function(prod){
          ul.append('<li style="list-style-type: circle; padding-left:-6px;list-style-position: initial;">'+prod+'</li>');
        }, this);



        this.$el.find("#custom_parameter_cb").off();
        this.$el.find("#custom_download").empty();
        this.$el.find("#custom_download").html(
          '<div class="w2ui-field">'+
              '<div class="checkbox" style="margin-left:20px;"><label><input type="checkbox" value="" id="custom_parameter_cb">Custom download parameters</label></div>'+
              '<div style="margin-left:0px;"> <input id="param_enum" style="width:100%;"> </div>'+
          '</div>'
        );

        this.$el.find("#custom_time_cb").off();
        this.$el.find("#custom_time").empty();

        $('#customtimefilter').empty();

        var timeinterval = that.model.get("ToI");
        var extent = [
          getISOTimeString(timeinterval.start),
          getISOTimeString(timeinterval.end)
        ];

        var name = "Time (hh:mm:ss.fff)";

        var $html = $(FilterTmpl({
            id: "timefilter",
            name: name,
            extent: extent
          })
        );
        $('#customtimefilter').append($html);
        $('#customtimefilter .input-group-btn button').removeClass();
        $('#customtimefilter .input-group-btn button').attr('class', 'btn disabled');

        this.$el.find('#custom_time_cb').attr('checked', 'checked');
        this.$el.find('#custom_time_cb').click(function(){

          $('#customtimefilter').empty();

          if ($('#custom_time_cb').is(':checked')) {
           
            var timeinterval = that.model.get("ToI");
            var extent = [
              getISOTimeString(timeinterval.start),
              getISOTimeString(timeinterval.end)
            ];

            var name = "Time (hh:mm:ss.fff)";

            var $html = $(FilterTmpl({
                id: "timefilter",
                name: name,
                extent: extent
              })
            );
            $('#customtimefilter').append($html);
            $('#customtimefilter .input-group-btn button').removeClass();
            $('#customtimefilter .input-group-btn button').attr('class', 'btn disabled');
            
          }

        });

        var available_parameters = [];

        globals.products.each(function(prod) {
          if (prod.get('visible')) {
            var downPars = prod.get('download_parameters');
            for(var id in downPars){
              available_parameters.push({
                'id': id, 
                'uom': downPars[id].uom,
                'description': downPars[id].name
              });
            }
          }
        }, this);       

        $('#param_enum').w2field('enum', { 
            items: _.sortBy(available_parameters, 'id'), // Sort parameters alphabetically 
            openOnFocus: true,
            renderItem: function (item, index, remove) {
                if(item.id == "Latitude" || item.id == "Longitude" ||
                   item.id == "Timestamp" || item.id == "Radius"){
                  remove = "";
                }
                var html = remove + item.id;
                return html;
            },
            renderDrop: function (item, options) {
              $("#w2ui-overlay").addClass("downloadsection");

              var html = '<b>'+item.id+'</b>';
              if(item.uom != null){
                html += ' ['+item.uom+']';
              }
              if(item.description){
                html+= ': '+item.description;
              }
              //'<i class="fa fa-info-circle" aria-hidden="true" data-placement="right" style="margin-left:4px;" title="'+item.description+'"></i>';
              
              return html;
            },
            onRemove: function(evt){
              if(evt.item.id == "Radius" || evt.item.id == "Latitude" ||
                 evt.item.id == "Longitude" || evt.item.id == "Timestamp"){
                evt.preventDefault();
                evt.stopPropagation();
              }
            }
        });
        $('#param_enum').prop('disabled', true);
        $('#param_enum').w2field().refresh();

        this.$el.find("#custom_parameter_cb").click(function(evt){
          if ($('#custom_parameter_cb').is(':checked')) {
            $('#param_enum').prop('disabled', false);
            $('#param_enum').w2field().refresh();
          }else{
            $('#param_enum').prop('disabled', true);
            $('#param_enum').w2field().refresh();
          }
        });

      },

      updateJobs: function(){

        var url_jobs = '/ows?service=wps&request=execute&version=1.0.0&identifier=listJobs&RawDataOutput=job_list';

        $.get(url_jobs, 'json')
          .done(function( processes ){
            $('#download_processes').empty();

            var processObjects = [];
            for (var pId in processes){
              processObjects = processObjects.concat(processes[pId]);
            }

            if(processObjects.length > 0){

              // Sort processes by time
              processObjects.sort(function(a, b){return new Date(a.created).getTime() - new Date(b.created).getTime()});

              var processes_to_save = 2;
              processes = processObjects;

              // Check if any process is active
              var active_processes = false;
              for (var i = 0; i < processes.length; i++) {
                if(processes[i].hasOwnProperty('status')){
                  if(processes[i]['status']=='ACCEPTED' || processes[i]['status']=='STARTED'){
                    active_processes = true;
                  }
                }
              }

              // Button will be enabled/disabled depending if there are active jobs
              toggleDownloadButton(!active_processes);

              var removal_processes = processes.splice(0,processes.length-processes_to_save );

              for (var i = 0; i < removal_processes.length; i++) {
                var remove_url = '/ows?service=WPS&request=Execute&identifier=removeJob&DataInputs=job_id='+removal_processes[i].id;
                $.get(remove_url);
              }

              if(processes.length>0){
                $('#download_processes').append('<div><b>Download links</b> (Process runs in background, panel can be closed and reopened at any time)</div>');
              }

              for (var i = processes.length - 1; i >= 0; i--) {
                var m = new DownloadProcessModel({
                  id: processes[i].id,
                  creation_time: processes[i].created.slice(0, -13),
                  status_url: processes[i].url,
                  status: processes[i].status
                });
                var el = $('<div></div>');
                $('#download_processes').append(el);
                var proc_view = new DownloadProcessView({
                  el: el,
                  model: m
                });
                proc_view.render();
                m.update();
              }
            }else{
              // If there are no processes activate button
              toggleDownloadButton(true);
            }
          });
      },

      renderFilterList: function(filters) {
        var fil_div = this.$el.find("#filters");
        fil_div.empty();
        //fil_div.append("<div>Filters</div>");

        _.each(_.keys(filters), function(key){

          var extent = filters[key].map(this.round);
          var name = "";
          var parts = key.split("_");
          if (parts.length>1){
            name = parts[0];
            for (var i=1; i<parts.length; i++){
              name+=(" "+parts[i]).sub();
            }
          }else{
            name = key;
          }

          var $html = $(FilterTmpl({
              id: key,
              name: name,
              extent: extent
            })
          );
          fil_div.append($html);
        }, this);

      },

      round: function(val){
        return val.toFixed(2);
      },

      fieldsValid: function(){
        var filter_elem = this.$el.find(".input-group");

        var valid = true;

        _.each(filter_elem, function(fe){
          var extent_elem = $(fe).find("textarea");

          for (var i = extent_elem.length - 1; i >= 0; i--) {

            if(extent_elem.context.id == 'timefilter'){
              if(!isValidTime(extent_elem[i].value)){
                $(extent_elem[i]).css('background-color', 'rgb(255, 215, 215)');
                valid = false;
              }else{
                $(extent_elem[i]).css('background-color', 'transparent');
              }
            }else{
              if(!$.isNumeric(extent_elem[i].value)){
                $(extent_elem[i]).css('background-color', 'rgb(255, 215, 215)');
                valid = false;
              }else{
                $(extent_elem[i]).css('background-color', 'transparent');
              }
            }

          };
        });
        return valid;

      },


      onStartDownloadClicked: function() {
        $('#validationwarning').remove();
        // First validate fields
        if(!this.fieldsValid()){
          // Show ther eis an issue in the fields and return
          $('.panel-footer').append('<div id="validationwarning">There is an issue with the provided filters, please look for the red marked fields.</div>');
          return;
        }

        var $downloads = $("#div-downloads");
        var options = {};

        // format
        options.format = this.$("#select-output-format").val();

        
        // time
        options.begin_time = this.start_picker.datepicker( "getDate" );
        options.begin_time = new Date(Date.UTC(options.begin_time.getFullYear(), options.begin_time.getMonth(),
        options.begin_time.getDate(), options.begin_time.getHours(), 
        options.begin_time.getMinutes(), options.begin_time.getSeconds()));
        options.begin_time.setUTCHours(0,0,0,0);
       

        options.end_time = this.end_picker.datepicker( "getDate" );
        options.end_time = new Date(Date.UTC(options.end_time.getFullYear(), options.end_time.getMonth(),
        options.end_time.getDate(), options.end_time.getHours(), 
        options.end_time.getMinutes(), options.end_time.getSeconds()));
        //options.end_time.setUTCHours(23,59,59,999);
        options.end_time.setUTCHours(0,0,0,0);
        
        


        // Rewrite time for start and end date if custom time is active
        if($("#timefilter").length!=0) {
          var s = parseTime($($("#timefilter").find('textarea')[1]).val());
          var e = parseTime($($("#timefilter").find('textarea')[0]).val());
          options.begin_time.setUTCHours(s[0],s[1],s[2],s[3]);
          options.end_time.setUTCHours(e[0],e[1],e[2],e[3]);
        }else{
          options.end_time.setDate(options.end_time.getDate() + 1);
        }

        var bt_obj = options.begin_time;
        var et_obj = options.end_time;
        options.begin_time = getISODateTimeString(options.begin_time);
        options.end_time = getISODateTimeString(options.end_time);

        // products
        //options.collection_ids = this.swarm_prod.map(function(m){return m.get("views")[0].id;}).join(",");
        var retrieve_data = [];

        globals.products.each(function(model) {
          if (_.find(this.swarm_prod, function(p){ return model.get("views")[0].id == p.get("views")[0].id})) {
            var processes = model.get("processes");
            _.each(processes, function(process){
              if(process){
                switch (process.id){
                  case "retrieve_data":
                    retrieve_data.push({
                      layer:process.layer_id,
                      url: model.get("views")[0].urls[0]
                    });
                  break;
                }
              }
            }, this);
          }
        }, this);



        var collections = [];
        _.each(this.model.get("products"), function(prod){
            if(prod.get('visible')){
              collections.push(prod.get('download').id);
            }
        },this);

        options["collection_ids"] = JSON.stringify(collections);


        // filters
        var filters = [];
        var filter_elem = $('#filters').find(".input-group");

        _.each(filter_elem, function(fe){

          var extent_elem = $(fe).find("textarea");
          if(extent_elem.context.id == 'timefilter'){
            return;
          }
          var extent = [];
          for (var i = extent_elem.length - 1; i >= 0; i--) {
            extent[i] = parseFloat(extent_elem[i].value);
          };
          // Make sure smaller value is first item
          extent.sort(function (a, b) { return a-b; });

          // Check to see if filter is on a vector component
          var original = false;
          var index = -1;
          _.each(VECTOR_BREAKDOWN, function(v, key){
            for (var i = 0; i < v.length; i++) {
              if(v[i] === fe.id){
                index = i;
                original = key;
              }
            }
            
          });

          if (original) {
            filters.push(original+"["+index+"]:"+ extent.join(","));
          }else{
            filters.push(fe.id+":"+ extent.join(","));
          }
        });

        options.filters = filters.join(";");

        // Custom variables
        if ($('#custom_parameter_cb').is(':checked')) {
          _.each(this.model.get("products"), function(prod){
            if(prod.get('visible')){
              var collectionId = prod.get("download").id;

              // TODO: This only takes into account having one product selected
              options.processId = prod.get('process');

              if(collectionId.indexOf('AUX')!==-1) {
                var auxType = collectionId.slice(4, -3);
                options['aux_type'] = auxType;

              }
            }

            var variables = $('#param_enum').data('selected');
            variables = variables.map(function(item) {return item.id;});
            variables = variables.join(',');
            options.fields = variables;

          },this);
        }else{
          // Use default parameters as described by download
          // product parameters in configuration

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
            ],
            'ALD_U_N_2A': {
              'observation_fields': [
                'mie_altitude_obs','rayleigh_altitude_obs',
                'longitude_of_DEM_intersection_obs', 'latitude_of_DEM_intersection_obs',
                'altitude_of_DEM_intersection_obs', 
                'SCA_extinction', 'SCA_time_obs','SCA_backscatter','SCA_LOD', 
                'SCA_extinction_variance', 'SCA_backscatter_variance','SCA_LOD_variance', 
                'MCA_extinction', 'MCA_time_obs', 'MCA_LOD',
                'SCA_QC_flag'
              ]
            },
            'ALD_U_N_2B': {
                'mie_profile_fields': [
                  'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                  'mie_profile_datetime_start', 'mie_profile_datetime_stop'
                ],
                'mie_wind_fields': [
                  'mie_wind_result_wind_velocity', 'mie_wind_result_start_time',
                  'mie_wind_result_stop_time', 'mie_wind_result_bottom_altitude',
                  'mie_wind_result_top_altitude',
                  'mie_wind_result_SNR', 'mie_wind_result_HLOS_error', 'mie_wind_result_COG_altitude',
                  'mie_wind_result_COG_range', 'mie_wind_result_QC_flags_1',
                  'mie_wind_result_QC_flags_2', 'mie_wind_result_QC_flags_3',
                ],
                'rayleigh_profile_fields': [
                  'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                  'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'
                ],
                'rayleigh_wind_fields': [
                  'rayleigh_wind_result_wind_velocity', 'rayleigh_wind_result_start_time',
                  'rayleigh_wind_result_stop_time', 'rayleigh_wind_result_bottom_altitude',
                  'rayleigh_wind_result_top_altitude',
                  'rayleigh_wind_result_HLOS_error', 'rayleigh_wind_result_COG_altitude',
                  'rayleigh_wind_result_COG_range', 'rayleigh_wind_result_QC_flags_1',
                  'rayleigh_wind_result_QC_flags_2', 'rayleigh_wind_result_QC_flags_3',
                ],
            },
            'ALD_U_N_2C': {
                 'mie_profile_fields': [
                  'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                  'mie_profile_datetime_start', 'mie_profile_datetime_stop'
                ],
                'mie_wind_fields': [
                  'mie_wind_result_wind_velocity', 'mie_wind_result_start_time',
                  'mie_wind_result_stop_time', 'mie_wind_result_bottom_altitude',
                  'mie_wind_result_top_altitude',
                  'mie_wind_result_SNR', 'mie_wind_result_HLOS_error', 'mie_wind_result_COG_altitude',
                  'mie_wind_result_COG_range', 'mie_wind_result_QC_flags_1',
                  'mie_wind_result_QC_flags_2', 'mie_wind_result_QC_flags_3',
                ],
                'rayleigh_profile_fields': [
                  'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                  'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'
                ],
                'rayleigh_wind_fields': [
                  'rayleigh_wind_result_wind_velocity', 'rayleigh_wind_result_start_time',
                  'rayleigh_wind_result_stop_time', 'rayleigh_wind_result_bottom_altitude',
                  'rayleigh_wind_result_top_altitude',
                  'rayleigh_wind_result_HLOS_error', 'rayleigh_wind_result_COG_altitude',
                  'rayleigh_wind_result_COG_range', 'rayleigh_wind_result_QC_flags_1',
                  'rayleigh_wind_result_QC_flags_2', 'rayleigh_wind_result_QC_flags_3',
                ],
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
            ],
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
            ],
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
            ],
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
            ],
            'AUX_MET_12': [
              'time_off_nadir', 'time_nadir',
              'surface_wind_component_u_off_nadir',
              'surface_wind_component_u_nadir',
              'surface_wind_component_v_off_nadir',
              'surface_wind_component_v_nadir',
              'surface_pressure_off_nadir','surface_pressure_nadir',
              'surface_altitude_off_nadir', 'surface_altitude_nadir'
              // TODO: 2D data is very big, how can we handle it?
            ]

          };

          var variables = [];
          _.each(this.model.get("products"), function(prod){
            if(prod.get('visible')){
              var collectionId = prod.get("download").id;

              // TODO: This only takes into account having one product selected
              options.processId = prod.get('process');
              if(collectionId === 'ALD_U_N_1B'){
                options["observation_fields"] = fieldsList[collectionId];
              } else if(collectionId === 'ALD_U_N_2A'){
                options = Object.assign(options, fieldsList[collectionId]);
              } else if(collectionId === 'ALD_U_N_2C' || collectionId === 'ALD_U_N_2B'){
                options = Object.assign(options, fieldsList[collectionId]);
              } else {
                var auxType = collectionId.slice(4, -3);
                options["fields"] = fieldsList[collectionId];
                options['aux_type'] = auxType;

              }
            }   
          },this);
        } 
       

        options.async = true;

        // TODO: Just getting URL of last active product need to think of 
        // how different urls should be handled
        var url;
        _.each(this.model.get("products"), function(prod){
          if(prod.get('visible')){
            url = prod.get('download').url;
          }   
        },this);

        var req_data = wps_fetchFilteredDataAsync(options);
        var that = this;

        // Do some sanity checks before starting process

        // Calculate the difference in milliseconds
        var difference_ms = et_obj.getTime() - bt_obj.getTime();
        var days = Math.round(difference_ms/(1000*60*60*24));

        var sendProcessingRequest = function(){
          toggleDownloadButton(false);
          $.post( url, req_data, 'xml' )
            .done(function( response ) {
              that.updateJobs();
            })
            .error(function(resp){
              toggleDownloadButton(true);
            });
        };

        if (days>50 && filters.length==0){
          w2confirm('The current selection will most likely exceed the download limit, please make sure to add filters to further subset your selection. <br> Would you still like to proceed?')
            .yes(function () {
              sendProcessingRequest();
            });

        }else if (days>50){
          w2confirm('The current selected time interval is large and could result in a large download file if filters are not restrictive. The process runs in the background and the browser does not need to be open.<br>Are you sure you want to proceed?')
            .yes(function () {
              sendProcessingRequest();
            });
        }else{
          sendProcessingRequest();
        }

      },

      onClose: function() {
        Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }

    });
    return {'DownloadFilterView':DownloadFilterView};
  });
}).call( this );
