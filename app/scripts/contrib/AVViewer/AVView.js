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
                if(this.graph2){
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

            this.$el.append('<div id="analyticsSavebutton"><i class="fa fa-floppy-o" aria-hidden="true"></i></div>');

            $('#analyticsSavebutton').click(function(){
                if (that.graph1){
                    that.graph1.saveImage();
                }
                if (that.graph2){
                    that.graph2.saveImage();
                }
            });

            if (typeof this.graph1 === 'undefined' && 
                typeof this.graph2 === 'undefined') {
                this.$el.append('<div class="d3canvas"></div>');
                this.$('.d3canvas').append('<div id="graph_1"></div>');
                this.$('.d3canvas').append('<div id="graph_2"></div>');
                this.$('.d3canvas').append('<div id="filterDivContainer"></div>');
                this.$el.append('<div id="nodataavailable"></div>');
                $('#nodataavailable').text('No data available for current selection');
                this.$('#filterDivContainer').append('<div id="filters"></div>');
            }else{
                if(this.graph1){
                    this.graph1.resize();
                }
                if(this.graph2){
                    this.graph2.resize();
                }
            }

            this.renderSettings = {
                rayleigh: {
                    xAxis: [
                        'time'
                    ],
                    yAxis: [
                        'rayleigh_altitude'
                    ],
                    combinedParameters: {
                        rayleigh_latitude: ['rayleigh_latitude_start', 'rayleigh_latitude_end'],
                        rayleigh_altitude: ['rayleigh_altitude_start', 'rayleigh_altitude_end'],
                        latitude_of_DEM_intersection: [
                            'rayleigh_latitude_of_DEM_intersection_start',
                            'rayleigh_latitude_of_DEM_intersection_end'
                        ],
                        time: ['rayleigh_time_start', 'rayleigh_time_end'],
                    },
                    colorAxis: ['rayleigh_HLOS_wind_speed']

                },
                mie: {
                    xAxis: [
                    'time'
                    ],
                    yAxis: [
                        'mie_altitude'
                    ],
                    //y2Axis: [],
                    combinedParameters: {
                        mie_latitude: ['mie_latitude_start', 'mie_latitude_end'],
                        mie_altitude: ['mie_altitude_start', 'mie_altitude_end'],
                        latitude_of_DEM_intersection: [
                            'mie_latitude_of_DEM_intersection_start',
                            'mie_latitude_of_DEM_intersection_end'
                        ],
                        time: ['mie_time_start', 'mie_time_end'],
                    },
                    colorAxis: ['mie_HLOS_wind_speed']

                },
                'ALD_U_N_2A_mie': {
                    xAxis: 'time',
                    yAxis: [ 'mie_altitude'],
                    combinedParameters: {
                        mie_altitude: ['mie_altitude_obs_top', 'mie_altitude_obs_bottom'],
                        time: ['MCA_time_obs_start', 'MCA_time_obs_stop'],
                    },
                    colorAxis: ['MCA_extinction']

                },
                'ALD_U_N_2A_rayleigh': {
                    xAxis: 'time',
                    yAxis: [ 'rayleigh_altitude'],
                    combinedParameters: {
                        rayleigh_altitude: ['rayleigh_altitude_obs_top', 'rayleigh_altitude_obs_bottom'],
                        time: ['SCA_time_obs_start', 'SCA_time_obs_stop'],
                    },
                    colorAxis: ['SCA_extinction']

                },
                'ALD_U_N_2C_mie': {
                    xAxis: 'time',
                    yAxis: [ 'mie_altitude'],
                    combinedParameters: {
                        mie_altitude: ['mie_wind_result_top_altitude', 'mie_wind_result_bottom_altitude'],
                        time: ['mie_wind_result_start_time', 'mie_wind_result_stop_time'],
                    },
                    colorAxis: ['mie_wind_result_wind_velocity']

                },
                'ALD_U_N_2C_rayleigh': {
                    xAxis: 'time',
                    yAxis: [ 'rayleigh_altitude'],
                    combinedParameters: {
                        rayleigh_altitude: ['rayleigh_wind_result_top_altitude', 'rayleigh_wind_result_bottom_altitude'],
                        time: ['rayleigh_wind_result_start_time', 'rayleigh_wind_result_stop_time'],
                    },
                    colorAxis: ['rayleigh_wind_result_wind_velocity']

                },
                AUX_MRC_1B: {
                    xAxis: ['frequency_offset'],
                    yAxis: ['measurement_response'],
                    colorAxis: [ null ],
                },
                AUX_MRC_1B_error: {
                    xAxis: ['frequency_offset'],
                    yAxis: ['measurement_error_mie_response'],
                    colorAxis: [ null ],
                },
                AUX_RRC_1B: {
                    xAxis: ['frequency_offset'],
                    yAxis: ['measurement_response'],
                    colorAxis: [ null ]
                },
                AUX_RRC_1B_error: {
                    xAxis: ['frequency_offset'],
                    yAxis: ['measurement_error_rayleigh_response'],
                    colorAxis: [ null ]
                },
                AUX_ISR_1B: {
                    xAxis: 'laser_frequency_offset',
                    yAxis: ['rayleigh_channel_A_response', 'rayleigh_channel_B_response'],
                    colorAxis: [ null, null ]
                },
                AUX_ZWC_1B: {
                    xAxis: 'observation_index',
                    yAxis: ['mie_ground_correction_velocity', 'rayleigh_ground_correction_velocity'],
                    colorAxis: [ null, null ]
                },
                'AUX_MET_12_nadir': {
                    xAxis: 'time_nadir',
                    yAxis: ['surface_wind_component_u_nadir'],
                    colorAxis: [ null, null ]
                },
                'AUX_MET_12_off_nadir': {
                    xAxis: 'time_off_nadir',
                    yAxis: ['surface_wind_component_u_off_nadir'],
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
                this.graph1 = new graphly.graphly({
                    el: '#graph_1',
                    margin: {top: 10, left: 120, bottom: 50, right: 20},
                    dataSettings: this.dataSettings,
                    renderSettings: this.renderSettings.mie,
                    filterManager: globals.swarm.get('filterManager')
                });
                globals.swarm.get('filterManager').setRenderNode('#filters');
            }

            if (this.graph2 === undefined){
                this.graph2 = new graphly.graphly({
                    el: '#graph_2',
                    margin: {top: 10, left: 120, bottom: 50, right: 20},
                    dataSettings: this.dataSettings,
                    renderSettings: this.renderSettings.rayleigh,
                    filterManager: globals.swarm.get('filterManager'),
                    connectedGraph: this.graph1
                });
                this.graph1.connectGraph(this.graph2);
            }

            var data = globals.swarm.get('data');

            if(Object.keys(data).length > 0){

                

                $('#nodataavailable').hide();
                //this.graph.loadData(data);
                // TODO: Iterate through all ids and load to corresponding graphs

                this.graph1.createHelperObjects();
                this.graph2.createHelperObjects();

                // TODO: Seems this is never called?

                /*if(idKeys[0] === 'ALD_U_N_1B'){
                    this.graph1.renderSettings =  this.renderSettings.mie;
                    this.graph2.renderSettings =  this.renderSettings.rayleigh;
                    $('#graph_1').css('height', '49%').css('height', '-=131px');
                    $('#graph_2').css('height', '49%').css('height', '-=131px');
                    $('#graph_2').show();
                    this.graph1.loadData(data['ALD_U_N_1B']);
                    this.graph2.loadData(data['ALD_U_N_1B']);
                    this.graph1.resize();
                    this.graph2.resize();
                    this.graph1.connectGraph(this.graph2);
                    this.graph2.connectGraph(this.graph1);
                    this.filterManager.loadData(data['ALD_U_N_1B']);

                }else if(idKeys[0] === 'AUX_MRC_1B' || idKeys[0] === 'AUX_RRC_1B'){
                    this.graph1.renderSettings =  this.renderSettings[idKeys[0]];
                    this.graph2.renderSettings =  this.renderSettings[(idKeys[0]+'_error')];
                    $('#graph_1').css('height', '49%').css('height', '-=131px');
                    $('#graph_2').css('height', '49%').css('height', '-=131px');
                    $('#graph_2').show();
                    this.graph1.loadData(data[idKeys[0]]);
                    this.graph2.loadData(data[idKeys[0]]);
                    this.graph1.resize();
                    this.graph2.resize();
                    this.filterManager.loadData(data[idKeys[0]]);

                }else{
                    this.graph2.data = {};
                    this.graph1.connectGraph(false);
                    this.graph2.connectGraph(false);
                    $('#graph_1').css('height', '99%').css('height', '-=262px');
                    $('#graph_2').hide();
                    this.graph1.renderSettings = this.renderSettings[idKeys[0]];
                    this.graph1.loadData(data[idKeys[0]]);
                    this.graph1.resize();
                    this.filterManager.loadData(data[idKeys[0]]);
                }*/

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

        onLayerParametersChanged: function(layer){

            // Parameters only apply for L1B curtains (possibly L2B)
            if(layer === 'ALD_U_N_1B'){
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
                this.graph1.updateSettings = this.dataSettings;
                this.graph1.renderData(false);
                this.graph1.createHelperObjects();
                this.graph2.dataSettings = this.dataSettings;
                this.graph2.renderData(false);
                this.graph2.createHelperObjects();
            }
        },

        reloadData: function(model, data) {
            // If element already has plot rendering
            if( $(this.el).html()){

                //this.filterManager.initManager();
                var idKeys = Object.keys(data);
                if(idKeys.length > 0){
                    $('#nodataavailable').hide();
                    //this.graph.loadData(data);
                    // TODO: Iterate through all ids and load to corresponding graphs
                    if(idKeys[0] === 'ALD_U_N_1B'){
                        this.graph1.renderSettings =  this.renderSettings.mie;
                        this.graph2.renderSettings =  this.renderSettings.rayleigh;
                        $('#graph_1').css('height', '49%').css('height', '-=131px');
                        $('#graph_2').css('height', '49%').css('height', '-=131px');
                        $('#graph_2').show();
                        this.graph1.loadData(data['ALD_U_N_1B']);
                        this.graph2.loadData(data['ALD_U_N_1B']);
                        this.graph1.resize();
                        this.graph2.resize();
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data['ALD_U_N_1B']);

                     }else if(idKeys[0] === 'ALD_U_N_2A'){

                        this.graph1.renderSettings =  this.renderSettings.ALD_U_N_2A_mie;
                        this.graph2.renderSettings =  this.renderSettings.ALD_U_N_2A_rayleigh;
                        $('#graph_1').css('height', '49%').css('height', '-=131px');
                        $('#graph_2').css('height', '49%').css('height', '-=131px');
                        $('#graph_2').show();
                        this.graph1.loadData(data['ALD_U_N_2A']);
                        this.graph2.loadData(data['ALD_U_N_2A']);
                        this.graph1.resize();
                        this.graph2.resize();
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data['ALD_U_N_2A']);

                     }else if(idKeys[0] === 'ALD_U_N_2C'){

                        this.graph1.renderSettings =  this.renderSettings.ALD_U_N_2C_mie;
                        this.graph2.renderSettings =  this.renderSettings.ALD_U_N_2C_rayleigh;
                        $('#graph_1').css('height', '49%').css('height', '-=131px');
                        $('#graph_2').css('height', '49%').css('height', '-=131px');
                        $('#graph_2').show();
                        this.graph1.loadData(data['ALD_U_N_2C']);
                        this.graph2.loadData(data['ALD_U_N_2C']);
                        this.graph1.resize();
                        this.graph2.resize();
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data['ALD_U_N_2C']);

                     }else if(idKeys[0] === 'AUX_MRC_1B' || idKeys[0] === 'AUX_RRC_1B'){

                        this.graph1.renderSettings =  this.renderSettings[idKeys[0]];
                        this.graph2.renderSettings =  this.renderSettings[(idKeys[0]+'_error')];
                        $('#graph_2').show();
                        $('#graph_1').css('height', '49%').css('height', '-=131px');
                        $('#graph_2').css('height', '49%').css('height', '-=131px');
                        this.graph1.loadData(data[idKeys[0]]);
                        this.graph2.loadData(data[idKeys[0]]);
                        this.graph1.resize();
                        this.graph2.resize();
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data[idKeys[0]]);

                    } else if(idKeys[0] === 'AUX_MET_12'){
                        this.graph1.renderSettings =  this.renderSettings[(idKeys[0]+'_nadir')];
                        this.graph2.renderSettings =  this.renderSettings[(idKeys[0]+'_off_nadir')];
                        $('#graph_2').show();
                        $('#graph_1').css('height', '49%').css('height', '-=131px');
                        $('#graph_2').css('height', '49%').css('height', '-=131px');
                        this.graph1.loadData(data[idKeys[0]]);
                        this.graph2.loadData(data[idKeys[0]]);
                        this.graph1.resize();
                        this.graph2.resize();
                        this.graph1.connectGraph(this.graph2);
                        this.graph2.connectGraph(this.graph1);
                        this.filterManager.loadData(data[idKeys[0]]);

                    }else /*if(idKeys[0] === 'AUX_MRC_1B')*/{
                        this.graph2.data = {};
                        $('#graph_1').css('height', '99%').css('height', '-=262px');
                        $('#graph_2').hide();
                        this.graph1.connectGraph(false);
                        this.graph2.connectGraph(false);
                        this.graph1.renderSettings = this.renderSettings[idKeys[0]];
                        this.graph1.loadData(data[idKeys[0]]);
                        this.graph1.resize();
                        this.filterManager.loadData(data[idKeys[0]]);
                    }
                }else{
                    $('#nodataavailable').show();
                    /*$('#graph_1').append('div').text('No data available for selection');
                    $('#graph_2').empty();
                    $('#filters').empty();*/

                }
            }
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