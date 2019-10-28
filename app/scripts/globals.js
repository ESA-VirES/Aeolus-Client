
// globals
define(['backbone', 'objectStore'], function(Backbone, ObjectStore) {

    var swarm_model = Backbone.Model.extend({data:[]});
    return {
        version: '1.4',
        objects: new ObjectStore(),
        selections: new ObjectStore(),
        baseLayers: new Backbone.Collection(),
        products: new Backbone.Collection(),
        overlays: new Backbone.Collection(),
        swarm: new swarm_model(),
        downloadMatrix: {
          'ALD_U_N_1B': {
            'observation': ['observation'],
            'measurement': ['measurement']
          },
          'ALD_U_N_2A': {
            'observation': ['observation', 'ica', 'sca'],
            'group': ['group', 'measurement']
          },
          'ALD_U_N_2B': {
            'wind-accumulation-result': ['rayleigh_wind', 'mie_wind', 'mie_profile', 'rayleigh_profile'],
            'group': ['mie_grouping', 'rayleigh_grouping']
          },
          'ALD_U_N_2C': {
            'wind-accumulation-result': ['rayleigh_wind', 'mie_wind', 'mie_profile', 'rayleigh_profile'],
            'group': ['mie_grouping', 'rayleigh_grouping']
          }
        },
        dataSettings: {

            time: {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            mie_time: {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            mie_time_start: {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            mie_time_end: {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            rayleigh_time: {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            rayleigh_time_start: {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            rayleigh_time_end: {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'rayleigh_HLOS_wind_speed': {
                uom: 'm/s',
                colorscale: 'viridis',
                extent: [-40,40]
            },
            'time_start': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'time_end': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'mie_HLOS_wind_speed': {
                uom: 'm/s',
                colorscale: 'viridis',
                extent: [-20,20]
            },
            'altitude':{
                uom: 'm'
            },

            'mie_signal_intensity': {
                uom: 'ACCD counts'
            },
            'rayleigh_signal_channel_A_intensity': {
                uom: 'ACCD counts'
            },
            'rayleigh_signal_channel_B_intensity': {
                uom: 'ACCD counts'
            },
            'rayleigh_signal_intensity': {
                uom: 'ACCD counts'
            },
            // L2A

            'SCA_extinction': {
                uom: '10-6 * m^-1',
                colorscale: 'viridis',
                extent: [0, 250]
            },
            'SCA_extinction_variance': {
                uom: 'm^-2',
                nullValue: -1
            },
            'SCA_backscatter': {
                uom: '10-6 * m^-1* sr^-1',
                colorscale: 'viridis',
                extent: [0, 15]
            },
            'SCA_backscatter_variance': {
                uom: 'm^-2*sr^-2',
                nullValue: -1
            },
            'SCA_LOD_variance': {
                nullValue: -1
            },
            "SCA_LOD": {
                "uom": null,
            },
            "SCA_LOD_variance": {
                "uom": null,
            },
            "SCA_SR": {
                "uom": null,
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
            'SCA_middle_bin_time_obs':{
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'SCA_middle_bin_time_obs_start':{
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'SCA_middle_bin_time_obs_stop':{
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'SCA_middle_bin_altitude_obs_top':{
                uom: 'm'
            },
            'SCA_middle_bin_altitude_obs_bottom':{
                uom: 'm'
            },
            'SCA_middle_bin_extinction_variance': {uom: "m^-2"},
            'SCA_middle_bin_backscatter_variance': {uom: "m^-2*sr^-2"},
            'SCA_middle_bin_LOD_variance': {uom: null},
            'SCA_middle_bin_BER_variance': {uom: "sr^-2"},
            'SCA_middle_bin_extinction': {uom: "10-6 * m^-1"},
            'SCA_middle_bin_backscatter': {uom: "10-6 * m^-1* sr^-1"},
            'SCA_middle_bin_LOD': {uom: null},

            "ICA_filling_case": {
                "uom": null,
            },
            "ICA_extinction": {
                "uom": "10-6 * m^-1",
            },
            "ICA_backscatter": {
                "uom": "10-6 * m^-1* sr^-1",
            },
            "ICA_LOD": {
                "uom": null,
            },

            'mie_altitude_obs':{

                uom: 'm'
            },
            'rayleigh_altitude_obs':{

                uom: 'm'
            },
            'longitude_of_DEM_intersection_obs':{
                uom: 'deg'
            },
            'latitude_of_DEM_intersection_obs':{
                uom: 'deg'
            },
            'altitude_of_DEM_intersection_obs':{
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
            "MCA_clim_BER": {
                "uom": "sr^-1"
            },
            "MCA_LOD": {
                "uom": null
            },
            'ICA_time_obs_start': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'ICA_time_obs_stop': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'ICA_extinction':{
                nullValue: -1000000
            },
            'ICA_backscatter':{
                nullValue: -1000000
            },

            "SCA_middle_bin_extinction": {
                "uom": "10-6 * m^-1",
            },
            "SCA_middle_bin_extinction_variance": {
                "uom": "m^-2",
            },
            "SCA_middle_bin_backscatter": {
                "uom": "10-6 * m^-1* sr^-1",
            },
            "SCA_middle_bin_backscatter_variance": {
                "uom": "m^-2*sr^-2",
            },
            "SCA_middle_bin_LOD": {
                "uom": null,
            },
            "SCA_middle_bin_LOD_variance": {
                "uom": null,
            },
            "SCA_middle_bin_BER": {
                "uom": null,
            },
            "SCA_middle_bin_BER_variance": {
                "uom": "sr^-2",
            },

            // L2A Group
            'group_backscatter_variance':{
                uom: 'm^-2*sr^-2',
                nullValue: -1
            },
            'group_extinction_variance':{
                uom: 'm^-2',
                nullValue: -1
            },
            'group_extinction':{
                uom: '10-6 * m^-1',
                nullValue: -1
            },
            'group_backscatter':{
                uom: '10-6 * m^-1* sr^-1',
                nullValue: -1
            },
            'group_LOD_variance':{
                uom: null,
                nullValue: -1
            },
            'group_LOD':{
                uom: null,
                //nullValue: 1.7e+38
            },
            'group_SR':{
                uom: null,
                //nullValue: 1.7e+38
            },


            // L2B, L2C

            'mie_meas_map': {
                colorscale: 'jet',
                csDiscrete: true
            },

            'rayleigh_meas_map': {
                colorscale: 'jet',
                csDiscrete: true
            },

            'mie_wind_result_SNR':{
                uom: null
            },
            'mie_wind_result_COG_range':{
                uom: 'km'
            },

            'mie_wind_result_HLOS_error':{
                uom: 'm/s',
                nullValue: 1.7e+38
            },
            'rayleigh_wind_result_HLOS_error':{
                uom: 'm/s',
                nullValue: 1.7e+38
            },

            'mie_wind_result_scattering_ratio': {
                nullValue: 1.7e+38
            },
            'rayleigh_wind_result_scattering_ratio': {
                nullValue: 1.7e+38
            },

            'rayleigh_wind_result_reference_pressure':{
                nullValue:4294967295
            },
            'mie_wind_result_reference_pressure':{
                nullValue:4294967295
            },

            'rayleigh_wind_result_reference_temperature': {
                nullValue: 65535
            },
            'mie_wind_result_reference_temperature': {
                nullValue: 65535
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

                uom: 'm'
            },
            'rayleigh_wind_result_top_altitude':{

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
                uom: 'm'
            },
            'mie_wind_result_top_altitude':{
                uom: 'm'
            },

            "mie_assimilation_background_HLOS": {
                "uom": "cm/s"
            },
            "mie_assimilation_background_horizontal_wind_velocity": {
                "uom": "m/s"
            },
            "mie_assimilation_analysis_HLOS": {
                "uom": "cm/s"
            },
            "mie_assimilation_analysis_horizontal_wind_velocity": {
                "uom": null
            },
          
            "rayleigh_assimilation_background_HLOS": {
                "uom": "cm/s"
            },
            "rayleigh_assimilation_analysis_HLOS": {
                "uom": "cm/s"
            },
            "rayleigh_assimilation_background_horizontal_wind_velocity": {
                "uom": "m/s"
            },
            "rayleigh_assimilation_analysis_horizontal_wind_velocity": {
                "uom": "m/s"
            },

            // AUX MRC and AUX RRC
            'frequency_valid': {
                extent: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',

            },
            'reference_pulse_response_valid': {
                range: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',

            },
            'measurement_response_valid': {
                range: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',

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

            },
            'ground_measurement_response_valid': {
                extent: [0, 1],
                uom: 'bool',
                colorscale: 'redblue',

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

                symbol: 'circle_empty',
                lineConnect: true
            },
            'rayleigh_channel_B_response':{
                uom: 'a.u.',

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

            },
            'rayleigh_ground_correction_velocity': {
                selected: true,
                range: [-1.6, 2],
                uom: 'm/s',
                colorscale: 'redblue',
                symbol: 'triangle_empty',
                lineConnect: true,

            },
            'mie_avg_ground_echo_bin_thickness_above_DEM':{
                uom: 'm',
            },
            'rayleigh_avg_ground_echo_bin_thickness_above_DEM':{
                uom: 'm',

            },
            // AUX MET
            'time_nadir_start': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'time_nadir_end': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'time_off_nadir_start': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
            'time_off_nadir_end': {
                scaleFormat: 'time',
                timeFormat: 'MJD2000_S'
            },
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

            'layer_validity_flag_off_nadir': {
                uom: null,
            },
            'layer_validity_flag_nadir': {
                uom: null,
            },
            'layer_pressure_off_nadir': {
                uom: null,
            },
            'layer_pressure_nadir': {
                uom: null,
            },
            'layer_temperature_off_nadir': {
                uom: null,
            },
            'layer_temperature_nadir': {
                uom: null,
            },
            'layer_wind_component_u_off_nadir': {
                uom: null,
            },
            'layer_wind_component_u_nadir': {
                uom: null,
            },
            'layer_wind_component_v_off_nadir': {
                uom: null,
            },
            'layer_wind_component_v_nadir': {
                uom: null,
            },
            'layer_rel_humidity_off_nadir': {
                uom: null,
            },
            'layer_rel_humidity_nadir': {
                uom: null,
            },
            'layer_spec_humidity_off_nadir': {
                uom: null,
            },
            'layer_spec_humidity_nadir': {
                uom: null,
            },
            'layer_cloud_cover_off_nadir': {
                uom: null,
            },
            'layer_cloud_cover_nadir': {
                uom: null,
            },
            'layer_cloud_liquid_water_content_off_nadir': {
                uom: null,
            },
            'layer_cloud_liquid_water_content_nadir': {
                uom: null,
            },
            'layer_cloud_ice_water_content_off_nadir': {
                uom: null,
            },
            'layer_cloud_ice_water_content_nadir': {
                uom: null,
            }
        }
    };
});
