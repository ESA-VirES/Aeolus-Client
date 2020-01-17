
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
            content:'Welcome introduction, arrow key navigation',
            position: 'center-bottom',
            arrowPosition: {},
            onHide: function (anno, $target, $annoElem) {
                if($('#leftSideBar').is(':empty')){
                    Communicator.mediator.trigger('ui:open:layercontrol');
                }
            }
        },
        {
            target: '.layercontrol',
            content: 'This is the layer control panel, you can open it clicking on the <i class="fa fa-fw fa-globe"></i>"Layers" item in the navigation bar',
            position: 'right',
        },
        {
            target: '.input-group.input-group-sm:has(.input-group-addon:has(input:checked))',
            content: 'Each layer has a settings panel to configure what should be shown on the globe. The settings panel can be opend by clicking on this button',
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
            content: 'this is settings panel, granularity, parameter, and styling',
            position: 'left',
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                if(!$('#optionsBar').is(':empty')){
                    showCurrentLayerSettings();
                }
            },
            buttons: [
                AnnoButton.BackButton,
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
            content: 'by clicking data the data configuration panel opens which allows selection of parameters you are interested in as well as other configuration options',
            position: {
                top: '126px',
                left: '290px'
            },
            arrowPosition: 'right',
            onHide: function(anno, $target, $annoElem, returnFromOnShow) {
                if(!$('#viewContent').is(':empty')){
                    Communicator.mediator.trigger('dialog:show:dataconfiguration');
                }
            },
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
            target: '#timeslider',
            content: 'this is timeslider, shows datasets',
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
            content: 'selection area, click and drag or click on product',
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
            content: 'interaction area, click and drag to move time domain',
            position: 'center-top',
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
            content: 'date widget to jump to a specific date',
            position: {
                top: '-5.5em',
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
            content: 'this is the analytics panel, blue names clickable',
            position: 'left',
            buttons: [AnnoButton.BackButton, AnnoButton.NextButton]
        },
        {
            target: '.view2',
            content: 'open axis settings by clicking label',
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
            content: 'open parameter label panel',
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
            content: 'Each label can be clicked to open further settings for the clicked parameter',
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
            content: 'In the parameter settings, many things can be configured, use of colorscale, label change, opacity, ...',
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
            content: 'visualization group selection',
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
                AnnoButton.NextButton
            ]
        },
        {
            target: '#filterDivContainer',
            content: 'this is the filter panel, where you can specify how the data should be filtered',
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
            content: 'this is an interactive filter, you can set filter extent by clicking and dragging on the axis, you can also set the shown data range by clicking the edit button',
            position: 'left',
            buttons: [
                AnnoButton.BackButton,
                AnnoButton.NextButton
            ]
        },
        {
            target: '.view1',
            content: 'this is the globe visualization',
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
            content: 'on the top right are interaction buttons to load kml files, setting an area of interest, save the current globe as image, interaction help information and visualization change between globe, 2D and 2.5D view',
            position: {top:'42px', left:'337px'},
            arrowPosition: 'center-top',
            buttons: [AnnoButton.BackButton,AnnoButton.NextButton]
        },
        {
            target: '.navbar',
            content:'This concludes the tutorial, if you have any questions or issues feel free to contact us at <a href="mailto:feedback@vires.services?subject=[VirES-Aeolus]:&nbsp;">feedback@vires.services</a>',
            position: 'center-bottom',
            arrowPosition: {},
            buttons: [
                AnnoButton.BackButton,
                AnnoButton.EndButton
            ]
        },
    ]
    return {
        steps: tutorialSteps,
        tutorialObject: new Anno(tutorialSteps)
    };
});
