(function() {
    'use strict';
    var root = this;
    root.define([
        'backbone',
        'communicator',
        'views/AuthView',
        'models/AuthModel',
        'hbs!tmpl/BulletLayer',
        'hbs!tmpl/iFrame',
        'globals',
        'app',
        'underscore'
    ],
    function( Backbone, Communicator, av, am, BulletLayerTmpl, iFrameTmpl, globals, App) {
        var LayerItemView = Backbone.Marionette.ItemView.extend({
            tagName: "li",
            events: {
                'drop' : 'drop',
                'change': 'onChange',
                'click .fa-adjust': 'onOpenSlider',
                'slide .ui-slider': 'onOpacityAdjust'
            },

            initialize: function(options) {

                this.$slider = $('<div>').slider({
                    range: "max",
                    max: 100,
                    min: 0
                });
                this.$slider.width(100);
                this.authview = null;
                this.activeDatasets = [];
            },
            onShow: function(view){

                this.listenTo(Communicator.mediator, "layer:activate", this.layerActivate);

                $( ".sortable" ).sortable({
                    revert: true,
                    delay: 90,
                    containment: "#products",
                    axis: "y",
                    forceHelperSize: true,
                    forcePlaceHolderSize: true,
                    placeholder: "sortable-placeholder",
                    handle: '.fa-sort',
                    start: function(event, ui) {
                        $( ".ui-slider" ).detach();
                        $('.fa-adjust').toggleClass('active')
                        $('.fa-adjust').popover('hide');
                    },
                    stop: function(event, ui) {
                        ui.item.trigger('drop', ui.item.index());
                    }
                });

                $('.fa-adjust').popover({
                    trigger: 'manual'
                });

                // If this model parameters is empty remove settings button
                var par = this.model.get('parameters');
                if(typeof par === 'undefined' || 
                    Object.keys(par).length === 0 && par.constructor === Object){
                    this.$el.find('.fa-sliders').css('visibility', 'hidden');
                }

                var that = this;

                if(this.model.get("containerproduct")){
                    this.$el.find( ".fa-sort" ).css("visibility", "hidden");
                    this.$el.appendTo("#containerproductslist");
                    this.$el.find('.fa-sliders').click(function(){
                                
                    if (_.isUndefined(App.layerSettings.isClosed) || App.layerSettings.isClosed) {
                            App.layerSettings.setModel(that.model);
                            App.optionsBar.show(App.layerSettings);
                        } else {
                            if(App.layerSettings.sameModel(that.model)){
                                App.optionsBar.close();
                            }else{
                                App.layerSettings.setModel(that.model);
                                App.optionsBar.show(App.layerSettings);
                            }
                        }
                    });

                }else{
                    if (this.$el.has( ".fa-sliders" ).length){

                        if(this.model.get("satellite")==="Swarm"){
                            this.$el.find( ".fa-sort" ).css("visibility", "hidden");
                        }

                        if(this.model.get("timeSliderProtocol")==="INDEX"){
                            this.$el.find( ".fa-sliders" ).css("visibility", "hidden");
                            this.$el.find( ".fa-sort" ).css("visibility", "hidden");
                        }else{
                            this.$el.find('.fa-sliders').click(function(){
                                
                                if (_.isUndefined(App.layerSettings.isClosed) || App.layerSettings.isClosed) {
                                    App.layerSettings.setModel(that.model);
                                    App.optionsBar.show(App.layerSettings);
                                } else {
                                    if(App.layerSettings.sameModel(that.model)){
                                        App.optionsBar.close();
                                    }else{
                                        App.layerSettings.setModel(that.model);
                                        App.optionsBar.show(App.layerSettings);
                                    }
                                }
                            });
                        }
                    }
                }
            },


            onChange: function(evt){

                var visible = evt.target.checked;
                var isBaseLayer = false;
                if (this.model.get('view').isBaseLayer){
                    isBaseLayer = true;
                }
                
                if(visible && !isBaseLayer && this.model.hasOwnProperty('download') &&
                   this.model.get('download').id !== 'AUX_ISR_1B'){
                    // Activate setting directly when product is being activated
                    if (_.isUndefined(App.layerSettings.isClosed) || App.layerSettings.isClosed) {
                        App.layerSettings.setModel(this.model);
                        App.optionsBar.show(App.layerSettings);
                        $('#optionsBar').fadeTo(100, 0.3, function() {$(this).fadeTo(100, 1.0); });
                    } else {
                        if(!App.layerSettings.sameModel(this.model)){
                            App.layerSettings.setModel(this.model);
                            App.optionsBar.show(App.layerSettings);
                            $('#optionsBar').fadeTo(100, 0.3, function() { $(this).fadeTo(100, 1.0); });
                        }
                    }
                } else {
                    if (!(_.isUndefined(App.layerSettings.isClosed) || App.layerSettings.isClosed)) {
                        App.optionsBar.close();
                    }
                }

                var options = { 
                    name: this.model.get('name'),
                    isBaseLayer: isBaseLayer,
                    visible: visible 
                };

                var product = globals.products.find(
                    function(p){return p.get('name') === options.name;}
                );
                if(product){
                    // TODO: Think how can manage all different datatype
                    //       of the aeolus mission
                    // If a product is being activated we deactivate all
                    // other products if they are not WMS
                    globals.products.each(function(p) {
                        if(p.get('download').id !== product.get('download').id &&
                           p.get('visible') && p.get('views')[0].protocol !== 'WMS' &&
                           product.get('views')[0].protocol !== 'WMS'){

                            p.set('visible', false);
                            Communicator.mediator.trigger('map:layer:change', { 
                                name: p.get('name'), isBaseLayer: false, visible: false 
                            });

                            //p.set('visible', false);
                            /*Communicator.mediator.trigger(
                                'layer:activate',  p.get('download').id
                            );*/
                        }
                       
                    });
                }
                if(typeof product === 'undefined'){
                    product = globals.overlays.find(
                        function(p){return p.get('name') === options.name;}
                    );
                }
                if(typeof product === 'undefined'){
                    product = globals.baseLayers.find(
                        function(p){return p.get('name') === options.name;}
                    );
                }

                if(product){
                    this.model.set('visible', options.visible);
                    //product.set('visible', options.visible);
                    Communicator.mediator.trigger('map:layer:change', options);
                }

                

            },

            drop: function(event, index) {
                Communicator.mediator.trigger('productCollection:updateSort', {model:this.model, position:index});
            },

            onOpenSlider: function(evt){

                if (this.$('.fa-adjust').toggleClass('active').hasClass('active')) {
                    this.$('.fa-adjust').popover('show');
                    this.$('.popover-content')
                        .empty()
                        .append(this.$slider);
                    this.$( ".ui-slider" ).slider( "option", "value", this.model.get("opacity") * 100 );


                } else {
                    this.$slider.detach();
                    this.$('.fa-adjust').popover('hide');
                }
            },

            onOpacityAdjust: function(evt, ui) {
                this.model.set("opacity", ui.value/100);
                Communicator.mediator.trigger('productCollection:updateOpacity', {model:this.model, value:ui.value/100});
            },

            layerActivate: function(layer){
                if(this.model.get('views') && this.model.get('views')[0].id == layer){
                    //this.model.set("visible", true);
                    var checkbox = $( "input[type$='checkbox']", this.$el);
                    //checkbox.attr('checked', true);
                    checkbox.prop( "checked", true );
                }

                if(this.model.hasOwnProperty('id') && this.model.get('id') == layer){
                    // Check for multiproduct datasets
                    var checkbox = $( "input[type$='checkbox']", this.$el);
                    checkbox.prop( "checked", true );
                }
            },

            onRender: function(){
                //TODO: This is a somwhat temporary solution, we need to think about
                // how we want to handle the DEM for the Virtual Globe
                if (this.model.get("name") == "Digital Elevation Model"){
                    this.$el.empty();
                }
             }

        });
        return {'LayerItemView':LayerItemView};
    });
}).call( this );
