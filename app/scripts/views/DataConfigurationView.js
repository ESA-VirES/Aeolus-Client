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
      id: "modalDataConfiguration",
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
          if(product.get('name')==='ADAM_albedo'){
            return;
          }
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

        $('#disableAll').off();
        $('#enableAll').off();

        $('#disableAll').on('click', function(){
          var selectedProduct = null;
          var currentId = that.currentSelection;
          globals.products.each(function(product){
            if(product.get('download').id === currentId){
              selectedProduct = product;
            }
          });

          if(selectedProduct !== null){
            var parameterList = selectedProduct.get('download_parameters');
            for (var key in parameterList){
              if(!parameterList[key].hasOwnProperty('required')){
                if(that.currentChanges.hasOwnProperty(key)){
                  that.currentChanges[key].active = false;
                } else {
                  that.currentChanges[key] = {
                    active: false
                  }
                }
              }
            }
          }
          $('.parameterActivationCB:not(:disabled)').prop('checked', false);
          that.addApplyChanges();
        });

        $('#enableAll').on('click', function(){

          var selectedProduct = null;
          var currentId = that.currentSelection;
          globals.products.each(function(product){
            if(product.get('download').id === currentId){
              selectedProduct = product;
            }
          });

          if(currentId === 'AUX_MET_12'){
            w2confirm('AUX MET product is very large, enabling all parameters'+
            ' will result in large data request and long rendering times,'+
            ' are you sure you want to continue?')
              .yes(function () {
                  if(selectedProduct !== null){
                    var parameterList = selectedProduct.get('download_parameters');
                    for (var key in parameterList){
                      if(that.currentChanges.hasOwnProperty(key)){
                        that.currentChanges[key].active = true;
                      } else {
                        that.currentChanges[key] = {
                          active: true
                        }
                      }
                    }
                  }
                  $('.parameterActivationCB:not(:disabled)').prop('checked', true);
                  that.addApplyChanges();
              });
          } else {

            if(selectedProduct !== null){
              var parameterList = selectedProduct.get('download_parameters');
              for (var key in parameterList){
                if(that.currentChanges.hasOwnProperty(key)){
                  that.currentChanges[key].active = true;
                } else {
                  that.currentChanges[key] = {
                    active: true
                  }
                }
              }
            }
            $('.parameterActivationCB:not(:disabled)').prop('checked', true);
            that.addApplyChanges();
          }
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

            var parInfo = globals.dataSettings[currentId][key];
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
                  colorscaleOptions: globals.colorscaletypes,
                  active: defaultFor(parInfo.active, false)
                };
                if(parameterList[key].hasOwnProperty('required')){
                  parOptions.required = true;
                  parOptions.active = true;
                }
                this.$('#parameterList').append(parameterItemTmpl(parOptions));
                // We now select the current colorscale
                $("#cs"+key).val(defaultFor(parInfo.colorscale, 'viridis'));
              } else {
                // TODO: We don not expose all parameters right now
                //console.log('Warning: parameter not defined: '+key);
              }
            }
          }
          var that = this;

          $('.colorscaleselector').change(function(){
            var paramId = $(this).attr('id').substr(2);
            var selectedCS = $(this).children("option:selected").val();
            if(globals.dataSettings[currentId].hasOwnProperty(paramId)){
              if(that.currentChanges.hasOwnProperty(paramId)){
                  that.currentChanges[paramId].colorscale = selectedCS;
              } else {
                that.currentChanges[paramId]={};
                that.currentChanges[paramId].colorscale = selectedCS;
              }
            }
            that.addApplyChanges();
          });
          // Add listener for checkboxes
          $('.parameterActivationCB').change(function() {
            var selected = $(this).is(":checked");
            var key = $(this).attr('id');
            if(globals.dataSettings[currentId].hasOwnProperty(key)){
              if(that.currentChanges.hasOwnProperty(key)){
                that.currentChanges[key].active = selected;
              } else {
                that.currentChanges[key] = {
                  active: selected
                }
              }

              // Special handling for 2D data that need other parameters for 
              // visualization
              var relations = {
                // AUX MET
                'layer_altitude_nadir': [
                  'layer_validity_flag_nadir',
                  'layer_temperature_nadir',
                  'layer_wind_component_u_nadir',
                  'layer_wind_component_v_nadir',
                  'layer_rel_humidity_nadir',
                  'layer_spec_humidity_nadir',
                  'layer_cloud_cover_nadir',
                  'layer_cloud_liquid_water_content_nadir',
                  'layer_cloud_ice_water_content_nadir'

                ],
                'layer_altitude_off_nadir': [
                  'layer_validity_flag_off_nadir',
                  'layer_temperature_off_nadir',
                  'layer_wind_component_u_off_nadir',
                  'layer_wind_component_v_off_nadir',
                  'layer_rel_humidity_off_nadir',
                  'layer_spec_humidity_off_nadir',
                  'layer_cloud_cover_off_nadir',
                  'layer_cloud_liquid_water_content_off_nadir',
                  'layer_cloud_ice_water_content_off_nadir'
                ],
                'altitude': [
                  'normalised_useful_signal',
                  'mie_scattering_ratio'
                ]
              };
              for(var depkey in relations){
                // If selected is one of the dependencies
                if(selected && (relations[depkey].indexOf(key)!==-1)){
                  // Check if necessery key already selected if not select it
                  if(!globals.dataSettings[currentId][depkey].active){
                    if(!that.currentChanges.hasOwnProperty(depkey)){
                      that.currentChanges[depkey] = {
                        active: true
                      }
                      // Add tick to checkbox
                      $('#'+depkey).prop('checked', true);
                    } else if(!that.currentChanges[depkey].active){
                      that.currentChanges[depkey].active = true;
                      $('#'+depkey).prop('checked', true);
                    }
                  }
                } else if (!selected && (key === depkey)){
                  // If selected is the necessary dependency and it is being
                  // removed we need to remove all related parameters
                  for(var pi=0; pi<relations[depkey].length; pi++){
                    var currKey = relations[depkey][pi];
                    if(globals.dataSettings[currentId][currKey].active){
                      that.currentChanges[currKey] = {active: false};
                      $('#'+currKey).prop('checked', false);
                    } else if(that.currentChanges.hasOwnProperty(currKey)){
                      if(that.currentChanges[currKey].active){
                        delete that.currentChanges[currKey].active;
                        $('#'+currKey).prop('checked', false);
                      }
                    }
                  }
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

            if(globals.dataSettings[currentId].hasOwnProperty(paramId)){
              if(that.currentChanges.hasOwnProperty(paramId)){
                if(!that.currentChanges[paramId].hasOwnProperty(parItemId)){
                  that.currentChanges[paramId][parItemId] = [null, null];
                }
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

        $('#applyDataChanges').removeAttr('disabled');
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
            if(globals.dataSettings[currentId].hasOwnProperty(key)){
              for(var parItem in that.currentChanges[key]){
                if(parItem === 'active'){
                  changesToRequestedParameters = true;
                }
                globals.dataSettings[currentId][key][parItem] = that.currentChanges[key][parItem];
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
