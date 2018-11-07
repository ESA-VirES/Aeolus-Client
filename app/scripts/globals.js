
// globals
define(['backbone', 'objectStore'], function(Backbone, ObjectStore) {

    var swarm_model = Backbone.Model.extend({data:[]});
    return {
        version: "1.1",
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
            // L2A

            'SCA_extinction': {
                uom: '10-6 * m^-1',
                colorscale: 'plasma',
                extent: [-20, 20]
            },
            'SCA_extinction_variance': {
                uom: 'm^-2'
            },
            'SCA_backscatter': {
                uom: '10-6 * m^-1* sr^-1',
                colorscale: 'plasma',
                extent: [-20, 20]
            },
            'SCA_backscatter_variance': {
                uom: 'm^-2*sr^-2'
            },
            'SCA_time_obs':{
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'SCA_time_obs_start':{
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'SCA_time_obs_stop':{
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'mie_altitude_obs':{
                name: 'mie altitude',
                uom: 'm'
            },
            'rayleigh_altitude_obs':{
                name: 'rayleigh altitude',
                uom: 'm'
            },
            'longitude_of_DEM_intersection_obs':{
                name: 'longitude',
                uom: 'deg'
            },
             'latitude_of_DEM_intersection_obs':{
                name: 'altitude',
                uom: 'deg'
            },
             'altitude_of_DEM_intersection_obs':{
                name: 'altitude',
                uom: 'm'
            },

            'MCA_extinction': {
                uom: '10-6 * m^-1',
                colorscale: 'viridis',
                extent: [-20, 20]
            },
            'MCA_backscatter': {
                uom: '10-6 * m^-1* sr^-1',
                colorscale: 'viridis',
                extent: [-20, 20]
            },
            'MCA_time_obs_start': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'MCA_time_obs_stop': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },


            // L2B, L2C

            'mie_wind_result_SNR':{
                uom: null
            },
            'mie_wind_result_HLOS_error':{
                uom: 'm/s'
            },
            'mie_wind_result_COG_range':{
                uom: 'km'
            },
            'rayleigh_wind_result_HLOS_error':{
                uom: 'm/s'
            },
            'rayleigh_wind_result_COG_range':{
                uom: 'km'
            },

            'rayleigh_wind_result_start_time': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'rayleigh_wind_result_stop_time': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'rayleigh_wind_result_wind_velocity': {
                uom: 'm/s',
                colorscale: 'viridis',
                extent: [-20,20]
            },
            'rayleigh_wind_result_bottom_altitude':{
                name: 'altitude',
                uom: 'm'
            },
            'rayleigh_wind_result_top_altitude':{
                name: 'altitude',
                uom: 'm'
            },



            'mie_wind_result_start_time': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'mie_wind_result_stop_time': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'mie_wind_result_wind_velocity': {
                uom: 'm/s',
                colorscale: 'viridis',
                extent: [-20,20]
            },
            'mie_wind_result_bottom_altitude':{
                name: 'altitude',
                uom: 'm'
            },
            'mie_wind_result_top_altitude':{
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
                uom: 'ACCD pixel index',
                regression: 'polynomial'
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
                uom: 'a.u.',
                regression: 'polynomial'
            },
            'measurement_response':{
                uom: 'a.u.'
            },
            'reference_pulse_response':{
                uom: 'a.u.(rayleigh)/ACCD pixel index(mie)'
            },
            'mie_core_measurement_FWHM':{
                uom: 'ACCD pixel'
            },
            'frequency_offset':{
                uom: 'GHz'
            },
            'reference_pulse_error_mie_response':{
                uom: 'ACCD pixel index'
            },
            'reference_pulse_error_rayleigh_response':{
                uom: 'a.u.'
            },

            // AUX IRC
            'rayleigh_channel_A_response':{
                uom: 'a.u.',
                displayName: 'Channel A',
                symbol: 'circle_empty',
                lineConnect: true
            },
            'rayleigh_channel_B_response':{
                uom: 'a.u.',
                displayName: 'Channel B',
                symbol: 'rectangle_empty',
                lineConnect: true
            },
            
            'laser_frequency_offset':{
                uom: 'GHz'
            },
            
            'fizeau_transmission':{
                uom: 'a.u.'
            },
            'mie_response':{
                uom: 'ACCD pixel index'
            },
            'mean_laser_energy_mie':{
                uom: 'mj'
            },
            'mean_laser_energy_rayleigh':{
                uom: 'mj'
            },
            'FWHM_mie_core_2':{
                uom: 'ACCD pixel index'
            },
            


            // AUX ZWC
            'mie_ground_correction_velocity': {
                selected: true,
                range: [-0.5, 0.5],
                uom: 'm/s',
                colorscale: 'redblue',
                symbol: 'x',
                lineConnect: true,
                name: 'Mie Ground Correction Velocity'
            },
            'rayleigh_ground_correction_velocity': {
                selected: true,
                range: [-1.6, 2],
                uom: 'm/s',
                colorscale: 'redblue',
                symbol: 'triangle_empty',
                lineConnect: true,
                name: 'Rayleigh Ground Correction Velocity'
            },
            'mie_avg_ground_echo_bin_thickness_above_DEM':{
                uom: 'm',
            },
            'rayleigh_avg_ground_echo_bin_thickness_above_DEM':{
                uom: 'm',

            },


            // AUX MET
            'time_off_nadir': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'time_nadir':{
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'surface_wind_component_u_off_nadir':{
                uom: 'm/s',
            },
            'surface_wind_component_u_nadir':{
                uom: 'm/s',
            },
            'surface_wind_component_v_off_nadir':{
                uom: 'm/s',
            },
            'surface_wind_component_v_nadir':{
                uom: 'm/s',
            },
            'surface_pressure_off_nadir':{
                uom: 'hPa',
            },'surface_pressure_nadir':{
                uom: 'hPa',
            },
            'surface_altitude_off_nadir':{
                uom: 'm',
            }, 'surface_altitude_nadir':{
                uom: 'm',
            },

            // Cloudsat
            'time_start': {
                scaleFormat: 'time'
            },
            'time_end': {
                scaleFormat: 'time'
            },
            'time':{
                scaleFormat: 'time',
            },
            'height_start': {
                 uom: 'm/s',
            },
            'height_end': {
                 uom: 'm/s',
            },
            'CPR_Cloud_mask': {
                uom: null,
                colorscale: 'viridis',
                extent: [0, 40]
            },
            'Gaseous_Attenuation': {
                extent: [0, 550],
                uom: null,
                colorscale: 'plasma'
            },
            'Radar_Reflectivity': {
                extent: [-8000, 16000],
                uom: null,
                colorscale: 'plasma'
            }
        }
    };
});
