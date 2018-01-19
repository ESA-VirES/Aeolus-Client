
// globals
define(['backbone', 'objectStore'], function(Backbone, ObjectStore) {

    var swarm_model = Backbone.Model.extend({data:[]});
    return {
        version: "0.5",
        objects: new ObjectStore(),
        selections: new ObjectStore(),
        baseLayers: new Backbone.Collection(),
        products: new Backbone.Collection(),
        overlays: new Backbone.Collection(),
        swarm: new swarm_model(),
        dataSettings: {

            time: {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'rayleigh_HLOS_wind_speed': {
                uom: 'm/s',
                colorscale: 'viridis',
                extent: [-40,40]
            },
            'rayleigh_time_start': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'rayleigh_time_end': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'rayleigh_altitude':{
                name: 'altitude',
                uom: 'm'
            },



            'mie_time_start': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'mie_time_end': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'mie_HLOS_wind_speed': {
                uom: 'm/s',
                colorscale: 'viridis',
                extent: [-20,20]
            },
            'mie_altitude':{
                name: 'altitude',
                uom: 'm'
            },

            // AUX MRC and AUX RRC
            'frequency_valid': {
                extent: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',
                name: 'Frequency Valid'
            },
            'reference_pulse_response_valid': {
                range: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',
                name: 'Reference Pulse Response Valid'
            },
            'measurement_response_valid': {
                range: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',
                name: 'Measurement Response Valid'
            },
            'lat_of_DEM_intersection': {
                uom: 'deg'
            },
            'lon_of_DEM_intersection':{
                uom: 'deg'
            },
            'time_freq_step':{
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'measurement_error_mie_response': {
                uom: 'ACCD pixel index'
            },
            'ground_frequency_valid': {
                extent: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',
                name: 'Ground Frequency Valid'
            },
            'ground_measurement_response_valid': {
                extent: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',
                name: 'Ground Measurement Response Valid'
            },
            'measurement_error_rayleigh_response': {
                uom: 'ACCD pixel index'
            },
            'measurement_response':{
                uom: 'ACCD pixel index'
            },
            'reference_pulse_response':{
                uom: 'ACCD pixel index'
            },
            'mie_core_measurement_FWHM':{
                uom: 'ACCD pixel index'
            },
            'frequency_offset':{
                uom: 'GHz'
            },

            // AUX IRC


            // AUX ZWC
            'Mie_Ground_Correction_Velocity': {
                selected: true,
                range: [0, 1],
                uom: 'm/s',
                colorscale: 'redblue',
                name: 'Mie Ground Correction Velocity'
            },
            'Rayleigh_Ground_Correction_Velocity': {
                selected: true,
                range: [0, 1],
                uom: 'm/s',
                colorscale: 'redblue',
                name: 'Rayleigh Ground Correction Velocity'
            }
        }
    };
});
