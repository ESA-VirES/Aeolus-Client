

(function() {
    'use strict';

    var root = this;

    root.define([
        'backbone'
    ],

    function( Backbone ) { // initializer

        var LayerModel = Backbone.Model.extend({
            name: '',
            timeSlider: false,
            timeSliderProtocol: '',
            color: '',
            time: null,
            visible: null,
            opacity: 0,
            view: {
                id : '',
                protocol: '',
                urls : [],
                style: 'default',
                isBaseLayer: null,
                attribution: '',
                matrixSet: '',
                format: '',
                resolutions: [],
                maxExtent: [],
                projection: '',
                gutter: null,
                buffer: null,
                units: '',
                transitionEffect: '',
                isphericalMercator: null,
                wrapDateLine: null,
                zoomOffset: null,
            },
            views:[],
            download: {
                id : '',
                protocol: '',
                url : [],
            },
            processes : [],
            unit: "",
            parameters:[],
            height: 0,
            model: false
            
            
        });

        return {"LayerModel":LayerModel};
    });

    

}).call( this );
