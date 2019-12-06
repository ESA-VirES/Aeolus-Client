(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/DataConfiguration',
    'hbs!tmpl/parameterItem',
    'underscore',
    'w2ui',
    'w2popup'
  ],
  function( Backbone, Communicator, globals, dataConfigurationTmpl, parameterItemTmpl) {

    var DataConfigurationView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "modalDataCOnfiguration",
      className: "panel panel-default download",
      template: {
          type: 'handlebars',
          template: dataConfigurationTmpl
      },
      initialize: function(options) {},
      onShow: function(view){

        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({ 
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

        // Load list of available product types
        globals.products.each(function(product){
          this.$('#productbtnGroup').append(
            '<button type="button" class="btn btn-default" value="'+
            product.get('download').id+'"">'+
              product.get('name')+
            '</button>'
          );
        }, this);

        // Load parameters for selected product type
        var selected = 'ALD_U_N_1B';
        this.$('#parameterList').empty();
        var selectedProduct = null;
        globals.products.forEach(function(p){
          if(p.get('download').id === selected){
            selectedProduct = p;
          }
        });
        if (selectedProduct !== null){
          var parameterList = selectedProduct.get('download_parameters');
          for (var key in parameterList){
            this.$('#parameterList').append(parameterItemTmpl({
              key: key,
              name: parameterList[key].name,
              uom: parameterList[key].uom,
            }))
          }
        }
//"L1B_start_time_obs": {"uom": null, "name": "Start date and time of Observation (UTC)"},
      },
      onClose: function() {
        Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }
    })

    return {'DataConfigurationView':DataConfigurationView};
  });

}).call( this );
