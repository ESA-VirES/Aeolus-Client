(function() {
    'use strict';

    var root = this;

    root.define([
        'backbone',
        'communicator'
    ],
    function( Backbone, Communicator ) {

        var RegionManager = Backbone.Marionette.Controller.extend({
        
            initialize: function( options ) {

                /* internal region manager */
                this._regionManager = new Backbone.Marionette.RegionManager();

                /* event API */
                Communicator.reqres.setHandler("RM:addRegion", this.addRegion, this);
                Communicator.reqres.setHandler("RM:removeRegion", this.removeRegion, this);
                Communicator.reqres.setHandler("RM:getRegion", this.getRegion, this);
            },

            /* add region facade */
            addRegion: function( regionName, regionId ) {
                return this._regionManager.addRegion( regionName, regionId );
            },

            /* remove region facade */
            removeRegion: function( regionName ) {
                this._regionManager.removeRegion( regionName );
            },

            /* get region facade */
            getRegion: function( regionName ) {
                return this._regionManager.get( regionName );
            }
        });

        return new RegionManager();
    });
}).call( this );