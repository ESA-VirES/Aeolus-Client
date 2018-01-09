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
              this.onResize();
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


            this.$('.d3canvas').remove();
            this.$el.append('<div class="d3canvas"></div>');
            this.$('.d3canvas').append('<div id="graph_1"></div>');
            this.$('.d3canvas').append('<div id="graph_2"></div>');
            this.$('.d3canvas').append('<div id="filterDivContainer"></div>');
            this.$el.append('<div id="nodataavailable"></div>');
            $('#nodataavailable').text('No data available for current selection');
            this.$('#filterDivContainer').append('<div id="filters"></div>');


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

            var dataSettings = {

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
                    extent: [-40,40]
                    //outline: false
                },

                mie_altitude:{
                    name: 'altitude',
                    uom: 'm'
                }




            };

            if (this.graph1 === undefined){


                this.filterManager = globals.swarm.get('filterManager');

                this.graph1 = new graphly.graphly({
                    el: '#graph_1',
                    dataSettings: dataSettings,
                    renderSettings: renderSettings_mie,
                    filterManager: globals.swarm.get('filterManager')
                });

                globals.swarm.get('filterManager').setRenderNode('#filters');

            }

            if (this.graph2 === undefined){
                this.graph2 = new graphly.graphly({
                    el: '#graph_2',
                    dataSettings: dataSettings,
                    renderSettings: renderSettings_rayleigh,
                    filterManager: globals.swarm.get('filterManager'),
                    connectedGraph: this.graph1
                });
                this.graph1.connectGraph(this.graph2);
            }


            var swarmdata = globals.swarm.get('data');

            /*var args = {
                scatterEl: '#scatterdiv',
                histoEl: '#parallelsdiv',
                selection_x: 'Latitude',
                selection_y: ['F'],
                margin: {top: 10, right: 67, bottom: 10, left: 60},
                histoMargin: {top: 55, right: 70, bottom: 25, left: 100},
                shorten_width: 125,
                toIgnoreHistogram: ['Latitude', 'Longitude', 'Radius'],
                fieldsforfiltering: ['F','B_N', 'B_E', 'B_C', 'Dst', 'QDLat','MLT'],
                single_color: true,
                file_save_string: 'VirES_Services_plot_rendering'
            };



            args.filterListChanged = function(param){
              localStorage.setItem('selectedFilterList', JSON.stringify(param));
            };
            args.xAxisSelectionChanged = function(param){
              localStorage.setItem('xAxisSelection', JSON.stringify(param));
            };
            args.yAxisSelectionChanged = function(param){
              localStorage.setItem('yAxisSelection', JSON.stringify(param));
            };
            args.filtersViewChanged = function(param){
              localStorage.setItem('filterViewHidden', JSON.stringify(param));
            };
            args.gridSettingChanged = function(param){
              localStorage.setItem('gridVisible', JSON.stringify(param));
            };

            if(localStorage.getItem('filterViewHidden') !== null){
                args.filters_hidden = JSON.parse(
                    localStorage.getItem('filterViewHidden')
                );
                if(args.filters_hidden){
                    $('#scatterdiv').css('height', '95%');
                    $('#parallelsdiv').css('height', '40px');
                }
            }
            if(localStorage.getItem('gridVisible') !== null){
                args.grid = JSON.parse(localStorage.getItem('gridVisible'));
            }

            var filterList = localStorage.getItem('selectedFilterList');
            if(filterList !== null){
                filterList = JSON.parse(filterList);
                args.fieldsforfiltering = filterList;
            }
            if(localStorage.getItem('prevParams') !== null){
                this.prevParams = JSON.parse(
                    localStorage.getItem('prevParams')
                );
            }*/

            /*if (this.sp === undefined){
                this.sp = new scatterPlot(
                    args, function(){},
                    function (values) {
                        if (values !== null){
                            Communicator.mediator.trigger(
                                'cesium:highlight:point',
                                [values.Latitude, values.Longitude, values.Radius]
                            );
                        }else{
                            Communicator.mediator.trigger('cesium:highlight:removeAll');
                        }
                    }, 
                    function(filter){
                        Communicator.mediator.trigger('analytics:set:filter', filter);
                    }
                );

                 // If filters from previous session load them
                if(localStorage.getItem('filterSelection') !== null){
                    var filters = JSON.parse(localStorage.getItem('filterSelection'));
                    Communicator.mediator.trigger('analytics:set:filter', filters);
                    _.map(filters, function(value, key){
                        that.sp.active_brushes.push(key);
                        that.sp.brush_extents[key] = value;
                    });
                }

                // If filters from previous session load them
                if(localStorage.getItem('xAxisSelection') !== null){
                    that.sp.sel_x = JSON.parse(localStorage.getItem('xAxisSelection'));
                }
                // If filters from previous session load them
                if(localStorage.getItem('yAxisSelection') !== null){
                    that.sp.sel_y = JSON.parse(localStorage.getItem('yAxisSelection'));
                }

            }*/

            if(swarmdata && swarmdata.length>0){
                args.parsedData = swarmdata;
                //that.sp.loadData(args);
                //that.filterManager.initManager();
                that.graph1.loadData(data);
                that.graph2.loadData(data);
                that.filterManager.loadData(data);
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
            this.isClosed = true;
            this.$el.empty();
            this.triggerMethod('view:disconnect');
        }
    });
    return AVView;
});