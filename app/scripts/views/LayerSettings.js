(function() {
    'use strict';

    var root = this;

    root.define([
        'backbone',
        'communicator',
        'globals',
        'hbs!tmpl/LayerSettings',
        'underscore'
    ],

    function( Backbone, Communicator, globals, LayerSettingsTmpl ) {

        var LayerSettings = Backbone.Marionette.Layout.extend({

            template: {type: 'handlebars', template: LayerSettingsTmpl},
            className: "panel panel-default optionscontrol not-selectable",

            initialize: function(options) {
                this.selected = null;
                this.selected_satellite = "Alpha";

            },

            renderView: function(){
                this.plot = globals.cesGraph.batchDrawer;

                // Unbind first to make sure we are not binding to many times
                this.stopListening(Communicator.mediator, "layer:settings:changed", this.onParameterChange);

                // Event handler to check if tutorial banner made changes to a model in order to redraw settings
                // If settings open rerender view to update changes
                this.listenTo(Communicator.mediator, "layer:settings:changed", this.onParameterChange);

                this.$(".panel-title").html('<h3 class="panel-title"><i class="fa fa-fw fa-sliders"></i> ' + this.current_model.get("name") + ' Settings</h3>');

                this.$('.close').on("click", _.bind(this.onClose, this));
                this.$el.draggable({ 
                    containment: "#main",
                    scroll: false,
                    handle: '.panel-heading'
                });
                var options = this.current_model.get("parameters");
                var height = this.current_model.get("height");
                var outlines = this.current_model.get("outlines");
                var showColorscale = this.current_model.get("showColorscale");
                var protocol = this.current_model.get("views")[0].protocol;
                var keys = _.keys(options);
                var option = '';
                var contours = this.current_model.get("contours");
                var granularity = this.current_model.get("granularity");
                var altitude = this.current_model.get("altitude");
                var altitudeExtentSet = this.current_model.get("altitudeExtentSet");
                var altitudeExtent = this.current_model.get("altitudeExtent");
                var pId = this.current_model.get("download").id;
                var that = this;


                // Special filtering for L2A related to having group visualization
                // also on globe
                if(pId === 'ALD_U_N_2A'){
                    var selected = null;
                    _.each(keys, function(key){
                        if(options[key].selected){
                            selected = key;
                        }
                    });
                    if (granularity === 'group') {
                        /*if(!selected.startsWith('group')){
                            // Need to change selected to default l2a group parameter
                            delete options[selected].selected;
                            options['group_backscatter'].selected = true;
                        }*/
                        for (var i = keys.length - 1; i >= 0; i--) {
                            if(!keys[i].startsWith('group')){
                                keys.splice(i,1);
                            }
                        }
                    } else {
                        for (var i = keys.length - 1; i >= 0; i--) {
                            if(keys[i].startsWith('group')){
                                keys.splice(i,1);
                            }
                        }
                    }
                }

                // TODO: Make sure once data is loaded to only allow selection
                // or to change selection of parameters that are available in the data

                if(granularity !== 'group' || pId === 'ALD_U_N_2A'){
                    // Filter out unavailable data parameters
                    /*var currdata = globals.swarm.get('data');
                    if(!$.isEmptyObject(currdata)){
                        for (var i = keys.length - 1; i >= 0; i--) {
                            var currProd = this.current_model.get('download').id;
                            if(currdata.hasOwnProperty(currProd)){
                                if(!currdata[currProd].hasOwnProperty(keys[i])){
                                    keys.splice(i,1);
                                }
                            }
                        }
                    }*/
                    this.enableInputs();
                } else {
                    this.disableInputs();
                }

                _.each(keys, function(key){
                    if(!options[key].hasOwnProperty('notAvailable')){
                        if(options[key].selected){
                            that.selected = key;
                            option += '<option value="'+ key + '" selected>' + options[key].name + '</option>';
                        }else{
                            option += '<option value="'+ key + '">' + options[key].name + '</option>';
                        }
                    }
                });

                this.$("#options").empty();

                this.$("#options").append(option);

                if(options[this.selected].description){
                    this.$("#description").text(options[this.selected].description);
                }
                this.addLogOption(options);

                this.$("#options").unbind();
                // Add event handler for change in drop down selection
                this.$("#options").change(this.onOptionsChanged.bind(this));

                // Set values for color scale ranges
                this.$("#range_min").val(options[this.selected].range[0]);
                this.$("#range_max").val(options[this.selected].range[1]);
                
                // Register necessary key events
                this.registerKeyEvents(this.$("#range_min"));
                this.registerKeyEvents(this.$("#range_max"));
                

                var colorscale_options = "";
                var selected_colorscale;
                _.each(this.colorscaletypes, function(colorscale){
                    var prodId = that.current_model.get('download').id;
                    if(globals.dataSettings[prodId][that.selected].colorscale == colorscale){
                        selected_colorscale = colorscale;
                        colorscale_options += '<option value="'+ colorscale + '" selected>' + colorscale + '</option>';
                    }else{
                        colorscale_options += '<option value="'+ colorscale + '">' + colorscale + '</option>';
                    }
                });

                this.$("#style").unbind();

                this.$("#style").empty();
                this.$("#style").append(colorscale_options);

                this.$("#style").change(function(evt){
                    var prodId = that.current_model.get('download').id;
                    var colScale = $(evt.target).find("option:selected").text();
                    if(globals.dataSettings[prodId].hasOwnProperty(that.selected)){
                        globals.dataSettings[prodId][that.selected].colorscale = colScale;
                    }
                    selected_colorscale = colScale;
                    options[that.selected].colorscale = colScale;
                    that.current_model.set("parameters", options);

                    if(options[that.selected].hasOwnProperty("logarithmic"))
                        that.createScale(options[that.selected].logarithmic);
                    else
                        that.createScale();

                    Communicator.mediator.trigger("layer:parameters:changed", that.current_model.get("download").id);
                });

                this.$("#opacitysilder").unbind();
                this.$("#opacitysilder").val(this.current_model.attributes.opacity*100);
                this.$("#opacitysilder").on("input change", function(){
                    var opacity = Number(this.value)/100;
                    that.current_model.set("opacity", opacity);
                    Communicator.mediator.trigger('productCollection:updateOpacity', {model:that.current_model, value:opacity});
                });

                

                if(!(typeof outlines === 'undefined')){
                    var checked = "";
                    if (outlines)
                        checked = "checked";

                    $("#outlines input").unbind();
                    $("#outlines").empty();
                    this.$("#outlines").append(
                        '<form style="vertical-align: middle;">'+
                        '<label class="valign" for="outlines" style="width: 120px;">Outlines </label>'+
                        '<input class="valign" style="margin-top: -5px;" type="checkbox" name="outlines" value="outlines" ' + checked + '></input>'+
                        '</form>'
                    );

                    this.$("#outlines input").change(function(evt){
                        var outlines = !that.current_model.get("outlines");
                        that.current_model.set("outlines", outlines);
                        Communicator.mediator.trigger("layer:outlines:changed", that.current_model.get("views")[0].id, outlines);
                    });
                }

                if(!(typeof showColorscale === 'undefined')){
                    var checked = "";
                    if (showColorscale)
                        checked = "checked";

                    $("#showColorscale input").unbind();
                    $("#showColorscale").empty();
                    this.$("#showColorscale").append(
                        '<form style="vertical-align: middle;">'+
                        '<label class="valign" for="showColorscale" style="width: 120px; margin">Legend </label>'+
                        '<input class="valign" style="margin-top: -5px;" type="checkbox" name="showColorscale" value="showColorscale" ' + checked + '></input>'+
                        '</form>'
                    );

                    this.$("#showColorscale input").change(function(evt){
                        var showColorscale = !that.current_model.get("showColorscale");
                        that.current_model.set("showColorscale", showColorscale);
                        Communicator.mediator.trigger("layer:colorscale:show", that.current_model.get("download").id);
                    });
                }


                if(!(typeof this.current_model.get("coefficients_range") === 'undefined')){

                    this.$("#coefficients_range").empty();

                    this.$("#coefficients_range").append(
                    '<li style="margin-top: 5px;">'+
                        '<label for="coefficients_range_min" style="width: 120px;">Coefficients range</label>'+
                        '<input id="coefficients_range_min" type="text" style="width:30px;"/>'+
                        '<input id="coefficients_range_max" type="text" style="width:30px; margin-left:8px"/>'+
                    '</li>'+
                    '<p style="font-size:0.85em; margin-left:130px;"> [-1,-1]: No range limitation</p>'
                    );

                    this.$("#coefficients_range_min").val(this.current_model.get("coefficients_range") [0]);
                    this.$("#coefficients_range_max").val(this.current_model.get("coefficients_range") [1]);

                    // Register necessary key events
                    this.registerKeyEvents(this.$("#coefficients_range_min"));
                    this.registerKeyEvents(this.$("#coefficients_range_max"));
                    
                }

                if(options[this.selected].hasOwnProperty("logarithmic"))
                    this.createScale(options[that.selected].logarithmic);
                else
                    this.createScale();

                this.createHeightTextbox(this.current_model.get("height"));

                if(altitude!==null){
                    this.$("#height").empty();
                    this.$("#height").append(
                        '<form style="vertical-align: middle;">'+
                        '<label for="heightvalue" style="width: 120px;">Altitude filter</label>'+
                        '<input id="heightvalue" type="text" style="width:30px; margin-left:8px"/>'+
                        '</form>'
                    );
                    this.$("#heightvalue").val(altitude);
                    this.$("#height").append(
                        '<p style="font-size:0.85em; margin-left: 120px;">Maximum altitude (Km)</p>'
                    );
                    // Register necessary key events
                    this.registerKeyEvents(this.$("#heightvalue"));
                }

                if(altitudeExtentSet!==null){
                    $("#minAltitude").off();
                    $("#maxAltitude").off();
                    $("#altitudeExtent").empty();
                    // TODO: I think we need a set extent for the vertical
                    // curtains as different curtains sections have different
                    // altitude ranges which creates issues, so for now we 
                    // will not allow activating/deactivating the extent
                    this.$("#altitudeExtent").append(
                        '<form style="vertical-align: middle;">'+
                        '<label for="minAltitude" style="width: 120px;">Altitude extent</label>'+
                        '<input id="minAltitude" type="text" style="width:40px;"/>'+
                        '<input id="maxAltitude" type="text" style="width:40px; margin-left:8px"/>'+
                        '</form>'
                    );
                    this.$("#minAltitude").val(altitudeExtent[0]);
                    this.$("#maxAltitude").val(altitudeExtent[1]);
                    // Register necessary key events
                    this.registerKeyEvents(this.$("#minAltitude"));
                    this.registerKeyEvents(this.$("#maxAltitude"));


                }
            
                if(this.selected == "Fieldlines"){
                    $("#coefficients_range").hide();
                    $("#opacitysilder").parent().hide();
                }else{
                    $("#coefficients_range").show();
                    $("#opacitysilder").parent().show();
                }

            },

            onShow: function(view){
                this.plot = globals.cesGraph.batchDrawer;
                // Overwrite with graphly colorscales
                if (this.plot.hasOwnProperty('colorscales')) {
                    this.colorscaletypes = Object.keys(this.plot.colorscales);
                }
                this.colorscaletypes = _.sortBy(this.colorscaletypes, function (c) {return c;});

                var that = this;
                var granularity = this.model.get("granularity");
                if(granularity){
                    // Add options for three satellites
                    $("#granularity_selection").off();
                    $("#granularity_selection").empty();
                    $("#granularity_selection").append('<label for="granularity_selection" style="width:70px;">Granularity </label>');
                    $("#granularity_selection").append('<select style="margin-left:4px;" name="granularity_selec" id="granularity_selec"></select>');

                   
                    var granOpts = this.model.get('granularity_options');
                    if(granOpts){
                        for (var i = 0; i < granOpts.length; i++) {
                            var selected = '';
                            if (granOpts[i] == this.model.get('granularity')){
                                selected = 'selected';
                            }
                            $('#granularity_selec').append('<option value="'+granOpts[i]+'"'+selected+'>'+granOpts[i]+'</option>');
                        }
                        
                        $("#granularity_selection").on('change', function(){
                            var granularity = $("#granularity_selection").find("option:selected").val();
                            that.model.set('granularity', granularity);
                            var pId = that.model.get("download").id;
                            // Switch between group and observation parameters
                            // when switching l2a granularity
                            if(pId === 'ALD_U_N_2A'){
                                var options = that.model.get("parameters");
                                var keys = _.keys(options);
                                var selected = null;
                                _.each(keys, function(key){
                                    if(options[key].selected){
                                        selected = key;
                                    }
                                });
                                if(granularity === 'group'){
                                    if(!selected.startsWith('group')){
                                        // Need to change selected to default l2a group parameter
                                        delete options[selected].selected;
                                        options['group_backscatter'].selected = true;
                                        that.model.set('parameters', options);
                                        that.onShow();
                                    }
                                } else {
                                    if(selected.startsWith('group')){
                                        delete options[selected].selected;
                                        options['SCA_extinction'].selected = true;
                                        that.model.set('parameters', options);
                                        that.onShow();
                                    }
                                }
                            }
                            // If group granularity is selected we hide some things
                            if(granularity === 'group' && pId !== 'ALD_U_N_2A'){
                                that.disableInputs();
                            } else {
                                that.enableInputs();
                            }
                            Communicator.mediator.trigger("layer:granularity:beforechange", that.model.get("download").id);
                        });
                    }
                }

                if(this.model.get("containerproduct")){
                    // Add options for three satellites
                    $("#satellite_selection").off();
                    $("#satellite_selection").empty();
                    $("#satellite_selection").append('<label for="satellite_selec" style="width:120px;">Satellite </label>');
                    $("#satellite_selection").append('<select style="margin-left:4px;" name="satellite_selec" id="satellite_selec"></select>');

                    if( globals.swarm.products.hasOwnProperty(this.model.get('id')) ){
                        var options = Object.keys(globals.swarm.products[this.model.get('id')]);
                        for (var i = 0; i < options.length; i++) {
                            var selected = '';
                            if (options[i] == 'Alpha'){
                                selected = 'selected';
                            }
                            $('#satellite_selec').append('<option value="'+options[i]+'"'+selected+'>'+options[i]+'</option>');
                        }
                    }

                    $("#satellite_selec option[value="+this.selected_satellite+"]").prop("selected", "selected");

                    var model = null;
                    var that = this;
                    globals.products.forEach(function(p){
                        if(p.get("download").id == globals.swarm.products[that.model.get("id")][that.selected_satellite]){
                            model = p;
                        }
                    });
                    this.current_model = model;

                    $("#satellite_selection").on('change', function(){
                        that.selected_satellite = $("#satellite_selection").find("option:selected").val();
                        var model = null;
                        globals.products.forEach(function(p){
                            if(p.get("download").id == globals.swarm.products[that.model.get("id")][that.selected_satellite]){
                                model = p;
                            }
                        });
                        that.current_model = model;
                        that.renderView();
                    });

                }else{
                    this.current_model = this.model;
                }
                this.renderView();
            },

            disableInputs: function(){
                $("#options").prop("disabled", true);
                $("#style").prop("disabled", true);
                $("#range_min").prop("disabled", true);
                $("#range_max").prop("disabled", true);
            },

            enableInputs: function(){
                $("#options").prop("disabled", false);
                $("#style").prop("disabled", false);
                $("#range_min").prop("disabled", false);
                $("#range_max").prop("disabled", false);
            },

            onClose: function() {
                this.close();
            }, 

            onParameterChange: function(){
                this.onShow();
            },

            onOptionsChanged: function(){

                var options = this.current_model.get("parameters");

                if(options.hasOwnProperty(this.selected)){
                    delete options[this.selected].selected;
                }

                $("#description").empty();

                this.selected = $("#options").find("option:selected").val();

                this.$("#style").empty();
                var colorscale_options = "";
                var selected_colorscale;
                _.each(this.colorscaletypes, function(colorscale){
                    if(options[this.selected].colorscale == colorscale){
                        selected_colorscale = colorscale;
                        colorscale_options += '<option value="'+ colorscale + '" selected>' + colorscale + '</option>';
                    }else{
                        colorscale_options += '<option value="'+ colorscale + '">' + colorscale + '</option>';
                    }
                }, this);

                this.$("#style").append(colorscale_options);

                $("#range_min").val(options[this.selected].range[0]);
                $("#range_max").val(options[this.selected].range[1]);
                
                this.createScale();


                this.$("#logarithmic").empty();
                this.addLogOption(options);

                options[this.selected].selected = true;

                if(options[this.selected].description){
                    this.$("#description").text(options[this.selected].description);
                }

                var altitude = this.current_model.get("altitude");

                //this.createHeightTextbox(this.current_model.get("height"));
                if(altitude!==null){
                    this.$("#height").empty();
                    this.$("#height").append(
                        '<form style="vertical-align: middle;">'+
                        '<label for="heightvalue" style="width: 120px;">Altitude filter</label>'+
                        '<input id="heightvalue" type="text" style="width:30px; margin-left:8px"/>'+
                        '</form>'
                    );
                    this.$("#heightvalue").val(altitude);
                    this.$("#height").append(
                        '<p style="font-size:0.85em; margin-left: 120px;">Maximum altitude (Km)</p>'
                    );
                    // Register necessary key events
                    this.registerKeyEvents(this.$("#heightvalue"));
                }

                if(this.selected == "Fieldlines"){
                    $("#coefficients_range").hide();
                    $("#opacitysilder").parent().hide();
                }else{
                    $("#coefficients_range").show();
                    $("#opacitysilder").parent().show();
                }

                Communicator.mediator.trigger(
                    "layer:parameters:changed",
                    this.current_model.get("download").id
                );
            },

            registerKeyEvents: function(el){
                var that = this;
                el.keypress(function(evt) {
                    if(evt.keyCode == 13){ //Enter pressed
                        evt.preventDefault();
                        that.applyChanges();
                    }else{
                        that.createApplyButton();
                    }
                });

                el.keyup(function(evt) {
                    if(evt.keyCode == 8){ //Backspace clicked
                        that.createApplyButton();
                    }
                });

                // Add click event to select text when clicking or tabbing into textfield
                el.click(function () { $(this).select(); });
            },

            createApplyButton: function(){
                var that = this;
                if($("#changesbutton").length == 0){
                    $("#applychanges").append('<button type="button" class="btn btn-default" id="changesbutton" style="width: 100%;"> Apply changes </button>');
                    $("#changesbutton").click(function(evt){
                        that.applyChanges();
                    });
                }
            },

            handleRangeRespone: function(response){
                var options = this.current_model.get("parameters");
                var resp = response.split(',');
                var range = [Number(resp[1]), Number(resp[2])];
                // Make range "nicer", rounding depending on extent
                range = d3.scale.linear().domain(range).nice().domain();
                $("#range_min").val(range[0]);
                $("#range_max").val(range[1]);
                options[this.selected].range = range;
                this.current_model.set("parameters", options);
                this.createScale();
                Communicator.mediator.trigger("layer:parameters:changed", this.current_model.get("download").id);
            },

            handleRangeResponseError: function(response){
                showMessage(
                    'warning', 
                    'There is a problem requesting the range values for the color scale,'+
                    ' please revise and set them to adequate values if necessary.', 15
                );
            },

            handleRangeChange: function(){
                var options = this.current_model.get("parameters");
                $("#range_min").val(options[this.selected].range[0]);
                $("#range_max").val(options[this.selected].range[1]);

                this.current_model.set("parameters", options);
                if(options[this.selected].hasOwnProperty("logarithmic"))
                    this.createScale(options[this.selected].logarithmic);
                else
                    this.createScale();

                Communicator.mediator.trigger("layer:parameters:changed", this.current_model.get("download").id);
            },

            applyChanges: function(){

                var options = this.current_model.get("parameters");

                    //this.$("#coefficients_range_max").val(this.current_model.get("coefficients_range") [1]);

                var error = false;
                var model_change = false;

                // Check color ranges
                var range_min = parseFloat($("#range_min").val());
                error = error || this.checkValue(range_min,$("#range_min"));

                var range_max = parseFloat($("#range_max").val());
                error = error || this.checkValue(range_max,$("#range_max"));

                var minAltitude = parseFloat($("#minAltitude").val());
                error = error || this.checkValue(minAltitude,$("#minAltitude"));
                
                var maxAltitude = parseFloat($("#maxAltitude").val());
                error = error || this.checkValue(maxAltitude,$("#maxAltitude"));

                var prodId = this.current_model.get('download').id;

                // Set parameters and redraw color scale
                if(!error){
                    options[this.selected].range = [range_min, range_max];

                    if(globals.dataSettings[prodId].hasOwnProperty(this.selected)){
                        globals.dataSettings[prodId][this.selected].extent = [range_min, range_max];
                    }
                    this.current_model.set("altitudeExtent", [minAltitude, maxAltitude]);

                    if(options[this.selected].hasOwnProperty("logarithmic"))
                        this.createScale(options[this.selected].logarithmic);
                    else
                        this.createScale();
                }

                if(!error){
                    // Remove button
                    $("#applychanges").empty();

                    //Apply changes
                    this.current_model.set("parameters", options);
                    Communicator.mediator.trigger("layer:parameters:changed", this.current_model.get("download").id);
                }
            },

            checkValue: function(value, textfield){
                if (isNaN(value)){
                    textfield.addClass("text_error");
                    return true;
                }else{
                    textfield.removeClass("text_error");
                    return false;
                }
            },

            setModel: function(model){
                this.model = model;
                /*this.model.on('change:parameters', function(model, data) {
                    
                }, this);*/
            },

            sameModel: function(model){
                return this.model.get("name") == model.get("name");
            },

            onUploadSelectionChanged: function(evt) {
            },

            addLogOption: function(options){
                var that = this;
                var prodId = this.current_model.get('download').id;
                var logscale = defaultFor(
                    globals.dataSettings[prodId][this.selected].logarithmic,
                    false
                );

                var checked = "";
                if (logscale) {
                    checked = "checked";
                }

                this.$("#logarithmic").empty();

                this.$("#logarithmic").append(
                    '<form style="vertical-align: middle;">'+
                    '<label class="valign" for="logarithmic" style="width: 120px;">Log. colorscale </label>'+
                    '<input class="valign" style="margin-top: -5px;" type="checkbox" name="logarithmic" value="logarithmic" ' + checked + '></input>'+
                    '</form>'
                );

                this.$("#logarithmic input").change(function(evt){
                    var prodId = that.current_model.get('download').id;
                    globals.dataSettings[prodId][that.selected].logarithmic =
                        defaultFor(
                            !globals.dataSettings[prodId][that.selected].logarithmic,
                            true
                        );
                    var currPars = globals.dataSettings[prodId][that.selected];
                    if (currPars.logarithmic) {
                        // If logarithmic scale was activated we need to make 
                        // sure extent does not contain 0
                        if(currPars.hasOwnProperty('extent')){
                            var ext = currPars.extent;
                            if(ext[0]<=0 && ext[1]>0) {
                                // Try to get data of this parameter and
                                // calculate extent
                                var data = globals.swarm.get('data');
                                if(Object.keys(data).length > 0){
                                    if(data.hasOwnProperty(that.selected)) {
                                        var tmpDomain = d3.extent(
                                            data[that.selected].filter(function(val) {
                                                return val>0.0;
                                            })
                                        );
                                        currPars.extent[0] = tmpDomain[0];
                                    }
                                } else {
                                    currPars.extent = [1e-10, 100];
                                }

                                var options = that.current_model.get("parameters");
                                options[that.selected].range = currPars.extent;
                                that.current_model.set("parameters", options);
                            }
                        }
                    }
                    Communicator.mediator.trigger("layer:parameters:changed", that.current_model.get("download").id);
                    //that.renderView();
                    that.onShow();
                });

            },

            createScale: function(){

                var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹",
                formatPower = function(d) { 
                    if (d>=0)
                        return (d + "").split("").map(function(c) { return superscript[c]; }).join("");
                    else if (d<0)
                        return "⁻"+(d + "").split("").map(function(c) { return superscript[c]; }).join("");
                };

                $("#setting_colorscale").empty();
                var margin = 20;
                var width = $("#setting_colorscale").width();
                var scalewidth =  width - margin *2;

                var prodId = this.current_model.get('download').id;

                var range_min = globals.dataSettings[prodId][this.selected].extent[0];
                var range_max = globals.dataSettings[prodId][this.selected].extent[1];
                var uom = globals.dataSettings[prodId][this.selected].uom;
                var modifiedUOM = globals.dataSettings[prodId][this.selected].modifiedUOM;
                var style = globals.dataSettings[prodId][this.selected].colorscale;
                var logscale = defaultFor(globals.dataSettings[prodId][this.selected].logarithmic, false);

                $("#setting_colorscale").append(
                    '<div id="gradient" style="width:'+scalewidth+'px;margin-left:'+margin+'px"></div>'
                );
                /*'<div class="'+style+'" style="width:'+scalewidth+'px; height:20px; margin-left:'+margin+'px"></div>'*/

                this.plot.setColorScale(style);
                var base64_string = this.plot.getColorScaleImage().toDataURL();
                $('#gradient').css('background-image', 'url(' + base64_string + ')');


                var svgContainer = d3.select("#setting_colorscale").append("svg")
                    .attr("width", width)
                    .attr("height", 40);

                var axisScale;
                
                if(logscale){
                    axisScale = d3.scale.log();
                }else{
                    axisScale = d3.scale.linear();
                }

                axisScale.domain([range_min, range_max]);
                axisScale.range([0, scalewidth]);

                var xAxis = d3.svg.axis()
                    .scale(axisScale);

                if(logscale){
                    xAxis.ticks(0, '0.0e');
                }else{
                    var step = (range_max - range_min)/5
                    xAxis.tickValues(
                        d3.range(range_min,range_max+step, step)
                    );
                    xAxis.tickFormat(d3.format("g"));
                }

                var g = svgContainer.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(" + [margin, 3]+")")
                    .call(xAxis);

                if(modifiedUOM){
                    var textEl = g.append("text")
                        .style("text-anchor", "middle")
                        .style("font-size", "1.1em")
                        .attr("transform", "translate(" + [scalewidth/2, 35]+")");

                    textEl.append("tspan")
                            .text(modifiedUOM);

                    textEl.append("tspan")
                        .style("font-size", "0.7em")
                        .text(' (modified)');

                } else if(uom){
                    g.append("text")
                        .style("text-anchor", "middle")
                        .style("font-size", "1.1em")
                        .attr("transform", "translate(" + [scalewidth/2, 35]+")")
                        .text(uom);
                }

                svgContainer.selectAll(".tick").select("line")
                    .attr("stroke", "black");
            },

            createHeightTextbox: function(height){
                var that = this;
                this.$("#height").empty();
                if( (height || height==0) && this.selected != "Fieldlines"){
                    this.$("#height").append(
                        '<form style="vertical-align: middle;">'+
                        '<label for="heightvalue" style="width: 120px;">Height</label>'+
                        '<input id="heightvalue" type="text" style="width:30px; margin-left:8px"/>'+
                        '</form>'
                    );
                    this.$("#heightvalue").val(height);
                    this.$("#height").append(
                        '<p style="font-size:0.85em; margin-left: 120px;">Above ellipsoid (Km)</p>'
                    );

                    // Register necessary key events
                    this.registerKeyEvents(this.$("#heightvalue"));
                }
            }

        });

        return {"LayerSettings": LayerSettings};

    });

}).call( this );
