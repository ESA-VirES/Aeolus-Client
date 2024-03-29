

define([
    'backbone.marionette',
    'communicator',
    'app',
    'models/MapModel',
    'hbs!tmpl/calvalsites',
    'globals',
    'papaparse',
    'cesium',
    'expr-eval',
    'drawhelper',
    'FileSaver'
], function( Marionette, Communicator, App, MapModel, calvalsites, globals,
    Papa, Cesium, exprEval) {
    'use strict';
    var CesiumView = Marionette.View.extend({
        model: new MapModel.MapModel(),

        initialize: function(options) {
            this.map = undefined;
            this.isClosed = true;
            this.tileManager = options.tileManager;
            this.selectionType = null;
            this.overlayIndex = 99;
            this.diffimageIndex = this.overlayIndex-10;
            this.diffOverlay = null;
            this.overlayLayers = [];
            this.overlayOffset = 100;
            this.cameraIsMoving = false;
            this.cameraLastPosition = null;
            this.billboards = null;
            this.activeFL = [];
            this.featuresCollection = {};
            this.FLCollection = {};
            this.bboxsel = null;
            this.extentPrimitive = null;
            this.activeModels = [];
            this.activeCollections = [];
            this.activeCurtainCollections = [];
            this.activePointsCollections = [];
            this.differenceImage = null;
            this.dataFilters = {};
            this.colorscales = {};
            this.beginTime = null;
            this.endTime = null;
            this.curtainPrimitive = null;
            this.hoveredPrim = null;
            this.selectedPrim = null;
            this.calvalsites = JSON.parse(calvalsites());
            this.parser = new exprEval.Parser();

            var renderSettings = {
                xAxis: [
                    'time'
                ],
                yAxis: [
                    ['altitude']
                ],
                //y2Axis: [],
                combinedParameters: {
                    latitude: ['latitude_start', 'latitude_end'],
                    altitude: ['altitude_start', 'altitude_end'],
                    latitude_of_DEM_intersection: [
                        'latitude_of_DEM_intersection_start',
                        'latitude_of_DEM_intersection_end'
                    ],
                    time: ['time_start', 'time_end']
                },
                colorAxis: [['mie_HLOS_wind_speed']],
                additionalXTicks: [],
                additionalYTicks: [],
                availableParameters: false
            };


            $('body').append($('<div/>', {
                id: 'hiddenRenderArea' ,
                style: 'height:100px; width:100px;visibility:hidden;'
            }));


            this.graph = new graphly.graphly({
                el: '#hiddenRenderArea',
                //dataSettings: this.dataSettings,
                renderSettings: renderSettings,
                filterManager: globals.filterManager,
                multiYAxis: false,
                fixedSize: true,
                fixedWidth: (2048*2),
                fixedHeigt: 256,
                defaultAlpha: 1.0,
                disableAntiAlias: true,
                enableMaskParameters: true,
            });

            for(var cskey in additionalColorscales){
                this.graph.addColorScale(
                    cskey, 
                    additionalColorscales[cskey][0],
                    additionalColorscales[cskey][1]
                );
            }

            globals.cesGraph = this.graph;

            var that = this;

            if(localStorage.getItem('filterSelection') !== null){
                if(this.graph){
                    this.graph.filters = globals.swarm.get('filters');
                }
            }

            globals.filterManager.on('filterChange', function(filters){
                //console.log(filters);
                var data = globals.swarm.get('data');
                if (Object.keys(data).length){
                    var idKeys = Object.keys(data);
                    for (var i = idKeys.length - 1; i >= 0; i--) {
                        //this.graph.loadData(data[idKeys[i]]);
                        if(idKeys[i] === 'ALD_U_N_1B'){
                            that.createCurtains(data[idKeys[i]], idKeys[i], false);
                        } else if (idKeys[i].includes('ALD_U_N_2')){
                            that.createL2Curtains(data[idKeys[i]], idKeys[i], false);
                        } else {
                            that.graph.data = {};
                            that.createPointCollection(data[idKeys[i]], idKeys[i]);
                        }
                    }
                }

            });
        },

        createMap: function() {

            // Problem arose in some browsers where aspect ratio was kept not adapting 
            // to height; Added height style attribute to 100% to solve problem
            this.$el.attr('style','height:100%;');

            // TODO: We dont use bing maps layer, but it still reports use of default key in console.
            // For now we just set it to something else just in case.
            Cesium.BingMapsApi.defaultKey = 'NOTHING';
            Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(0.0, -10.0, 30.0, 55.0);

            Cesium.WebMapServiceImageryProvider.prototype.updateProperties = function(property, value) {
                var qPars = this._tileProvider._resource._queryParameters;
                qPars[property] = value;
            };

            this.$el.append('<div id="coordinates_label"></div>');
            this.$el.append('<div id="cesium_attribution"></div>');
            this.$el.append('<div id="cesium_custom_attribution"></div>');
            $('#cesium_custom_attribution').append(
                '<div style="float:left"><a href="http://cesiumjs.org" target="_blank">Cesium</a>'+
                '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>'
            );

            this.$el.append('<div type="button" class="btn btn-success darkbutton" id="cesium_save">Save as Image</div>');
            this.$el.append('<div type="button" class="btn btn-success darkbutton"  id="bb_selection">Select Area</div>');
    
            var layer;

            this.colors = globals.objects.get('color');

            if (this.beginTime === null || this.endTime === null){
                var selTime = Communicator.reqres.request('get:time');
                this.beginTime = selTime.start;
                this.endTime = selTime.end;
            }

            var baseLayers = [];
            var initialLayer = null;
            globals.baseLayers.each(function(baselayer) {
                var layer = this.createLayer(baselayer);
                baseLayers.push(layer);
                if (baselayer.get('visible')){
                    initialLayer = layer;
                }
            }, this);

            var clock = new Cesium.Clock({
               startTime : Cesium.JulianDate.fromIso8601('2014-01-01'),
               currentTime : Cesium.JulianDate.fromIso8601('2014-01-02'),
               stopTime : Cesium.JulianDate.fromIso8601('2014-01-03'),
               clockRange : Cesium.ClockRange.LOOP_STOP,
               clockStep : Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER,
               canAnimate: false,
               shouldAnimate: false
            });

            if (initialLayer){
                var options = {
                    timeline: false,
                    fullscreenButton: false,
                    baseLayerPicker: false,
                    homeButton: false,
                    infoBox: false,
                    navigationHelpButton: false,
                    navigationInstructionsInitiallyVisible: false,
                    animation: false,
                    imageryProvider: initialLayer,
                    /*terrainProvider : new Cesium.CesiumTerrainProvider({
                        url : '//tiles.maps.eox.at/dem'
                    }),*/
                    terrainExaggeration: 20.0,
                    creditContainer: 'cesium_attribution',
                    contextOptions: {webgl: {preserveDrawingBuffer: true}},
                    clock: clock
                };
                //COLUMBUS_VIEW SCENE2D SCENE3D
                if(localStorage.getItem('sceneMode') !== null){
                    options.sceneMode = Number(localStorage.getItem('sceneMode'));
                }
                this.map = new Cesium.Viewer(this.el, options);
                var initialCesiumLayer = this.map.imageryLayers.get(0);
                this.map.scene.globe.maximumScreenSpaceError = 1.3;
            }

            if(localStorage.getItem('cameraPosition') !== null){
                var c = JSON.parse(localStorage.getItem('cameraPosition'));
                this.map.scene.camera.position = new Cesium.Cartesian3(
                    c.position[0], c.position[1], c.position[2]
                );
                this.map.scene.camera.direction = new Cesium.Cartesian3(
                    c.direction[0], c.direction[1], c.direction[2]
                );
                this.map.scene.camera.up = new Cesium.Cartesian3(
                    c.up[0], c.up[1], c.up[2]
                );
                this.map.scene.camera.right = new Cesium.Cartesian3(
                    c.right[0], c.right[1], c.right[2]
                );
            }

            var mm = globals.objects.get('mapmodel');

            this.navigationhelp = new Cesium.NavigationHelpButton({
                container: $('.cesium-viewer-toolbar')[0]
            });

            this.map.scene.skyBox.show = mm.get('skyBox');
            this.map.scene.sun.show = mm.get('sun');
            this.map.scene.moon.show = mm.get('moon');
            this.map.scene.skyAtmosphere.show = mm.get('skyAtmosphere');

            // Check to see if background color was already set

            var bgColor = '#ffffff';
            if(localStorage.hasOwnProperty('cesiumBGColor')){
                bgColor = localStorage.getItem('cesiumBGColor');
            }
            this.map.scene.backgroundColor = new Cesium.Color.fromCssColorString(bgColor);

            // Create color picker
            $(this.el).append('<div id="cesiumcolorPicker" class="btn btn-success darkbutton"></div>');
            var colorSelect = $('#cesiumcolorPicker').append('<input id="cesiumBGColor" type="text" size="5" autocomplete="off"/>');
            $('#cesiumBGColor').val(bgColor);

            var picker = new CP(colorSelect[0]);
            picker.set(bgColor);

            var firstChange = true;
            var map = this.map;
            picker.on('change', function(color) {
                if(!firstChange){
                    var hexCol = '#'+color;
                    map.scene.backgroundColor = new Cesium.Color.fromCssColorString(hexCol);
                    $('#cesiumBGColor').val(hexCol);
                    localStorage.setItem('cesiumBGColor', hexCol);
                }else{
                    firstChange = false;
                }
            });

            function update() {
                var currCol = $('#cesiumBGColor').val();
                if(currCol.length === 7){
                    picker.set(currCol).enter();
                    map.scene.backgroundColor = new Cesium.Color.fromCssColorString(currCol);
                    localStorage.setItem('cesiumBGColor', hexCol);
                }
            }

            picker.source.oncut = update;
            picker.source.onpaste = update;
            picker.source.onkeyup = update;
            picker.source.oninput = update;

            var closeButton = $('<div id="colorpickercloser" class="btn btn-success darkbutton">Close</div>');
            closeButton.click(function () {
                picker.exit();
            })

            picker.self.appendChild(closeButton[0]);

            this.map.scene.globe.dynamicAtmosphereLighting = false;
            this.map.scene.globe.showGroundAtmosphere = false;

            // TODO: Removes fog for now as it is not very good at this point
            if(this.map.scene.hasOwnProperty('fog')){
                this.map.scene.fog.enabled = false;  
            }

            // Remove gazetteer field
            $('.cesium-viewer-geocoderContainer').remove();

            // Show Wireframe (Debug help)
            //this.map.scene.globe._surface._tileProvider._debug.wireframe = true;

            var handler = new Cesium.ScreenSpaceEventHandler(
                this.map.scene.canvas
            );
            handler.setInputAction(function() {
                //hide the selectionIndicator
                this.map.selectionIndicator.viewModel.selectionIndicatorElement.style.visibility = 'hidden';

                // Clear possible selection
                if(this.selectedPrim !== null) {
                    this.selectedPrim.id.label.show = false;
                    this.selectedPrim.id.point.outlineColor = Cesium.Color.BLACK;
                    this.selectedPrim.id.point.outlineWidth = 1;
                    this.selectedPrim.id.point.color = Cesium.Color.YELLOW;
                    this.selectedPrim = null;
                }

                if(this.hoveredPrim !== null) {
                    // mark as selected
                    this.hoveredPrim.id.point.color = Cesium.Color.GREEN;
                    this.hoveredPrim.id.point.outlineWidth = 1;
                    this.hoveredPrim.id.label.show = true;
                    this.selectedPrim = this.hoveredPrim;

                    // Create bbox selection with approx 300km range
                    var pos = this.hoveredPrim.id.position.getValue();
                    var carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);
                    var lon = Cesium.Math.toDegrees(carto.longitude);
                    var lat = Cesium.Math.toDegrees(carto.latitude);
                    // 2.67 should be approx 300km (depending where on the ellipsoid)
                    var offset = 2.67/2;
                    var bbox = {
                        s: lat-offset,
                        n: lat+offset,
                        e: lon+offset,
                        w: lon-offset,
                    };
                    Communicator.mediator.trigger('selection:changed', bbox);
                }
            }.bind(this), Cesium.ScreenSpaceEventType.LEFT_CLICK);

            handler.setInputAction(function(movement) {
                var ellipsoid = Cesium.Ellipsoid.WGS84;
                var position = this.map.scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                $('#coordinates_label').hide();
                if (Cesium.defined(position)) {
                    var cartographic = ellipsoid.cartesianToCartographic(position);
                    var lat = Cesium.Math.toDegrees(cartographic.latitude);
                    var lon = Cesium.Math.toDegrees(cartographic.longitude);
                    //var height = cartographic.height;
                    $('#coordinates_label').show();
                    $('#coordinates_label').html(
                        'Lat: ' + lat.toFixed(4) + '</br>Lon: '+lon.toFixed(4)
                    );
                }
                // Clear possible highlighted calval site 
                if(this.hoveredPrim !== null){
                    if(this.selectedPrim === null){
                        // Only change style if it is not the selected one
                        this.hoveredPrim.id.label.show = false;
                        this.hoveredPrim.id.point.outlineColor = Cesium.Color.BLACK;
                        this.hoveredPrim.id.point.outlineWidth = 1;
                    } else if(this.hoveredPrim.id !== this.selectedPrim.id) {
                        this.hoveredPrim.id.label.show = false;
                        this.hoveredPrim.id.point.outlineColor = Cesium.Color.BLACK;
                        this.hoveredPrim.id.point.outlineWidth = 1;
                    }
                    this.hoveredPrim = null;
                }
                // Check for calval sites
                var pickedObject = this.map.scene.pick(movement.endPosition);

                if (Cesium.defined(pickedObject) && pickedObject.hasOwnProperty('id')
                    && typeof pickedObject.id !== 'undefined'
                    && typeof pickedObject.id.label !== 'undefined') {
                    pickedObject.id.label.show = true;
                    this.hoveredPrim = pickedObject;
                    pickedObject.id.point.outlineColor = Cesium.Color.GREEN;
                    pickedObject.id.point.outlineWidth = 2;
                    //pickedObject.id.point.color = Cesium.Color.GREEN;
                }
            }.bind(this), Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            this.billboards = this.map.scene.primitives.add(
                new Cesium.BillboardCollection()
            );
            this.drawhelper = new DrawHelper(this.map.cesiumWidget);
            // It seems that if handlers are active directly there are some
            // object deleted issues when the draw helper tries to pick elements
            // in the scene; Setting handlers muted in the beginning seems to
            // solve the issue.
            this.drawhelper._handlersMuted = true;

            this.cameraLastPosition = {};
            this.cameraLastPosition.x = this.map.scene.camera.position.x;
            this.cameraLastPosition.y = this.map.scene.camera.position.y;
            this.cameraLastPosition.z = this.map.scene.camera.position.z;

            // Extend far clipping for fieldlines
            this.map.scene.camera.frustum.far = this.map.scene.camera.frustum.far * 15;

            this.map.clock.onTick.addEventListener(this.handleTick.bind(this));

            //Go through all defined baselayer and add them to the map
            for (var i = 0; i < baseLayers.length; i++) {
                globals.baseLayers.each(function(baselayer) {
                    if(initialLayer._layer === baselayer.get('views')[0].id){
                        baselayer.set('ces_layer', initialCesiumLayer);
                    }else{
                        if(baseLayers[i]._layer === baselayer.get('views')[0].id){
                            var imagerylayer = this.map.scene.imageryLayers.addImageryProvider(baseLayers[i]);
                            imagerylayer.show = baselayer.get('visible');
                            baselayer.set('ces_layer', imagerylayer);
                        }
                    }
                }, this);
            }

            // Go through all products and add them to the map
            _.each(globals.products.last(globals.products.length).reverse(), function(product){
                var layer = this.createLayer(product);
                if (layer) {
                    var imagerylayer = this.map.scene.imageryLayers.addImageryProvider(layer);
                    product.set('ces_layer', imagerylayer);
                    imagerylayer.show = product.get('visible');
                    imagerylayer.alpha = product.get('opacity');

                    // If product protocol is not WMS or WMTS they are
                    // shown differently so dont activate 'dummy' layers
                    if(product.get('views')[0].protocol !== 'WMS' &&
                       product.get('views')[0].protocol !== 'WMTS'){
                        imagerylayer.show = false;
                    }
                    // If product is model and active parameters is Fieldline 
                    // do not activate dummy layer and check for fieldlines
                    if(product.get('model')){
                        // Find active key
                        var active;
                        var params = product.get('parameters');
                        for (var key in params) {
                            if (params[key].selected) {
                                active = key;
                            }
                        }
                        if (active === 'Fieldlines'){
                            imagerylayer.show = false;
                        }
                    }
                }
            }, this);

            // Go through all overlays and add them to the map
            globals.overlays.each(function(overlay){
                var imagerylayer;
                if(overlay.get('view').protocol === 'entityLayer'){
                    // loading calval sites
                    var calvalsitesDatasource = new Cesium.CustomDataSource('calvalsites');
                    var sites = this.calvalsites.Earth_Explorer_File.Data_Block.List_of_Zones.Zone;
                    for (var i = 0; i < sites.length; i++) {
                        var site = sites[i];
                        var lat = Number(site.List_of_Polygon_Pts.Polygon_Pt.Lat.__text);
                        var lon = Number(site.List_of_Polygon_Pts.Polygon_Pt.Long.__text);
                        calvalsitesDatasource.entities.add({
                            id: site.Zone_Id,
                            position : Cesium.Cartesian3.fromDegrees(lon, lat),
                            point: {
                                pixelSize: 10,
                                color: Cesium.Color.YELLOW,
                                outlineColor: Cesium.Color.BLACK,
                                outlineWidth: 1,
                            },
                            label : {
                                show: false,
                                text : site.Zone_Id.replace(/_/g, ' '),
                                font : '14pt monospace',
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                outlineWidth : 3,
                                verticalOrigin : Cesium.VerticalOrigin.TOP,
                                pixelOffset : new Cesium.Cartesian2(0, -25)
                            }
                        });
                    }
                    this.map.dataSources.add(calvalsitesDatasource);
                    imagerylayer = calvalsitesDatasource;
                } else {
                    var layer = this.createLayer(overlay);
                    if (layer) {
                     imagerylayer = this.map.scene.imageryLayers.addImageryProvider(layer);
                    }
                }
                imagerylayer.show = overlay.get('visible');
                overlay.set('ces_layer', imagerylayer);
            }, this);


            this.map.scene.morphComplete.addEventListener(function (){
                localStorage.setItem('sceneMode', this.map.scene.mode);
                var c = this.map.scene.camera;
                localStorage.setItem('cameraPosition', 
                    JSON.stringify({
                        position: [c.position.x, c.position.y,c.position.z],
                        direction: [c.direction.x, c.direction.y,c.direction.z],
                        up: [c.up.x, c.up.y,c.up.z],
                        right: [c.right.x, c.right.y,c.right.z]
                    })
                );
            }, this);
        }, // END of createMap

        onShow: function() {
            if (!this.map) {
                this.createMap();
            }


            $('#kmluploadcontainer').remove();
            $(this.el).append('<div id="kmluploadcontainer"></div>');

            $('#kmluploadcontainer').append(
                '<input type="file" name="file" id="kmlinput" class="kmlinputfile" accept=".kml"></input>'
            );
             $('#kmluploadcontainer').append(
                '<label for="kmlinput" class="btn btn-success darkbutton">Import kml</label>'
            );

             $('#kmlresetbutton').remove();
            $(this.el).append('<div id="kmlresetbutton" class="btn btn-success darkbutton">Remove kml</div>');

            if(localStorage.hasOwnProperty('kmlfile')){
                var text = localStorage.getItem('kmlfile');
                var kmlDocument = new DOMParser().parseFromString(text, "application/xml");
                localStorage.setItem('kmlfile', text);

                 // clean datasources
                this.map.dataSources.removeAll();

                this.map.dataSources.add(
                    Cesium.KmlDataSource.load(kmlDocument, {
                        camera: this.map.camera,
                        canvas: this.map.canvas
                    })
                );
            } else {
                $('#kmlresetbutton').css('display', 'none');
            }

             var that = this;

             $('#kmlinput').change(function(event) {
                var input = event.target;

                var reader = new FileReader();
                reader.onload = function(){
                    var text = reader.result;
                    var kmlDocument = new DOMParser().parseFromString(text, "application/xml");
                    localStorage.setItem('kmlfile', text);

                     // clean datasources
                    that.map.dataSources.removeAll();

                    that.map.flyTo(
                        that.map.dataSources.add(
                            Cesium.KmlDataSource.load(kmlDocument, {
                                camera: that.map.camera,
                                canvas: that.map.canvas
                            })
                        )
                    );
                    $('#kmluploadcontainer').css('display', 'none');
                    $('#kmlresetbutton').css('display', 'block');
                };
                reader.readAsText(input.files[0]);
            });

            $('#kmlresetbutton').click(function(event) {
                that.map.dataSources.removeAll();
                localStorage.removeItem('kmlfile');
                $('#kmlresetbutton').css('display', 'none');
                $('#kmluploadcontainer').css('display', 'block');
            });

            // Check for possible already available selection
            if(localStorage.getItem('areaSelection') !== null){
                var bbox = JSON.parse(localStorage.getItem('areaSelection'));
                if(bbox != null){
                    this.bboxsel = [bbox.s, bbox.w, bbox.n, bbox.e ];
                    this.onSelectionChanged(bbox);
                }
            }

            if(this.navigationhelp){
                this.navigationhelp.destroy();
                this.navigationhelp = new Cesium.NavigationHelpButton({
                    container: $('.cesium-viewer-toolbar')[0]
                });
            } 
            this.isClosed = false;

            $('#cesium_save').on('click', this.onSaveImage.bind(this));

            function synchronizeLayer(l){
                if(l.get('ces_layer')){
                    if(l.get('ces_layer').show !== l.get('visible')){
                        var isBaseLayer = defaultFor(l.get('view').isBaseLayer, false);
                        this.changeLayer({
                            name: l.get('name'), visible: l.get('visible'),
                            isBaseLayer: isBaseLayer
                        });
                    }
                }
            }
            function synchronizeColorLegend(p){
                this.checkColorscale(p.get('download').id);
            }
            // Go through config to make any changes done while widget
            // not active (not in view)
            globals.baseLayers.each(synchronizeLayer.bind(this));
            globals.products.each(synchronizeLayer.bind(this));
            globals.overlays.each(synchronizeLayer.bind(this));

            // Recheck color legends
            globals.products.each(synchronizeColorLegend.bind(this));

            this.connectDataEvents();

            // Redraw to make sure we are at current selection
            /*this.createDataFeatures(
                globals.swarm.get('data'),
                'pointcollection', 'band'
            );*/
            var data = globals.swarm.get('data');
            if (Object.keys(data).length){
                var idKeys = Object.keys(data);
                for (var i = idKeys.length - 1; i >= 0; i--) {
                    if(idKeys[i] === 'ALD_U_N_1B'){
                        this.createCurtains(data[idKeys[i]], idKeys[i]);
                    } else if (idKeys[i].includes('ALD_U_N_2')){
                        this.createL2Curtains(data[idKeys[i]], idKeys[i]);
                    } else {
                        this.createPointCollection(data[idKeys[i]], idKeys[i]);
                    }
                }
            }

            $('#bb_selection').unbind('click');
            $('#bb_selection').click(function(){
                if($('#bb_selection').text() === 'Select Area'){
                    $('#bb_selection').html('Deactivate');
                    Communicator.mediator.trigger('selection:activated',{
                        id:'bboxSelection',
                        active:true,
                        selectionType:'single'
                    });
                } else if ($('#bb_selection').text() === 'Deactivate'){
                    $('#bb_selection').html('Select Area');
                    Communicator.mediator.trigger('selection:activated', {
                        id:'bboxSelection',
                        active:false,
                        selectionType:'single'
                    });
                } else if ($('#bb_selection').text() === 'Clear Selection'){
                    $('#bb_selection').html('Select Area');
                    Communicator.mediator.trigger('selection:changed', null);
                }
            });
            return this;
        }, // END of onShow

        connectDataEvents: function(){
            globals.swarm.on('change:data', function(model, data) {
                if (Object.keys(data).length){
                    
                    //this.createDataFeatures(data, 'pointcollection', 'band');
                    var idKeys = Object.keys(data);
                    for (var i = idKeys.length - 1; i >= 0; i--) {
                        if(idKeys[i] === 'ALD_U_N_1B'){
                            this.createCurtains(data[idKeys[i]], idKeys[i]);
                        } else if (idKeys[i].includes('ALD_U_N_2')){
                            this.createL2Curtains(data[idKeys[i]], idKeys[i]);
                        } else {
                            this.graph.data = {};
                            this.createPointCollection(data[idKeys[i]], idKeys[i]);
                        }
                    }
                }else{
                    for (var i = 0; i < this.activeCurtainCollections.length; i++) {
                        this.activeCurtainCollections[i].removeAll();
                    }
                    for (var i = 0; i < this.activePointsCollections.length; i++) {
                        this.activePointsCollections[i].removeAll();
                    }

                    /*for (var i = 0; i < this.activeCollections.length; i++) {
                        if(this.featuresCollection.hasOwnProperty(this.activeCollections[i])){
                            this.map.scene.primitives.remove(
                                this.featuresCollection[this.activeCollections[i]]
                            );
                            delete this.featuresCollection[this.activeCollections[i]];
                        }
                    }
                    this.activeCollections = [];*/
                }
            }, this);

            globals.swarm.on('change:filters', function(model, filters) {
                var data = globals.swarm.get('data');
                if (Object.keys(data).length){
                    var idKeys = Object.keys(data);
                    for (var i = idKeys.length - 1; i >= 0; i--) {
                        if(idKeys[i] !== 'ALD_U_N_1B' && 
                           idKeys[i] !== 'ALD_U_N_2A' && 
                           idKeys[i] !== 'ALD_U_N_2B' && 
                           idKeys[i] !== 'ALD_U_N_2C'){
                            this.createPointCollection(data[idKeys[i]], idKeys[i]);
                        }
                    }
                }
            }, this);
        },

        onResize: function() {
            if(this.map._sceneModePicker){
                var container = this.map._sceneModePicker.container;
                var scene = this.map._sceneModePicker.viewModel._scene;
                this.map._sceneModePicker.destroy();
                var modepicker = new Cesium.SceneModePicker(container, scene);
                this.map._sceneModePicker = modepicker;
            }
        },

        /*updateCurtain: function(id){

            var data = globals.swarm.get('data')[id];
            var product = globals.products.find(
                function(p){return p.get('download').id === id;}
            );

            if(product && product.hasOwnProperty('curtain')){
                var curtain = product.curtain;
                var parameters = product.get('parameters');
                var band;
                var keys = _.keys(parameters);
                _.each(keys, function(key){
                    if(parameters[key].selected){
                        band = key;
                    }
                });
                var style = parameters[band].colorscale;
                var range = parameters[band].range;


                //this.graph.setColorScale(style);
                //this.graph.onSetExtent(range);
                this.dataSettings[band].colorscale = style;
                this.dataSettings[band].extent = range;
                this.graph.dataSettings = this.dataSettings;
                
                if(band === 'mie_HLOS_wind_speed'){
                    this.graph.renderSettings.colorAxis = ['mie_HLOS_wind_speed'];
                    this.graph.renderSettings.yAxis = ['mie_altitude'];
                    this.graph.renderSettings.xAxis =['mie_time'];
                }else if(band === 'rayleigh_HLOS_wind_speed'){
                    this.graph.renderSettings.colorAxis = ['rayleigh_HLOS_wind_speed'];
                    this.graph.renderSettings.yAxis = ['rayleigh_altitude'];
                    this.graph.renderSettings.xAxis =['rayleigh_time'];
                }
                this.graph.loadData(data);

                var alpha = 0.99;

                var newmat = new Cesium.Material({
                    fabric : {
                        uniforms : {
                            image : this.graph.getCanvasImage(),
                            repeat : new Cesium.Cartesian2(-1.0, 1.0),
                            alpha : alpha
                        },
                        components : {
                            diffuse : 'texture2D(image, fract(repeat * materialInput.st)).rgb',
                            alpha : 'texture2D(image, fract(repeat * materialInput.st)).a * alpha'
                        }
                    },
                    flat: true,
                    translucent : true
                });

                var sliceAppearance = new Cesium.MaterialAppearance({
                    translucent : true,
                    flat: true,
                    material : newmat
                });

                if(curtain && curtain.hasOwnProperty('_appearance') && curtain._appearance){
                    curtain.appearance.material._textures.image.copyFrom(this.graph.getCanvas());
                }

                this.checkColorscale(id);
            }

        },*/


        createCurtains: function(data, cov_id, createWallPrimitives){
            createWallPrimitives = defaultFor(createWallPrimitives, true);

            var currProd = globals.products.find(
                function(p){return p.get('download').id === cov_id;}
            );
            var prodId = currProd.get('download').id;

            var altitudeExtentSet = currProd.get('altitudeExtentSet');
            var altitudeExtent = currProd.get('altitudeExtent');

            var curtainCollection;

            if(currProd.hasOwnProperty('curtains')){
                if(createWallPrimitives) {
                    currProd.curtains.removeAll();
                }
                curtainCollection = currProd.curtains;
            }else{
                curtainCollection = new Cesium.PrimitiveCollection();
                this.activeCurtainCollections.push(curtainCollection);
                this.map.scene.primitives.add(curtainCollection);
                currProd.curtains = curtainCollection;
            }

            var alpha = currProd.get('opacity');
            this.graph.dataSettings = globals.dataSettings[prodId];

            var dataJumps;

            this.graph.renderSettings.combinedParameters = {
                latitude: ['latitude_start', 'latitude_end'],
                mie_altitude: ['mie_altitude_start', 'mie_altitude_end'],
                rayleigh_altitude: ['rayleigh_altitude_start', 'rayleigh_altitude_end'],
                latitude_of_DEM_intersection: [
                    'latitude_of_DEM_intersection_start',
                    'latitude_of_DEM_intersection_end'
                ],
                mie_time: ['mie_time_start', 'mie_time_end'],
                rayleigh_time: ['rayleigh_time_start', 'rayleigh_time_end']
            };

            var parameters = currProd.get('parameters');
            var band;
            var keys = _.keys(parameters);
            _.each(keys, function(key){
                if(parameters[key].selected){
                    band = key;
                }
            });

            if(band === 'mie_HLOS_wind_speed'){
                this.graph.renderSettings.colorAxis = [['mie_HLOS_wind_speed']];
                this.graph.renderSettings.yAxis = [['mie_altitude']];
                this.graph.renderSettings.xAxis =['mie_time'];
            }else if(band === 'rayleigh_HLOS_wind_speed'){
                this.graph.renderSettings.colorAxis = [['rayleigh_HLOS_wind_speed']];
                this.graph.renderSettings.yAxis = [['rayleigh_altitude']];
                this.graph.renderSettings.xAxis =['rayleigh_time'];
            } else if(band === 'mie_HLOS_wind_speed_normalised'){
                this.graph.renderSettings.colorAxis = [['mie_HLOS_wind_speed_normalised']];
                this.graph.renderSettings.yAxis = [['mie_altitude']];
                this.graph.renderSettings.xAxis =['mie_time'];
            }else if(band === 'rayleigh_HLOS_wind_speed_normalised'){
                this.graph.renderSettings.colorAxis = [['rayleigh_HLOS_wind_speed_normalised']];
                this.graph.renderSettings.yAxis = [['rayleigh_altitude']];
                this.graph.renderSettings.xAxis =['rayleigh_time'];
            }else if(band === 'mie_signal_intensity'){
                this.graph.renderSettings.colorAxis = [['mie_signal_intensity']];
                this.graph.renderSettings.yAxis = [['mie_altitude']];
                this.graph.renderSettings.xAxis =['mie_time'];
            }else if(band === 'rayleigh_signal_channel_A_intensity'){
                this.graph.renderSettings.colorAxis = [['rayleigh_signal_channel_A_intensity']];
                this.graph.renderSettings.yAxis = [['rayleigh_altitude']];
                this.graph.renderSettings.xAxis =['rayleigh_time'];
            }else if(band === 'rayleigh_signal_channel_B_intensity'){
                this.graph.renderSettings.colorAxis = [['rayleigh_signal_channel_B_intensity']];
                this.graph.renderSettings.yAxis = [['rayleigh_altitude']];
                this.graph.renderSettings.xAxis =['rayleigh_time'];
            }else if(band === 'rayleigh_signal_intensity'){
                this.graph.renderSettings.colorAxis = [['rayleigh_signal_intensity']];
                this.graph.renderSettings.yAxis = [['rayleigh_altitude']];
                this.graph.renderSettings.xAxis =['rayleigh_time'];
            }

            if(altitudeExtentSet) {
                var altExtent = altitudeExtent.map(
                    function(it){ return it*1000; }
                );
                // Check to see if we need to apply modifier to altitude
                var currPar = this.graph.renderSettings;
                var currSetts = globals.dataSettings[cov_id];
                var par = currPar.yAxis[0][0];
                if(currSetts.hasOwnProperty(par)){
                    // Check for modifiers that need to be applied
                    if(currSetts[par].hasOwnProperty('modifier')){
                        var expr = this.parser.parse(currSetts[par].modifier);
                        var exprFn = expr.toJSFunction('x');
                        altExtent = altExtent.map(exprFn);
                    }
                }

                this.graph.renderSettings.yAxisExtent = [altExtent];
                this.graph.renderSettings.yAxisLocked = [true];
            } else {
                this.graph.renderSettings.yAxisLocked = [false];
            }


            var height = 1000000;
            var lineInstances = [];
            var renderOutlines = defaultFor(currProd.get('outlines'), false);

            //TODO: How to correctly handle multiple curtains with jumps

            for (var i = 0; i <= data.stepPositions.length; i++) {

                var start = 0;
                var end;
                var signCross;
                if(i<data.stepPositions.length){
                    end = data.stepPositions[i]*2;
                }

                // TODO: this modifiert cuts the first and last column of the 
                // available data this solves multiple issues where the texture 
                // is rendered using the next colum after a gap in the data but
                //  it is not a clean solution
                var mod = 24;
                var dataStartMie = 0;
                var dataEndMie = data.mie_jumps[0]-mod;
                var dataStartRay = 0;
                var dataEndRay = data.rayleigh_jumps[0]-mod;
                if (i>0){
                    start = data.stepPositions[i-1]*2;
                    dataStartMie = data.mie_jumps[(i-1)*2]+mod;
                    dataEndMie = data.mie_jumps[(i*2)]-mod;
                    dataStartRay = data.rayleigh_jumps[(i-1)*2]+mod;
                    dataEndRay = data.rayleigh_jumps[(i*2)]-mod;
                }
                if(i===data.stepPositions.length){
                    end = data.positions.length;
                    dataEndMie = data['mie_HLOS_wind_speed'].length;
                    dataEndRay = data['rayleigh_HLOS_wind_speed'].length;
                }

                var dataSlice = {};
                var dataKeys = Object.keys(data);
                for (var k = dataKeys.length - 1; k >= 0; k--) {
                    if (band.indexOf('mie')!==-1 && dataKeys[k].indexOf('mie')!==-1){
                        dataSlice[dataKeys[k]] = 
                        data[dataKeys[k]].slice(dataStartMie, dataEndMie);
                    } else if (band.indexOf('rayleigh')!==-1 && dataKeys[k].indexOf('ray')!==-1){
                        dataSlice[dataKeys[k]] = 
                        data[dataKeys[k]].slice(dataStartRay, dataEndRay);
                    } else if(dataKeys[k].indexOf('mie')===-1 && dataKeys[k].indexOf('rayleigh')===-1) {
                        dataSlice[dataKeys[k]] = 
                        data[dataKeys[k]].slice(dataStartMie, dataEndMie);
                    }
                }

                if(data.signCross[i]){
                    end += 2;
                }


                this.graph.loadData(dataSlice);


                var imageTexture = this.graph.getCanvasImage();

                if(createWallPrimitives){
                    var newmat = new Cesium.Material({
                        fabric : {
                            type : 'Image',
                            uniforms : {
                                image : imageTexture
                            }
                        },
                        minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
                        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
                    });
                    
                    var slicedPosData = data.positions.slice(start, end);

                    if(renderOutlines){
                        var slicedPosDataWithHeight = [];
                        for (var p = 0; p < slicedPosData.length; p+=2) {
                            slicedPosDataWithHeight.push(slicedPosData[p]);
                            slicedPosDataWithHeight.push(slicedPosData[p+1]);
                            slicedPosDataWithHeight.push(height);
                        }


                        lineInstances.push(
                            new Cesium.GeometryInstance({
                                geometry : new Cesium.PolylineGeometry({
                                    positions : 
                                    Cesium.Cartesian3.fromDegreesArrayHeights(
                                        slicedPosDataWithHeight
                                    ),
                                    width : 10.0
                                })
                            })
                        );

                        lineInstances.push(
                            new Cesium.GeometryInstance({
                                geometry : new Cesium.PolylineGeometry({
                                    positions : 
                                    Cesium.Cartesian3.fromDegreesArray(
                                        slicedPosData
                                    ),
                                    width : 10.0
                                })
                            })
                        );
                    }

                    var maxHeights = [];
                    var carPos = Cesium.Cartesian3.fromDegreesArray(slicedPosData);
                    for (var j = 0; j <carPos.length; j++) {
                        maxHeights.push(height);
                    }
                    var wall = new Cesium.WallGeometry({
                        positions : carPos,
                        maximumHeights : maxHeights,
                    });
                    var wallGeometry = Cesium.WallGeometry.createGeometry(wall);

                    if(wallGeometry){
                        var instance = new Cesium.GeometryInstance({
                          geometry : wallGeometry
                        });

                        var sliceAppearance = new Cesium.MaterialAppearance({
                            translucent : true,
                            flat: true,
                            faceForward: true,
                            material : newmat
                        });

                        // Check the normal vector, in some cases we need to flip the
                        // direction of the texture to be applied
                        if(wallGeometry.attributes.normal.values[0]>0 &&
                            wallGeometry.attributes.normal.values[1]<0 &&
                            wallGeometry.attributes.normal.values[2]>0){
                            newmat.uniforms.repeat.x = 1;
                        } else if (wallGeometry.attributes.normal.values[0]<0 &&
                            wallGeometry.attributes.normal.values[1]>0 &&
                            wallGeometry.attributes.normal.values[2]<0){
                            newmat.uniforms.repeat.x = -1;
                        } else if (wallGeometry.attributes.normal.values[0]>0 &&
                            wallGeometry.attributes.normal.values[1]>0 &&
                            wallGeometry.attributes.normal.values[2]<0){
                            newmat.uniforms.repeat.x = -1;
                        } else if (wallGeometry.attributes.normal.values[0]>0 &&
                            wallGeometry.attributes.normal.values[1]<0 &&
                            wallGeometry.attributes.normal.values[2]<0){
                            newmat.uniforms.repeat.x = -1;
                        } else if (wallGeometry.attributes.normal.values[0]<0 &&
                            wallGeometry.attributes.normal.values[1]<0 &&
                            wallGeometry.attributes.normal.values[2]<0){
                            newmat.uniforms.repeat.x = -1;
                        }

                        //instances.push(instance);
                        var prim = new Cesium.Primitive({
                          geometryInstances : instance,
                          appearance : sliceAppearance,
                          releaseGeometryInstances: false,
                          asynchronous: false
                        });

                        curtainCollection.add(prim);
                    }

                    if(renderOutlines){
                        var linesPrim = new Cesium.Primitive({
                            geometryInstances: lineInstances,
                            appearance: new Cesium.PolylineMaterialAppearance({
                                material : new Cesium.Material.fromType('PolylineArrow', {
                                    color: new Cesium.Color(0.53, 0.02, 0.65, 1)
                                })
                            })
                        });
                        curtainCollection.add(linesPrim);
                    }

                } else {
                    // Just update the textures instead of recreating all primitives
                    if(currProd.hasOwnProperty('curtains')){
                        var curtainIdx = i;
                        if(defaultFor(currProd.get('outlines'), false)){
                            curtainIdx = curtainIdx*2;
                        }
                        var currPrim = currProd.curtains.get(curtainIdx);
                        if(typeof currPrim !== 'undefined'){
                            //currPrim.appearance.material._textures.image.copyFrom(this.graph.getCanvas())
                            currPrim.appearance.material.uniforms.image = imageTexture;
                        }
                    }
                }
            }
        },



        createL2Curtains: function(data, cov_id, createWallPrimitives){

            createWallPrimitives = defaultFor(createWallPrimitives, true);
            var currProd = globals.products.find(
                function(p){return p.get('download').id === cov_id;}
            );

            var altitudeExtentSet = currProd.get('altitudeExtentSet');
            var altitudeExtent = currProd.get('altitudeExtent');

            // TODO: If group collection is selected for now we do not create
            // curtains unless it is group granularity of L2A
            if(currProd.get('granularity') === 'group' &&
                currProd.get('download').id !== 'ALD_U_N_2A'){
                if(currProd.hasOwnProperty('curtains')){
                    currProd.curtains.removeAll();
                    curtainCollection = currProd.curtains;
                }
                return;
            }

            var curtainCollection;

            if(currProd.hasOwnProperty('curtains')){
                // Only delete the primitives if we are going to recreate them
                if(createWallPrimitives){
                    currProd.curtains.removeAll();
                }
                curtainCollection = currProd.curtains;
            }else{
                curtainCollection = new Cesium.PrimitiveCollection();
                this.activeCurtainCollections.push(curtainCollection);
                this.map.scene.primitives.add(curtainCollection);
                currProd.curtains = curtainCollection;
            }

            var parameters = currProd.get('parameters');
            var band;
            var keys = _.keys(parameters);
            _.each(keys, function(key){
                if(parameters[key].selected){
                    band = key;
                }
            });
            var alpha = currProd.get('opacity');

            this.graph.dataSettings = globals.dataSettings[cov_id];

            var dataJumps, lats, lons, pStartTimes, pStopTimes, signCross;

            var params = {
                'ALD_U_N_2A': {
                    'SCA_middle_bin': {
                        lats: 'latitude_of_DEM_intersection_obs_orig',
                        lons: 'longitude_of_DEM_intersection_obs_orig',
                        timeStart: 'SCA_middle_bin_time_obs_orig_start',
                        timeStop: 'SCA_middle_bin_time_obs_orig_stop',
                        xAxis:'SCA_middle_bin_time',
                        yAxis: ['SCA_middle_bin_altitude'],
                        combinedParameters: {
                            SCA_middle_bin_altitude: ['SCA_middle_bin_altitude_obs_top', 'SCA_middle_bin_altitude_obs_bottom'],
                            SCA_middle_bin_time: ['SCA_middle_bin_time_obs_start', 'SCA_middle_bin_time_obs_stop']
                        },
                        jumps: 'SCA_middle_bin_jumps',
                        signCross: 'signCross'
                    },
                    'SCA': {
                        lats: 'sca_latitude_of_DEM_intersection_obs_orig',
                        lons: 'sca_longitude_of_DEM_intersection_obs_orig',
                        timeStart: 'SCA_time_obs_orig_start',
                        timeStop: 'SCA_time_obs_orig_stop',
                        xAxis:'time',
                        yAxis: ['rayleigh_altitude'],
                        combinedParameters: {
                            rayleigh_altitude: ['rayleigh_altitude_obs_top', 'rayleigh_altitude_obs_bottom'],
                            time: ['SCA_time_obs_start', 'SCA_time_obs_stop'],
                        },
                        jumps: 'sca_jumps',
                        signCross: 'sca_signCross'
                    },
                    'MCA': {
                        lats: 'latitude_of_DEM_intersection_obs_orig',
                        lons: 'longitude_of_DEM_intersection_obs_orig',
                        timeStart: 'MCA_time_obs_orig_start',
                        timeStop: 'MCA_time_obs_orig_stop',
                        xAxis:'time',
                        yAxis: ['mie_altitude'],
                        combinedParameters: {
                            mie_altitude: ['mie_altitude_obs_top', 'mie_altitude_obs_bottom'],
                            time: ['MCA_time_obs_start', 'MCA_time_obs_stop'],
                        },
                        jumps: 'jumps',
                        signCross: 'signCross'
                    },
                    'group': {
                        lats: 'latitude_of_DEM_intersection_obs_orig',
                        lons: 'longitude_of_DEM_intersection_obs_orig',
                        timeStart: 'group_start_time',
                        timeStop: 'group_end_time',
                        xAxis:'time',
                        yAxis: ['altitude'],
                        combinedParameters: {
                            altitude: ['alt_start', 'alt_end'],
                            time: ['group_start_time', 'group_end_time'],
                        },
                        jumps: 'group_jumps',
                        signCross: 'group_signCross'
                    },

                },
                'ALD_U_N_2B': {
                    'mie_wind_result': {
                        lats: 'mie_wind_result_lat_of_DEM_intersection',
                        lons: 'mie_wind_result_lon_of_DEM_intersection',
                        timeStart: 'mie_wind_result_start_time',
                        timeStop: 'mie_wind_result_stop_time',
                        xAxis:'time',
                        yAxis: ['mie_altitude'],
                        combinedParameters: {
                            mie_altitude: ['mie_wind_result_top_altitude', 'mie_wind_result_bottom_altitude'],
                            time: ['mie_wind_result_start_time', 'mie_wind_result_stop_time'],
                        },
                        jumps: 'mie_jumps',
                        signCross: 'mieSignCross'
                    },
                    'rayleigh_wind_result': {
                        lats: 'rayleigh_wind_result_lat_of_DEM_intersection',
                        lons: 'rayleigh_wind_result_lon_of_DEM_intersection',
                        timeStart: 'rayleigh_wind_result_start_time',
                        timeStop: 'rayleigh_wind_result_stop_time',
                        xAxis:'time',
                        yAxis: ['rayleigh_altitude'],
                        combinedParameters: {
                            rayleigh_altitude: ['rayleigh_wind_result_top_altitude', 'rayleigh_wind_result_bottom_altitude'],
                            time: ['rayleigh_wind_result_start_time', 'rayleigh_wind_result_stop_time'],
                        },
                        jumps: 'rayleigh_jumps',
                        signCross: 'rayleighSignCross'
                    }
                },
                'ALD_U_N_2C': {
                    'mie_wind_result': {
                        lats: 'mie_wind_result_lat_of_DEM_intersection',
                        lons: 'mie_wind_result_lon_of_DEM_intersection',
                        timeStart: 'mie_wind_result_start_time',
                        timeStop: 'mie_wind_result_stop_time',
                        xAxis:'time',
                        yAxis: ['mie_altitude'],
                        combinedParameters: {
                            mie_altitude: ['mie_wind_result_top_altitude', 'mie_wind_result_bottom_altitude'],
                            time: ['mie_wind_result_start_time', 'mie_wind_result_stop_time'],
                        },
                        jumps: 'mie_jumps',
                        signCross: 'mieSignCross'
                    },
                    'rayleigh_wind_result': {
                        lats: 'rayleigh_wind_result_lat_of_DEM_intersection',
                        lons: 'rayleigh_wind_result_lon_of_DEM_intersection',
                        timeStart: 'rayleigh_wind_result_start_time',
                        timeStop: 'rayleigh_wind_result_stop_time',
                        xAxis:'time',
                        yAxis: ['rayleigh_altitude'],
                        combinedParameters: {
                            rayleigh_altitude: ['rayleigh_wind_result_top_altitude', 'rayleigh_wind_result_bottom_altitude'],
                            time: ['rayleigh_wind_result_start_time', 'rayleigh_wind_result_stop_time'],
                        },
                        jumps: 'rayleigh_jumps',
                        signCross: 'rayleighSignCross'
                    }
                }
            };

            var currPar;
            var modifier = 0;

            if(cov_id === 'ALD_U_N_2B' || cov_id === 'ALD_U_N_2C'){
                modifier = 24;
            } else if(cov_id === 'ALD_U_N_2A'){
                modifier = 2;
            }

            if(cov_id === 'AUX_MET_12'){
                modifier = 0;
                if(band.indexOf('off_nadir') !== -1){
                    currPar = {
                        lats: 'latitude_off_nadir',
                        lons: 'longitude_off_nadir',
                        timeStart: 'time_off_nadir',
                        timeStop: 'time_off_nadir',
                        colorAxis: [band],
                        xAxis:'time_off_nadir_combined',
                        yAxis: ['layer_altitude_off_nadir'],
                        combinedParameters: {
                            time_off_nadir_combined: ['time_off_nadir_start', 'time_off_nadir_end'],
                            layer_altitude_off_nadir: ['layer_altitude_off_nadir_end', 'layer_altitude_off_nadir_start']
                        },
                        jumps: 'off_nadir_jumps',
                        signCross: 'off_nadirSignCross'
                    };
                } else {
                    currPar = {
                        lats: 'latitude_nadir',
                        lons: 'longitude_nadir',
                        timeStart: 'time_nadir',
                        timeStop: 'time_nadir',
                        colorAxis: [band],
                        xAxis:'time_nadir_combined',
                        yAxis: ['layer_altitude_nadir'],
                        combinedParameters: {
                            time_nadir_combined: ['time_nadir_start', 'time_nadir_end'],
                            layer_altitude_nadir: ['layer_altitude_nadir_end', 'layer_altitude_nadir_start']
                        },
                        jumps: 'nadir_jumps',
                        signCross: 'nadirSignCross'
                    };
                }
            } else if (band.startsWith('SCA_middle_bin')){
                currPar = params[cov_id]['SCA_middle_bin'];
                currPar.colorAxis = [band];
            } else if (band.startsWith('SCA_')){
                currPar = params[cov_id]['SCA'];
                currPar.colorAxis = [band];
            } else if (band.startsWith('MCA_')){
                currPar = params[cov_id]['MCA'];
                currPar.colorAxis = [band];
            } else if (band.startsWith('group_')){
                currPar = params[cov_id]['group'];
                currPar.colorAxis = [band];
            }else if (band.startsWith('mie_wind_result') || band.startsWith('mie_assimilation') ){
                currPar = params[cov_id]['mie_wind_result'];
                currPar.colorAxis = [band];
            }  else if (band.startsWith('rayleigh_wind_result') || band.startsWith('rayleigh_assimilation') ){
                currPar = params[cov_id]['rayleigh_wind_result'];
                currPar.colorAxis = [band];
            } else {
                currPar = params[cov_id][band];
            }

            this.graph.renderSettings.combinedParameters = currPar.combinedParameters;
            this.graph.renderSettings.colorAxis = [currPar.colorAxis];
            this.graph.renderSettings.yAxis = [currPar.yAxis];
            this.graph.renderSettings.xAxis =currPar.xAxis;

            if(altitudeExtentSet) {
                var altExtent = altitudeExtent.map(
                    function(it){ return it*1000; }
                );
                // Check to see if we need to apply modifier to altitude
                var currSetts = globals.dataSettings[cov_id];
                var par = currPar.yAxis;
                // Check to see if we are using the modified _obs altitudes
                if(currSetts.hasOwnProperty(par+'_obs')){
                    par += '_obs';
                }
                // For L2B and L2C we use the combined parameter as reference
                if(cov_id === 'ALD_U_N_2B' || cov_id === 'ALD_U_N_2C'){
                    if(currPar.combinedParameters.hasOwnProperty(par)){
                        par = currPar.combinedParameters[par][0];
                    }
                }
                if(currSetts.hasOwnProperty(par)){
                    // Check for modifiers that need to be applied
                    if(currSetts[par].hasOwnProperty('modifier')){
                        var expr = this.parser.parse(currSetts[par].modifier);
                        var exprFn = expr.toJSFunction('x');
                        altExtent = altExtent.map(exprFn);
                    }
                }

                this.graph.renderSettings.yAxisExtent = [altExtent];
                this.graph.renderSettings.yAxisLocked = [true];
            } else {
                this.graph.renderSettings.yAxisLocked = [false];
            }

            dataJumps = data[currPar.jumps];
            lats = data[currPar.lats];
            lons = data[currPar.lons];
            //pStartTimes = data[currPar.timeStart];
            //pStopTimes = data[currPar.timeStop];
            pStartTimes = data[currPar.timeStart];
            pStopTimes = data[currPar.timeStop];
            signCross = data[currPar.signCross];

            // Go through slices and render them
            for (var jIdx = 0; jIdx <= dataJumps.length; jIdx++) {

                var start, end;
                var startSlice, endSlice;
                
                if(dataJumps.length === 0){
                    this.graph.loadData(data);
                    if(pStartTimes[0] instanceof Date){
                        start = pStartTimes[0];
                    }else{
                        start = new Date('2000-01-01');
                        start.setUTCMilliseconds(
                            start.getUTCMilliseconds() + pStartTimes[0]*1000
                        );
                    }

                    if(pStopTimes[pStopTimes.length-1] instanceof Date){
                        end = pStopTimes[pStopTimes.length-1];
                    }else{
                        end = new Date('2000-01-01');
                        end.setUTCMilliseconds(
                            end.getUTCMilliseconds() + 
                            pStopTimes[pStopTimes.length-1]*1000
                        );
                    }
                    startSlice = 0;
                    endSlice = lats.length-1;

                } else {
                    // get extent limits for curtain piece
                    startSlice = 0;
                    if(jIdx>0){
                        if(signCross[jIdx-1]){
                            startSlice = dataJumps[jIdx-1]-1;
                        } else {
                            startSlice = dataJumps[jIdx-1];
                        }
                    }
                    if(jIdx<dataJumps.length){
                        endSlice = dataJumps[jIdx]-modifier;
                    }else{
                        endSlice = lats.length-1;
                    }
                    // If curtain slice is too small we ignore it as it can't be rendered
                    if(endSlice-startSlice<=2){
                        console.log('Curtain slice too small, is ignored')
                        continue;
                    }

                    if(pStartTimes[startSlice] instanceof Date){
                        start = pStartTimes[startSlice];
                    }else{
                        start = new Date('2000-01-01');
                        start.setUTCMilliseconds(start.getUTCMilliseconds() + pStartTimes[startSlice]*1000);
                    }

                    if(pStopTimes[endSlice] instanceof Date){
                        end = pStopTimes[endSlice-1];
                    }else{
                        end = new Date('2000-01-01');
                        end.setUTCMilliseconds(end.getUTCMilliseconds() + pStopTimes[endSlice]*1000);
                    }
                    
                    this.graph.setXDomain([start, end]);
                    this.graph.loadData(data);
                    this.graph.clearXDomain();
                }

                var imageTexture = this.graph.getCanvasImage();
                if(createWallPrimitives){
                    this.createWallPrimitive(
                        currProd, startSlice, endSlice, lats, lons, dataJumps,
                        modifier, start, end, imageTexture, curtainCollection
                    );
                } else {
                    // Just update the textures instead of recreating all primitives
                    if(currProd.hasOwnProperty('curtains')){
                        var curtainIdx = jIdx;
                        if(defaultFor(currProd.get('outlines'), false)){
                            curtainIdx = curtainIdx*2;
                        }
                        var currPrim = currProd.curtains.get(curtainIdx);
                        if(typeof currPrim !== 'undefined'){
                            //currPrim.appearance.material._textures.image.copyFrom(this.graph.getCanvas())
                            currPrim.appearance.material.uniforms.image = imageTexture;
                        }
                    }
                }
            }

        },

        createWallPrimitive: function(
            currProd, startSlice, endSlice, lats, lons, dataJumps, modifier,
            start, end, imageTexture, curtainCollection ) {

            var newmat = new Cesium.Material({
                fabric : {
                    type : 'Image',
                    uniforms : {
                        image : imageTexture
                    }
                },
                minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
                magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
            });

            var slicedLats, slicedLons, slicedTime;

            if(dataJumps.length > 0){
                slicedLats = lats.slice(startSlice, endSlice+modifier);
                slicedLons = lons.slice(startSlice, endSlice+modifier);
            } else {
                slicedLats = lats;
                slicedLons = lons;
            }

            var posDataHeight = [];
            var posDataLineHeight = [];
            var posData = [];

            var height = 1000000;
            var lineInstances = [];
            var renderOutlines = defaultFor(currProd.get('outlines'), false);

            // We need uniformly distributed sections in the curtain to not 
            // create distortions in the texture, for this we use the time
            // information which should be uniform

            var cleanLats = [];
            var cleanLons = [];

            var sliceTimeInterval = end.getTime() - start.getTime();
            var endMs = end.getTime();
            // Lets try to get around a value each ~90 seconds, more or less
            // a curtain section per profile
            var steps = (sliceTimeInterval/1000) / 90;
            if(steps < 1.0){
                steps = 1.0;
            }
            var datastepsize = Math.floor(slicedLats.length / steps);
            var timeDelta = (sliceTimeInterval/steps);

            var currentTime = start.getTime();
            var currSliceStep = startSlice;

            for (var currStep = 0; currStep < slicedLats.length; currStep+=datastepsize) {
                cleanLats.push(slicedLats[currStep]);
                cleanLons.push(slicedLons[currStep]);
            }


            if(cleanLats[cleanLats.length-1] !== slicedLats[slicedLats.length-1]){
                if(cleanLats.length>1){
                    cleanLats.pop();
                    cleanLons.pop();
                }
                cleanLats.push(slicedLats[slicedLats.length-1]);
                cleanLons.push(slicedLons[slicedLons.length-1]);
            }

            // As first and last profile can have very different size
            // we make sure we find the min and max value of initial and last
            // values
            var delta = 1;
            if(cleanLats[0]-cleanLats[1]<0){
                cleanLats[0] = d3.min(slicedLats.slice(0,delta));
                cleanLats[cleanLats.length-1] = d3.max(slicedLats.slice(-delta));
            } else {
                cleanLats[0] = d3.max(slicedLats.slice(0,delta));
                cleanLats[cleanLats.length-1] = d3.min(slicedLats.slice(-delta));
            }
            
            
            if(cleanLons[0]-cleanLons[1]<0){
                cleanLons[0] = d3.min(slicedLons.slice(0,delta));
                cleanLons[cleanLons.length-1] = d3.max(slicedLons.slice(-delta));
            } else {
                cleanLons[0] = d3.max(slicedLons.slice(0,delta));
                cleanLons[cleanLons.length-1] = d3.min(slicedLons.slice(-delta));
            }
            

            for (var p = 0; p < cleanLats.length; p++) {
                posDataHeight.push(cleanLons[p]);
                posDataHeight.push(cleanLats[p]);
                posDataHeight.push(height);
                posDataLineHeight.push(cleanLons[p]);
                posDataLineHeight.push(cleanLats[p]);
                posDataLineHeight.push(height+20000);
                posData.push(cleanLons[p]);
                posData.push(cleanLats[p]);
            }

            if(renderOutlines){
                lineInstances.push(
                    new Cesium.GeometryInstance({
                        geometry : new Cesium.PolylineGeometry({
                            positions : 
                            Cesium.Cartesian3.fromDegreesArrayHeights(
                                posDataLineHeight
                            ),
                            width : 10.0
                        })
                    })
                );

                lineInstances.push(
                    new Cesium.GeometryInstance({
                        geometry : new Cesium.PolylineGeometry({
                            positions : 
                            Cesium.Cartesian3.fromDegreesArray(
                                posData
                            ),
                            width : 10.0
                        })
                    })
                );
            }

            if(posDataHeight.length === 6){
                if (posDataHeight[0] === posDataHeight[3] &&
                    posDataHeight[1] === posDataHeight[4]){
                    console.log('Warning curtain geometry has equal start and end point, geometry creation was skipped');
                    return;
                }
            }

            // Debug helper
            /*
            if(this.auxOutlineLines){
                this.map.entities.remove(this.auxOutlineLines);
            }
            this.auxOutlineLines = this.map.entities.add({
                wall : {
                    positions : Cesium.Cartesian3.fromDegreesArrayHeights(
                        posDataHeight
                    ),
                    outline : true,
                    outlineColor : Cesium.Color.RED,
                    outlineWidth : 2,
                    material : Cesium.Color.fromRandom({alpha : 0.7})
                }
            });
            */

            var wall = new Cesium.WallGeometry({
                positions : Cesium.Cartesian3.fromDegreesArrayHeights(
                    posDataHeight
                )
            });

            var wallGeometry = Cesium.WallGeometry.createGeometry(wall);
            if(wallGeometry){
                var instance = new Cesium.GeometryInstance({
                  geometry : wallGeometry
                }); 

                // Check the normal vector, in some cases we need to flip the
                // direction of the texture to be applied
                if(wallGeometry.attributes.normal.values[0]>0 &&
                    wallGeometry.attributes.normal.values[1]<0 &&
                    wallGeometry.attributes.normal.values[2]>0){
                    newmat.uniforms.repeat.x = 1;
                } else if (wallGeometry.attributes.normal.values[0]<0 &&
                    wallGeometry.attributes.normal.values[1]>0 &&
                    wallGeometry.attributes.normal.values[2]<0){
                    newmat.uniforms.repeat.x = -1;
                } else if (wallGeometry.attributes.normal.values[0]>0 &&
                    wallGeometry.attributes.normal.values[1]>0 &&
                    wallGeometry.attributes.normal.values[2]<0){
                    newmat.uniforms.repeat.x = -1;
                } else if (wallGeometry.attributes.normal.values[0]>0 &&
                    wallGeometry.attributes.normal.values[1]<0 &&
                    wallGeometry.attributes.normal.values[2]<0){
                    newmat.uniforms.repeat.x = -1;
                } else if (wallGeometry.attributes.normal.values[0]<0 &&
                    wallGeometry.attributes.normal.values[1]<0 &&
                    wallGeometry.attributes.normal.values[2]<0){
                    newmat.uniforms.repeat.x = -1;
                }

            } else {
                console.log("CesiumView.js: Wallgeometry not created correctly!");
            }


            var sliceAppearance = new Cesium.MaterialAppearance({
                translucent : true,
                flat: true,
                faceForward: true,
                material : newmat
            });

            var prim = new Cesium.Primitive({
              geometryInstances : instance,
              appearance : sliceAppearance,
              releaseGeometryInstances: false,
              asynchronous: false
            });

            curtainCollection.add(prim);

            if(renderOutlines){
                var linesPrim = new Cesium.Primitive({
                    geometryInstances: lineInstances,
                    appearance: new Cesium.PolylineMaterialAppearance({
                        material : new Cesium.Material.fromType('PolylineArrow', {
                            color: new Cesium.Color(0.53, 0.02, 0.65, 1)
                        })
                    })
                });
                curtainCollection.add(linesPrim);
            }
        },



        //method to create layer depending on protocol
        //setting possible description attributes
        createLayer: function (layerdesc) {

            var returnLayer = null;
            var views = layerdesc.get('views');
            var view;

            if( typeof(views) === 'undefined'){
              view = layerdesc.get('view');
            } else {
            
                if (views.length === 1){
                    view = views[0];
                } else {
                    // FIXXME: this whole logic has to be replaced by a more robust method, i.e. a viewer
                    // defines, which protocols to support and get's the corresponding views from the
                    // config then.

                    // For now: prefer WMTS over WMS, if available:
                    var wmts = _.find(views, function(view){ 
                        return view.protocol === 'WMTS'; 
                    });
                    if(wmts){
                        view = wmts;
                    } else {
                        var wms = _.find(views, function(view){
                            return view.protocol === 'WMS'; 
                        });
                        if (wms) {
                            view = wms;
                        } else {
                            // No supported protocol defined in config.json!
                            return null;
                        }
                    }
                }
            }

            // Manage custom attribution element (add attribution for active layers)
            if(layerdesc.get('visible')){
                this.addCustomAttribution(view);
            }
            var options;
            switch(view.protocol){
                case 'WMTS':
                    options = {
                        url : view.urls[0],
                        layer : view.id,
                        style : view.style,
                        format : view.format,
                        tileMatrixSetID : view.matrixSet,
                        maximumLevel: 12,
                        tilingScheme: new Cesium.GeographicTilingScheme({
                            numberOfLevelZeroTilesX: 2, numberOfLevelZeroTilesY: 1
                        }),
                        credit : new Cesium.Credit(view.attribution),
                        show: layerdesc.get('visible')
                    };
                    if(view.hasOwnProperty('urlTemplate') && view.hasOwnProperty('subdomains')){
                        options.url = view.urlTemplate;
                        options.subdomains = view.subdomains;
                    }
                    returnLayer = new Cesium.WebMapTileServiceImageryProvider(options);
                break;

                case 'WMS':
                    var params = $.extend({
                        transparent: 'true',
                    }, Cesium.WebMapServiceImageryProvider.DefaultParameters);

                    // Check if layer has additional parameters configured
                    var addParams = {transparent: true};
                    var styles;
                    if(layerdesc.get('parameters')){
                        options = layerdesc.get('parameters');
                        var keys = _.keys(options);
                        _.each(keys, function(key){
                            if(options[key].selected){
                                addParams.dim_bands = key;
                                addParams.dim_range = 
                                    options[key].range[0]+','+options[key].range[1];
                                styles = options[key].colorscale;
                            }
                        });
                    }
                    var cr = layerdesc.get('coefficients_range');
                    if(cr){
                        addParams.coefficients_range = cr.join();
                    }
                    addParams.styles = styles; 
                    if(layerdesc.get('timeSlider')){
                        var string = 
                            getISODateTimeString(this.beginTime) + '/'+
                            getISODateTimeString(this.endTime);
                        addParams.time = string;
                    }
                    if(layerdesc.get('height')){
                        addParams.elevation = layerdesc.get('height');
                    }
                    params.format = layerdesc.get('views')[0].format;
                    returnLayer = new Cesium.WebMapServiceImageryProvider({
                        url: view.urls[0],
                        layers : view.id,
                        tileWidth: layerdesc.get('tileSize'),
                        tileHeight: layerdesc.get('tileSize'),
                        enablePickFeatures: false,
                        parameters: params
                    });

                    for (var par in addParams){
                        returnLayer.updateProperties(par, addParams[par]);
                    }

                break;

                case 'WPS':
                    returnLayer = new Cesium.SingleTileImageryProvider({
                        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                    });
                 break;

                default:
                  // No supported view available
                  // Return dummy Image provider to help with with sorting of layers 
                  //return  new Cesium.WebMapServiceImageryProvider();
                  returnLayer = false;
                break;
            }
            return returnLayer;
        },

        centerMap: function(data) {
            //this.map.setCenter(new OpenLayers.LonLat(data.x, data.y), data.l);
            this.model.set({
                'center': [data.x, data.y],
                'zoom': data.l
            });
        },

        onSortProducts: function(shifts) {
            // Search for moved layer
            // Sorting only works on model layers so we filter them out first
            globals.products.each(function(product) {
                var cesLayer = product.get('ces_layer');
                if(cesLayer && shifts.hasOwnProperty(product.get('name'))){
                    // Raise or Lower the layer depending on movement
                    var toMove = shifts[product.get('name')];
                    for(var i=0; i<Math.abs(toMove); ++i){
                        if(toMove < 0){
                            this.map.scene.imageryLayers.lower(cesLayer);
                        } else if(toMove > 0){
                            this.map.scene.imageryLayers.raise(cesLayer);
                        }
                    }
                }
            }, this);
            console.log('Map products sorted');
        },

        onUpdateOpacity: function(options) {

            var product = globals.products.find(
                function(p){return p.get('download').id === options.model.get('download').id;}
            );

            if(product){
                if(product.hasOwnProperty('curtains')){
                    for (var i = 0; i < product.curtains._primitives.length; i++) {
                        product.curtains._primitives[i].appearance.material.uniforms.color.alpha = options.value;//.clone();
                    }
                }
                if(product.hasOwnProperty('points')){
                    for (var i = 0; i < product.points._pointPrimitives.length; i++) {
                        var b = product.points.get(i);
                        if(b.color){
                            var c = b.color.clone();
                            c.alpha = options.value;
                            b.color = c;
                        }
                    }
                }
                var cesLayer = product.get('ces_layer');
                if(cesLayer){
                    cesLayer.alpha = options.value;
                }
            }
        },

        addCustomAttribution: function(view) {
            if(view.hasOwnProperty('attribution')){
                $('#cesium_custom_attribution').append(
                    '<div id="' + view.id.replace(/[^A-Z0-9]/ig, '_') +
                    '" style="float: left; margin-left: 3px;">'+
                    view.attribution + '</div>'
                );
            }
        },

        removeCustomAttribution: function(view){
            if(view.hasOwnProperty('id')){
                $('#'+view.id.replace(/[^A-Z0-9]/ig, '_')).remove();
            }
        },

        changeLayer: function(options) {
            // Seems for some reason that a layer needs to be as shown at all times
            // or cesium will throw an error, so first activate the new layer, then 
            // deactivate the others
            if (options.isBaseLayer){
                globals.baseLayers.each(function(baselayer) {
                    var cesLayer = baselayer.get('ces_layer');
                    if (cesLayer) {
                        if(baselayer.get('name') === options.name){
                            cesLayer.show = true;
                            this.addCustomAttribution(baselayer.get('views')[0]);
                        }
                    }
                }, this);

                globals.baseLayers.each(function(baselayer) {
                    var cesLayer = baselayer.get('ces_layer');
                    if (cesLayer) {
                        if(baselayer.get('name') !== options.name){
                            cesLayer.show = false;
                            this.removeCustomAttribution(baselayer.get('views')[0]);
                        }
                    }
                }, this);

            } else {
                globals.overlays.each(function(overlay) {
                    if(overlay.get('name') === options.name){
                        var cesLayer = overlay.get('ces_layer');
                        cesLayer.show = options.visible;
                        if(options.visible){
                            this.addCustomAttribution(overlay.get('view'));
                        }else{
                            this.removeCustomAttribution(overlay.get('view'));
                        }
                    }
                }, this);

                globals.products.each(function(product) {
                    if(product.get('name') === options.name){
                        //product.set('visible', options.visible);
                        this.checkColorscale(product.get('download').id);

                        if (product.get('views')[0].protocol === 'WPS'){
                            //this.checkShc(product, options.visible);

                        }else if (product.get('views')[0].protocol === 'WMS' ||
                                  product.get('views')[0].protocol === 'WMTS' ){
                            var cesLayer;
                            var parameters = product.get('parameters');
                            var coeffRange = product.get('coefficients_range');
                            if (parameters){
                                var band;
                                var keys = _.keys(parameters);
                                _.each(keys, function(key){
                                    if(parameters[key].selected){
                                        band = key;
                                    }
                                });
                                var style = parameters[band].colorscale;
                                var range = parameters[band].range;

                                if (band === 'Fieldlines'){
                                    if(options.visible){
                                        this.activeFL.push(product.get('download').id);
                                    }else{
                                        if (this.activeFL.indexOf(product.get('download').id)!==-1){
                                            this.activeFL.splice(this.activeFL.indexOf(product.get('download').id), 1);
                                        }
                                    }
                                }else{

                                    cesLayer = product.get('ces_layer');
                                    if(band){
                                        cesLayer.imageryProvider.updateProperties(
                                            'dim_bands', band
                                        );
                                    }
                                    if(range){
                                        cesLayer.imageryProvider.updateProperties(
                                            'dim_range', (range[0]+','+range[1])
                                        );
                                    }
                                    if(style){
                                        cesLayer.imageryProvider.updateProperties(
                                            'styles', style
                                        );
                                    }
                                    if(coeffRange){
                                        cesLayer.imageryProvider.updateProperties(
                                            'dim_coeff', (coeffRange[0]+','+coeffRange[1])
                                        );
                                    }
                                    cesLayer.show = options.visible;
                                }

                            }else{
                                cesLayer = product.get('ces_layer');
                                cesLayer.show = options.visible;
                            }
                        } // END of WMS and WMTS case
                    }

                    if(product.get('model') && product.get('name') === options.name){
                        if (this.activeModels.indexOf(product.get('name'))!==-1){
                            this.activeModels.splice(
                                this.activeModels.indexOf(product.get('name')), 1
                            );
                        }

                        if (this.activeModels.length !== 2){
                            if(this.differenceImage) {
                                this.map.scene.imageryLayers.remove(
                                    this.differenceImage
                                );
                            }
                            this.differenceImage = null;
                            if($('#colorlegend').is(':visible')){
                                $('#colorlegend').hide();
                            }
                        }

                        // Compare models if two are selected
                        if (this.activeModels.length === 2){
                        }

                    }
                }, this); // END of global products loop
            }
        }, // END of changeLayer


        checkShc: function(product, visible){
            if(visible){
                if(product.get('shc') !== null){
                    var parameters = product.get('parameters');
                    var band;
                    var keys = _.keys(parameters);
                    _.each(keys, function(key){
                        if(parameters[key].selected){
                            band = key;
                        }
                    });
                    var style = parameters[band].colorscale;
                    var range = parameters[band].range;
                    var url = product.get('views')[0].urls[0];
                    this.customModelLayer = product.get('ces_layer');
                    this.customModelLayer.show = false;

                    var coeffRange = product.get('coefficients_range');
                    var options = {
                        'model': 'Custom_Model',
                        'variable': band,
                        'begin_time': getISODateTimeString(this.beginTime),
                        'end_time': getISODateTimeString(this.endTime),
                        'elevation': product.get('height'),
                        'coeff_min': coeffRange[0],
                        'coeff_max': coeffRange[1],
                        'shc': product.get('shc'),
                        'height': 512,
                        'width': 1024,
                        'style': style,
                        'range_min': range[0],
                        'range_max': range[1],
                    };
                    if (this.bboxsel !== null){
                        var bb = this.bboxsel;
                        options.bbox =  bb.join();
                    }

                    var map = this.map;
                    var customModelLayer = this.customModelLayer;

                    /*$.post(url, tmplEvalModel(options))
                        .done(function( data ) {
                            var imageURI = 'data:image/gif;base64,'+data;
                            var layerOptions = {url: imageURI};
                            if(bb && bb.length === 4){
                                var rec = new Cesium.Rectangle(
                                    Cesium.Math.toRadians(bb[1]),
                                    Cesium.Math.toRadians(bb[0]),
                                    Cesium.Math.toRadians(bb[3]),
                                    Cesium.Math.toRadians(bb[2])
                                );
                                layerOptions.rectangle = rec;
                            }
                            var index = map.scene.imageryLayers.indexOf(customModelLayer);
                            var imagelayer = new Cesium.SingleTileImageryProvider(layerOptions);
                            map.scene.imageryLayers.remove(customModelLayer);
                            customModelLayer = 
                                map.scene.imageryLayers.addImageryProvider(imagelayer, index);
                            product.set('ces_layer', customModelLayer);
                            customModelLayer.show = true;
                        });*/
                } // END if product has shc
            }else{ 
                var cesLayer = product.get('ces_layer');
                cesLayer.show = visible;
            } // END of if visible
        },


        createPointCollection: function(data, cov_id, alpha, height){

            var currProd = globals.products.find(
                function(p){return p.get('download').id === cov_id;}
            );
            var parameters = currProd.get('parameters');
            var band;
            var keys = _.keys(parameters);
            _.each(keys, function(key){
                if(parameters[key].selected){
                    band = key;
                }
            });

            var AUXMET2D = [
                'layer_validity_flag_nadir',
                //'layer_pressure_nadir',
                'layer_temperature_nadir',
                'layer_wind_component_u_nadir',
                'layer_wind_component_v_nadir',
                'layer_rel_humidity_nadir',
                'layer_spec_humidity_nadir',
                'layer_cloud_cover_nadir',
                'layer_cloud_liquid_water_content_nadir',
            
                'layer_validity_flag_off_nadir',
                //'layer_pressure_off_nadir',
                'layer_temperature_off_nadir',
                'layer_wind_component_u_off_nadir',
                'layer_wind_component_v_off_nadir',
                'layer_rel_humidity_off_nadir',
                'layer_spec_humidity_off_nadir',
                'layer_cloud_cover_off_nadir',
                'layer_cloud_liquid_water_content_off_nadir',
                'layer_cloud_ice_water_content_off_nadir'
            ];
            // If selected parameter is from AUX MET and 2D we need to create
            // a curtain isntead of points
            if(cov_id === 'AUX_MET_12' && AUXMET2D.indexOf(band)!==-1 ){
                if(currProd.hasOwnProperty('points')){
                    currProd.points.removeAll();
                }
                this.createL2Curtains(data, cov_id);
                return;
            } 
            var latPar, lonPar;
            if (cov_id === 'AUX_MET_12'){
                if(band.indexOf('_off_nadir') !== -1){
                    latPar = 'latitude_off_nadir';
                    lonPar = 'longitude_off_nadir';
                } else {
                    latPar = 'latitude_nadir';
                    lonPar = 'longitude_nadir';
                }
            } else {
                latPar = 'lat_of_DEM_intersection';
                lonPar = 'lon_of_DEM_intersection';
            }

            if(typeof data === 'undefined' || !data.hasOwnProperty(latPar) || !data.hasOwnProperty(lonPar)){
                // If data does not have required position information
                // do not try to render it
                return;
            }

            var pointCollection;
            var style = parameters[band].colorscale;
            var range = parameters[band].range;

            if(currProd.hasOwnProperty('points')){
                currProd.points.removeAll();
                pointCollection = currProd.points;
                /*this.map.scene.primitives.remove(currProd.curtains);
                delete currProd.curtains;*/
            }else{
                pointCollection = new Cesium.PointPrimitiveCollection();
                this.activePointsCollections.push(pointCollection);
                this.map.scene.primitives.add(pointCollection);
                currProd.points = pointCollection;
            }

            if(!this.map.scene.context._gl.getExtension('EXT_frag_depth')){
                pointCollection._rs = 
                    Cesium.RenderState.fromCache({
                        depthTest : {
                            enabled : true,
                            func : Cesium.DepthFunction.LESS
                        },
                        depthMask : false,
                        blending : Cesium.BlendingState.ALPHA_BLEND
                    });
            }



            alpha = currProd.get('opacity');

            /*this.dataSettings[band].colorscale = style;
            this.dataSettings[band].extent = range;
            this.graph.dataSettings = this.dataSettings;*/

            height = 0;
            var renderOutlines = defaultFor(currProd.get('outlines'), false);

            this.graph.batchDrawer.setColorScale(style);
            this.graph.batchDrawer.setDomain(range);

            var scaltype = new Cesium.NearFarScalar(1.0e2, 4, 14.0e6, 0.8);
            
            var filters = globals.swarm.get('filters');
            var show = true;

            var positions = [];

            for (var i = 0; i < data[band].length; i++) {
                var row = {};
                for(var k in data){
                    row[k] = data[k][i];
                }
                if(filters){
                    for (var f in filters){
                        show = filters[f](row[f]);
                        if(!show){break;}
                    }
                }
                if(!show){
                    continue;
                }

                positions.push(data[lonPar][i]+1);
                positions.push(data[latPar][i]);

                var color = this.graph.batchDrawer.getColor(data[band][i]);
                var options = {
                    position : new Cesium.Cartesian3.fromDegrees(
                        data[lonPar][i],
                        data[latPar][i]/*,
                        height*/
                    ),
                    color : new Cesium.Color.fromBytes(
                        color[0], color[1], color[2], alpha*255
                    ),
                    pixelSize : 8,
                    scaleByDistance : scaltype
                };

                pointCollection.add(options);
            }

            var pointsOutlineColl;
            if(currProd.hasOwnProperty('pointsOutlineColl')){
                currProd.pointsOutlineColl.removeAll();
                pointsOutlineColl = currProd.pointsOutlineColl;
            }else if(renderOutlines){
                pointsOutlineColl = new Cesium.PrimitiveCollection();
                this.map.scene.primitives.add(pointsOutlineColl);
                currProd.pointsOutlineColl = pointsOutlineColl;
                this.activePointsCollections.push(pointsOutlineColl);
            }

            if(renderOutlines){
                                
                var geomInstance =  new Cesium.GeometryInstance({
                    geometry : new Cesium.PolylineGeometry({
                        positions : Cesium.Cartesian3.fromDegreesArray(
                            positions
                        ),
                        width : 10.0
                    })
                });


                var linesPrim = new Cesium.Primitive({
                    geometryInstances: [geomInstance],
                    appearance: new Cesium.PolylineMaterialAppearance({
                        material : new Cesium.Material.fromType('PolylineArrow', {
                            color: new Cesium.Color(0.53, 0.02, 0.65, 1)
                        })
                    })
                });

                pointsOutlineColl.add(linesPrim);
            }

            this.map.scene.primitives.add(pointCollection);

        },


        createDataFeatures: function (results){
            if(results.length>0){
                // The feature collections are removed directly when a change happens
                // because of the asynchronous behavior it can happen that a collection
                // is added between removing it and adding another one so here we make sure
                // it is empty before overwriting it, which would lead to a not referenced
                // collection which is no longer deleted.
                // I remove it before the response because a direct feedback to the user is important
                // There is probably a cleaner way to do this
                for (var i = 0; i < this.activeCollections.length; i++) {
                    if(this.featuresCollection.hasOwnProperty(this.activeCollections[i])){
                        this.map.scene.primitives.remove(this.featuresCollection[this.activeCollections[i]]);
                        delete this.featuresCollection[this.activeCollections[i]];
                    }
                }
                this.activeCollections = [];
                var settings = {};
                var curProd = null;

                globals.products.each(function(product) {
                    if(product.get('visible')){
                        curProd = product;
                        var params = product.get('parameters');
                        for (var k in params){
                            if(params[k].selected){
                                var sat = false;
                                var prodKeys = _.keys(globals.swarm.products);
                                for (var i = prodKeys.length - 1; i >= 0; i--) {
                                    var satKeys = _.keys(globals.swarm.products[prodKeys[i]]);
                                    for (var j = satKeys.length - 1; j >= 0; j--) {
                                        if (globals.swarm.products[prodKeys[i]][satKeys[j]] === 
                                            product.get('views')[0].id) {
                                            sat = satKeys[j];
                                        }
                                    }
                                }
                                if(sat) {
                                    if(!settings.hasOwnProperty(sat)){
                                        settings[sat] = {};
                                    }
                                    if(!settings[sat].hasOwnProperty(k)){
                                        settings[sat][k] = product.get('parameters')[k];
                                    }
                                    settings[sat][k].band = k;
                                    settings[sat][k].alpha = Math.floor(product.get('opacity')*255);
                                    settings[sat][k].outlines = product.get('outlines');
                                    settings[sat][k].outline_color = product.get('color');
                                }
                            }
                        }
                    }
                });

                if (!_.isEmpty(settings) ){

                    _.uniq(results, function(row) { 
                            return row.id; 
                    })
                    .map(function(obj){
                        var parameters = _.filter(
                            SCALAR_PARAM,
                            function(par){
                                return settings[obj.id].hasOwnProperty(par);
                            });

                            for (var i = 0; i < parameters.length; i++) {
                                this.activeCollections.push(obj.id+parameters[i]);
                                this.featuresCollection[obj.id+parameters[i]] = 
                                    new Cesium.PointPrimitiveCollection();
                                if(!this.map.scene.context._gl.getExtension('EXT_frag_depth')){
                                    this.featuresCollection[obj.id+parameters[i]]._rs = 
                                        Cesium.RenderState.fromCache({
                                            depthTest : {
                                                enabled : true,
                                                func : Cesium.DepthFunction.LESS
                                            },
                                            depthMask : false,
                                            blending : Cesium.BlendingState.ALPHA_BLEND
                                        });
                                }
                            }
                            parameters = _.filter(VECTOR_PARAM, function(par){
                                return settings[obj.id].hasOwnProperty(par);
                            });
                            for (var i = 0; i < parameters.length; i++) {
                                this.activeCollections.push(obj.id+parameters[i]);
                                this.featuresCollection[obj.id+parameters[i]] = new Cesium.Primitive({
                                    geometryInstances : [],
                                    appearance : new Cesium.PerInstanceColorAppearance({
                                        flat : true,
                                        translucent : true
                                    }),
                                    releaseGeometryInstances: false
                                });
                            }
                    },this);

                    var maxRad = this.map.scene.globe.ellipsoid.maximumRadius;
                    var scaltype = new Cesium.NearFarScalar(1.0e2, 4, 14.0e6, 0.8);
                    var timeBucket = {'Alpha':{}, 'Bravo':{}, 'Charlie':{}};
                    var linecnt = 0;

                    _.each(results, function(row){
                        var show = true;
                        var filters = globals.swarm.get('filters');
                        var heightOffset, color;

                        if(filters){
                            for (var k in filters){
                                show = !(row[k]<filters[k][0] || row[k]>filters[k][1]);
                            }
                        }
                        if (show){
                            // Find parameter in settings which is also in row 
                            // these are the ones that are active
                            var actvParam = _.keys(settings[row.id]);
                            var tovisualize = _.filter(actvParam, function(ap){
                                // Check if component is vector component
                                if(VECTOR_BREAKDOWN.hasOwnProperty(ap)){
                                    var b = VECTOR_BREAKDOWN[ap];
                                    return (
                                        row.hasOwnProperty(b[0]) &&
                                        row.hasOwnProperty(b[1]) &&
                                        row.hasOwnProperty(b[2])
                                    );
                                }else{
                                    return row.hasOwnProperty(ap);
                                }
                            });

                            for (var i = tovisualize.length - 1; i >= 0; i--) {
                                var set = settings[row.id][tovisualize[i]];
                                var alpha = set.alpha;
                                this.graph.batchDrawer.setColorScale(set.colorscale);
                                this.graph.batchDrawer.setDomain(set.range);

                                if (_.find(SCALAR_PARAM, function(par){
                                    return set.band === par;
                                })) {
                                    if(tovisualize[i] === 'Bubble_Probability'){
                                        if(row[set.band] <= 0.1){
                                            continue;
                                        }
                                    }
                                    heightOffset = i*210000;

                                    if(tovisualize[i] === 'Absolute_STEC' ||
                                       tovisualize[i] === 'Relative_STEC' ||
                                       tovisualize[i] === 'Relative_STEC_RMS'){
                                        var ts = String(row.Timestamp.getTime());
                                        if(timeBucket[row.id].hasOwnProperty(ts)){
                                            timeBucket[row.id][ts] = timeBucket[row.id][ts]+1;
                                            heightOffset = (i+timeBucket[row.id][ts])*210000;
                                        }else{
                                            timeBucket[row.id][ts] = 1;
                                            heightOffset = (i+1)*210000;
                                        }
                                    }

                                    if(!isNaN(row[set.band])){
                                        color = this.graph.batchDrawer.getColor(row[set.band]);
                                        var options = {
                                            position : new Cesium.Cartesian3.fromDegrees(
                                                row.Longitude, row.Latitude,
                                                row.Radius-maxRad+heightOffset
                                            ),
                                            color : new Cesium.Color.fromBytes(
                                                color[0], color[1], color[2], alpha
                                            ),
                                            pixelSize : 8,
                                            scaleByDistance : scaltype
                                        };
                                        if(set.outlines){
                                            options.outlineWidth = 0.5;
                                            options.outlineColor = 
                                                Cesium.Color.fromCssColorString(set.outline_color);
                                        }
                                        this.featuresCollection[row.id+set.band].add(options);
                                    }
                                }else if (
                                    _.find(VECTOR_PARAM, function(par){
                                        return set.band === par;
                                    })) {
                                        var sb = VECTOR_BREAKDOWN[set.band];
                                        heightOffset = i*210000;

                                        // Check if residuals are active!
                                        if(!isNaN(row[sb[0]]) &&
                                           !isNaN(row[sb[1]]) &&
                                           !isNaN(row[sb[2]])) {
                                            var vLen = Math.sqrt(Math.pow(row[sb[0]],2)+Math.pow(row[sb[1]],2)+Math.pow(row[sb[2]],2));
                                            color = this.graph.batchDrawer.getColor(vLen);
                                            var addLen = 10;
                                            var vN = (row[sb[0]]/vLen)*addLen;
                                            var vE = (row[sb[1]]/vLen)*addLen;
                                            var vC = (row[sb[2]]/vLen)*addLen;
                                            this.featuresCollection[row.id+set.band].geometryInstances.push( 
                                                new Cesium.GeometryInstance({
                                                    geometry : new Cesium.SimplePolylineGeometry({
                                                        positions : Cesium.Cartesian3.fromDegreesArrayHeights([
                                                            row.Longitude, row.Latitude, (row.Radius-maxRad+heightOffset),
                                                            (row.Longitude+vE), (row.Latitude+vN), ((row.Radius-maxRad)+vC*30000)
                                                        ]),
                                                        followSurface: false
                                                    }),
                                                    id: 'vec_line_'+linecnt,
                                                    attributes : {
                                                        color : Cesium.ColorGeometryInstanceAttribute.fromColor(
                                                            new Cesium.Color.fromBytes(color[0], color[1], color[2], alpha)
                                                        )
                                                    }
                                                })
                                            );
                                            linecnt++;
                                        }
                                    } // END of if vector parameter
                                }
                            }
                        }, this);

                    for (var j = 0; j < this.activeCollections.length; j++) {
                        this.map.scene.primitives.add(this.featuresCollection[this.activeCollections[j]]);
                    }
                }
            }
        },

        onLayerOutlinesChanged: function(collection){
            //this.createDataFeatures(globals.swarm.get('data'), 'pointcollection', 'band');
            var data = globals.swarm.get('data');
            if (Object.keys(data).length){
                var idKeys = Object.keys(data);
                for (var i = idKeys.length - 1; i >= 0; i--) {
                    if(idKeys[i] === 'ALD_U_N_1B'){
                        this.createCurtains(data[idKeys[i]], idKeys[i]);
                    } else if (idKeys[i].includes('ALD_U_N_2')){
                        this.createL2Curtains(data[idKeys[i]], idKeys[i]);
                    } else {
                        this.createPointCollection(data[idKeys[i]], idKeys[i]);
                    }
                }
            }
        },

        OnLayerParametersChanged: function(layer){

            // TODO: Rewrite all references to change layer to use download id and not name!
            var product = globals.products.find(
                function(p){return p.get('download').id === layer;}
            );

            if(product){
                
                if(product.hasOwnProperty('curtains')){
                    var covid = product.get('download').id;
                    var data = globals.swarm.get('data')[covid];

                     if(covid === 'ALD_U_N_1B'){
                        this.createCurtains(data, covid);
                    } else if ( covid.includes('ALD_U_N_2') ){
                        this.createL2Curtains(data, covid);
                    }
                    this.checkColorscale(covid);
                }

                if(product.hasOwnProperty('points')){
                    var covid = product.get('download').id;
                    var data = globals.swarm.get('data')[covid];
                    this.createPointCollection(data, covid);
                    this.checkColorscale(covid);
                }


                if(product.get('views')[0].protocol === 'WMS'){
                    if(product.get('name')===layer){
                        var parameters = product.get('parameters');
                        var band;
                        var keys = _.keys(parameters);
                        _.each(keys, function(key){
                            if(parameters[key].selected){
                                band = key;
                            }
                        });
                        var style = parameters[band].colorscale;
                        var range = parameters[band].range;

                        var cesLayer = product.get('ces_layer');

                        if(product.get('visible')){
                            cesLayer.show = true;
                        }

                        cesLayer.imageryProvider.updateProperties('dim_bands', band);
                        cesLayer.imageryProvider.updateProperties('dim_range', (range[0]+','+range[1]));
                        if(style){
                            cesLayer.imageryProvider.updateProperties('styles', style);
                        }
                        if (cesLayer.show){
                            var index = this.map.scene.imageryLayers.indexOf(cesLayer);
                            this.map.scene.imageryLayers.remove(cesLayer, false);
                            this.map.scene.imageryLayers.add(cesLayer, index);
                        }
                        this.checkColorscale(product.get('download').id);
                    }
                }
            }
        },


        onAnalyticsFilterChanged: function(filter){
            console.log(filter);
        },


        onExportGeoJSON: function() {
            var geojsonstring = this.geojson.write(this.vectorLayer.features, true);
            var blob = new Blob([geojsonstring], {
                type: 'text/plain;charset=utf-8'
            });
            saveAs(blob, 'selection.geojson');
        },

        onGetGeoJSON: function () {
            return this.geojson.write(this.vectorLayer.features, true);
        },

        onGetMapExtent: function(){
            return this.getMapExtent();
        },

        getMapExtent: function(){
            // TODO: repair get map extent
            /*var ellipsoid = this.map.scene.globe.ellipsoid;
            var c2 = new Cesium.Cartesian2(0, 0);
            var leftTop = this.map.scene.camera.pickEllipsoid(c2, ellipsoid);
            c2 = new Cesium.Cartesian2(this.map.scene.canvas.width, this.map.scene.canvas.height);
            var rightDown = this.map.scene.camera.pickEllipsoid(c2, ellipsoid);

            if (leftTop != null && rightDown != null) { //ignore jslint
                leftTop = ellipsoid.cartesianToCartographic(leftTop);
                rightDown = ellipsoid.cartesianToCartographic(rightDown);
                return {
                    left: Cesium.Math.toDegrees(leftTop.longitude),
                    bottom: Cesium.Math.toDegrees(rightDown.latitude),
                    right: Cesium.Math.toDegrees(rightDown.longitude),
                    top: Cesium.Math.toDegrees(leftTop.latitude)
                };
            } else {
                //The sky is visible in 3D
                // TODO: Not sure what the best way to calculate the extent is when sky/space is visible.
                //       This method is just an approximation, not actually correct
                // Try to get center point
                var center = new Cesium.Cartesian2(this.map.scene.canvas.width/2, this.map.scene.canvas.height/2);
                center = this.map.scene.camera.pickEllipsoid(center, ellipsoid);
                if (center !== null){
                    center = ellipsoid.cartesianToCartographic(center);
                    return {
                        left: Cesium.Math.toDegrees(center.longitude) - 90,
                        bottom: Cesium.Math.toDegrees(center.latitude) - 45,
                        right: Cesium.Math.toDegrees(center.longitude) + 90,
                        top: Cesium.Math.toDegrees(center.latitude) + 45
                    };
                }else{
                    // If everything fails assume whole world is visible which is wrong
                    return {left: -180, bottom: -90, right: 180, top: 90};
                }
            }*/
        },

        renderSVG: function(svg, width, height){
            $('#imagerenderercanvas').attr('width', width);
            $('#imagerenderercanvas').attr('height', height);
            var c = document.querySelector('#imagerenderercanvas');
            var ctx = c.getContext('2d');
            // Clear the canvas
            ctx.clearRect(0, 0, width, height);
            ctx.drawSvg(svg, 0, 0, height, width);
            return c.toDataURL('image/jpg');
        },

        createViewportQuad: function(img, x, y, width, height){
            var newmat = new Cesium.Material.fromType('Image', {
                image : img,
                color: new Cesium.Color(1, 1, 1, 1),
            });
            return new Cesium.ViewportQuad(
                new Cesium.BoundingRectangle(x, y, width, height), newmat
            );
        },

        checkColorscale: function(pId){
            var visible = true;
            var product = false;
            var indexDel;
            var margin = 20;
            var width = 300;
            var scalewidth =  width - margin *2;

            globals.products.each(function(p) {
                if(p.get('download').id === pId){
                    product = p;
                }
            }, this);

            if (_.has(this.colorscales, pId)){
                // remove object from cesium scene
                this.map.scene.primitives.remove(this.colorscales[pId].prim);
                this.map.scene.primitives.remove(this.colorscales[pId].csPrim);
                indexDel = this.colorscales[pId].index;
                delete this.colorscales[pId];

                // Modify all indices and related height of all colorscales 
                // which are over deleted position

                _.each(this.colorscales, function(value, key, obj) {
                    var i = obj[key].index-1;
                    if (i >= indexDel){
                        var scaleImg = obj[key].prim.material.uniforms.image;
                        var csImg = obj[key].csPrim.material.uniforms.image;
                        this.map.scene.primitives.remove(obj[key].prim);
                        this.map.scene.primitives.remove(obj[key].csPrim);
                        obj[key].prim = this.map.scene.primitives.add(
                            this.createViewportQuad(scaleImg, 0, i*55 +5, width, 55)
                        );
                        obj[key].csPrim = this.map.scene.primitives.add(
                            this.createViewportQuad(csImg, 20, i*55 +42, scalewidth, 10)
                        );
                        obj[key].index = i;
                  
                    }
                },this);
            }

            if(product && product.get('views')[0].protocol === 'WPS' &&
                product.get('shc') === null){
                visible = false;
            }

            if(product.get('timeSliderProtocol') === 'INDEX'){
                visible = false;
            }

            if (product && product.get('showColorscale') &&
                product.get('visible') && visible){

                var prodId = product.get('download').id;
                var options = product.get('parameters');
                var keys = _.keys(options);
                var sel = false;

                _.each(keys, function(key){
                    if(options[key].selected){
                        sel = key;
                    }
                });

                if(sel === false){
                    return;
                }

                if(globals.dataSettings[prodId].hasOwnProperty(sel)){

                    var rangeMin = globals.dataSettings[prodId][sel].extent[0];
                    var rangeMax = globals.dataSettings[prodId][sel].extent[1];
                    var uom = globals.dataSettings[prodId][sel].uom;
                    var modifiedUOM = globals.dataSettings[prodId][sel].modifiedUOM;
                    var style = globals.dataSettings[prodId][sel].colorscale;
                    var logscale = defaultFor(globals.dataSettings[prodId][sel].logarithmic, false);
                    var axisScale;


                    this.graph.batchDrawer.setColorScale(style);
                    var colorscaleimage = this.graph.batchDrawer.getColorScaleImage().toDataURL();

                    $('#svgcolorscalecontainer').remove();
                    var svgContainer = d3.select('body').append('svg')
                        .attr('width', 300)
                        .attr('height', 60)
                        .attr('id', 'svgcolorscalecontainer');

                    if(logscale){
                        axisScale = d3.scale.log();
                    }else{
                        axisScale = d3.scale.linear();
                    }

                    axisScale.domain([rangeMin, rangeMax]);
                    axisScale.range([0, scalewidth]);

                    var xAxis = d3.svg.axis()
                        .scale(axisScale);

                    if(logscale){
                        xAxis.ticks(0, '0.0e');
                    }else{
                        var step = (rangeMax - rangeMin)/5;
                        xAxis.tickValues(
                            d3.range(rangeMin,rangeMax+step, step)
                        );
                        xAxis.tickFormat(d3.format('g'));
                    }

                    // Add white background
                    var mainGroup = svgContainer.append('g');
                    mainGroup.append('rect')
                            .attr('width', 300)
                            .attr('height', 52)
                            .attr('y', 3)
                            .attr('opacity', 0.7)
                            .attr('stroke', 'none')
                            .attr('rx', 3)
                            .attr('ry', 3)
                            .attr('fill', 'white');

                    var g = mainGroup.append('g')
                        .attr('class', 'x axis')
                        .attr('transform', 'translate(' + [margin, 20]+')')
                        .call(xAxis);


                    // Add layer info
                    var info = product.get('name');
                    info += ' - ' + sel.replace(/_/g, ' ');

                    if(modifiedUOM) {
                        g.append('text')
                            .style('text-anchor', 'middle')
                            .attr('transform', 'translate(' + [scalewidth/2, 30]+')')
                            .text(info+' ['+modifiedUOM+']');

                    } else if(uom) {
                        info += ' ['+uom+']';
                        g.append('text')
                            .style('text-anchor', 'middle')
                            .attr('transform', 'translate(' + [scalewidth/2, 30]+')')
                            .attr('font-weight', 'bold')
                            .text(info);
                    }

                    svgContainer.selectAll('text')
                        .attr('stroke', 'none')
                        .attr('fill', 'black')
                        .attr('font-weight', 'bold');

                    svgContainer.selectAll('.tick').select('line')
                        .attr('stroke', 'black');

                    svgContainer.selectAll('.axis .domain')
                        .attr('stroke-width', '2')
                        .attr('stroke', '#000')
                        .attr('shape-rendering', 'crispEdges')
                        .attr('fill', 'none');

                    svgContainer.selectAll('.axis path')
                        .attr('stroke-width', '2')
                        .attr('shape-rendering', 'crispEdges')
                        .attr('stroke', '#000');


                    var svgHtml = d3.select('#svgcolorscalecontainer')
                        .attr('version', 1.1)
                        .attr('xmlns', 'http://www.w3.org/2000/svg')
                        .node().innerHTML;

                    var renderHeight = 55;
                    var renderWidth = width;

                    var index = Object.keys(this.colorscales).length;

                    var prim = this.map.scene.primitives.add(
                        this.createViewportQuad(
                            this.renderSVG(svgHtml, renderWidth, renderHeight),
                            0, index*55+5, renderWidth, renderHeight
                        )
                    );
                    var csPrim = this.map.scene.primitives.add(
                        this.createViewportQuad(
                            colorscaleimage, 20, index*55 +42, scalewidth, 10
                        )
                    );

                    this.colorscales[pId] = {
                        index: index,
                        prim: prim,
                        csPrim: csPrim
                    };

                    svgContainer.remove();

                } else {
                    console.log('Error creating colorscale for parameter '+sel+
                        '. Parameter not defined in global datasettings');
                }
            }

        },

        onSelectionActivated: function(arg) {
            this.selectionType = arg.selectionType;
            if (arg.active) {
                this.drawhelper.startDrawingRectangle({
                    callback: function(extent) {
                    var bbox = {
                        n: Cesium.Math.toDegrees(extent.north),
                        e: Cesium.Math.toDegrees(extent.east),
                        s: Cesium.Math.toDegrees(extent.south),
                        w: Cesium.Math.toDegrees(extent.west)
                    };
                    Communicator.mediator.trigger('selection:changed', bbox);
                  }
                });
            } else {
                //Communicator.mediator.trigger('selection:changed', null);
                this.drawhelper.stopDrawing();
                // It seems the drawhelper muted handlers reset to false and 
                // it creates issues in cesium picking for some reason so
                // we deactivate them again
                this.drawhelper._handlersMuted = true;
            }
        },

        onSelectionChanged: function(bbox){

            // It seems the drawhelper muted handlers reset to false and 
            // it creates issues in cesium picking for some reason so
            // we deactivate them again
            this.drawhelper._handlersMuted = true;
            if(bbox){
                // Remove any possible selection and field lines (e.g.by tutorial)
                if(this.extentPrimitive){
                    this.map.entities.remove(this.extentPrimitive);
                }
                _.each(_.keys(this.FLCollection), function(key){
                    this.map.scene.primitives.remove(this.FLCollection[key]);
                    delete this.FLCollection[key];
                }, this);

                this.bboxsel = [bbox.s, bbox.w, bbox.n, bbox.e ];
                var rectangle = Cesium.Rectangle.fromDegrees(bbox.w, bbox.s, bbox.e, bbox.n);
                this.extentPrimitive = this.map.entities.add({
                    id: 'selectionrectangle',
                    rectangle : {
                        coordinates : rectangle,
                        fill : false,
                        outline : true,
                        outlineColor : Cesium.Color.BLUE,
                        outlineWidth: 2
                    }
                });
                $('#bb_selection').html('Clear Selection');

            }else{
                this.bboxsel = null;
                if(this.extentPrimitive){
                    this.map.entities.remove(this.extentPrimitive);
                }
                _.each(_.keys(this.FLCollection), function(key){
                    this.map.scene.primitives.remove(this.FLCollection[key]);
                    delete this.FLCollection[key];
                }, this);
                $('#bb_selection').html('Select Area');
            }

            globals.products.each(function(product) {
                /*if (product.get('views')[0].protocol === 'WPS'){
                    this.checkShc(product, product.get('visible'));
                }*/
            },this);
        },


        createPrimitives: function(results, name){
            var parseddata = {};
            var instances = [];
            if(this.FLCollection.hasOwnProperty(name)){
                this.map.scene.primitives.remove(this.FLCollection[name]);
            }
            _.each(results.data, function(row){
                if(parseddata.hasOwnProperty(row.id)){
                    parseddata[row.id].colors.push(Cesium.Color.fromBytes(
                        row.color_r, row.color_g, row.color_b, 255)
                    );
                    parseddata[row.id].positions.push(new Cesium.Cartesian3(
                        row.pos_x, row.pos_y, row.pos_z)
                    );
                }else{
                    parseddata[row.id] = {
                        colors:[Cesium.Color.fromBytes(
                            row.color_r, row.color_g, row.color_b, 255
                        )],
                        positions:[new Cesium.Cartesian3(
                            row.pos_x, row.pos_y, row.pos_z)
                        ]
                     };
                }
            });
            var linecnt = 0;
            _.each(_.keys(parseddata), function(key){
                instances.push(
                    new Cesium.GeometryInstance({
                        geometry : new Cesium.PolylineGeometry({
                            positions : parseddata[key].positions,
                            width : 2.0,
                            vertexFormat : Cesium.PolylineColorAppearance.VERTEX_FORMAT,
                            colors : parseddata[key].colors,
                            colorsPerVertex : true,
                        }),
                        id: 'vec_line_'+linecnt
                    })
                );
                linecnt++;
            }, this);
            // TODO: Possibly needed geometry instances if transparency should work for fieldlines
            this.FLCollection[name] = new Cesium.Primitive({
                geometryInstances: instances,
                appearance: new Cesium.PolylineColorAppearance()
            });
            this.map.scene.primitives.add(this.FLCollection[name]);
        },

        onHighlightPoint: function(coords){
            this.billboards.removeAll();
            if(coords !== null && coords.Latitude && coords.Longitude){

                var canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                var context2D = canvas.getContext('2d');
                context2D.beginPath();
                context2D.arc(16, 16, 12, 0, Cesium.Math.TWO_PI, true);
                context2D.closePath();
                context2D.strokeStyle = 'rgb(255, 255, 255)';
                context2D.lineWidth = 3;
                context2D.stroke();

                context2D.beginPath();
                context2D.arc(16, 16, 9, 0, Cesium.Math.TWO_PI, true);
                context2D.closePath();
                context2D.strokeStyle = 'rgb(0, 0, 0)';
                context2D.lineWidth = 3;
                context2D.stroke();

                var curtainHeight = 1000000;



                if(!Array.isArray(coords.Latitude) &&
                   !Array.isArray(coords.Longitude)){
                    var height = 0;
                    if(Array.isArray(coords.Radius)){
                        height = coords.Radius[0]+(coords.Radius[1]-coords.Radius[0])/2;
                        if(globals.swarm.hasOwnProperty('altitudeExtents')){
                            var currProd = globals.products.find(
                                function(p){return p.get('visible');}
                            );
                            var active;
                            var params = currProd.get('parameters');
                            for (var key in params) {
                                if (params[key].selected) {
                                    active = key;
                                }
                            }
                            var extent;
                            var exts = globals.swarm.altitudeExtents;
                            var currmin;
                            if(active === 'mie_HLOS_wind_speed' ||
                                active === 'MCA_extinction' ||
                                active === 'mie_wind_result_wind_velocity'){
                                extent = exts.mie_max - exts.mie_min;
                                currmin = exts.mie_min;

                            } else if (active === 'rayleigh_HLOS_wind_speed' ||
                                active === 'SCA_extinction' ||
                                active === 'rayleigh_wind_result_wind_velocity'){
                                extent = exts.ray_max - exts.ray_min;
                                currmin = exts.ray_min;
                            } else {
                                // Should not happen
                                extent = 1;
                                currmin = 0;
                                console.log('neither mie nor rayleigh active, issue at cesiumview');
                            }
                            // there seems to be an offset to the curtain i can't
                            // quite explain so we need to add some offset here too
                            var ratio = (height/(extent+Math.abs(currmin)));
                            height = (curtainHeight*ratio) + 90000;
                        } else {
                            height = (1000*50)+(height*50);
                        }
                    } else if(coords.Radius){
                        height = coords.Radius;
                    }

                    this.billboards.add({
                        imageId : 'custom canvas point',
                        image : canvas,
                        position : Cesium.Cartesian3.fromDegrees(
                            coords.Longitude,
                            coords.Latitude,
                            height
                        ),
                        scale : 1
                    });
                } else {
                    var lat = coords.Latitude[1]-Math.abs(coords.Latitude[0]-coords.Latitude[1])/2;
                    var lon = coords.Longitude[1]+Math.abs(coords.Longitude[0]-coords.Longitude[1])/2;
                    var alt = coords.Radius[0]+(coords.Radius[1]-coords.Radius[0])/2;
                    //var alt = 0;
                    this.billboards.add({
                        imageId : 'custom canvas point',
                        image : canvas,
                        position : Cesium.Cartesian3.fromDegrees(
                            lon,
                            lat,
                            (1000*50)+(alt*50)
                        ),
                        scale : 1
                    });
                }
            }
        },

        onRemoveHighlights: function(){
            this.billboards.removeAll();
        },

        onTimeChange: function (time) {
            var string = getISODateTimeString(time.start) + '/'+ 
                         getISODateTimeString(time.end);
            this.beginTime = time.start;
            this.endTime = time.end;
            globals.products.each(function(product) {
                if(product.get('timeSlider') && product.get('views')[0].protocol === 'WMS'){
                    product.set('time',string);
                    var cesLayer = product.get('ces_layer');
                    if(cesLayer){
                        cesLayer.imageryProvider.updateProperties('time', string);
                        if (cesLayer.show){
                            var index = this.map.scene.imageryLayers.indexOf(cesLayer);
                            this.map.scene.imageryLayers.remove(cesLayer, false);
                            this.map.scene.imageryLayers.add(cesLayer, index);
                        }
                    }
                }else if (product.get('views')[0].protocol === 'WPS'){
                    //this.checkShc(product, product.get('visible'));
                }
            }, this);
        },

        onSetExtent: function(bbox) {
            //this.map.zoomToExtent(bbox);
            /*this.map.scene.camera.flyToRectangle({
              destination: Cesium.Rectangle.fromDegrees(bbox[0], bbox[1], bbox[2], bbox[3])
            });*/
        },

        onChangeZoom: function (zoom) {
            if(zoom<0){
                this.map.scene.camera.zoomOut(Math.abs(zoom));
            }else{
                this.map.scene.camera.zoomIn(Math.abs(zoom));
            }
        },


        onClose: function(){
            //this.graph.destroy();
            this.isClosed = true;
        },

        isModelCompatible: function(model) {
            var protocol = model.get('view').protocol;
            if (protocol === 'WMS' || protocol === 'WMTS') {
                return true;
            }
            return false;
        },

        isEventListenedTo: function(eventName) {
            return !!this._events[eventName];
        },

        onLoadImage: function(url, selection_bounds){  
        },

        onSaveImage: function(){
            var bodyContainer = $('<div/>');

            var typeContainer = $('<div id="typeSelectionContainer"></div>')
            var filetypeSelection = $('<select id="filetypeSelection"></select>');
            filetypeSelection.append($('<option/>').html('png'));
            filetypeSelection.append($('<option/>').html('jpeg'));
            typeContainer.append(
                $('<label for="filetypeSelection" style="margin-right:10px;">Output type</label>')
            );
            typeContainer.append(filetypeSelection);
            var w = this.map.canvas.width;
            var h = this.map.canvas.height;

            var resolutionContainer = $('<div id="resolutionSelectionContainer"></div>')
            var resolutionSelection = $('<select id="resolutionSelection"></select>');
            resolutionSelection.append($('<option/>').html('normal ('+w+'x'+h+')').val(1));
            resolutionSelection.append($('<option/>').html('large ('+w*2+'x'+h*2+')').val(2));
            resolutionSelection.append($('<option/>').html('very large ('+w*3+'x'+h*3+')').val(3));
            resolutionContainer.append(
                $('<label for="resolutionSelection" style="margin-right:10px;">Resolution</label>')
            );
            resolutionContainer.append(resolutionSelection);

            bodyContainer.append(typeContainer);
            bodyContainer.append(resolutionContainer);

            var okbutton = $('<button style="margin-right:5px;">Ok</button>');
            var cancelbutton = $('<button style="margin-left:5px;">Cancel</button>');
            var buttons = $('<div/>');
            buttons.append(okbutton);
            buttons.append(cancelbutton);

            if (this.map){
                var saveimagedialog = w2popup.open({
                    body: bodyContainer,
                    buttons: buttons,
                    title       : w2utils.lang('Image configuration'),
                    width       : 400,
                    height      : 200
                });

                var map = this.map;

                okbutton.click(function(){
                    var selectedType = $('#filetypeSelection')
                        .find(":selected").text();
                    var selectedRes = $('#resolutionSelection')
                        .find(":selected").val();
                    var scale = selectedRes;
                    map.resolutionScale = scale;
                    var scene = map.scene;
                    var removePreListener = scene.preUpdate.addEventListener(function() {
                        var canvas = scene.canvas;
                        var removePostListener = scene.postRender.addEventListener(function() {
                            var fileName = 'VirES-Aeolus_Screenshot.';
                            var filetype = 'image/';
                            fileName+=selectedType;
                            filetype+=selectedType;

                            canvas.toBlob(function(blob) {
                                saveAs(blob, fileName);
                            }, filetype);
                            map.resolutionScale = 1.0;
                            removePostListener();
                        });
                        removePreListener();
                    });
                    bodyContainer.remove();
                    saveimagedialog.close();
                });
                cancelbutton.click(function(){
                    bodyContainer.remove();
                    saveimagedialog.close();
                });
            }
        },

        onClearImage: function(){
            if(this.diffOverlay){
                this.map.removeLayer(this.diffOverlay);
                this.diffOverlay = null;
            }
        },


        handleTick: function(clock) {
            // TODO: Cesium does not provide a method to know when the camera has stopped, 
            //       this approach is not ideal, when the movement mantains inertia difference 
            //       values are very low and there are comparison errors.
            var c = this.map.scene.camera;
            var th = [1, 1, 1];
            // If current mode is either Columbus or Scene2D lower threshold
            if(this.map.scene.mode === 1 || this.map.scene.mode === 2){
                th = [0, 0, 0];
            }
            if (!this.cameraIsMoving){
                if (Math.abs(this.cameraLastPosition.x - c.position.x) > th[0] &&
                    Math.abs(this.cameraLastPosition.y - c.position.y) > th[1] &&
                    Math.abs(this.cameraLastPosition.z - c.position.z) >= th[2] ){
                    this.cameraIsMoving = true;
                }
            }else{
                if (Math.abs(this.cameraLastPosition.x - c.position.x) <= th[0] &&
                    Math.abs(this.cameraLastPosition.y - c.position.y) <= th[1] &&
                    Math.abs(this.cameraLastPosition.z - c.position.z) <= th[2] ){
                    this.cameraIsMoving = false;
                    Communicator.mediator.trigger('map:position:change', this.getMapExtent() );
                    localStorage.setItem('cameraPosition', JSON.stringify({
                        position: [c.position.x, c.position.y,c.position.z],
                        direction: [c.direction.x, c.direction.y,c.direction.z],
                        up: [c.up.x, c.up.y,c.up.z],
                        right: [c.right.x, c.right.y,c.right.z]
                    }));
                }else{
                    this.cameraLastPosition.x = c.position.x;
                    this.cameraLastPosition.y = c.position.y;
                    this.cameraLastPosition.z = c.position.z;
                }
            }
        },

        toggleDebug: function(){
            this.map.scene.debugShowFramesPerSecond = !this.map.scene.debugShowFramesPerSecond;
        }
    });
    return CesiumView;
});