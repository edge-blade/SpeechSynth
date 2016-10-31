////////////////////////////////////
//
// SpeechSynth
// A simple wrapper around HTML5 SpeechSynthesis API for modern browsers.
// MIT-style license. Copyright 2016 Nick A. Beers
//
////////////////////////////////////
(function (window, document, undefined) {
	"use strict";
	var closedClass = ' closed';
    
	var SpeechSynthProto,
        SpeechSynth = function (options) {
            //Unchanging settings and defaults
            // Default values for some properties
            this.speechSynth = window.speechSynthesis;

            // Setup plugin specific options
            this.isVisible = false; // for toggle control
            this.voiceSelector = {};
            this.playButton = {};
            this.pauseButton = {};
            this.events = [];

            // Toggle element
            this.popoutElement = {};
            this.toggleButton = {};

            // Event types
            this.clickEvt = (this.usesTouch) ? "touchstart" : "mousedown";

            // set options and create element
            this.setOptions(options);
            this.init();
	    };

	//////////////////////////////////////////////////////////////////////////////////

    (SpeechSynthProto = SpeechSynth.prototype).nothing = function () {};

	//////////////////////////////////////////////////////////////////////////////////

    SpeechSynthProto.setOptions = function (options) {
        var hasOwnProp = Object.prototype.hasOwnProperty,
            option;

        // setup defaults for all options that we want users to update
        this.options = {
            controlLocation: "right",
            defaultLanguageText: 'Google US English',
            volume: 1,
            rate: 1,
            pitch: 1,
        };

        // set user specified options
        if (options) {
            for (option in this.options) {
				if (hasOwnProp.call(this.options, option) && options[option] !== undefined) {
					this.options[option] = options[option];
				}
			}
        }
    };

    //////////////////////////////////////////////////////////////////////////////////

    SpeechSynthProto.speechSynthSpeak = function (text) {
        if (text) {
            var voices = this.speechSynth.getVoices();
            
            var utterThis = new SpeechSynthesisUtterance(text);
            var selectedOption = this.voiceSelector.selectedOptions[0].getAttribute('data-name');
            for (var i = 0; i < voices.length; i++) {
                if (voices[i].name === selectedOption) {
                    utterThis.voice = voices[i];
                }
            }

            utterThis.volume = this.options.volume;
            utterThis.rate = this.options.rate;
            utterThis.pitch = this.options.pitch;

            this.speechSynth.speak(utterThis);
        }
    }
    
	//////////////////////////////////////////////////////////////////////////////////
    
    SpeechSynthProto.generateAudioControls = function () {
        // TODO: Create HTML components and add them into the DOM
        // Allow user to customize classes or provide their own HTML for the controls
        // and specify buttons for each action
        
        // controlLocation: top, bottom, left, right
        // Create container
        this.popoutElement = document.createElement('div');
        this.popoutElement.className = 'speechSynth-container ' + this.options.controlLocation.toLowerCase() + closedClass;
        this.popoutElement.id = 'speechSynth-container';
        
        this.toggleButton = document.createElement('div');
        this.toggleButton.className = 'speechSynth-toggle';
        this.toggleButton.id = 'speechSynth-toggle';
        this.popoutElement.appendChild(this.toggleButton);

        // create other controls
        var controlsContainer = document.createElement('div');
        controlsContainer.className = 'speechSynth-controls';

        // Label
        var selectLabel = CreateNewDomElement('label', 'speechSynth-label', 'speechSynth-label');
        selectLabel.text = 'Language';
        controlsContainer.appendChild(selectLabel);

        // Select
        this.voiceSelector = CreateNewDomElement('select', 'speechSynth-select', 'speechSynth-select');
        controlsContainer.appendChild(this.voiceSelector);
        
        // Play button
        this.playButton = CreateNewDomElement('button', 'speechsynth-play', 'speechsynth-play');
        this.playButton.textContent = 'Play';
        controlsContainer.appendChild(this.playButton);

        // Pause button
        this.pauseButton = CreateNewDomElement('button', 'speechsynth-pause', 'speechsynth-pause');
        this.pauseButton.textContent = 'Pause';
        controlsContainer.appendChild(this.pauseButton);
        
        // append controls to container
        this.popoutElement.appendChild(controlsContainer);
        // Add controls to the page
        document.body.appendChild(this.popoutElement);
    };
    
	//////////////////////////////////////////////////////////////////////////////////
    
    SpeechSynthProto.populateVoiceList = function (self) {
        var voices = self.speechSynth.getVoices();

        for (var i = 0; i < voices.length; i++) {
            var option = document.createElement('option');
            option.textContent = voices[i].name + ' (' + voices[i].lang + ')';

            if (voices[i].default) {
                option.textContent += ' -- DEFAULT';
            }

            option.setAttribute('data-lang', voices[i].lang);
            option.setAttribute('data-name', voices[i].name);
            self.voiceSelector.appendChild(option);
        }
        
        // default needs work to run on all browsers properly
        for (var i = 0; i < this.voiceSelector.options.length; i++) {
            if (self.voiceSelector.options[i].getAttribute('data-name') == self.options.defaultLanguageText) {
                self.voiceSelector.selectedIndex = i;
                break;
            }
        }
    };

	//////////////////////////////////////////////////////////////////////////////////
    
    SpeechSynthProto.addEvents = function ( ) {
        var self = this;
        // Add the play button
        self.events.push(self.playButton.addEventListener(self.clickEvt, function(event) {
            event.preventDefault();

            var text = self.getSelectionText();
            self.speechSynthSpeak(text);
        }));
        // Add the stop button
        self.events.push(self.pauseButton.addEventListener(self.clickEvt, function(event){
            event.preventDefault();

            if(self.speechSynth.speaking){
                self.speechSynth.cancel();
            }
        }));
        
        self.toggleButton.addEventListener(self.clickEvt, function (event) {
            self.isVisible = !self.isVisible;
            if (!self.isVisible) {
                // Hide the menu
                self.popoutElement.className += closedClass;
            } else {
                // Show the menu
                self.popoutElement.className = self.popoutElement.className.replace(closedClass, '');
            }
        });
        
        // setup voice list listener
        if (self.speechSynth.onvoiceschanged !== undefined) {
            // Needed anonymous function to allow callback to another function with parameters
            self.speechSynth.onvoiceschanged = function() { self.populateVoiceList(self); };
        }
    };

	//////////////////////////////////////////////////////////////////////////////////
	
    SpeechSynthProto.init = function ( ) {
		// Set up events and load in everything
        this.generateAudioControls();
		this.addEvents();
	};
    
    //////////////////////////////////////////////////////////////////////////////////

    SpeechSynthProto.getSelectionText = function ( ) {
        var text = ""
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type == "Text") {
            text = document.selection.createRange().text;
        }
        return text;
    }
   
	//////////////////////////////////////////////////////////////////////////////////
    //
    //                                 Utility
    //
	//////////////////////////////////////////////////////////////////////////////////

    function CreateNewDomElement(elementName, idName, className){
        if(!elementName){
            elementName = 'div'; // Default to div
        }
        var element = document.createElement(elementName);
        if (idName) {
            element.id = idName;
        }
        if (className) { 
            element.className = className;
        }

        return element;
    } 
        
    // Expose class to user
    window.SpeechSynth = SpeechSynth;

})(this, this.document);
