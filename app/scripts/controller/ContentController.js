(function() {
    'use strict';
    var root = this;
    root.require([
        'backbone',
        'communicator',
        'app',
        'globals',
        'tutorial'
    ],
    function( Backbone, Communicator, App , globals, tutorial) {

        var ContentController = Backbone.Marionette.Controller.extend({
            initialize: function(options){
                this.listenTo(Communicator.mediator, "dialog:open:about", this.onDialogOpenAbout);
                this.listenTo(Communicator.mediator, "ui:open:layercontrol", this.onLayerControlOpen);
                this.listenTo(Communicator.mediator, "ui:open:toolselection", this.onToolSelectionOpen);
                this.listenTo(Communicator.mediator, "ui:open:options", this.onOptionsOpen);
                this.listenTo(Communicator.mediator, "ui:open:storybanner", this.StoryBannerOpen);
                this.listenTo(Communicator.mediator, "app:reset", this.OnAppReset);
                this.listenTo(Communicator.mediator, "layer:open:settings", this.onOpenLayerSettings);
                this.listenTo(Communicator.mediator, "ui:fullscreen:globe", this.onFullscrenGlobe);
                this.listenTo(Communicator.mediator, "ui:fullscreen:analytics", this.onFullscrenAnalytics);
                this.listenTo(Communicator.mediator, "application:reset", this.onApplicationReset);
                this.listenTo(Communicator.mediator, "application:save", this.onApplicationSave);
                this.listenTo(Communicator.mediator, "application:load", this.onApplicationLoad);
                this.listenTo(Communicator.mediator, "dialog:show:upload", this.onShowUpload);
                this.listenTo(Communicator.mediator, "dialog:show:dataconfiguration", this.onOpenDataConfiguration);
                this.listenTo(Communicator.mediator, "ui:open:tutorial", this.onOpenTutorial);
                
            },

            onOpenTutorial: function() {
                tutorial.resetAndRunTutorial();
            },

            onFullscrenGlobe: function () {
                Communicator.mediator.trigger("layout:switch:singleview", "CesiumViewer");
            },

            onFullscrenAnalytics: function () {
                Communicator.mediator.trigger('layout:switch:singleview', 'AVViewer');
                //Communicator.mediator.trigger("region:show:view", 'tl','AVViewer');
            },

            onDialogOpenAbout: function(event){
                App.dialogRegion.show(App.DialogContentView);
            },
            onShowUpload: function(event){
                if($('#uploadDialogContainer').is(':visible')){
                    $('#uploadDialogContainer').hide();
                } else {
                    $('#uploadDialogContainer').show();
                }
            }, 
            onLayerControlOpen: function(event){
                //We have to render the layout before we can
                //call show() on the layout's regions
                if (_.isUndefined(App.layout.isClosed) || App.layout.isClosed) {
                    App.leftSideBar.show(App.layout);
                    App.layout.baseLayers.show(App.baseLayerView);
                    App.layout.products.show(App.productsView);
                    App.layout.overlays.show(App.overlaysView);
                } else {
                    App.layout.close();
                }
               
            },
            onToolSelectionOpen: function(event){
                if (_.isUndefined(App.toolLayout.isClosed) || App.toolLayout.isClosed) {
                    App.rightSideBar.show(App.toolLayout);
                    App.toolLayout.selection.show(App.selectionToolsView);
                    App.toolLayout.visualization.show(App.visualizationToolsView);
                    App.toolLayout.mapmode.show(App.visualizationModesView);
                } else {
                    App.toolLayout.close();
                }
            },
            onOptionsOpen: function(event){
                if (_.isUndefined(App.optionsLayout.isClosed) || App.optionsLayout.isClosed) {
                    App.optionsBar.show(App.optionsLayout);
                    App.optionsLayout.colorramp.show(App.colorRampView);
                } else {
                    App.optionsLayout.close();
                }
            },

            StoryBannerOpen: function(event){

                // Instance StoryBanner view
                App.storyBanner = new App.views.StoryBannerView({
                    template: App.templates[event]
                });
                
                if (_.isUndefined(App.storyView.isClosed) || App.storyView.isClosed) {
                    //if (confirm('Starting the tutorial will reset your current view, are you sure you want to continue?')) {
                        App.storyView.show(App.storyBanner);
                    //}
                    
                } else {
                    App.storyView.close();
                }

            },

            OnAppReset: function(){
                App.layout.close();
                App.toolLayout.close();
                App.optionsLayout.close();
                App.optionsBar.close();
            },

            onOpenLayerSettings: function(layer){

                var product = false;
                for (var i = 0; i < globals.products.models.length; i++) {
                    if(globals.products.models[i].get("views")[0].id==layer){
                        product = globals.products.models[i];
                    }
                }
                
                if(!product){
                    for (var i = 0; i < globals.swarm.filtered_collection.models.length; i++) {
                        if(globals.swarm.filtered_collection.models[i].get("id")==layer){
                            product = globals.swarm.filtered_collection.models[i];
                        }
                    }
                }

                if (_.isUndefined(App.layerSettings.isClosed) || App.layerSettings.isClosed) {
                    App.layerSettings.setModel(product);
                    App.optionsBar.show(App.layerSettings);
                } else {
                    if(App.layerSettings.sameModel(product)){
                        App.optionsBar.close();
                    }else{
                        App.layerSettings.setModel(product);
                        App.optionsBar.show(App.layerSettings);
                    }
                }

            },
            onOpenDataConfiguration: function(){
                if (_.isUndefined(App.dataConfigurationView.isClosed) || App.dataConfigurationView.isClosed) {
                    App.viewContent.show(App.dataConfigurationView);
                } else {
                    App.viewContent.close();
                }
            },
            onApplicationReset: function(){
                if (typeof(Storage) !== "undefined") {
                    var tutorialShown = localStorage.getItem('tutorialShown');
                    localStorage.clear();
                    localStorage.setItem(
                        'serviceVersion',
                        JSON.stringify(globals.version)
                    );
                    if(tutorialShown){
                        localStorage.setItem('tutorialShown', true);
                    }
                    location.reload(true);
                }
            },

            onApplicationSave: function(){
                if (typeof(Storage) !== "undefined") {
                    var settingsJSON = JSON.stringify(localStorage);
                    var blob = new Blob([settingsJSON], {
                        type: 'text/plain;charset=utf-8'
                    });
                    var dateObj = new Date();
                    var month = ('0' + (dateObj.getUTCMonth() + 1)).slice(-2);
                    var day = ('0' + dateObj.getUTCDate()).slice(-2);
                    var year = dateObj.getUTCFullYear();

                    var newdate = ''+year + month + day + '_';

                    saveAs(blob, newdate+'vires_settings.json');
                }

            },
            onApplicationLoad: function(){
                if (typeof(Storage) !== "undefined") {
                    $('#fileInputJSON').remove();
                    var infield = $('<input id="fileInputJSON" type="file" name="name" style="display: none;" />');
                    $('body').append(infield);

                    function onChange(event) {
                        var reader = new FileReader();
                        reader.onload = onReaderLoad;
                        reader.readAsText(event.target.files[0]);
                    }

                    function onReaderLoad(event){
                        var obj = JSON.parse(event.target.result);

                        // Check for version, if needed do conversion
                        if(obj.hasOwnProperty('serviceVersion')){

                            if(JSON.parse(obj.serviceVersion) === '1.3'){
                                showMessage('danger',
                                    'We are sorry, the configuration you are trying to '+
                                    'load is from an older version of the service and no longer supported.',
                                    35
                                );
                            } else {
                                localStorage.clear();
                                for( var key in obj ){
                                    localStorage.setItem(key, obj[key]);
                                }
                                localStorage.setItem('configurationLoaded', true);
                                // We also dont want the tutorial to run so we set it to true
                                localStorage.setItem('tutorialShown', true);
                                window.location.reload();
                            }
                        } else {
                            showMessage('danger',
                                'We are sorry, the configuration you are trying to '+
                                'load is from an older version of the service and no longer supported.',
                                35
                            );
                        }
                    }

                    $('#fileInputJSON').on('change', onChange);

                    $('#fileInputJSON').trigger('click');
                }
            }

        });
        return new ContentController();
    });

}).call( this );