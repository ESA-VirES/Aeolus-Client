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
            this.$('.d3canvas').append('<div id="graph" style="height:60%;"></div>');
            this.$('.d3canvas').append('<div id="filters" style="height:39%;"></div>');


            /*var renderSettings_ray = {
                xAxis: [
                    'rayleigh_datetime',
                    'rayleigh_datetime',
                ],
                yAxis: [
                    'rayleigh_altitude',
                    'rayleigh_dem_altitude'
                ],
                //y2Axis: [],
                combinedParameters: {
                    rayleigh_datetime: ['rayleigh_datetime_start', 'rayleigh_datetime_stop'],
                    rayleigh_altitude: ['rayleigh_altitude_bottom', 'rayleigh_altitude_top'],
                    mie_datetime: ['mie_datetime_start', 'mie_datetime_stop'],
                    mie_altitude: ['mie_altitude_bottom', 'mie_altitude_top']
                },
                colorAxis: [
                    'rayleigh_wind_velocity',
                    //'mie_wind_velocity',
                ],

            };*/







            var renderSettings_test = {
                xAxis: [
                    //'latitude_of_DEM_intersection'
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
                        'latitude_of_DEM_intersection_start',
                        'latitude_of_DEM_intersection_end'
                    ],
                    time: ['time_start', 'time_end'],
                },
                colorAxis: ['mie_wind_data']

            };

            var dataSettings = {
               
                /*rayleigh_dem_altitude: {
                    symbol: 'circle',
                    uom: 'm',
                    lineConnect: true
                },
                rayleigh_wind_velocity: {
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-3000,3000]
                    //outline: false
                },
                rayleigh_datetime_start: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },

                rayleigh_datetime_stop: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },

                velocity_at_DEM_intersection: {
                    symbol: 'circle',
                    uom: 'm',
                    lineConnect: true
                },*/



                time_start: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                time_end: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },

                time: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },




                mie_wind_data: {
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-40,40]
                    //outline: false
                },



            };

            if (this.graph === undefined){

                /*this.filterManager = new FilterManager({
                    el:'#filters',
                    filterSettings: filterSettings,
                });*/

                this.filterManager = globals.swarm.get('filterManager');
                

                this.graph = new graphly.graphly({
                    el: '#graph',
                    dataSettings: dataSettings,
                    renderSettings: renderSettings_test,
                    filterManager: globals.swarm.get('filterManager')
                });

                globals.swarm.get('filterManager').setRenderNode('#filters');

                //$('#tooltip').appendTo(document.body);

                /*fM.getNode().addEventListener(
                    'change',
                    (evt)=>{
                        // Check if event comes directly from el with filters id
                        if(evt.target.id === 'filters'){
                            //this.filters = evt.detail;
                            //this.renderData();
                             //prim_to_render.appearance.material._textures.image.copyFrom(self.p_plot.canvas);

                            var data = globals.swarm.get('data');
                            var positions = [];
                            for (var i = 0; i < data.rayleigh_lats.length; i++) {
                                if(i%3==0){
                                    positions.push(data.rayleigh_lons[i]);
                                    positions.push(data.rayleigh_lats[i]);
                                }
                            }
                            this.createCurtain(data, positions, 'pointcollection', 'band');
                        }
                    }
                );*/

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
                that.graph.loadData(data);
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
                // Prepare to create list of available parameters
                /*var availableParameters = {};
                globals.products.each(function(prod) {
                    if(prod.get('download_parameters')){
                        var par = prod.get('download_parameters');
                        var newKeys = _.keys(par);
                        _.each(newKeys, function(key){
                            availableParameters[key] = par[key];
                        });
                    }
                });
                this.sp.uom_set = availableParameters;

                // Remove uom of time
                if(this.sp.uom_set.hasOwnProperty('Timestamp')){
                    this.sp.uom_set['Timestamp'].uom = null;
                }

                // Special cases for separeted vectors
                this.separateVector('B_error', 'B_error', ['X', 'Y', 'Z'], ',');
                this.separateVector('B', 'B_NEC', ['N', 'E', 'C'], '_');
                this.separateVector('v_SC', 'v_SC', ['N', 'E', 'C'], '_');
                this.separateVector('B_VFM', 'B_VFM', ['X', 'Y', 'Z'], ',');
                this.separateVector('B', 'B_NEC_res_IGRF12',
                    ['N_res_IGRF12', 'E_res_IGRF12', 'C_res_IGRF12'], '_'
                );
                this.separateVector('B', 'B_NEC_res_SIFM',
                    ['N_res_SIFM', 'E_res_SIFM', 'C_res_SIFM'], '_'
                );
                this.separateVector('B', 'B_NEC_res_CHAOS-5-Combined',
                    ['N_res_CHAOS-5-Combined',
                    'E_res_CHAOS-5-Combined',
                    'C_res_CHAOS-5-Combined'], '_'
                );
                this.separateVector('B', 'B_NEC_res_Custom_Model',
                    ['N_res_Custom_Model',
                    'E_res_Custom_Model',
                    'C_res_Custom_Model'], '_'
                );
                this.sp.uom_set['MLT'] = {uom: null, name:'Magnetic Local Time'};
                this.sp.uom_set['QDLat'] = {uom: 'deg', name:'Quasi-Dipole Latitude'};
                this.sp.uom_set['QDLon'] = {uom: 'deg', name:'Quasi-Dipole Longitude'};
                this.sp.uom_set['Dst'] = {uom: null, name:'Disturbance storm time Index'};
                this.sp.uom_set['Kp'] = {uom: null, name:'Global geomagnetic storm Index'};

                $('#tmp_download_button').unbind( 'click' );
                $('#tmp_download_button').remove();

                if(data.length > 0){

                    // TODO: Hack to handle how analyticsviewer re-renders button, need to update analaytics viewer
                    d3.select(this.el).append('button')
                        .attr('type', 'button')
                        .attr('id', 'tmp_download_button')
                        .attr('class', 'btn btn-success')
                        .attr('style', 'position: absolute; right: 55px; top: 7px; z-index: 1000;')
                        .text('Download');

                    $('#tmp_download_button').click(function(){
                        Communicator.mediator.trigger('dialog:open:download:filter', true);
                    });

                    // If data parameters have changed
                    if (!_.isEqual(this.prevParams, _.keys(data[0]))){
                        // Define which parameters should be selected defaultwise as filtering
                        var filterstouse = this.sp.fieldsforfiltering.concat([
                            'n', 'T_elec', 'Bubble_Probability',
                            'Relative_STEC_RMS', 'Relative_STEC', 'Absolute_STEC',
                            'IRC', 'FAC',
                            'EEF'
                        ]);

                        filterstouse = filterstouse.concat(['MLT']);
                        var residuals = _.filter(_.keys(data[0]), function(item) {
                            return item.indexOf('_res') !== -1;
                        });
                        // If new datasets contains residuals add those instead of normal components
                        if(residuals.length > 0){
                            filterstouse = filterstouse.concat(residuals);
                        }else{
                            if(filterstouse.indexOf('F') === -1){
                              filterstouse.push('F');
                            }
                            if(filterstouse.indexOf('F_error') === -1){
                                filterstouse.push('F_error');
                            }
                        }

                        this.sp.fieldsforfiltering = filterstouse;
                        localStorage.setItem('selectedFilterList', JSON.stringify(filterstouse));

                        // Check if we want to change the y-selection
                        // If previous does not contain key data and new one
                        // does we add key parameter to selection in plot
                        var parasToCheck = [
                            'n', 'F', 'n', 'Absolute_STEC', 'FAC', 'EEF'
                        ];

                        _.each(parasToCheck, function(p){
                            this.checkPrevious(
                                p, this.prevParams.indexOf(p), _.keys(data[0]).indexOf(p)
                            );
                        }, this);

                        // If previous does not contain a residual a new one does
                        // we switch the selection to residual value
                        var resIndex = residuals.indexOf(
                            _.find(_.keys(data[0]), function(item) {
                                return item.indexOf('F_res') !== -1;
                            })
                        );
                        if(resIndex !== -1){
                            var resPar = residuals[resIndex];
                            this.checkPrevious(
                                resPar, this.prevParams.indexOf(resPar),
                                _.keys(data[0]).indexOf(resPar),
                                true
                            );
                        }

                        localStorage.setItem('yAxisSelection', JSON.stringify(this.sp.sel_y));
                        localStorage.setItem('xAxisSelection', JSON.stringify(this.sp.sel_x));
                    } // End of IF to see if data parameters have changed


                    this.prevParams = _.keys(data[0]);
                    localStorage.setItem('prevParams', JSON.stringify(this.prevParams));

                    // Check for special case of only EEF selected
                    var onlyEEF = true;

                    if(this.$('.d3canvas').length === 1){
                        $('#scatterdiv').empty();
                        $('#parallelsdiv').empty();
                        var args = {
                            selector: this.$('.d3canvas')[0],
                            parsedData: data
                        };
                        if(onlyEEF){
                            this.sp.toIgnore = ['id','active', 'Radius'];
                        }
                        this.sp.loadData(args);
                    }
                }else{ // Else for if data is greater 0
                    $('#scatterdiv').empty();
                    $('#parallelsdiv').empty();
                    $('#scatterdiv').append('<div id="nodatainfo">No data available for your current selection</div>');
                }*/

                //this.filterManager.initManager();
                if(Object.keys(data).length > 0){
                    //this.graph.loadData(data);
                    // TODO: Iterate through all ids and load to corresponding graphs
                    this.graph.loadData(data['AEOLUS']);
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