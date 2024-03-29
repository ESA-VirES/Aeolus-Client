
var SCALAR_PARAM = [];
var VECTOR_PARAM = [];
var VECTOR_BREAKDOWN = {};

(function() {
    'use strict';

    var root = this;

    root.define([
            'backbone',
            'globals',
            'cesium',
            'regions/DialogRegion', 'regions/UIRegion',
            'layouts/LayerControlLayout',
            'layouts/ToolControlLayout',
            'layouts/OptionsLayout',
            'core/SplitView/WindowView',
            'communicator', 'filepond',
            'jquery', 'backbone.marionette',
            'controller/ContentController',
            'controller/DownloadController',
            'controller/SelectionManagerController',
            'controller/LoadingController',
            'controller/LayerController',
            'controller/SelectionController',
            'controller/DifferenceController',
            'controller/DataController'
        ],

        function(Backbone, globals, Cesium, DialogRegion,
            UIRegion, LayerControlLayout, ToolControlLayout, OptionsLayout,
            WindowView, Communicator, FilePond) {

        var Application = Backbone.Marionette.Application.extend({
            initialize: function(options) {
            },

            configure: function(config) {

                var imagerenderercanvas = $('<canvas/>',{id: 'imagerenderercanvas'});
                $('body').append(imagerenderercanvas);

                var uploadDialogContainer = $('<div/>',{id: 'uploadDialogContainer'});
                $('body').append(uploadDialogContainer);
                //uploadDialogContainer.style('visibility', 'hidden');

                // Create a multi file upload component
                const pond = FilePond.create({
                    allowMultiple: true,
                    labelIdle: ('Drag & Drop your files or <span class="filepond--label-action"> Browse </span><br>'+
                                'Use uncompressed product file (DBL, EEF)<br>'+
                                'Additional information in the <a target="_blank" href="/faq">FAQ</a>'),
                    name: 'file',
                    server: 'upload/',
                    onprocessfile: function(error, file){
                        window.setTimeout(
                            function(){
                                Communicator.mediator.trigger('user:collection:change');
                                globals.products.each(function(prod){
                                    if(prod.get('visible')){
                                        var options = { 
                                            name: prod.get('name'),
                                            isBaseLayer: false,
                                            visible: false
                                        };
                                        Communicator.mediator.trigger('map:layer:change', options);
                                        options.visible = true;
                                        Communicator.mediator.trigger('map:layer:change', options);
                                    }
                                });
                            },
                            1000
                        );
                    }
                });

                // Add it to the DOM
                $(uploadDialogContainer)[0].appendChild(pond.element);


                var v = {}; //views
                var m = {}; //models
                var t = {}; //templates

                // Application regions are loaded and added to the Marionette Application
                _.each(config.regions, function(region) {
                    var obj = {};
                    obj[region.name] = "#" + region.name;
                    this.addRegions(obj);
                    console.log("Added region " + obj[region.name]);
                }, this);

                //Load all configured views
                _.each(config.views, function(viewDef) {
                    var View = require(viewDef);
                    $.extend(v, View);
                }, this);

                //Load all configured models
                _.each(config.models, function(modelDef) {
                    var Model = require(modelDef);
                    $.extend(m, Model);
                }, this);

                //Load all configured templates
                _.each(config.templates, function(tmplDef) {
                    var Tmpl = require(tmplDef.template);
                    t[tmplDef.id] = Tmpl;
                }, this);

                this.templates = t;
                this.views = v;


                //Map attributes are loaded and added to the global map model
                globals.objects.add('mapmodel', new m.MapModel({
                        visualizationLibs : config.mapConfig.visualizationLibs,
                        center: config.mapConfig.center,
                        zoom: config.mapConfig.zoom,
                        sun: _.has(config.mapConfig, 'showSun') ? config.mapConfig.showSun: true,
                        moon: _.has(config.mapConfig, 'showMoon') ? config.mapConfig.showMoon: true,
                        skyBox: _.has(config.mapConfig, 'showSkyBox') ? config.mapConfig.showSkyBox: true,
                        skyAtmosphere: _.has(config.mapConfig, 'skyAtmosphere') ? config.mapConfig.skyAtmosphere: true,
                        backgroundColor: _.has(config.mapConfig, 'backgroundColor') ? config.mapConfig.backgroundColor: "#000"
                    })
                );

                // Check if version of service is set and if it differs from the
                // current version
                var serviceVersion;
                var numberSV = NaN;
                if(localStorage.getItem('serviceVersion') !== null){
                    serviceVersion = JSON.parse(
                        localStorage.getItem('serviceVersion')
                    );
                    // If service version older then 1.3 it should not be
                    // loaded anyhow, but we add check here just in case
                    var versionssegments = serviceVersion.split('.');
                    if(versionssegments.length>1){
                        numberSV = Number(versionssegments[0]+'.'+versionssegments[1]);
                    }
                    if(serviceVersion!==globals.version){
                        if(localStorage.getItem('configurationLoaded') !== null){
                            // A configuration from a previous version was loaded
                            localStorage.removeItem('configurationLoaded');
                            
                            if(isNaN(numberSV) || numberSV<1.3){
                                localStorage.clear();
                                showMessage('success',
                                    'The configuration you are trying to load is outdated.', 35
                                );
                            } else if(numberSV === 1.4){
                                // In version 1.4 all parameters are requested
                                // so we need to identify which parameter
                                // are used to make sure they are available
                                var usedPars = [
                                    JSON.parse(localStorage.getItem('xAxisSelection')),
                                    JSON.parse(localStorage.getItem('yAxisSelection')),
                                    JSON.parse(localStorage.getItem('y2AxisSelection')),
                                    JSON.parse(localStorage.getItem('colorAxisSelection')),
                                    JSON.parse(localStorage.getItem('colorAxis2Selection'))
                                ].flat(2);

                                var dataSettings = JSON.parse(localStorage.getItem('dataSettings'));
                                for (var uu = 0; uu < usedPars.length; uu++) {
                                    if(usedPars[uu] !== null){
                                        // Look for parameter in product config
                                        if(dataSettings.hasOwnProperty(usedPars[uu])){
                                            dataSettings[usedPars[uu]].active = true;
                                        }
                                    }
                                }
                                localStorage.setItem('dataSettings', JSON.stringify(dataSettings));
                            } else {
                                localStorage.setItem(
                                    'serviceVersion',
                                    JSON.stringify(globals.version)
                                );
                            }

                        } else {
                            // A new version has been loaded, here we could 
                            // differentiate which version was previous and which
                            // one ist the new, for now we reset and save the new
                            // version
                            showMessage('success',
                                'A new version ('+globals.version+') of the service has been released. '+
                                'Your configuration has been updated.</br>'+
                                'You can find information on the changes in the '+
                                '<b><a target="_blank" href="/changelog">changelog</a></b>.', 35
                            );
                            localStorage.clear();
                            localStorage.setItem(
                                'serviceVersion',
                                JSON.stringify(globals.version)
                            );
                        }
                    }
                } else {
                    // This should be the case when loading version 2.3 for the 
                    // first time (or when the localstorage is empty)
                    localStorage.clear();

                    localStorage.setItem(
                        'serviceVersion',
                        JSON.stringify(globals.version)
                    );
                    
                    showMessage('success',
                        'A new version ('+globals.version+') of the service has been released. '+
                        'Your configuration has been updated.</br>'+
                        'You can find information on the changes in the '+
                        '<b><a target="_blank" href="/changelog">changelog</a></b>.', 35
                    );
                }


                //Base Layers are loaded and added to the global collection
                // If there are already saved baselayer config in the local
                // storage use that instead

                if(localStorage.getItem('baseLayersConfig') !== null){
                    config.mapConfig.baseLayers = JSON.parse(localStorage.getItem('baseLayersConfig'));
                }

                _.each(config.mapConfig.baseLayers, function(baselayer) {

                    globals.baseLayers.add(
                        new m.LayerModel({
                            name: baselayer.name,
                            visible: baselayer.visible,
                            view: {
                                id : baselayer.id,
                                urls : baselayer.urls,
                                protocol: baselayer.protocol,
                                projection: baselayer.projection,
                                attribution: baselayer.attribution,
                                matrixSet: baselayer.matrixSet,
                                style: baselayer.style,
                                format: baselayer.format,
                                resolutions: baselayer.resolutions,
                                maxExtent: baselayer.maxExtent,
                                gutter: baselayer.gutter,
                                buffer: baselayer.buffer,
                                units: baselayer.units,
                                transitionEffect: baselayer.transitionEffect,
                                isphericalMercator: baselayer.isphericalMercator,
                                isBaseLayer: true,
                                wrapDateLine: baselayer.wrapDateLine,
                                zoomOffset: baselayer.zoomOffset,
                                    //time: baselayer.time // Is set in TimeSliderView on time change.
                            },
                            views: baselayer.views
                        })
                    );
                    console.log("Added baselayer " + baselayer.id );
                }, this);
                
                var autoColor = {
                    colors : d3.scale.category10(),
                    index : 0,
                    getColor: function () { return this.colors(this.index++) }
                };


                //Productsare loaded and added to the global collection
                var ordinal = 0;
                var domain = [];
                var range = [];

                // Remove three first colors as they are used by the products
                //autoColor.getColor();autoColor.getColor();autoColor.getColor();

                // If there are already saved product config in the local
                // storage use that instead

                var clickEvent = "require(['communicator'], function(Communicator){Communicator.mediator.trigger('application:reset');});";

                // Add reset button to loadscreen just in case some configuration
                // has been done incorrectly 
                $('#loadscreen').append('<button style="position:absolute;top:5px;right:5px;" type="button" onclick="'+clickEvent+'">Reset client</button>');

                if(localStorage.getItem('productsConfig') !== null){

                    showMessage('success',
                         'The configuration of your last visit has been loaded, '+
                         'if you would like to reset to the default configuration click '+
                         '<b><a href="javascript:void(0);" onclick="'+clickEvent+'">here</a></b> '+
                         'or the Reset button under the Workspace tab above.', 35
                    );


                    // Need to check if we need to migrate user data to new version (new data)
                    var product_config = JSON.parse(localStorage.getItem('productsConfig'));

                    // Go through products in original configuration file and see if available
                    // in user configuration, if not add them to it
                    var m_p = config.mapConfig.products;
                    for (var i = 0; i < m_p.length; i++) {
                        if(product_config.length>i){
                            if(product_config[i].download.id != m_p[i].download.id){
                                // If id is not the same a new product was inserted and thus 
                                // needs to be inserted into the old configuration of the user
                                product_config.splice(i, 0, m_p[i]);
                            }
                        }else{
                            // If length of config is longer then user config new data was apended
                            product_config.push(m_p[i]);
                        }

                        // Make sure download parameters are always loaded from script
                        // as well as granularity options
                        product_config[i].download_parameters = m_p[i].download_parameters;
                        product_config[i].download_groups = m_p[i].download_groups;
                        if(m_p[i].hasOwnProperty('granularity_options')){
                            product_config[i].granularity_options = m_p[i].granularity_options;
                        }

                        // Check if there are changes saved for parameter settings
                        if(localStorage.getItem('dataSettings') !== 'null'){
                            var setts = JSON.parse(localStorage.getItem('dataSettings'));
                            for (var key in product_config[i].parameters){
                                if(setts.hasOwnProperty(key)){
                                    for (var parkey in product_config[i].parameters[key]){
                                        var convertedparkey = parkey;
                                        if(convertedparkey === 'range'){
                                            convertedparkey = 'extent';
                                        }
                                        if(setts[key].hasOwnProperty(convertedparkey) && convertedparkey === 'extent'){
                                            product_config[i].parameters[key][parkey] = setts[key][convertedparkey];
                                        }
                                    }
                                }
                            }
                        }
                        // Make sure process id is also always downloaded from config
                        product_config[i].process = m_p[i].process;

                        // Make sure aux met parameters are up to date
                        if(product_config[i].download.id === 'AUX_MET_12'){

                            if(!product_config[i].hasOwnProperty('altitude')){
                                product_config[i].altitude = defaultFor(m_p[i].altitude, 25);
                            }

                            if (!product_config[i].parameters.hasOwnProperty('layer_temperature_off_nadir')){
                                product_config[i].parameters = m_p[i].parameters;
                            }
                        }
                    }


                    config.mapConfig.products = product_config;
                }

                // Check if we have user permission info, if yes only load
                // products available to the user
                if(typeof USERPERMISSIONS !== 'undefined'){
                    var allowedProducts = [];
                    for (var i = 0; i < USERPERMISSIONS.length; i++) {
                        if(USERPERMISSIONS[i].indexOf('access_user_collection')==-1){
                            var undIdx = USERPERMISSIONS[i].indexOf('_');
                            var currId = USERPERMISSIONS[i].substring(undIdx+1);
                            // Check if collections is public collection
                            if(currId.indexOf('_public') !== -1){
                                // If only the public permissions are available 
                                // we add the information to make use of the public
                                // collections, if also the privileged collection
                                // is available we ignore the public one
                                currId = currId.replace('_public', '');
                                if(USERPERMISSIONS.findIndex(function(item) {
                                  var actualId = item.substring(USERPERMISSIONS[i].indexOf('_')+1);
                                  return actualId === currId;
                                }) === -1) {
                                  globals.publicCollections[currId] = true;
                                }
                            }
                            allowedProducts.push(currId);
                        }
                    }

                    config.mapConfig.products = config.mapConfig.products
                        .filter(function(prod){
                            return (
                                prod.download.id === 'ADAM_albedo' ||
                                allowedProducts.indexOf(prod.download.id) !== -1
                            );
                        });
                }
                

                _.each(config.mapConfig.products, function(product) {
                    var p_color = product.color ? product.color : autoColor.getColor();
                    if(product.download.id === 'AUX_MET_12'){

                    }
                    var lm = new m.LayerModel({
                        name: product.name,
                        visible: product.visible,
                        ordinal: ordinal,
                        timeSlider: product.timeSlider,
                        // Default to WMS if no protocol is defined
                        timeSliderProtocol: (product.timeSliderProtocol) ? product.timeSliderProtocol : "WMS",
                        color: p_color,
                        //time: products.time, // Is set in TimeSliderView on time change.
                        opacity: (product.opacity) ? product.opacity : 1,
                        views: product.views,
                        view: {isBaseLayer: false},
                        download: {
                            id: product.download.id,
                            protocol: product.download.protocol,
                            url: product.download.url
                        },
                        process: product.process,
                        unit: product.unit,
                        parameters: product.parameters,
                        download_parameters: product.download_parameters,
                        download_groups: product.download_groups,
                        height: product.height,
                        outlines: product.outlines,
                        model: product.model,
                        coefficients_range: product.coefficients_range,
                        satellite: product.satellite,
                        tileSize: (product.tileSize) ? product.tileSize : 256,
                        validity: product.validity,
                        showColorscale: defaultFor(product.showColorscale, true),
                        altitude: defaultFor(product.altitude, null),
                        altitudeExtentSet: defaultFor(product.altitudeExtentSet, null),
                        altitudeExtent: defaultFor(product.altitudeExtent, [0, 25]),
                    });

                    if(product.hasOwnProperty('granularity_options')){
                        lm.set('granularity_options', product.granularity_options);
                        lm.set('granularity', defaultFor(product.granularity, product.granularity_options[0]));
                    }

                    if(lm.get('model')){
                        lm.set('contours', defaultFor( product.contours,false));
                    }

                    if(lm.get('download').id === 'Custom_Model'){
                        var shcFile = localStorage.getItem('shcFile');
                        if(shcFile !== null){
                            shcFile = JSON.parse(shcFile);
                            lm.set('shc', shcFile.data);
                            lm.set('shc_name', shcFile.name);
                        }
                    }
                    
                    globals.products.add(lm);

                    if(product.processes){
                        domain.push(product.processes[0].layer_id);
                        range.push(p_color);
                    }
                    
                    console.log("Added product " + product.name );
                }, this);

                // Check if datasettings already available, and also from which
                // service version the datasettings are coming from
                if(!isNaN(numberSV) && numberSV>1.4 && 
                    localStorage.getItem('dataSettings') !== null){
                    globals.dataSettings = JSON.parse(localStorage.getItem('dataSettings'));
                    // Check if ADAM albedo is correctly loaded
                    if(globals.dataSettings.hasOwnProperty('ADAM_albedo')){
                        if(globals.dataSettings['ADAM_albedo'].hasOwnProperty('nadir')){
                            if(!globals.dataSettings['ADAM_albedo']['nadir'].hasOwnProperty('extent')){
                                globals.dataSettings['ADAM_albedo']['nadir'].extent = [0,1];
                            }
                        }
                        if(globals.dataSettings['ADAM_albedo'].hasOwnProperty('offnadir')){
                            if(!globals.dataSettings['ADAM_albedo']['offnadir'].hasOwnProperty('extent')){
                                globals.dataSettings['ADAM_albedo']['offnadir'].extent = [0,1];
                            }
                        }
                    }
                } else {
                    // Go through products and fill global datasettings
                    globals.products.each(function(product){
                        var downloadPars = product.get('download_parameters');
                        var productConf = product.get('parameters');
                        var prodId = product.get('download').id;
                        var prevDataSettings = JSON.parse(localStorage.getItem('dataSettings'));
                        // Get keys we currently request for visualization
                        var downloadKeys = [];

                        if(globals.fieldList.hasOwnProperty(prodId)){
                            if(Array.isArray(globals.fieldList[prodId])){
                                downloadKeys = globals.fieldList[prodId];
                            } else {
                                for (var key in globals.fieldList[prodId]){
                                    downloadKeys = downloadKeys.concat(
                                        globals.fieldList[prodId][key]
                                    );
                                }
                            }
                        }
                        var isAux = prodId.indexOf('AUX_')!==-1;
                        for(var key in downloadPars){
                            if(!globals.dataSettings[prodId].hasOwnProperty(key) && 
                                downloadKeys.indexOf(key)!==-1){
                                var parInfo = {};
                                // Check if parameter defined in product config
                                if(productConf.hasOwnProperty(key)){
                                    for(var prk in productConf[key]){
                                        parInfo[prk] = productConf[key][prk];
                                    }
                                }
                                if(downloadPars[key].hasOwnProperty('uom')){
                                    parInfo.uom = downloadPars[key].uom;
                                }
                                if(downloadPars[key].hasOwnProperty('required')){
                                    parInfo.active = true;
                                }
                                if(downloadPars[key].hasOwnProperty('active')){
                                    parInfo.active = downloadPars[key].active;
                                }
                                // For now we activate all auxiliary parameters per 
                                // default
                                // TODO: Will need to change once 2D parameters are introduced
                                if(isAux && prodId!=='AUX_MET_12'){
                                    parInfo.active = true;
                                }
                                globals.dataSettings[prodId][key] = parInfo;
                            } else if(downloadKeys.indexOf(key)!==-1){
                                // Add info if available in product config
                                if(productConf.hasOwnProperty(key)){
                                    for(var prk in productConf[key]){
                                        if(productConf[key][prk]!==null){
                                            globals.dataSettings[prodId][key][prk] = productConf[key][prk];
                                        }
                                    }
                                }
                                // Add active info if already present
                                if(downloadPars[key].hasOwnProperty('required')){
                                    globals.dataSettings[prodId][key].active = true;
                                }
                                if(downloadPars[key].hasOwnProperty('active')){
                                    globals.dataSettings[prodId][key].active = downloadPars[key].active;
                                }
                                // For now we activate all auxiliary parameters per 
                                // default
                                if(isAux && prodId!=='AUX_MET_12'){
                                    globals.dataSettings[prodId][key].active = true;
                                }
                            }
                            if(prevDataSettings && prevDataSettings.hasOwnProperty(key)){
                                if(prevDataSettings[key].hasOwnProperty('active')){
                                    globals.dataSettings[prodId][key].active = true;
                                }
                            }
                        }
                    });
                    localStorage.setItem('dataSettings', JSON.stringify(globals.dataSettings));
                    localStorage.setItem('serviceVersion', JSON.stringify(globals.version));
                }

                var productcolors = d3.scale.ordinal().domain(domain).range(range);

                globals.objects.add('productcolors', productcolors);

                // If there is already saved overly configuration use that
                if(localStorage.getItem('overlaysConfig') !== null){
                    config.mapConfig.overlays = JSON.parse(localStorage.getItem('overlaysConfig'));
                }
                //Overlays are loaded and added to the global collection
                _.each(config.mapConfig.overlays, function(overlay) {

                        globals.overlays.add(
                            new m.LayerModel({
                                name: overlay.name,
                                visible: overlay.visible,
                                ordinal: ordinal,
                                view: overlay.view
                            })
                        );
                        console.log("Added overlay " + overlay.id);
                    }, this);


                // If Navigation Bar is set in configuration go trhough the 
                // defined elements creating a item collection to rendered
                // by the marionette collection view
                if (config.navBarConfig) {

                    var addNavBarItems = defaultFor(self.NAVBARITEMS, []);
                    config.navBarConfig.items = config.navBarConfig.items.concat(addNavBarItems);
                    var navBarItemCollection = new m.NavBarCollection;

                    _.each(config.navBarConfig.items, function(list_item){
                        navBarItemCollection.add(
                            new m.NavBarItemModel(list_item)
                        );
                    }, this);

                    this.topBar.show(new v.NavBarCollectionView(
                        {template: t.NavBar({
                            title: config.navBarConfig.title,
                            url: config.navBarConfig.url}),
                        className:"navbar navbar-inverse navbar-fixed-top not-selectable",
                        itemView: v.NavBarItemView, tag: "div",
                        collection: navBarItemCollection}));

                };

                // Added region to test combination of backbone
                // functionality combined with jQuery UI
                this.addRegions({dialogRegion: DialogRegion.extend({el: "#viewContent"})});
                this.DialogContentView = new v.ContentView({
                    template: {type: 'handlebars', template: t.Info},
                    id: "about",
                    className: "modal fade",
                    attributes: {
                        role: "dialog",
                        tabindex: "-1",
                        "aria-labelledby": "about-title",
                        "aria-hidden": true,
                        "data-keyboard": true,
                        "data-backdrop": "static"
                    }
                });

                // Create the views - these are Marionette.CollectionViews that render ItemViews
                this.baseLayerView = new v.BaseLayerSelectionView({
                    collection:globals.baseLayers,
                    itemView: v.LayerItemView.extend({
                        template: {
                            type:'handlebars',
                            template: t.BulletLayer},
                        className: "radio-inline"
                    })
                });


                this.productsView = new v.LayerSelectionView({
                    collection: globals.products,
                    itemView: v.LayerItemView.extend({
                        template: {
                            type:'handlebars',
                            template: t.CheckBoxLayer},
                        className: "sortable-layer"
                    }),
                    className: "sortable"
                });

                this.overlaysView = new v.BaseLayerSelectionView({
                    collection: globals.overlays,
                    itemView: v.LayerItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: t.CheckBoxOverlayLayer},
                        className: "checkbox"
                    }),
                    className: "check"
                });



                // Create layout that will hold the child views
                this.layout = new LayerControlLayout();


                // Define collection of selection tools
                var selectionToolsCollection = new m.ToolCollection();
                _.each(config.selectionTools, function(selTool) {
                    selectionToolsCollection.add(
                            new m.ToolModel({
                                id: selTool.id,
                                description: selTool.description,
                                icon:selTool.icon,
                                enabled: true,
                                active: false,
                                type: "selection",
                                selectionType: selTool.selectionType
                            }));
                }, this);

                // Define collection of visualization tools
                var visualizationToolsCollection = new m.ToolCollection();
                _.each(config.visualizationTools, function(visTool) {
                    visualizationToolsCollection.add(
                            new m.ToolModel({
                                id: visTool.id,
                                eventToRaise: visTool.eventToRaise,
                                description: visTool.description,
                                disabledDescription: visTool.disabledDescription,
                                icon:visTool.icon,
                                enabled: visTool.enabled,
                                active: visTool.active,
                                type: "tool"
                            }));
                }, this);

                // Define collection of visualization modes
                var visualizationModesCollection = new m.ToolCollection();
                _.each(config.visualizationModes, function(visMode) {
                    visualizationModesCollection.add(
                        new m.ToolModel({
                            id: visMode.id,
                            eventToRaise: visMode.eventToRaise,
                            description: visMode.description,
                            icon: visMode.icon,
                            enabled: visMode.enabled,
                            active: visMode.active,
                            type: "vis_mode"
                        }));
                }, this);   
                
                // Create Collection Views to hold set of views for selection tools
                this.visualizationToolsView = new v.ToolSelectionView({
                    collection:visualizationToolsCollection,
                    itemView: v.ToolItemView.extend({
                        template: {
                            type:'handlebars',
                            template: t.ToolIcon}
                    })
                });

                // Create Collection Views to hold set of views for visualization tools
                this.selectionToolsView = new v.ToolSelectionView({
                    collection:selectionToolsCollection,
                    itemView: v.ToolItemView.extend({
                        template: {
                            type:'handlebars',
                            template: t.ToolIcon}
                    })
                });


                // Create Collection Views to hold set of views for visualization modes
                this.visualizationModesView = new v.ToolSelectionView({
                    collection: visualizationModesCollection,
                    itemView: v.ToolItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: t.ToolIcon
                        }
                    })
                });

                // Create data configuration view
                this.dataConfigurationView = new v.DataConfigurationView();


                this.layerSettings = new v.LayerSettings();

                // Create layout to hold collection views
                this.toolLayout = new ToolControlLayout();
                this.optionsLayout = new OptionsLayout();

                // Instance timeslider view
                this.timeSliderView = new v.TimeSliderView(config.timeSlider);

                var compare = function(val){
                    return val <= this[1] && val >= this[0];
                };

                // Load possible available filter selection
                if(localStorage.getItem('filterSelection') !== null){
                    var filters = JSON.parse(localStorage.getItem('filterSelection'));
                    var filterfunc = {};
                    for (var f in filters){
                        var ext = filters[f];
                        filterfunc[f] = compare.bind(ext);
                    }
                    globals.swarm.set('filters', filterfunc);
                    Communicator.mediator.trigger('analytics:set:filter', filters);
                }
                


            },

            // The GUI is setup after the application is started. Therefore all modules
            // are already registered and can be requested to populate the GUI.
            setupGui: function() {

                // Starts the SplitView module and registers it with the Communicator.
                this.module('SplitView').start();
                var splitview = this.module('SplitView').createController();
                this.main.show(splitview.getView());

                
                // Show Timsliderview after creating modules to
                // set the selected time correctly to the products
                this.bottomBar.show(this.timeSliderView);

                // Show storybanner
                /*if(this.storyBanner){
                    this.storyView.show(this.storyBanner);
                }*/

                if ( (typeof(Storage) !== "undefined") && localStorage.getItem("viewSelection") !== null) {
                    if(localStorage.getItem('viewSelection') == 'split'){
                        splitview.setSplitscreen();
                    }
                    if(localStorage.getItem('viewSelection') == 'globe'){
                        splitview.setSinglescreen('CesiumViewer');
                    }
                    if( localStorage.getItem('viewSelection') == 'analytics'){
                        splitview.setSinglescreen('AVViewer');
                    }
                }else{
                    splitview.setSplitscreen();
                }

                // Try to get CSRF token, if available set it for necesary ajax requests
                function getCookie(name) {
                    var cookieValue = null;
                    if (document.cookie && document.cookie != '') {
                        var cookies = document.cookie.split(';');
                        for (var i = 0; i < cookies.length; i++) {
                            var cookie = jQuery.trim(cookies[i]);
                            // Does this cookie string begin with the name we want?
                            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                                break;
                            }
                        }
                    }
                    return cookieValue;
                }
                var csrftoken = getCookie('csrftoken');

                function csrfSafeMethod(method) {
                    // these HTTP methods do not require CSRF protection
                    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
                }

                if(csrftoken){
                    $.ajaxSetup({
                        beforeSend: function(xhr, settings) {
                            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                                xhr.setRequestHeader("X-CSRFToken", csrftoken);
                            }
                        }
                    });
                }

                // Add a trigger for ajax calls in order to display loading state
          // in mouse cursor to give feedback to the user the client is busy
          $(document).ajaxStart(function() {
                Communicator.mediator.trigger("progress:change", true);
          });

          $(document).ajaxStop(function() {
                Communicator.mediator.trigger("progress:change", false);
          });

          $(document).ajaxError(function( event, request , settings, thrownError ) {
            if(settings.suppressErrors) {
                    return;
                    }

                    var error_text = request.responseText.match("<ows:ExceptionText>(.*)</ows:ExceptionText>");

                    if (error_text && error_text.length > 1) {
                        error_text = error_text[1];
                    } else {
                        error_text = 'Please contact feedback@vires.services if issue persists.'
                    }

                    showMessage('danger', ('Problem retrieving data: ' + error_text), 35);
          });

          // The tooltip is called twice at beginning and end, it seems to show the style of the
          // tooltips more consistently, there is some problem where sometimes no style is shown for tooltips
          /*$("body").tooltip({ 
                    selector: '[data-toggle=tooltip]',
                    position: { my: "left+5 center", at: "right center" },
                    hide: { effect: false, duration: 0 },
                    show:{ effect: false, delay: 700}
                });*/

              // Now that products and data are loaded make sure datacontroller is correctly initialized
                Communicator.mediator.trigger('manual:init');
                this.timeSliderView.manualInit();

                // Broadcast possible area selection
                /*if(localStorage.getItem('areaSelection') !== null){
                    Communicator.mediator.trigger('selection:changed', JSON.parse(localStorage.getItem('areaSelection')));
                }*/

                //Communicator.mediator.trigger('map:multilayer:change', globals.swarm.activeProducts);
                //Communicator.mediator.trigger('map:multilayer:change', globals.swarm.activeProducts);

                // Remove loading screen when this point is reached in the script
                $('#loadscreen').remove();
            }



        });

        return new Application();
    });
}).call( this );
