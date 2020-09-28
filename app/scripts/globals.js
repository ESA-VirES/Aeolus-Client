
// globals
define(['backbone', 'objectStore'], function(Backbone, ObjectStore) {

    var swarm_model = Backbone.Model.extend({data:[]});
    return {
        version: '2.1.1',
        objects: new ObjectStore(),
        selections: new ObjectStore(),
        baseLayers: new Backbone.Collection(),
        products: new Backbone.Collection(),
        overlays: new Backbone.Collection(),
        swarm: new swarm_model(),
        publicCollections:{},
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
            'ALD_U_N_1B': {
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
                    extent: [-40,40],
                    filterExtent: [-40, 40],
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
                    extent: [-20,20],
                    filterExtent: [-20, 20]
                },
                mie_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
                rayleigh_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
                
            },
/*
maskParameter: 'SCA_mie_SNR_valid',
maskParameter: 'SCA_rayleigh_SNR_valid',
maskParameter: 'SCA_extinction_error_bar_valid',
maskParameter: 'SCA_backscatter_error_bar_valid',
maskParameter: 'SCA_cumulative_LOD_valid',
*/
/*
SCA_middle_bin_BER_valid
SCA_middle_bin_mie_SNR_valid
SCA_middle_bin_rayleigh_SNR_valid
SCA_middle_bin_extinction_error_bar_valid
SCA_middle_bin_backscatter_error_bar_valid
SCA_middle_bin_cumulative_LOD_valid
*/
            'ALD_U_N_2A': {
                'SCA_extinction': {
                    uom: '10-6 * m^-1',
                    colorscale: 'viridis',
                    extent: [0, 250],
                    maskParameter: 'SCA_extinction_valid',
                },
                'SCA_extinction_variance': {
                    uom: 'm^-2',
                    nullValue: -1,
                    filterExtent: [0,1e-8]
                },
                'SCA_backscatter': {
                    uom: '10-6 * m^-1* sr^-1',
                    colorscale: 'viridis',
                    extent: [0, 15],
                    filterExtent: [-1,1],
                    maskParameter: 'SCA_backscatter_valid',
                },
                'SCA_backscatter_variance': {
                    uom: 'm^-2*sr^-2',
                    nullValue: -1,
                    filterExtent: [0,1e-13]
                },
                'SCA_LOD_variance': {
                    nullValue: -1
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
                'SCA_middle_bin_extinction': {
                    maskParameter: 'SCA_middle_bin_extinction_valid',
                },
                'SCA_middle_bin_backscatter': {
                    maskParameter: 'SCA_middle_bin_backscatter_valid',
                },
                /*
                'SCA_middle_bin_extinction_variance',
                'SCA_middle_bin_backscatter_variance',
                'SCA_middle_bin_LOD_variance',
                'SCA_middle_bin_BER_variance',
                'SCA_middle_bin_LOD',
                'SCA_middle_bin_BER',
                */
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
                    nullValue: -1,
                    extent: [-3.5e-9, -2e-10],
                },
                'group_backscatter':{
                    uom: '10-6 * m^-1* sr^-1',
                    nullValue: -1,
                    extent: [-3.5e-9, -2e-10],
                },
                'group_LOD_variance':{
                    uom: null,
                    nullValue: -1
                },
                time: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                group_start_time: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                group_end_time: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                mie_altitude_obs: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
                rayleigh_altitude_obs: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
            },
            'ALD_U_N_2B': {
                'mie_meas_map': {
                    colorscale: 'jet',
                    csDiscrete: true
                },

                'rayleigh_meas_map': {
                    colorscale: 'jet',
                    csDiscrete: true
                },
                'mie_wind_result_HLOS_error':{
                    uom: 'cm/s',
                    nullValue: 1.7e+38,
                    filterExtent: [0, 1000]
                },
                'rayleigh_wind_result_HLOS_error':{
                    uom: 'cm/s',
                    nullValue: 1.7e+38,
                    filterExtent: [0, 1000]
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
                'rayleigh_wind_result_start_time': {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'rayleigh_wind_result_stop_time': {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'rayleigh_wind_result_wind_velocity': {
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-20,20],
                    modifier: 'x*1E-2',
                    modifiedUOM: 'm/s'
                },
                'rayleigh_wind_result_wind_velocity_normalised': {
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-20,20],
                    modifier: 'x*1E-2',
                    modifiedUOM: 'm/s'
                },
                rayleigh_wind_result_bottom_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
                rayleigh_wind_result_top_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
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
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-20,20],
                    modifier: 'x*1E-2',
                    modifiedUOM: 'm/s'
                },
                'mie_wind_result_wind_velocity_normalised': {
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-20,20],
                    modifier: 'x*1E-2',
                    modifiedUOM: 'm/s'
                },
                mie_wind_result_bottom_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
                mie_wind_result_top_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
            },

            'ALD_U_N_2C': {
                'mie_meas_map': {
                    colorscale: 'jet',
                    csDiscrete: true
                },

                'rayleigh_meas_map': {
                    colorscale: 'jet',
                    csDiscrete: true
                },
                'mie_wind_result_HLOS_error':{
                    uom: 'cm/s',
                    nullValue: 1.7e+38,
                    filterExtent: [0, 1000]
                },
                'rayleigh_wind_result_HLOS_error':{
                    uom: 'cm/s',
                    nullValue: 1.7e+38,
                    filterExtent: [0, 1000]
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
                'rayleigh_wind_result_start_time': {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'rayleigh_wind_result_stop_time': {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'rayleigh_wind_result_wind_velocity': {
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-20,20],
                    modifier: 'x*1E-2',
                    modifiedUOM: 'm/s'
                },
                'rayleigh_wind_result_wind_velocity_normalised': {
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-20,20],
                    modifier: 'x*1E-2',
                    modifiedUOM: 'm/s'
                },
                rayleigh_wind_result_bottom_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
                rayleigh_wind_result_top_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
                mie_wind_result_bottom_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
                },
                mie_wind_result_top_altitude: {
                    modifier: 'x*1E-3',
                    modifiedUOM: 'km'
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
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-20,20],
                    modifier: 'x*1E-2',
                    modifiedUOM: 'm/s'
                },
                'mie_wind_result_wind_velocity_normalised': {
                    uom: 'cm/s',
                    colorscale: 'viridis',
                    extent: [-20,20],
                    modifier: 'x*1E-2',
                    modifiedUOM: 'm/s'
                },
            },

            'AUX_MRC_1B': {
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
                'time_freq_step':{
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'time_freq_step_combined':{
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'time_freq_step_start':{
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'time_freq_step_end':{
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
                }
            },

            'AUX_RRC_1B': {
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
                'time_freq_step':{
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'time_freq_step_combined':{
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'time_freq_step_start':{
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
                'time_freq_step_end':{
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
                }
            },

            'AUX_ISR_1B': {
                'rayleigh_channel_A_response':{
                    uom: 'a.u.',
                    symbol: 'circle_empty',
                    lineConnect: true
                },
                'rayleigh_channel_B_response':{
                    uom: 'a.u.',
                    symbol: 'rectangle_empty',
                    lineConnect: true
                }
            },

            'AUX_ZWC_1B': {
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

                }
            },

            'AUX_MET_12': {
                time: {
                    scaleFormat: 'time',
                    timeFormat: 'MJD2000_S'
                },
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
                }
            },
            'ADAM_albedo': {
            }
        },
        fieldList: {
          'ALD_U_N_1B': {
            'observation_fields': [
              'time',
              'longitude_of_DEM_intersection',
              'latitude_of_DEM_intersection',
              'altitude_of_DEM_intersection',
              'argument_of_latitude_of_dem_intersection',
              'mie_longitude',
              'mie_latitude',
              'rayleigh_longitude',
              'rayleigh_latitude',
              'mie_altitude',
              'rayleigh_altitude',
              'rayleigh_topocentric_azimuth_of_height_bin',
              'rayleigh_topocentric_elevation_of_height_bin',
              'rayleigh_target_to_sun_visibility_flag',
              'mie_range',
              'rayleigh_range',
              'geoid_separation',
              'velocity_at_DEM_intersection',
              'AOCS_pitch_angle',
              'AOCS_roll_angle',
              'AOCS_yaw_angle',
              'mie_HLOS_wind_speed',
              'rayleigh_HLOS_wind_speed',
              'mie_signal_intensity',
              'rayleigh_signal_channel_A_intensity',
              'rayleigh_signal_channel_B_intensity',
              'rayleigh_signal_intensity',
              'mie_ground_velocity',
              'rayleigh_ground_velocity',
              'mie_HBE_ground_velocity',
              'mie_ground_fwhm',
              'mie_ground_useful_signal',
              'mie_ground_signal_to_noise_ratio',
              'mie_ground_refined_signal_to_noise_ratio',
              'rayleigh_ground_useful_signal',
              'rayleigh_ground_signal_to_noise_ratio',
              'mie_average_ground_wind_bin_thickness',
              'rayleigh_average_ground_wind_bin_thickness',
              'mie_average_ground_wind_bin_thickness_above_dem',
              'rayleigh_average_ground_wind_bin_thickness_above_dem',
              'rayleigh_HBE_ground_velocity',
              'mie_total_ZWC',
              'rayleigh_total_ZWC',
              'mie_scattering_ratio',
              'mie_SNR',
              'rayleigh_channel_A_SNR',
              'rayleigh_channel_B_SNR',
              'rayleigh_SNR',
              'mie_num_invalid_reference_pulse',
              'rayleigh_num_invalid_reference_pulse',
              'mie_error_quantifier',
              'rayleigh_error_quantifier',
              'average_laser_energy',
              'laser_frequency_offset_std_dev',
              'uv_energy_std_dev',
              'mie_ref_pulse_signal_to_noise_ratio',
              'mie_ref_pulse_refined_signal_to_noise_ratio',
              'rayleigh_ref_pulse_signal_to_noise_ratio_channel_a',
              'rayleigh_ref_pulse_signal_to_noise_ratio_channel_b',
              'mie_num_peak_invalid',
              'mie_corrected_reference_pulse_response',
              'rayleigh_corrected_reference_pulse_response',
              'laser_frequency',
              'rayleigh_bin_quality_flag',
              'mie_bin_quality_flag',
              'rayleigh_reference_pulse_quality_flag',
              'mie_reference_pulse_quality_flag',
              'aht_22_tel_m1',
              'aht_23_tel_m1',
              'aht_24_tel_m1',
              'aht_25_tel_m1',
              'aht_26_tel_m1',
              'aht_27_tel_m1',
              'tc_18_tel_m11',
              'tc_19_tel_m12',
              'tc_20_tel_m13',
              'tc_21_tel_m14',
              'tc_25_tm15_ths1y',
              'tc_27_tm16_ths1y',
              'tc_29_ths2',
              'tc_23_ths1',
              'tc_32_ths3',
              'albedo_off_nadir',
              'rayleigh_signal_intensity_range_corrected',
              'mie_signal_intensity_range_corrected',
              'rayleigh_signal_intensity_normalised',
              'mie_signal_intensity_normalised'
            ],
            'measurement_fields': [
              'time',
              'longitude_of_DEM_intersection',
              'latitude_of_DEM_intersection',
              'altitude_of_DEM_intersection',
              'argument_of_latitude_of_dem_intersection',
              'mie_longitude',
              'mie_latitude',
              'rayleigh_longitude',
              'rayleigh_latitude',
              'mie_altitude',
              'rayleigh_altitude',
              'velocity_at_DEM_intersection',
              'AOCS_pitch_angle',
              'AOCS_roll_angle',
              'AOCS_yaw_angle',
              'mie_HLOS_wind_speed',
              'rayleigh_HLOS_wind_speed',
              'mie_mean_emitted_frequency',
              'rayleigh_mean_emitted_frequency',
              'mie_emitted_frequency_std_dev',
              'rayleigh_emitted_frequency_std_dev',
              'mie_signal_intensity',
              'rayleigh_signal_channel_A_intensity',
              'rayleigh_signal_channel_B_intensity',
              'rayleigh_signal_intensity',
              'mie_ground_velocity',
              'rayleigh_ground_velocity',
              'mie_scattering_ratio',
              'mie_SNR',
              'rayleigh_channel_A_SNR',
              'rayleigh_channel_B_SNR',
              'rayleigh_SNR',
              'average_laser_energy',
              'laser_frequency',
              'rayleigh_bin_quality_flag',
              'mie_bin_quality_flag',
              'rayleigh_reference_pulse_quality_flag',
              'mie_reference_pulse_quality_flag',
              'albedo_off_nadir'
            ]
          },
          'ALD_U_N_2A': {
            // ICA have different size, for now disabled
            'observation_fields': [
              'L1B_start_time_obs',
              'L1B_centroid_time_obs',
              'MCA_time_obs',
              'longitude_of_DEM_intersection_obs',
              'latitude_of_DEM_intersection_obs',
              'altitude_of_DEM_intersection_obs',
              'geoid_separation_obs',
              'mie_altitude_obs',
              'rayleigh_altitude_obs',
              'L1B_num_of_meas_per_obs',
              'MCA_clim_BER',
              'MCA_extinction',
              'MCA_LOD',
              'sca_mask',
              'ica_mask',
              'albedo_off_nadir'
            ],
            'ica_fields': [
              'ICA_time_obs',
              'ICA_QC_flag',
              'ICA_filling_case',
              'ICA_extinction',
              'ICA_backscatter',
              'ICA_LOD'
            ],
            'sca_fields': [
              'SCA_time_obs',
              'SCA_QC_flag',
              'SCA_extinction_variance',
              'SCA_backscatter_variance',
              'SCA_LOD_variance',
              'SCA_extinction',
              'SCA_backscatter',
              'SCA_LOD',
              'SCA_SR',
              'SCA_middle_bin_altitude_obs',
              'SCA_middle_bin_extinction_variance',
              'SCA_middle_bin_backscatter_variance',
              'SCA_middle_bin_LOD_variance',
              'SCA_middle_bin_BER_variance',
              'SCA_middle_bin_extinction',
              'SCA_middle_bin_backscatter',
              'SCA_middle_bin_LOD',
              'SCA_middle_bin_BER',
              'SCA_processing_qc_flag',
              'SCA_middle_bin_processing_qc_flag'
            ],
            'measurement_fields': [
              'L1B_time_meas',
              'longitude_of_DEM_intersection_meas',
              'latitude_of_DEM_intersection_meas',
              'altitude_of_DEM_intersection_meas',
              'mie_altitude_meas',
              'rayleigh_altitude_meas',
              'albedo_off_nadir'
            ],
            'group_fields': [
              'group_start_obs',
              'group_end_obs',
              'group_start_meas_obs',
              'group_end_meas_obs',
              'group_start_time',
              'group_end_time',
              'group_height_bin_index',
              'group_backscatter',
              'group_backscatter_variance',
              'group_extinction_variance',
              /*'group_centroid_time',
              'group_middle_bin_start_altitude',
              'group_middle_bin_stop_altitude',
              'group_start_obs',
              'group_start_meas_obs',
              'group_end_obs',
              'group_end_meas_obs',
              'group_height_bin_index',
              'group_extinction_variance',
              'group_backscatter_variance',
              'group_LOD_variance',
              'group_middle_bin_extinction_variance_top',
              'group_middle_bin_backscatter_variance_top',
              'group_middle_bin_LOD_variance_top',
              'group_middle_bin_BER_variance_top',
              'group_middle_bin_extinction_variance_bottom',
              'group_middle_bin_backscatter_variance_bottom',
              'group_middle_bin_LOD_variance_bottom',
              'group_middle_bin_BER_variance_bottom',
              'group_extinction',
              'group_backscatter',
              'group_LOD',
              'group_SR',
              'group_middle_bin_extinction_top',
              'group_middle_bin_backscatter_top',
              'group_middle_bin_LOD_top',
              'group_middle_bin_BER_top',
              'group_middle_bin_extinction_bottom',
              'group_middle_bin_backscatter_bottom',
              'group_middle_bin_LOD_bottom',
              'group_middle_bin_BER_bottom',
              //'scene_classification_aladin_cloud_flag',
              'scene_classification_NWP_cloud_flag',
              'scene_classification_group_class_reliability'*/
            ],
          },
          'ALD_U_N_2B': {
              'mie_profile_fields': [
                'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                /*'mie_profile_datetime_start', 'mie_profile_datetime_stop'*/
              ],
              'mie_wind_fields': [
                'mie_wind_result_id',
                'mie_wind_result_range_bin_number',
                'mie_wind_result_start_time',
                'mie_wind_result_COG_time',
                'mie_wind_result_stop_time',
                'mie_wind_result_bottom_altitude',
                'mie_wind_result_COG_altitude',
                'mie_wind_result_top_altitude',
                'mie_wind_result_bottom_range',
                'mie_wind_result_COG_range',
                'mie_wind_result_top_range',
                'mie_wind_result_start_latitude',
                'mie_wind_result_COG_latitude',
                'mie_wind_result_stop_latitude',
                'mie_wind_result_start_longitude',
                'mie_wind_result_COG_longitude',
                'mie_wind_result_stop_longitude',
                'mie_wind_result_lat_of_DEM_intersection',
                'mie_wind_result_lon_of_DEM_intersection',
                'mie_wind_result_arg_of_lat_of_DEM_intersection',
                'mie_wind_result_geoid_separation',
                'mie_wind_result_alt_of_DEM_intersection',
                'mie_wind_result_HLOS_error',
                'mie_wind_result_QC_flags_1',
                'mie_wind_result_QC_flags_2',
                'mie_wind_result_QC_flags_3',
                'mie_wind_result_SNR',
                'mie_wind_result_scattering_ratio',
                'mie_wind_result_observation_type',
                'mie_wind_result_validity_flag',
                'mie_wind_result_wind_velocity',
                'mie_wind_result_integration_length',
                'mie_wind_result_num_of_measurements',
                'mie_wind_result_albedo_off_nadir',

                'mie_wind_result_reference_hlos',
                'mie_wind_result_extinction',
                'mie_wind_result_background_high',
                'mie_wind_result_observation_type',
                'mie_wind_result_applied_spacecraft_los_corr_velocity',
                'mie_wind_result_applied_m1_temperature_corr_velocity',
                'mie_aht_22',
                'mie_aht_23',
                'mie_aht_24',
                'mie_aht_25',
                'mie_aht_26',
                'mie_aht_27',
                'mie_tc_18',
                'mie_tc_19',
                'mie_tc_20',
                'mie_tc_21',
                'mie_tc_23',
                'mie_tc_25',
                'mie_tc_27',
                'mie_tc_29',
                'mie_tc_32',

              ],
              'rayleigh_wind_fields': [
                'rayleigh_wind_result_id',
                'rayleigh_wind_result_range_bin_number',
                'rayleigh_wind_result_start_time',
                'rayleigh_wind_result_COG_time',
                'rayleigh_wind_result_stop_time',
                'rayleigh_wind_result_bottom_altitude',
                'rayleigh_wind_result_COG_altitude',
                'rayleigh_wind_result_top_altitude',
                'rayleigh_wind_result_bottom_range',
                'rayleigh_wind_result_COG_range',
                'rayleigh_wind_result_top_range',
                'rayleigh_wind_result_start_latitude',
                'rayleigh_wind_result_COG_latitude',
                'rayleigh_wind_result_stop_latitude',
                'rayleigh_wind_result_start_longitude',
                'rayleigh_wind_result_COG_longitude',
                'rayleigh_wind_result_stop_longitude',
                'rayleigh_wind_result_lat_of_DEM_intersection',
                'rayleigh_wind_result_lon_of_DEM_intersection',
                'rayleigh_wind_result_arg_of_lat_of_DEM_intersection',
                'rayleigh_wind_result_geoid_separation',
                'rayleigh_wind_result_alt_of_DEM_intersection',
                'rayleigh_wind_result_HLOS_error',
                'rayleigh_wind_result_QC_flags_1',
                'rayleigh_wind_result_QC_flags_2',
                'rayleigh_wind_result_QC_flags_3',
                'rayleigh_wind_result_scattering_ratio',
                'rayleigh_wind_result_observation_type',
                'rayleigh_wind_result_validity_flag',
                'rayleigh_wind_result_wind_velocity',
                'rayleigh_wind_result_integration_length',
                'rayleigh_wind_result_num_of_measurements',
                'rayleigh_wind_result_reference_pressure',
                'rayleigh_wind_result_reference_temperature',
                'rayleigh_wind_result_reference_backscatter_ratio',
                'rayleigh_wind_result_albedo_off_nadir',

                'rayleigh_wind_result_reference_hlos',
                'rayleigh_wind_result_background_high',
                'rayleigh_wind_result_wind_to_pressure',
                'rayleigh_wind_result_wind_to_temperature',
                'rayleigh_wind_result_wind_to_backscatter_ratio',
                'rayleigh_wind_result_applied_spacecraft_los_corr_velocity',
                'rayleigh_wind_result_applied_rdb_corr_velocity',
                'rayleigh_wind_result_applied_ground_corr_velocity',
                'rayleigh_wind_result_applied_m1_temperature_corr_velocity',
                'rayleigh_aht_22',
                'rayleigh_aht_23',
                'rayleigh_aht_24',
                'rayleigh_aht_25',
                'rayleigh_aht_26',
                'rayleigh_aht_27',
                'rayleigh_tc_18',
                'rayleigh_tc_19',
                'rayleigh_tc_20',
                'rayleigh_tc_21',
                'rayleigh_tc_23',
                'rayleigh_tc_25',
                'rayleigh_tc_27',
                'rayleigh_tc_29',
                'rayleigh_tc_32',

              ],
              'rayleigh_profile_fields': [
                'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                /*'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'*/
              ]
          },
          'ALD_U_N_2C': {
               'mie_profile_fields': [
                'mie_profile_lat_of_DEM_intersection', 'mie_profile_lon_of_DEM_intersection',
                /*'mie_profile_datetime_start', 'mie_profile_datetime_stop'*/
              ],
              'mie_wind_fields': [
                'mie_wind_result_id',
                'mie_wind_result_range_bin_number',
                'mie_wind_result_start_time',
                'mie_wind_result_COG_time',
                'mie_wind_result_stop_time',
                'mie_wind_result_bottom_altitude',
                'mie_wind_result_COG_altitude',
                'mie_wind_result_top_altitude',
                'mie_wind_result_bottom_range',
                'mie_wind_result_COG_range',
                'mie_wind_result_top_range',
                'mie_wind_result_start_latitude',
                'mie_wind_result_COG_latitude',
                'mie_wind_result_stop_latitude',
                'mie_wind_result_start_longitude',
                'mie_wind_result_COG_longitude',
                'mie_wind_result_stop_longitude',
                'mie_wind_result_lat_of_DEM_intersection',
                'mie_wind_result_lon_of_DEM_intersection',
                'mie_wind_result_geoid_separation',
                'mie_wind_result_alt_of_DEM_intersection',
                'mie_wind_result_HLOS_error',
                'mie_wind_result_reference_hlos',
                'mie_wind_result_QC_flags_1',
                'mie_wind_result_QC_flags_2',
                'mie_wind_result_QC_flags_3',
                'mie_wind_result_SNR',
                'mie_wind_result_scattering_ratio',
                'mie_wind_result_extinction',
                'mie_wind_result_background_high',
                'mie_assimilation_L2B_QC',
                'mie_assimilation_persistence_error',
                'mie_assimilation_representativity_error',
                'mie_assimilation_final_error',
                'mie_assimilation_est_L2B_bias',
                'mie_assimilation_background_HLOS_error',
                'mie_assimilation_L2B_HLOS_reliability',
                'mie_assimilation_u_wind_background_error',
                'mie_assimilation_v_wind_background_error',
                'mie_wind_result_observation_type',
                'mie_wind_result_validity_flag',
                'mie_wind_result_wind_velocity',
                'mie_wind_result_applied_spacecraft_los_corr_velocity',
                'mie_wind_result_applied_m1_temperature_corr_velocity',
                'mie_wind_result_integration_length',
                'mie_wind_result_num_of_measurements',
                'mie_assimilation_validity_flag',
                'mie_assimilation_background_HLOS',
                'mie_assimilation_background_u_wind_velocity',
                'mie_assimilation_background_v_wind_velocity',
                'mie_assimilation_background_horizontal_wind_velocity',
                'mie_assimilation_background_wind_direction',
                'mie_assimilation_analysis_HLOS',
                'mie_assimilation_analysis_u_wind_velocity',
                'mie_assimilation_analysis_v_wind_velocity',
                'mie_assimilation_analysis_horizontal_wind_velocity',
                'mie_assimilation_analysis_wind_direction',
                'mie_wind_result_albedo_off_nadir',

                'mie_aht_22',
                'mie_aht_23',
                'mie_aht_24',
                'mie_aht_25',
                'mie_aht_26',
                'mie_aht_27',
                'mie_tc_18',
                'mie_tc_19',
                'mie_tc_20',
                'mie_tc_21',
                'mie_tc_23',
                'mie_tc_25',
                'mie_tc_27',
                'mie_tc_29',
                'mie_tc_32',
              ],
              'rayleigh_profile_fields': [
                'rayleigh_profile_lat_of_DEM_intersection', 'rayleigh_profile_lon_of_DEM_intersection',
                /*'rayleigh_profile_datetime_start', 'rayleigh_profile_datetime_stop'*/
              ],
              'rayleigh_wind_fields': [
                'rayleigh_wind_result_id',
                'rayleigh_wind_result_range_bin_number',
                'rayleigh_wind_result_start_time',
                'rayleigh_wind_result_COG_time',
                'rayleigh_wind_result_stop_time',
                'rayleigh_wind_result_bottom_altitude',
                'rayleigh_wind_result_COG_altitude',
                'rayleigh_wind_result_top_altitude',
                'rayleigh_wind_result_bottom_range',
                'rayleigh_wind_result_COG_range',
                'rayleigh_wind_result_top_range',
                'rayleigh_wind_result_start_latitude',
                'rayleigh_wind_result_COG_latitude',
                'rayleigh_wind_result_stop_latitude',
                'rayleigh_wind_result_start_longitude',
                'rayleigh_wind_result_COG_longitude',
                'rayleigh_wind_result_stop_longitude',
                'rayleigh_wind_result_lat_of_DEM_intersection',
                'rayleigh_wind_result_lon_of_DEM_intersection',
                'rayleigh_wind_result_geoid_separation',
                'rayleigh_wind_result_alt_of_DEM_intersection',
                'rayleigh_wind_result_HLOS_error',
                'rayleigh_wind_result_reference_hlos',
                'rayleigh_wind_result_background_high',
                'rayleigh_wind_result_QC_flags_1',
                'rayleigh_wind_result_QC_flags_2',
                'rayleigh_wind_result_QC_flags_3',
                'rayleigh_wind_result_scattering_ratio',
                'rayleigh_assimilation_L2B_QC',
                'rayleigh_assimilation_persistence_error',
                'rayleigh_assimilation_representativity_error',
                'rayleigh_assimilation_final_error',
                'rayleigh_assimilation_est_L2B_bias',
                'rayleigh_assimilation_background_HLOS_error',
                'rayleigh_assimilation_L2B_HLOS_reliability',
                'rayleigh_assimilation_u_wind_background_error',
                'rayleigh_assimilation_v_wind_background_error',
                'rayleigh_wind_result_observation_type',
                'rayleigh_wind_result_validity_flag',
                'rayleigh_wind_result_wind_velocity',
                'rayleigh_wind_result_wind_to_pressure',
                'rayleigh_wind_result_wind_to_temperature',
                'rayleigh_wind_result_wind_to_backscatter_ratio',
                'rayleigh_wind_result_applied_spacecraft_los_corr_velocity',
                'rayleigh_wind_result_applied_rdb_corr_velocity',
                'rayleigh_wind_result_applied_ground_corr_velocity',
                'rayleigh_wind_result_applied_m1_temperature_corr_velocity',
                'rayleigh_wind_result_integration_length',
                'rayleigh_wind_result_num_of_measurements',
                'rayleigh_wind_result_reference_pressure',
                'rayleigh_wind_result_reference_temperature',
                'rayleigh_wind_result_reference_backscatter_ratio',
                'rayleigh_assimilation_validity_flag',
                'rayleigh_assimilation_background_HLOS',
                'rayleigh_assimilation_background_u_wind_velocity',
                'rayleigh_assimilation_background_v_wind_velocity',
                'rayleigh_assimilation_background_horizontal_wind_velocity',
                'rayleigh_assimilation_background_wind_direction',
                'rayleigh_assimilation_analysis_HLOS',
                'rayleigh_assimilation_analysis_u_wind_velocity',
                'rayleigh_assimilation_analysis_v_wind_velocity',
                'rayleigh_assimilation_analysis_horizontal_wind_velocity',
                'rayleigh_assimilation_analysis_wind_direction',
                'rayleigh_wind_result_albedo_off_nadir',

                'rayleigh_aht_22',
                'rayleigh_aht_23',
                'rayleigh_aht_24',
                'rayleigh_aht_25',
                'rayleigh_aht_26',
                'rayleigh_aht_27',
                'rayleigh_tc_18',
                'rayleigh_tc_19',
                'rayleigh_tc_20',
                'rayleigh_tc_21',
                'rayleigh_tc_23',
                'rayleigh_tc_25',
                'rayleigh_tc_27',
                'rayleigh_tc_29',
                'rayleigh_tc_32',
              ],
           },
          'AUX_MRC_1B': [
            // 2d data
            'altitude',
            'satellite_range',
            'normalised_useful_signal',
            'mie_scattering_ratio',
            // 2d data end
            'lat_of_DEM_intersection',
            'lon_of_DEM_intersection',
            'time_freq_step',
            'frequency_offset',
            'frequency_valid',
            'measurement_response',
            'measurement_response_valid',
            'measurement_error_mie_response',
            'reference_pulse_response',
            'reference_pulse_response_valid',
            'reference_pulse_error_mie_response',
            'num_measurements_usable',
            'num_valid_measurements',
            'num_reference_pulses_usable',
            'num_mie_core_algo_fails_measurements',
            'num_ground_echoes_not_detected_measurements',
            'measurement_mean_sensitivity',
            'measurement_zero_frequency',
            'measurement_error_mie_response_std_dev',
            'measurement_offset_frequency',
            'reference_pulse_mean_sensitivity',
            'reference_pulse_zero_frequency',
            'reference_pulse_error_mie_response_std_dev',
            'reference_pulse_offset_frequency',
            'satisfied_min_valid_freq_steps_per_cal',
            'freq_offset_data_monotonic',
            'num_of_valid_frequency_steps',
            'measurement_mean_sensitivity_valid',
            'measurement_error_response_std_dev_valid',
            'measurement_zero_frequency_response_valid',
            'measurement_data_monotonic',
            'reference_pulse_mean_sensitivity_valid',
            'reference_pulse_error_response_std_dev_valid',
            'reference_pulse_zero_frequency_response_valid',
            'reference_pulse_data_monotonic',
            'mie_core_measurement_FWHM',
            'mie_core_measurement_amplitude',
            'mie_core_measurement_offset',
          ],
          'AUX_RRC_1B': [
            // 2d data
            'altitude',
            'satellite_range', 
            //'geoid_separation_obs',
            //'geoid_separation_freq_step',
            'normalised_useful_signal',
            // end 2d data
            'lat_of_DEM_intersection',
            'lon_of_DEM_intersection',
            'time_freq_step',
            'frequency_offset',
            'frequency_valid',
            'ground_frequency_valid',
            'measurement_response',
            'measurement_response_valid',
            'measurement_error_rayleigh_response',
            'reference_pulse_response',
            'reference_pulse_response_valid',
            'reference_pulse_error_rayleigh_response',
            'ground_measurement_response',
            'ground_measurement_response_valid',
            'ground_measurement_error_rayleigh_response',
            'num_measurements_usable',
            'num_valid_measurements',
            'num_reference_pulses_usable',
            'num_measurements_valid_ground',
            'measurement_mean_sensitivity',
            'measurement_zero_frequency',
            'measurement_error_rayleigh_response_std_dev',
            'measurement_offset_frequency',
            'measurement_error_fit_coefficient',
            'reference_pulse_mean_sensitivity',
            'reference_pulse_zero_frequency',
            'reference_pulse_error_rayleigh_response_std_dev',
            'reference_pulse_offset_frequency',
            'reference_pulse_error_fit_coefficient',
            'ground_measurement_mean_sensitivity',
            'ground_measurement_zero_frequency',
            'ground_measurement_error_rayleigh_response_std_dev',
            'ground_measurement_offset_frequency',
            'ground_measurement_error_fit_coefficient', 
            'satisfied_min_valid_freq_steps_per_cal',
            'satisfied_min_valid_ground_freq_steps_per_cal',
            'freq_offset_data_monotonic',
            'num_of_valid_frequency_steps',
            'num_of_valid_ground_frequency_steps',
            'measurement_mean_sensitivity_valid',
            'measurement_error_response_std_dev_valid',
            'measurement_zero_frequency_response_valid',
            'measurement_data_monotonic',
            'reference_pulse_mean_sensitivity_valid',
            'reference_pulse_error_response_std_dev_valid',
            'reference_pulse_zero_frequency_response_valid',
            'reference_pulse_data_monotonic',
            'ground_measurement_mean_sensitivity_valid',
            'ground_measurement_error_response_std_dev_valid',
            'ground_measurement_zero_frequency_response_valid',
            'ground_measurement_data_monotonic',
            'rayleigh_spectrometer_temperature_9',
            'rayleigh_spectrometer_temperature_10',
            'rayleigh_spectrometer_temperature_11',
            'rayleigh_thermal_hood_temperature_1',
            'rayleigh_thermal_hood_temperature_2',
            'rayleigh_thermal_hood_temperature_3',
            'rayleigh_thermal_hood_temperature_4',
            'rayleigh_optical_baseplate_avg_temperature'
          ],
          'AUX_ISR_1B': [
            'time',
            'freq_mie_USR_closest_to_rayleigh_filter_centre',
            'frequency_rayleigh_filter_centre',
            'num_of_valid_mie_results',
            'num_of_valid_rayleigh_results',
            'laser_frequency_offset',
            'mie_valid',
            'rayleigh_valid',
            'fizeau_transmission',
            'mie_response',
            'rayleigh_channel_A_response',
            'rayleigh_channel_B_response',
            'num_of_raw_reference_pulses',
            'num_of_mie_reference_pulses',
            'num_of_rayleigh_reference_pulses',
            'accumulated_laser_energy_mie',
            'mean_laser_energy_mie',
            'accumulated_laser_energy_rayleigh',
            'mean_laser_energy_rayleigh',
            'laser_energy_drift',
            'downhill_simplex_used',
            'num_of_iterations_mie_core_1',
            'last_peak_difference_mie_core_1',
            'FWHM_mie_core_2',
            'num_of_iterations_mie_core_2',
            'downhill_simplex_quality_flag',
            'rayleigh_spectrometer_temperature_9',
            'rayleigh_spectrometer_temperature_10',
            'rayleigh_spectrometer_temperature_11',
            'rayleigh_thermal_hood_temperature_1',
            'rayleigh_thermal_hood_temperature_2',
            'rayleigh_thermal_hood_temperature_3',
            'rayleigh_thermal_hood_temperature_4',
            'rayleigh_optical_baseplate_avg_temperature'
          ],
          'AUX_ZWC_1B': [
            'time',
            'lat_of_DEM_intersection',
            'lon_of_DEM_intersection',
            'roll_angle',
            'pitch_angle',
            'yaw_angle',
            //'mie_range',
            //'rayleigh_range',
            'ZWC_result_type',
            'mie_ground_correction_velocity',
            'rayleigh_ground_correction_velocity',
            'num_of_mie_ground_bins',
            'mie_avg_ground_echo_bin_thickness',
            'rayleigh_avg_ground_echo_bin_thickness',
            'mie_avg_ground_echo_bin_thickness_above_DEM',
            'rayleigh_avg_ground_echo_bin_thickness_above_DEM',
            'mie_top_ground_bin_obs',
            'rayleigh_top_ground_bin_obs',
            'mie_bottom_ground_bin_obs',
            'rayleigh_bottom_ground_bin_obs',
            // Commented out pseudo 2D data for now
            //'mie_measurements_used',
            //'mie_top_ground_bin_meas',
            //'mie_bottom_ground_bin_meas',
            //'mie_DEM_ground_bin',
            //'mie_height_difference_top_to_DEM_ground_bin',
            //'mie_ground_bin_SNR_meas',
            //'rayleigh_measurements_used',
            //'rayleigh_top_ground_bin_meas',
            //'rayleigh_bottom_ground_bin_meas',
            //'rayleigh_DEM_ground_bin',
            //'rayleigh_height_difference_top_to_DEM_ground_bin',
            //'rayleigh_channel_A_ground_SNR_meas',
            //'rayleigh_channel_B_ground_SNR_meas',
            //'DEM_height'
          ],
          'AUX_MET_12': [
          // 1D params
            'time_off_nadir', 'time_nadir',
            'surface_wind_component_u_off_nadir',
            'surface_wind_component_u_nadir',
            'surface_wind_component_v_off_nadir',
            'surface_wind_component_v_nadir',
            'surface_pressure_off_nadir','surface_pressure_nadir',
            'surface_altitude_off_nadir', 'surface_altitude_nadir',
            'latitude_nadir',
            'longitude_nadir',
            'latitude_off_nadir',
            'longitude_off_nadir',
          //params2DNadir
            'layer_validity_flag_nadir',
            //'layer_pressure_nadir',
            'layer_altitude_nadir',
            'layer_temperature_nadir',
            'layer_wind_component_u_nadir',
            'layer_wind_component_v_nadir',
            'layer_rel_humidity_nadir',
            'layer_spec_humidity_nadir',
            'layer_cloud_cover_nadir',
            'layer_cloud_liquid_water_content_nadir',
            'layer_cloud_ice_water_content_nadir',
          //params2DOffNadir
            'layer_validity_flag_off_nadir',
            //'layer_pressure_off_nadir',
            'layer_altitude_off_nadir',
            'layer_temperature_off_nadir',
            'layer_wind_component_u_off_nadir',
            'layer_wind_component_v_off_nadir',
            'layer_rel_humidity_off_nadir',
            'layer_spec_humidity_off_nadir',
            'layer_cloud_cover_off_nadir',
            'layer_cloud_liquid_water_content_off_nadir',
            'layer_cloud_ice_water_content_off_nadir'
          ],
          'ADAM_albedo': [
            'nadir', 'offnadir'
          ]
        },

        colorscaletypes : [
            'coolwarm', 'rainbow', 'jet', 'diverging_1', 'diverging_2',
            'blackwhite','viridis','inferno', 'hsv','hot','cool',
            'spring', 'summer','autumn','winter','bone','copper','yignbu',
            'greens','yiorrd','bluered', 'portland', 'blackbody','earth',
            'electric','magma','plasma', 'redblue', 'rdylbu'
        ]
    };
});
