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

            if (typeof this.graph1 === 'undefined' && 
                typeof this.graph2 === 'undefined') {
                /*this.graph1.destroy();
                delete this.graph1;
                this.graph2.destroy();
                delete this.graph2;
                this.$el.empty();*/
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


            var renderSettings_mie = {
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

            };

            var renderSettings_rayleigh = {
                xAxis: [
                    'time'
                ],
                yAxis: [
                    'rayleigh_altitude'
                ],
                //y2Axis: [],
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

            };

            this.dataSettings = {

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
                }
            };


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

            if (this.graph1 === undefined){
                this.filterManager = globals.swarm.get('filterManager');
                this.graph1 = new graphly.graphly({
                    el: '#graph_1',
                    dataSettings: this.dataSettings,
                    renderSettings: renderSettings_mie,
                    filterManager: globals.swarm.get('filterManager')
                });
                globals.swarm.get('filterManager').setRenderNode('#filters');
            }

            if (this.graph2 === undefined){
                this.graph2 = new graphly.graphly({
                    el: '#graph_2',
                    dataSettings: this.dataSettings,
                    renderSettings: renderSettings_rayleigh,
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
                this.graph1.loadData(data['AEOLUS']);
                this.graph2.loadData(data['AEOLUS']);
                this.filterManager.loadData(data['AEOLUS']);
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

        },

        reloadData: function(model, data) {
            // If element already has plot rendering
            if( $(this.el).html()){

                //this.filterManager.initManager();
                if(Object.keys(data).length > 0){
                    $('#nodataavailable').hide();
                    //this.graph.loadData(data);
                    // TODO: Iterate through all ids and load to corresponding graphs
                    this.graph1.loadData(data['AEOLUS']);
                    this.graph2.loadData(data['AEOLUS']);
                    this.filterManager.loadData(data['AEOLUS']);
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