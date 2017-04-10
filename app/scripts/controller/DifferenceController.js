(function() {
    'use strict';

    var root = this;

    root.require([
        'backbone',
        'communicator',
        'globals',
        'app',
    ],

    function( Backbone, Communicator, globals, App) {

        var DifferenceController = Backbone.Marionette.Controller.extend({

            initialize: function(options){

                this.selection_list = [];
                this.activeWPSproducts = [];
                this.selected_time = null;
                //this.selected_time = Communicator.reqres.request('get:time');

                this.listenTo(Communicator.mediator, "map:layer:change",this.changeLayer);
                this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChanged);
                this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
            },


            changeLayer: function(options) {
                if (!options.isBaseLayer){
                  var product = globals.products.find(function(model) { return model.get('name') == options.name; });
                  if (product){
                    if(options.visible && product.get('timeSlider')){

                        if (product.get("processes")){
                            _.each(product.get("processes"), function(process){
                                this.activeWPSproducts.push(process.layer_id);
                            },this);
                        }
                                              
                    }else{
                        _.each(product.get("processes"), function(process){
                            if (this.activeWPSproducts.indexOf(process.layer_id)!=-1)
                                this.activeWPSproducts.splice(this.activeWPSproducts.indexOf(process.layer_id), 1);
                            //console.log(this.activeWPSproducts);
                        },this);
                    }
                    this.checkSelections();
                  }
                }
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

            checkSelections: function(){
                /*if (this.selected_time == null)
                    this.selected_time = Communicator.reqres.request('get:time');

                if (this.activeWPSproducts.length > 0 && this.selection_list.length > 0 && this.selected_time){
                    this.sendRequest();
                }else{
                    Communicator.mediator.trigger("map:clear:image");
                    $(".colorlegend").empty();
                }*/
            },

            onTimeChange: function (time) {
                this.selected_time = time;
                this.checkSelections();
            },

            sendRequest: function(){

                Communicator.mediator.trigger("map:clear:image");

                var that = this;

                var getcoveragedifflist = [];
                var units = [];

                globals.products.each(function(model) {
                    if (model.get('visible')) {
                        var processes = model.get("processes");
                        _.each(processes, function(process){
                            if(process){
                                if (process.id == "getCoverageData"){
                                    getcoveragedifflist.push(process.layer_id);
                                    units.push(model.get("unit"));
                                }
                            }
                        }, this);
                    }
                }, this);

                if (getcoveragedifflist.length > 0 && this.selection_list[0].geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){

                    var bbox = this.selection_list[0].geometry.getBounds().toBBOX();

                    var url = "http://localhost:3080/browse/ows" + "?service=WPS&version=1.0.0&request=Execute&" +
                              "identifier=getCoverageDifference&" +
                              "DataInputs="+
                              "collections="+ getcoveragedifflist +";"+
                              "begin_time="+ getISODateTimeString(this.selected_time.start) +";"+
                              "end_time="+ getISODateTimeString(this.selected_time.end) +";"+
                              "bbox="+ bbox +";"+
                              "crs=4326&"+
                              "rawdataoutput=processed";

                    Communicator.mediator.trigger("map:load:image", url, this.selection_list[0].geometry.getBounds());

                    var unit = "";
                    var first = true;
                    _.each(units, function(u){
                        if (u) {
                            if (first){
                                unit = u;
                                first = false;
                            }else{
                                if (!unit == u)
                                    unit = "";
                            }
                        }

                    }, this);

                    var label_url = "http://localhost:3080/browse/ows" + "?service=WPS&version=1.0.0&request=Execute&" +
                              "identifier=getCoverageDifferenceLabel&" +
                              "DataInputs="+
                              "collections="+ getcoveragedifflist +";"+
                              "begin_time="+ getISODateTimeString(this.selected_time.start) +";"+
                              "end_time="+ getISODateTimeString(this.selected_time.end) +";"+
                              "bbox="+ bbox +";"+
                              "crs=4326" +";"+
                              "unit="+unit+"&"+
                              "rawdataoutput=processed";

                    $(".colorlegend").empty();
                    $(".colorlegend").append("<img id='theImg' src='" + label_url + "'/>");
                }
            }
        });
        return new DifferenceController();
    });

}).call( this );