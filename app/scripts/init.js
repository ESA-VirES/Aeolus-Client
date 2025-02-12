(function () {
  'use strict';

  var root = this;

  root.require.config({
    urlArgs: 'bust=v2.1.41',

    waitSeconds: 5,
    /* starting point for application */
    deps: ['backbone', 'backbone.marionette', 'bootstrap', 'marionette.handlebars', 'main'],

    shim: {
      "jquery-ui": {
        deps: ['jquery']
      },
      jqueryuitouch: {
        deps: ['jquery-ui']
      },
      Modernizr:{
        deps: ['jquery',"jquery-ui"]
      },
      handlebars: {
        exports: 'Handlebars'
      },
      filepond: {
        exports: 'FilePond',
        deps: ['jquery']
      },
      backbone: {
        deps: [
          'underscore',
          'jquery'
        ],
        exports: 'Backbone'
      },
      bootstrap: {
        deps: ['jquery'],
        exports: 'jquery'
      },
      FileSaver: {
        deps: ['canvas-toBlob', 'Blob'],
        exports: 'saveAs'
      },
      lm: {
        exports: 'lm'
      },
      timeslider: {
        deps: ['d3']
      },
      xtk: {
        exports: 'X'
      },
      'xtk-gui': {
        exports: 'dat'
      },
      drawhelper: {
        deps: ['cesium'],
        exports: 'DrawHelper'
      },
      w2ui: {
        deps: ['jquery']
      },
      w2popup: {
        deps: ['w2utils', 'jquery']
      },
      graphly: {
        deps: ['d3', 'msgpack']
      },
      Anno: {
        deps: ['jquery-scrollintoview', "jquery"]
      },
      cesium: {
        exports: 'Cesium'
      },
    },

    paths: {
      filepond: '../node_modules/filepond/dist/filepond',
      msgpack: '../node_modules/msgpack-lite/dist/msgpack.min',
      graphly: '../node_modules/graphly/dist/graphly.min',
      cesium: "../node_modules/cesium/Build/Cesium/Cesium",
      drawhelper: "../scripts/vendor/cesium_DrawHelper",
      contrib: 'contrib',
      core: 'core',
      requirejs: '../node_modules/requirejs/require',
      jquery: '../node_modules/jquery/dist/jquery.min',
      jQuery: '../node_modules/jquery/dist/jquery.min',
      "jquery-ui": '../node_modules/jquery-ui/jquery-ui',
      jqueryuitouch: '../node_modules/jqueryui-touch-punch/jquery.ui.touch-punch',
      backbone: '../node_modules/backbone/backbone-min',
      underscore: '../node_modules/underscore/underscore-min',
      d3: '../node_modules/d3/d3.min',
      timeslider: '../node_modules/d3.TimeSlider/build/d3.timeslider',

      'canvas-toBlob': '../node_modules/canvas-toBlob/canvas-toBlob',
      'Blob': '../node_modules/blob-polyfill/Blob',
      'FileSaver': '../node_modules/FileSaver.js/FileSaver',

      lm: '../node_modules/lm.js/lm.min',

      /* alias all marionette libs */
      'backbone.marionette': '../node_modules/backbone.marionette/lib/core/amd/backbone.marionette.min',
      'backbone.wreqr': '../node_modules/backbone.wreqr/lib/backbone.wreqr.min',
      'backbone.babysitter': '../node_modules/backbone.babysitter/lib/backbone.babysitter.min',

      /* alias the bootstrap js lib */
      bootstrap: '../node_modules/bootstrap/dist/js/bootstrap.min',

      /* Alias text.js for template loading and shortcut the templates dir to tmpl */
      text: '../node_modules/requirejs-text/text',
      tmpl: "../templates",

      /* handlebars from the require handlerbars plugin below */
      handlebars: '../node_modules/require-handlebars-plugin/Handlebars',

      /* require handlebars plugin - Alex Sexton */
      i18nprecompile: '../node_modules/require-handlebars-plugin/hbs/i18nprecompile',
      json2: '../node_modules/require-handlebars-plugin/hbs/json2',
      hbs: '../node_modules/require-handlebars-plugin/hbs',

      /* marionette and handlebars plugin */
      'marionette.handlebars': '../node_modules/backbone.marionette.handlebars/backbone.marionette.handlebars.min',

      papaparse: '../node_modules/papaparse/papaparse.min',

      sumoselect: '../node_modules/sumoselect/jquery.sumoselect.min',
      FileSaver:"../node_modules/file-saver/FileSaver",

      w2ui: '../node_modules/w2ui/dist/w2ui-1.5.min',
      w2popup: '../node_modules/w2ui/src/w2popup',
      w2utils: '../node_modules/w2ui/src/w2utils',

      Anno: '../node_modules/anno.js/dist/anno',
      'jquery-scrollintoview': '../node_modules/jquery-scrollintoview/jquery.scrollintoview.min',
      'expr-eval': '../node_modules/expr-eval/dist/bundle',
    },

    hbs: {
      disableI18n: true
    }
  });
}).call(this);
