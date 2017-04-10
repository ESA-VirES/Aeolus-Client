define([
    'backbone.marionette',
    'app',
    'communicator',
    './CesiumViewController',
    './CesiumViewRouter',
    'keypress'
], function(Marionette, App, Communicator, CesiumViewController, CesiumViewRouterController, keypress) {

    'use strict';

    App.module('CesiumViewer', function(Module) {

        this.startsWithParent = true;

        // This is the start routine of the module, called automatically by Marionette
        // after the core system is loaded. The module is responsible for creating its
        // private implementation, the Module.Controller. The Module.Controller is the
        // connected to the event system of the application via the Communicator.
        // Moreover the Router responsible for this module is activated in this routine.
        this.on('start', function(options) {
            this.idx = 0;
            this.instance = undefined;

            console.log('[CesiumViewerModule] Finished module initialization');
        });

        this.createController = function(opts) {

            var setupKeyboardShortcuts = function(controller) {
                /*var keypressListener = new keypress.Listener();
                keypressListener.simple_combo("ctrl d", function() {
                    controller.toggleDebug();
                });*/
            };

            var i = this.insance;
            if(this.insance === undefined){
                i = new CesiumViewController({
                    id: 'CesiumViewer',
                    startPosition: {}
                });
                this.insance = i;
            }
            i.connectToView();
            setupKeyboardShortcuts(i);
            return i;
        };
    });
});