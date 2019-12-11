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
        this.currentChanges = {};
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
                var parOptions = {
                  key: key,
                  name: parameterList[key].name,
                  uom: parameterList[key].uom,
                  extent: defaultFor(parInfo.extent, null),
                  filterExtent: defaultFor(parInfo.filterExtent, null),
                  colorscale: defaultFor(parInfo.colorscale, 'viridis'),
                  active: defaultFor(parInfo.active, false)
                };
                if(parameterList[key].hasOwnProperty('required')){
                  parOptions.required = true;
                  parOptions.active = true;
                }
                this.$('#parameterList').append(parameterItemTmpl(parOptions))
              } else {
                console.log('Warning: parameter not defined: '+key);
              }
            }
          }
          var that = this;
          // Add listener for checkboxes
          $('.parameterActivationCB').change(function() {
            var selected = $(this).is(":checked");
            var key = $(this).attr('id');
            if(globals.dataSettings.hasOwnProperty(key)){
              if(that.currentChanges.hasOwnProperty(key)){
                that.currentChanges[key].active = selected;
              } else {
                that.currentChanges[key] = {
                  active: selected
                }
              }
            }
            that.addApplyChanges();
          });
          // Add listener for extent inputs
          $('.parameterConfInput').keyup(function() {
            var parItemId = this.parentElement.parentElement.parentElement.id;
            var paramId = this.parentElement.parentElement.parentElement.parentElement.parentElement.id;
            var value = Number(this.value);

            if(globals.dataSettings.hasOwnProperty(paramId)){
              if(that.currentChanges.hasOwnProperty(paramId)){
                if($(this).hasClass('min')){
                  that.currentChanges[paramId][parItemId][0] = value;
                } else if($(this).hasClass('max')){
                  that.currentChanges[paramId][parItemId][1] = value;
                }
              } else {
                that.currentChanges[paramId]={};
                if($(this).hasClass('min')){
                  that.currentChanges[paramId][parItemId] = [value, null];
                } else if($(this).hasClass('max')){
                  that.currentChanges[paramId][parItemId] = [null, value];
                }
              }
            }
            that.addApplyChanges();
          });
        }

      },

      addApplyChanges: function(){
        var that = this;
        $('#applyDataChanges').off();
        $('#applyDataChanges').remove();
        $(this.el).find('.panel-footer').append(
          '<button style="pointer-events: auto;" type="button" class="btn btn-primary" '+
          'target="_blank" id="applyDataChanges" title="Apply changes done and close panel">'+
          'Apply & Close</button>'
        );

        $('#applyDataChanges').click(function(){

          var selectedProduct = null;
          var currentId = that.currentSelection;
          globals.products.each(function(product){
            if(product.get('download').id === currentId){
              selectedProduct = product;
            }
          });
          var parOpts = selectedProduct.get('parameters');

          var changesToRequestedParameters = false;
          // Iterate current changes and apply them to global settings
          for(var key in that.currentChanges){
            if(globals.dataSettings.hasOwnProperty(key)){
              for(var parItem in that.currentChanges[key]){
                if(parItem === 'active'){
                  changesToRequestedParameters = true;
                }
                globals.dataSettings[key][parItem] = that.currentChanges[key][parItem];
              }
            } else {
              console.log('Error: Parameter changed does not exist in global datasettings '+ key);
            }

            if(parOpts.hasOwnProperty(key)){
              for(var parItem in that.currentChanges[key]){
                if(parItem === 'extent'){
                  parOpts[key].range = that.currentChanges[key][parItem];
                } else {
                  parOpts[key][parItem] = that.currentChanges[key][parItem];
                }
              }
            }
          }

          if(changesToRequestedParameters){
            // Need to re-request current selection
            Communicator.mediator.trigger('layer:parameterlist:changed');
          }

          selectedProduct.set('parameters', parOpts);
          Communicator.mediator.trigger('layer:parameters:changed', that.currentSelection);

          that.onClose();
        });
      },

      onClose: function() {
        Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }
    })

    return {'DataConfigurationView':DataConfigurationView};
  });

}).call( this );
