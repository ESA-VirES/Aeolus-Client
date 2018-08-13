(function() {
    'use strict';
    var root = this;
    root.define([
        'backbone',
        'communicator',
        'timeslider',
        'globals',
        'underscore',
        'd3'
    ],
    function( Backbone, Communicator, timeslider, globals) {
        var TimeSliderView = Backbone.Marionette.ItemView.extend({
            id: 'timeslider',
            events: {
                'selectionChanged': 'onChangeTime',
                'recordClicked': 'onCoverageSelected',
                'displayChanged': 'onDisplayChanged'
            },
            initialize: function(options){
                this.options = options;
            },

            manualInit: function(){
                for (var i = 0; i < globals.products.models.length; i++) {
                    var prot = globals.products.models[i].get('timeSliderProtocol');
                    if(prot === 'WPS' || prot === 'INDEX'){
                        this.changeLayer({
                            name: globals.products.models[i].get('name'),
                            visible: globals.products.models[i].get('visible')
                        });
                    }
                }
            },
            render: function(){},
            
            onShow: function() {
                var that = this;

                this.listenTo(
                    Communicator.mediator, 'map:layer:change', this.changeLayer
                );
                this.listenTo(
                    Communicator.mediator, 'map:position:change', this.updateExtent
                );
                this.listenTo(
                    Communicator.mediator, 'date:selection:change',
                    this.onDateSelectionChange
                );

                Communicator.reqres.setHandler('get:time', this.returnTime);

                // Try to get CSRF token, if available set it for 
                // necesary ajax requests

                this.csrftoken = false;
                var name = 'csrftoken';
                if (document.cookie && document.cookie !== '') {
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = $.trim(cookies[i]);
                        // Does this cookie string begin with the name we want?
                        if (cookie.substring(0, name.length + 1) === (name + '=')) {
                            this.csrftoken = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }

                var selectionstart = new Date(this.options.brush.start);
                var selectionend = new Date(this.options.brush.end);

                if(localStorage.getItem('timeSelection')){
                    var time = JSON.parse(localStorage.getItem('timeSelection'));
                    selectionstart = new Date(time[0]);
                    selectionend = new Date(time[1]);
                }

                this.activeWPSproducts = [];

                var initopt = {
                    domain: {
                        start: new Date(this.options.domain.start),
                        end: new Date(this.options.domain.end)
                    },
                    displayLimit: 'P1Y2M',
                    brush: {
                        start: selectionstart,
                        end: selectionend
                    },
                    constrain: false,
                    brushTooltip: true,
                    debounce: 300,
                    ticksize: 10,
                    selectionLimit: (60*60*24*30), //15 Days
                    datasets: []
                };

                if (this.options.display){
                    initopt.display = {
                        start: new Date(this.options.display.start),
                        end: new Date(this.options.display.end)
                    };
                }

                if(localStorage.getItem('timeDomain')){
                    var domain = JSON.parse(localStorage.getItem('timeDomain'));
                    initopt.display = {
                        start: new Date(domain[0]),
                        end: new Date(domain[1])
                    };
                }

                this.slider = new TimeSlider(this.el, initopt);

                // Add selection helpers
                //this.slider.setBrushTooltip(true);

                // Set the offset of the tooltip
                this.slider.setBrushTooltipOffset([0, -135]);

                Communicator.mediator.trigger('time:change', {start:selectionstart, end:selectionend});
                // For viewers that are loaded after the TimeSlider announces its initial timespan there
                // has to be a way to get the timespan for their setup. This is a 'sloppy' way of 
                // accomplishing this:
                Communicator.mediator.timeOfInterest = {
                    start: selectionstart,
                    end: selectionend
                };

                $(this.el).append(
                    '<div type="button" class="btn btn-success darkbutton" id="calendarselection"><i class="fa fa-calendar" aria-hidden="true"></i></div>'
                );
                 $(this.el).append('<div id="calendarwidgetholder"></div>');

                // Initialise datepickers
                $.datepicker.setDefaults({
                    showOn: 'both',
                    dateFormat: 'dd.mm.yy',
                    changeYear: true,
                    yearRange: '-25:+5',
                });

                var datepickerWidget = this.$('#calendarwidgetholder').datepicker({
                    onSelect: function() {
                        var date = datepickerWidget.datepicker('getDate');
                        var beginTime = new Date(Date.UTC(
                            date.getFullYear(), date.getMonth(), date.getDate(),
                            date.getHours(),date.getMinutes(), date.getSeconds())
                        );
                        beginTime.setDate(beginTime.getDate() - 1);
                        beginTime.setUTCHours(22,0,0,0);

                        var endTime = new Date(Date.UTC(
                            date.getFullYear(), date.getMonth(), date.getDate(),
                            date.getHours(),date.getMinutes(), date.getSeconds())
                        );
                        endTime.setDate(endTime.getDate() + 1);
                        endTime.setUTCHours(2,0,0,0);

                        that.slider.center(beginTime, endTime);
                        $('#calendarwidgetholder').hide();

                        var  tos = Communicator.mediator.timeOfInterest;

                        var startSelection = new Date(Date.UTC(
                            date.getFullYear(), date.getMonth(), date.getDate(),
                            tos.start.getUTCHours(),tos.start.getMinutes(),
                            tos.start.getSeconds(), tos.start.getMilliseconds()
                        ));

                        var endSelection = new Date(Date.UTC(
                            date.getFullYear(), date.getMonth(), date.getDate(),
                            tos.end.getUTCHours(),tos.end.getMinutes(),
                            tos.end.getSeconds(), tos.end.getMilliseconds()
                        ));

                        var diff = (tos.end.getDate() - tos.start.getDate());
                        // If more then one day is selected limit end time to end of day
                        if (diff>=1){
                          endSelection.setUTCHours(23,59,59,999);
                        }
                        
                        that.slider.select(startSelection, endSelection);

                        var domain = that.slider.scales.x.domain();
                        Communicator.mediator.trigger(
                            'time:domain:change', 
                            {start: domain[0], end: domain[1]}
                        );
                    }
                });

                datepickerWidget.datepicker('setDate', selectionstart);
                this.$('#calendarwidgetholder').hide();

                $('#calendarselection').click(function(){
                    if($('#calendarwidgetholder').is(':visible') ){
                        $('#calendarwidgetholder').hide();
                    }else{
                        $('#calendarwidgetholder').show();
                    }
                });
                $('.timeslider .brush').attr('fill', '#333');
            }, // END of onShow

            onChangeTime: function(evt){
                // Check if start and end time is equal if yes increse end time by 1 minute
                var start = evt.originalEvent.detail.start;
                var end = evt.originalEvent.detail.end;
                if(end.getTime() - start.getTime() === 0){
                    this.slider.select(start, new Date(end.getTime()+(60*1000)));
                 }else{
                    Communicator.mediator.trigger('time:change', evt.originalEvent.detail);
                    // Update ToI in the global context:
                    Communicator.mediator.timeOfInterest = {start: start, end: end};
                    $('#calendarwidgetholder').datepicker('setDate', evt.originalEvent.detail.start);
                }
            },

            onDisplayChanged: function(evt){
                Communicator.mediator.trigger('time:domain:change', evt.originalEvent.detail);
            },

            onDateSelectionChange: function(opt) {
                this.slider.select(opt.start, opt.end);
            },

            fetch: function(start, end, params, callback){
                var request =  this.url + '?service=wps&request=execute&version=1.0.0&identifier=get_indices&DataInputs=index_id='+
                    this.id + ';begin_time='+getISODateTimeString(start)+ ';end_time='+getISODateTimeString(end)+'&RawDataOutput=output';

                d3.csv(request)
                    .row(function (row) {
                        return [new Date(row.time), Number(row.value), row.id];
                    })
                    .get(function(error, rows) { 
                        callback(rows);
                    });
            },

            fetchBubble: function(start, end, params, callback){
                var request = this.url + '?service=wps&request=execute&version=1.0.0&identifier=retrieve_bubble_index&DataInputs=collection_id='+
                this.id + ';begin_time='+getISODateTimeString(start)+';end_time='+getISODateTimeString(end)+'&RawDataOutput=output';
                d3.csv(request)
                    .row(function (row) {
                        return [
                            new Date(row.starttime),
                            new Date(row.endtime), 
                            {
                                id: row.identifier,
                                bbox: row.bbox.replace(/[()]/g,'').split(',').map(parseFloat)
                            }
                        ];
                    })
                    .get(function(error, rows) { 
                        callback(rows);
                    });
            },


            fetchWPS: function(start, end, params, callback){
                var request = this.url + '?service=wps&request=execute&version=1.0.0&identifier=getTimeData&DataInputs=collection='+
                this.id + ';begin_time='+getISODateTimeString(start)+';end_time='+getISODateTimeString(end)+'&RawDataOutput=times';
                d3.csv(request)
                    .row(function (row) {
                        return [
                            new Date(row.starttime),
                            new Date(row.endtime), 
                            {
                                id: row.identifier,
                                bbox: row.bbox.replace(/[()]/g,'').split(',').map(parseFloat)
                            }
                        ];
                    })
                    .get(function(error, rows) { 
                        callback(rows);
                    });
            },


            changeLayer: function (options) {
                if (!options.isBaseLayer){
                    var product = globals.products.find(function(model) { return model.get('name') === options.name; });
                    if (product){
                        if(options.visible && product.get('timeSlider')){
                            var extent = {left: -180, bottom: -90, right: 180, top: 90};
                            try{
                                extent = Communicator.reqres.request('map:get:extent');
                            }catch(err){
                                console.log('Warning: Map not initialized setting extent to default (-180,-90,180,90)')
                            }
                            var attrs;
                            switch (product.get('timeSliderProtocol')){
                                case 'WMS':
                                  this.slider.addDataset({
                                    id: product.get('view').id,
                                    color: product.get('color'),
                                    data: new TimeSlider.Plugin.WMS({
                                      url: product.get('view').urls[0],
                                      eoid: product.get('view').id,
                                      dataset: product.get('view').id
                                    })
                                  });
                                  break;
                                case 'EOWCS':
                                  this.slider.addDataset({
                                    id: product.get('download').id,
                                    color: product.get('color'),
                                    data: new TimeSlider.Plugin.EOWCS({
                                        url: product.get('download').url,
                                        eoid: product.get('download').id,
                                        dataset: product.get('download').id
                                     })
                                  });
                                  break;
                                case 'WPS':
                                  attrs = {
                                    id: product.get('download').id,
                                    url: product.get('download').url
                                  };
                                  
                                  this.slider.addDataset({
                                    id: product.get('download').id,
                                    color: product.get('color'),
                                    records: null,
                                    source: {fetch: this.fetchWPS.bind(attrs)}
                                  });
                                  this.activeWPSproducts.push(product.get('download').id);
                                  // For some reason updateBBox is needed, altough bbox it is initialized already.
                                  // Withouth this update the first time activating a layer after the first map move
                                  // the bbox doesnt seem to be defined in the timeslider library and the points shown are wrong
                                  //this.slider.updateBBox([extent.left, extent.bottom, extent.right, extent.top], product.get('download').id);
                                  break;

                                case 'WPS-INDEX':
                                  this.activeWPSproducts.push(product.get('download').id);
                                  attrs = {
                                    id: product.get('download').id,
                                    url: product.get('download').url
                                  };
                                  this.slider.addDataset({
                                    id: product.get('download').id,
                                    color: product.get('color'),
                                    records: null,
                                    source: {fetch: this.fetchBubble.bind(attrs)}
                                  });
                                  break;

                                case 'INDEX':
                                  attrs = {
                                    id: product.get('download').id,
                                    url: product.get('download').url
                                  };
                                  this.slider.addDataset({
                                    id: product.get('download').id,
                                    color: product.get('color'),
                                    lineplot: true,
                                    records: null,
                                    source: {fetch: this.fetch.bind(attrs)}
                                  });
                                  break;
                            } // END of switch

                        }else{
                            this.slider.removeDataset(product.get('download').id);
                            if (this.activeWPSproducts.indexOf(product.get('download').id)!==-1){
                                this.activeWPSproducts.splice(this.activeWPSproducts.indexOf(product.get('download').id), 1);
                            }
                        }
                    }
                }
            },

            returnTime: function(){
                return Communicator.mediator.timeOfInterest;
            },

            updateExtent: function(extent){
                for (var i=0; i<this.activeWPSproducts.length; i++){
                    //this.slider.updateBBox([extent.left, extent.bottom, extent.right, extent.top], this.activeWPSproducts[i]);
                }
            },

            onCoverageSelected: function(evt){
                var details = evt.originalEvent.detail;
                if (details.params.bbox){
                    var oneDay=1000*60*60*24;
                    if ( Math.ceil( (details.end - details.start)/oneDay)<10 ){
                        this.slider.select(details.start, details.end);
                        Communicator.mediator.trigger('map:set:extent', details.params.bbox);
                    }
                }
            }
        });
        return {'TimeSliderView':TimeSliderView};
    });
}).call( this );