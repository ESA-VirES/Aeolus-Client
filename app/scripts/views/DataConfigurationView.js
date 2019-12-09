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
      initialize: function(options) {
        this.currentSelection = null;
      },
      onShow: function(view){

        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({ 
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

        var productId = null;
        var that = this;
        // Load list of available product types
        globals.products.each(function(product){

          var button = $(
            '<button type="button" class="btn btn-default productSelect" value="'+
            product.get('download').id+'"">'+
              product.get('name')+
            '</button>'
          );
          this.$('#productbtnGroup').append(button);
          if(product.get('visible')){
            that.currentSelection = product.get('download').id;
            button.addClass('active');
          }
        }, this);

        this.renderProductParameterList(false);

        $('.productSelect').click(function(evt){
          $('.productSelect').removeClass('active');
          that.currentSelection = this.value;
          that.renderProductParameterList(false);
        });

        $('#parameterSearchInput').off();
        $('#parameterSearchInput').keyup(function(){
          that.renderProductParameterList(this.value);
        });
      },

      renderProductParameterList: function(filter){
        this.$('#parameterList').empty();
        // Load parameters for selected product type
        var selectedProduct = null;
        var currentId = this.currentSelection;
        globals.products.each(function(product){
          if(product.get('download').id === currentId){
            selectedProduct = product;
          }
        });

        if(selectedProduct !== null){
          var parameterList = selectedProduct.get('download_parameters');
          for (var key in parameterList){

            // TODO: probably info should be kept somehow connected to product
            // right now information for all parameters is global, need to 
            // reconsider this approach
            var parInfo = globals.dataSettings[key];
            var show = true;
            if(filter!==false && (
                  key.toLowerCase().indexOf(filter.toLowerCase()) === -1 &&
                  parameterList[key].name.toLowerCase().indexOf(filter.toLowerCase()) === -1 )){
              show = false;
            }
            if(show){
              if(parInfo !== undefined){
                this.$('#parameterList').append(parameterItemTmpl({
                  key: key,
                  name: parameterList[key].name,
                  uom: parameterList[key].uom,
                  extent: defaultFor(parInfo.extent, null),
                  filterExtent: defaultFor(parInfo.filterExtent, null),
                  colorscale: defaultFor(parInfo.colorscale, 'viridis')
                }))
              } else {
                console.log('Warning: parameter not defined: '+key);
              }
            }
          }
        }

      },

      onClose: function() {
        Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }
    })

    return {'DataConfigurationView':DataConfigurationView};
  });

}).call( this );
