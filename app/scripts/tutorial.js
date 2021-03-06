
// tutorial
define(['communicator', 'globals', 'Anno'], function(Communicator, globals) {

    var createEventStep = function(event){
        return {
            target: '#topBar', content:'',
            onShow: function (anno, $target, $annoElem) {anno.switchToChainNext();},
            onHide: function (anno, $target, $annoElem) {
                Communicator.mediator.trigger('ui:open:layercontrol');
            }
        };
    };
    var showCurrentLayerSettings = function() {
        var prod = globals.products.find(
            function(p){return (p.get('visible') && p.get('name')!=='ADAM_albedo');}
        );
        var activeProd = 'ALD_U_N_1B';
        if(typeof prod !== 'undefined'){
            activeProd = prod.get('download').id;
        }
        Communicator.mediator.trigger("layer:open:settings", activeProd);
    };

    var tutorialSteps = [
        {
            target: '.navbar',
            content:'Welcome to VirES for Aeolus, this tutorial will be shown the first time automatically and can be opened any time by clicking on the <i class="fa fa-fw fa-book"></i> <b>Tutorial</b> button on the navigation bar.</br>We recommend using the right arrow or Enter key on the keyboard to navigate the tutorial. You can exit the tutorial at any time by pressing the "Esc" key or clicking outside the tutorial panel.',
            position: 'center-bottom',
            arrowPosition: {},
            className: 'anno-width-400',
            buttons: [
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        if($('#leftSideBar').is(':empty')){
                            Communicator.mediator.trigger('ui:open:layercontrol');
                        }
                        this.switchToChainNext();
                    }
                }),
            ]
        },
        {
            target: '.layercontrol',
            content: 'This is the <b>Products panel</b>, you can open it clicking on the </br> <i class="fa fa-fw fa-globe"></i> <b>Products</b> item in the navigation bar.</br>Here you can activate the product you are interested in by clicking the checkbox on the left.</br>It is also possible to change the base layer by clicking on the radio buttons on the bottom.',
            position: 'right',
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        if(!$('#leftSideBar').is(':empty')){
                            Communicator.mediator.trigger('ui:open:layercontrol');
                        }
                        this.switchToChainPrev();
                    }
                }),
                AnnoButton.NextButton
            ]
        },
        {
            target: '.input-group.input-group-sm:has(.input-group-addon:has(input:checked))',
            content: 'Each product has a settings panel to configure what should be shown on the globe.</br>The settings panel can be opend by clicking on this button.',
            position: {
                top: '13.5em',
                left: '8.7em'
            },
            onShow: function (anno, $target, $annoElem) {
                $('.layercontrol').css('z-index', 1004);
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('.layercontrol').css('z-index', 600);
            },
            buttons: [
                AnnoButton.BackButton,
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        if($('#optionsBar').is(':empty')){
                            showCurrentLayerSettings();
                        }
                        this.switchToChainNext();
                        if(!$('#leftSideBar').is(':empty')){
                            Communicator.mediator.trigger('ui:open:layercontrol');
                        }
                    }
                }),
            ]
        },
        {
            target: '.optionscontrol',
            content: 'This is <b>Settings panel</b>, it allows selecting the wanted granularity, which parameter should be represented on the globe, and the styling of the representation, such as range, colorscale and opacity.',
            position: 'left',
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                if(!$('#optionsBar').is(':empty')){
                    showCurrentLayerSettings();
                }
            },
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        if($('#leftSideBar').is(':empty')){
                            Communicator.mediator.trigger('ui:open:layercontrol');
                        }
                        this.switchToChainPrev();
                    }
                }),
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        if($('#viewContent').is(':empty')){
                            Communicator.mediator.trigger('dialog:show:dataconfiguration');
                        }
                        this.switchToChainNext();
                    }
                }),
            ]
        },
        {
            target: '#modalDataConfiguration',
            content: 'Which parameters are available for a product can be defined here.</br>This is the <b>data configuration panel</b> which can be opened by clicking on the <i class="fa fa-fw fa-database"></i> <b>Data</b> button in the navigation bar.',
            position: 'left',
            className: 'anno-left-offset',
            arrowPosition: 'right',
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        if($('#optionsBar').is(':empty')){
                            showCurrentLayerSettings();
                        }
                        this.switchToChainPrev();
                    }
                }),
                AnnoButton.NextButton
            ]
        },
        {
            target: '#productList',
            content: 'Here is the product list, the currently selected product will be selected automatically.',
            position: 'left',
            arrowPosition: 'right',
            onShow: function (anno, $target, $annoElem) {
                $('.panel.download').css('z-index', 1005);
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('.panel.download').css('z-index', 600);
            },
            buttons: [
                AnnoButton.BackButton,
                AnnoButton.NextButton
            ]
        },
        {
            target: '#parameterSearchInput',
            content: 'The search field allows filtering the parameter list, the list will update dynamically while typing.',
            position: 'left',
            className: 'anno-search-offset',
            arrowPosition: 'right',
            onShow: function (anno, $target, $annoElem) {
                $('.panel.download').css('z-index', 1005);
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('.panel.download').css('z-index', 600);
            },
            buttons: [
                AnnoButton.BackButton,
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        if(!$('#viewContent').is(':empty')){
                            Communicator.mediator.trigger('dialog:show:dataconfiguration');
                        }
                        this.switchToChainNext();
                    }
                })
            ]
        },
        {
            target: '#timeslider',
            content: 'This is the <b>timebar</b>, it shows with colored rectangles (or points) when datasets are available for the selected Product.</br>With the mouse wheel it is possible to zoom in or out.',
            position: 'center-top',
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        if($('#viewContent').is(':empty')){
                            Communicator.mediator.trigger('dialog:show:dataconfiguration');
                        }
                        this.switchToChainPrev();
                    }
                }),
                AnnoButton.NextButton
            ]
        },
        {
            target: '#timeslider',
            content: 'This is the selection area, it is possible to select a time interval by clicking and dragging an extent.</br>It is also possible to click on product to automatically select its time extent.',
            position: 'center-top',
            onShow: function (anno, $target, $annoElem) {
                $('#timesliderInteractionArea').css('display', 'block');
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('#timesliderInteractionArea').css('display', 'none');
            },
            buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
        },
        {
            target: '#timeslider',
            content: 'This is the interaction area, by clicking and dragging this area it is possible to move time domain.',
            position: 'center-top',
            className: 'anno-height-offset-small',
            onShow: function (anno, $target, $annoElem) {
                $('#timesliderSelectionArea').css('display', 'block');
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('#timesliderSelectionArea').css('display', 'none');
            },
            buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
        },
        {
            target: '#calendarselection',
            content: 'This is the <b>date widget</b> which allows easily jump to a specific date.',
            position: {
                top: '-6.5em',
                right: '3em'
            },
            arrowPosition: 'center-right',
            onShow: function (anno, $target, $annoElem) {
                $('.anno-arrow').css('top', '73%');
            },
            buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
        },
        {
            target: '.view2',
            content: 'This is the <b>analytics panel</b>, it allows dynamic analysis of the data.</br>Each plot is interactive, can be zoomed (mouse wheel) and panned (click and drag).</br>By clicking a point or bin in the plot further information will be shown.</br>Each plot can be further configured. This will be explained in the next steps.</br>As a general rule, labels in blue can be interacted with.',
            position: 'left',
            buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
        },
        {
            target: '.view2',
            content: 'This panel are the axis settings, they can be opened for each axis by clicking the axis label.</br>It allows adding/removing parameters to be shown on that axis, changing the shown axis label as well as showing a logarithmic scale or switching between ascending/descending order.',
            position: 'left',
            onShow: function (anno, $target, $annoElem) {
                var pos = $('.yAxis.axisLabel:first').offset();
                $annoElem.css('top', pos.top-30);
                $annoElem.css('left', pos.left-300);
                if( $('#ySettings0').css('display') === 'none'){
                    $('#ySettings0').css('display', 'block');
                }
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                if( $('#ySettings0').css('display') === 'block'){
                    $('#ySettings0').css('display', 'none');
                }
            },
            buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
        },
        {
            target: '.view2',
            content: 'The labels for the currently displayed parameters can be shown by clicking on the cog icon.',
            position: {top:'0px', left:'0px'},
            onShow: function (anno, $target, $annoElem) {
                var pos = $('#cogIcon0').offset();
                $annoElem.css('top', pos.top-25);
                $annoElem.css('left', pos.left-130);
            },
            buttons: [
                AnnoButton.BackButton,
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        if($('.parameterInfo:first').css('visibility') === 'hidden'){
                            $('#cogIcon0').click();
                        }
                        this.switchToChainNext();
                    }
                })
            ]
        },
        {
            target: '.parameterInfo:first',
            content: 'Each label can be clicked to open further settings for each of the available parameters.',
            position: 'center-bottom',
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        if($('#parameterSettings').css('display') === 'block'){
                            $('.parameterInfo:first > div > div').click();
                        }
                        if($('.parameterInfo:first').css('visibility') === 'visible'){
                            $('#cogIcon0').click();
                        }
                        this.switchToChainPrev();
                    }
                }),
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        if($('#parameterSettings').css('display') === 'none'){
                            $('.parameterInfo:first > div > div').click();
                        }
                        this.switchToChainNext();
                    }
                })
            ]
        },
        {
            target: '#parameterSettings',
            content: 'In the parameter settings, many things can be configured, use of additional parameter as colorscale, label change, opacity, ...',
            position: 'center-bottom',
            buttons: [
                AnnoButton.BackButton,
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        if($('#parameterSettings').css('display') === 'block'){
                            $('.parameterInfo:first > div > div').click();
                        }
                        if($('.parameterInfo:first').css('visibility') === 'visible'){
                            $('#cogIcon0').click();
                        }
                        this.switchToChainNext();
                    }
                })
            ]
        },
        {
            target: '.groupSelect:first',
            content: 'The Aeolus data contains not equally sized parameters as part of the same product based on different groups, for example for mie or rayleigh.</br>To allow easy interaction it is possible to switch between these groups using this dropdown.',
            position: 'center-bottom',
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        if($('.parameterInfo:first').css('visibility') === 'hidden'){
                            $('#cogIcon0').click();
                        }
                        if($('#parameterSettings').css('display') === 'none'){
                            $('.parameterInfo:first > div > div').click();
                        }
                        this.switchToChainPrev();
                    }
                }),
                //'<div id="minimizeFilters" class="visible minimized"><i class="fa fa-chevron-circle-up" aria-hidden="true"></i></div>'
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        // Check that filters panel is open
                        if($('#minimizeFilters').hasClass('minimized')){
                            Communicator.mediator.trigger('analytics:toggle:filters');
                        }
                        this.switchToChainNext();
                    }
                })
            ]
        },
        {
            target: '#filterDivContainer',
            content: 'Below the plots is the <b>filters panel</b>, which allow managing filters interactively for all parameters.</br>It is possible to add and remove the shown filter panels using the "Add filter" button or the cross on the each of the filters.',
            position: 'center-top',
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        if($('.parameterInfo:first').css('visibility') === 'hidden'){
                            $('#cogIcon0').click();
                        }
                        if($('#parameterSettings').css('display') === 'none'){
                            $('.parameterInfo:first > div > div').click();
                        }
                        this.switchToChainPrev();
                    }
                }),
                AnnoButton.NextButton
            ]
        },
        {
            target: '.filterContainer:first',
            content: 'This is one of the filters for a linear parameter, it shows a histogram to visualize how the data is distributed.</br>You can set a filter extent by clicking and dragging on the axis.</br>You can also set the shown data range by clicking the edit button <div style="position:relative;left:-3px;" class="pencilIcon"></div>',
            position: 'right',
            buttons: [
                AnnoButton.BackButton,
                AnnoButton.NextButton
            ]
        },
        {
            target: '.view1',
            content: 'This is the interactive 3D <b>globe visualization</b>.',
            position: 'right',
            onShow: function (anno, $target, $annoElem) {
                if(!$('#leftSideBar').is(':empty')){
                    Communicator.mediator.trigger('ui:open:layercontrol');
                }
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
            },
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        if($('.parameterInfo:first').css('visibility') === 'hidden'){
                            $('#cogIcon0').click();
                        }
                        if($('#parameterSettings').css('display') === 'none'){
                            $('.parameterInfo:first > div > div').click();
                        }
                        this.switchToChainPrev();
                    }
                }),
                AnnoButton.NextButton
            ]
        },
        {
            target: '.view1',
            content: 'On the top right are interaction buttons to load kml files, setting an area of interest, save the current globe as image, interaction help information and visualization change between globe, 2D and 2.5D view.',
            position: 'right',
            buttons: [
                AnnoButton.BackButton,
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        if($('#viewContent').is(':empty')){
                            Communicator.mediator.trigger('dialog:open:download:filter', true);
                        }
                        this.switchToChainNext();
                    }
                })
            ]
        },
        {
            target: '.panel.download',
            content: 'If you want to also download the selected data you can click on the <i class="fa fa-fw fa-download"></i> <b>Download</b> button in the navigation bar which opens the <b>download panel</b>.',
            position: 'left',
            className: 'anno-left-offset',
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        Communicator.mediator.trigger('dialog:open:download:filter', false);
                        this.switchToChainPrev();
                    }
                }),
                AnnoButton.NextButton
            ]
        },
        {
            target: '#filterContainer',
            content: 'All the currently applied filters are shown here.',
            position: 'bottom',
            onShow: function (anno, $target, $annoElem) {
                $('.panel.download').css('z-index', 1005);
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('.panel.download').css('z-index', 600);
            },
            buttons: [
                AnnoButton.BackButton,
                AnnoButton.NextButton
            ]
        },
        {
            target: '#btn-start-download',
            content: 'Once happy with the selection you can click here, this will start the process on the server.',
            position: 'top',
            onShow: function (anno, $target, $annoElem) {
                $('.panel.download').css('z-index', 1005);
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('.panel.download').css('z-index', 600);
            },
            buttons: [
                AnnoButton.BackButton,
                AnnoButton.NextButton
            ]
        },
        {
            target: '#download_processes',
            content: 'The process status is then shown here, once a process is finished the <b>Download</b> button will be enabled where you can download the results.',
            position: 'bottom',
            onShow: function (anno, $target, $annoElem) {
                $('.panel.download').css('z-index', 1005);
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('.panel.download').css('z-index', 600);
            },
            buttons: [
                AnnoButton.BackButton,
                AnnoButton.NextButton
            ]
        },
        {
            target: '#containerFurtherOptions',
            content: 'Further options for the download are to add or remove the data set descriptors or to only download specific parameters.',
            position: 'left',
            className: 'anno-height-offset',
            onShow: function (anno, $target, $annoElem) {
                $('.panel.download').css('z-index', 1005);
                $('#containerFurtherOptions:not(.anno-placeholder)').hide();
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('.panel.download').css('z-index', 600);
                $('#containerFurtherOptions:not(.anno-placeholder)').show();
            },
            buttons: [
                AnnoButton.BackButton,
                AnnoButton.NextButton
            ]
        },
        {
            target: '#origDownload',
            content: 'If you are interested in the original datasets instead of the converted netCDF files you can use this button to create a package containing the original datasets used.',
            position: 'top',
            onShow: function (anno, $target, $annoElem) {
                $('.panel.download').css('z-index', 1005);
            },
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                $('.panel.download').css('z-index', 600);
            },
            buttons: [
                AnnoButton.BackButton,
                new AnnoButton({
                    text: 'Next',
                    click: function(){
                        Communicator.mediator.trigger('dialog:open:download:filter', false);
                        this.switchToChainNext();
                    }
                })
            ]
        },
        {
            target: 'ul.navbar-nav li.dropdown:eq(1)',
            content: 'Under the workspace navigation panel button it is possible to save the current status as file (that can be shared) by using the "Export" function, to load such a file with the "Load" function and to completely reset the configuration to default by using the "Reset" function.',
            position: 'center-bottom',
            buttons: [
                new AnnoButton({
                    text: 'Back', className: 'anno-btn-low-importance',
                    click: function(){
                        Communicator.mediator.trigger('dialog:open:download:filter', true);
                        this.switchToChainPrev();
                    }
                }),
                AnnoButton.NextButton
            ]
        },
        {
            target: 'ul.navbar-nav li:eq(3)',
            content: 'With the upload button an upload panel is opened where it is possible to upload one local file to be visualized in the web client.<br/>Currently the file has to have the same format and structure as the original Aeolus files to be supported.',
            position: 'center-bottom',
            buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
        },
        {
            target: 'ul.navbar-nav li:eq(5)',
            content: 'With the Views button it is possible to switch between three view types, showing only the globe, showing only the analytics panel, or showing both in split screen (default).',
            position: 'center-bottom',
            buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
        },
        {
            target: '.navbar',
            content:'This concludes the tutorial, if you have any questions or issues feel free to contact us at <a href="mailto:feedback@vires.services?subject=[VirES-Aeolus]:&nbsp;">feedback@vires.services</a>.',
            position: 'center-bottom',
            arrowPosition: {},
            buttons: [AnnoButton.BackButton, AnnoButton.EndButton]
        },
    ];

    var annoTutorial = new Anno(tutorialSteps);

    var resetAndRunTutorial = function(){

        var closeAllPanels = function(){
            Communicator.mediator.trigger('dialog:open:download:filter', false);
            if(!$('#viewContent').is(':empty')){
                Communicator.mediator.trigger('dialog:show:dataconfiguration');
            }
            if(!$('#leftSideBar').is(':empty')){
                Communicator.mediator.trigger('ui:open:layercontrol');
            }
            if(!$('#optionsBar').is(':empty')){
                showCurrentLayerSettings();
            }

            // Reset view to split screen
            if($('.view2').hasClass('disabled')){
                Communicator.mediator.trigger('layout:switch:splitview');
            }
        }

        var prod = globals.products.find(
            function(p){return (p.get('visible') && p.get('name')!=='ADAM_albedo');}
        );
        var activeProd = '';
        if(typeof prod !== 'undefined'){
            activeProd = prod.get('download').id;
        }

        if(activeProd === 'ALD_U_N_2B' && prod.get('granularity')==='wind-accumulation-result'){
            var data = globals.swarm.get('data');
            if(!$.isEmptyObject(data) && !(Array.isArray(data) && data.length===0)){
                closeAllPanels();
                annoTutorial.show();
                localStorage.setItem('tutorialShown', true);
            } else {
                // Data is empty need to select another time interval
                localStorage.removeItem('tutorialShown');
                var opt = {};
                opt.start = new Date('2020-05-06T02:42:56.746Z');
                opt.end = new Date('2020-05-06T03:30:27.965Z');
                /*opt.start = new Date('2019-10-31T14:29:03.264Z');
                opt.end = new Date('2019-10-31T15:06:57.127Z');*/
                
                
                Communicator.mediator.trigger("date:selection:change", opt);
                
                opt.start.setDate(opt.start.getDate() - 1);
                opt.end.setDate(opt.end.getDate() + 1);
                Communicator.mediator.trigger(
                    'timeslider:update:domain', opt
                );
                globals.tutorialShouldLoad = true;
            }
        } else {
            // IF L2B is not selected we switch to L2B
            var product = globals.products.find(
                function(p){return p.get('download').id === 'ALD_U_N_2B';}
            );
            if(product.get('granularity')!=='wind-accumulation-result'){
                product.set('granularity', 'wind-accumulation-result');
            }
            product.set('visible', true);
            if(product){
                // Deactivate all other products
                globals.products.each(function(p) {
                    if(p.get('download').id !== product.get('download').id &&
                       p.get('visible') && p.get('views')[0].protocol !== 'WMS'){
                        p.set('visible', false);
                        Communicator.mediator.trigger('map:layer:change', { 
                            name: p.get('name'), isBaseLayer: false, visible: false 
                        });
                    }
                   
                });
            }
            localStorage.removeItem('tutorialShown');
            Communicator.mediator.trigger('map:layer:change', { 
                name: product.get('name'), isBaseLayer: false, visible: true 
            });

        }

        function escapeTutorial(e){
            if (e.key === 'Escape') {
                // Go through all anno elements and see if any is not empty
                var currAnno = annoTutorial;
                while(currAnno._chainNext){
                    if(currAnno._annoElem !== null){
                        currAnno.hide();
                        $(document).off('keyup');
                        break;
                    } else {
                        currAnno = currAnno._chainNext;
                    }
                }
            }
        };
        $(document).off('keyup');
        $(document).on('keyup', escapeTutorial);

        // TODO
        // Reset view
        // After finish tutorial go to "current" date?
    };

    return {
        steps: tutorialSteps,
        tutorialObject: annoTutorial,
        resetAndRunTutorial: resetAndRunTutorial
    };
});
