/*
credits

brunt of the work by increpare (www.increpare.com)

all open source mit license blah blah

testers:
none, yet

code used

colors used
color values for named colours from arne, mostly (and a couple from a 32-colour palette attributed to him)
http://androidarts.com/palette/16pal.htm

the editor is a slight modification of codemirro (codemirror.net), which is crazy awesome.

for post-launch credits, check out activty on github.com/increpare/PuzzleScript

*/

var compiling = false;
var errorStrings = [];//also stores warning strings
var errorCount=0;//only counts errors

var twiddleable_params = ['background_color','text_color','key_repeat_interval','realtime_interval','again_interval','flickscreen','zoomscreen','smoothscreen','noundo','norestart','message_text_align']; //Please note that you have to add these twiddleable properties in more locations that just here!

function logErrorCacheable(str, lineNumber,urgent) {
    if (compiling||urgent) {
        if (lineNumber === undefined) {
            return logErrorNoLine(str,urgent);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="errorText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString);
            errorStrings.push(errorString);
            errorCount++;
        }
    }
}

function logError(str, lineNumber,urgent) {
    if (compiling||urgent) {
        if (lineNumber === undefined) {
            return logErrorNoLine(str,urgent);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="errorText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
            errorCount++;
        }
    }
}

function logWarning(str, lineNumber,urgent) {
    if (compiling||urgent) {
        if (lineNumber === undefined) {
            return logWarningNoLine(str,urgent);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="warningText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
        }
    }
}

function logWarningNoLine(str,urgent, increaseErrorCount = true) {
    if (compiling||urgent) {
        var errorString = '<span class="warningText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
        }
        if (increaseErrorCount) {
            errorCount++;
        }
    }
}


function logErrorNoLine(str,urgent) {
    if (compiling||urgent) {
        var errorString = '<span class="errorText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
        }
        errorCount++;
    }
}



function logBetaMessage(str,urgent){
    if (compiling||urgent) {
        var errorString = '<span class="betaText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consoleError(errorString);
            errorStrings.push(errorString);
        }
    }  
}

function blankLineHandle(state) {
    if (state.section === 'levels') {
            if (state.levels[state.levels.length - 1].length > 0)
            {
                state.levels.push([]);
            }
    } else if (state.section === 'objects') {
        state.objects_section = 0;
    }
}

//for IE support
if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      // We must check against these specific cases.
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
 
      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}

var codeMirrorFn = function() {
    'use strict';


    function searchStringInArray(str, strArray) {
        for (var j = 0; j < strArray.length; j++) {
            if (strArray[j] === str) { return j; }
        }
        return -1;
    }

    function isMatrixLine(str) {
        for (var j = 0; j < str.length; j++) {
            if (str.charAt(j) !== '.' && str.charAt(j) !== '0') {
                return false;
            }
        }
        return true;
    }

    function checkNameNew(state,candname) {
        if (state.objects[candname] !== undefined) {
            logError('Object "' + candname + '" defined multiple times.', state.lineNumber);
            return 'ERROR';
        }
        for (var i=0;i<state.legend_synonyms.length;i++) {
            var entry = state.legend_synonyms[i];
            if (entry[0]==candname) {
                logError('Name "' + candname + '" already in use.', state.lineNumber);                                        
            }
        }
        for (var i=0;i<state.legend_aggregates.length;i++) {
            var entry = state.legend_aggregates[i];
            if (entry[0]==candname) {
                logError('Name "' + candname + '" already in use.', state.lineNumber);                                        
            }
        }
        for (var i=0;i<state.legend_properties.length;i++) {
            var entry = state.legend_properties[i];
            if (entry[0]==candname) {
                logError('Name "' + candname + '" already in use.', state.lineNumber);                                        
            }
        }
    }
    //var absolutedirs = ['up', 'down', 'right', 'left'];
    //var relativedirs = ['^', 'v', '<', '>', 'moving','stationary','parallel','perpendicular', 'no'];
    //var logicWords = ['all', 'no', 'on', 'some'];
    var sectionNames = ['objects', 'legend', 'sounds', 'collisionlayers', 'rules', 'winconditions', 'levels'];
    var commandwords = ["sfx0","sfx1","sfx2","sfx3","sfx4","sfx5","sfx6","sfx7","sfx8","sfx9","sfx10","cancel","checkpoint","restart","win","message","again","undo",
    "nosave","quit","zoomscreen","flickscreen","smoothscreen","again_interval","realtime_interval","key_repeat_interval",'noundo','norestart','background_color','text_color','goto','message_text_align'];
	
    var reg_commands = /[\p{Z}\s]*(sfx0|sfx1|sfx2|sfx3|Sfx4|sfx5|sfx6|sfx7|sfx8|sfx9|sfx10|cancel|checkpoint|restart|win|message|again|undo|nosave)[\p{Z}\s]*/ui;
    var reg_name = /[\p{L}\p{N}_]+[\p{Z}\s]*/u;///\w*[a-uw-zA-UW-Z0-9_]/;
    var reg_number = /[\d]+/;
    var reg_soundseed = /\d+\b/;
    var reg_spriterow = /[\.0-9]{5}[\p{Z}\s]*/u;
    var reg_sectionNames = /(objects|collisionlayers|legend|sounds|rules|winconditions|levels)(?![\p{L}\p{N}_])[\p{Z}\s]*/ui;
    var reg_equalsrow = /[\=]+/;
    var reg_notcommentstart = /[^\(]+/;
    var reg_csv_separators = /[ \,]*/;
    var reg_soundverbs = /(move|action|create|destroy|cantmove|undo|restart|titlescreen|startgame|cancel|endgame|startlevel|endlevel|showmessage|closemessage|sfx0|sfx1|sfx2|sfx3|sfx4|sfx5|sfx6|sfx7|sfx8|sfx9|sfx10)\b[\p{Z}\s]*/ui;
    var reg_directions = /^(action|up|down|left|right|\^|v|\<|\>|moving|stationary|parallel|perpendicular|horizontal|orthogonal|vertical|no|randomdir|random)$/i;
    var reg_loopmarker = /^(startloop|endloop)$/;
    var reg_ruledirectionindicators = /^(up|down|left|right|horizontal|vertical|orthogonal|late|rigid)$/i;
    var reg_sounddirectionindicators = /[\p{Z}\s]*(up|down|left|right|horizontal|vertical|orthogonal)(?![\p{L}\p{N}_])[\p{Z}\s]*/ui;
    var reg_winconditionquantifiers = /^(all|any|no|some)$/i;
    var reg_keywords = /(checkpoint|objects|collisionlayers|legend|sounds|rules|winconditions|\.\.\.|levels|up|down|left|right|^|\||\[|\]|v|\>|\<|no|horizontal|orthogonal|vertical|any|all|no|some|moving|stationary|parallel|perpendicular|action|nosave)/i;
    var preamble_params = ['title','author','homepage','background_color','text_color','key_repeat_interval','realtime_interval','again_interval','flickscreen','zoomscreen','smoothscreen','color_palette','youtube',
      'sprite_size','level_select_unlocked_ahead','level_select_solve_symbol','custom_font', 'mouse_left','mouse_drag','mouse_right','mouse_rdrag','mouse_up','mouse_rup','local_radius','font_size', 'tween_length', "tween_easing", "tween_snap", "message_text_align", "text_controls", "text_message_continue", "level_select_unlocked_rollover", "sitelock_origin_whitelist", "sitelock_hostname_whitelist"];
    var preamble_keywords = ['run_rules_on_level_start','norepeat_action','require_player_movement','debug','verbose_logging','throttle_movement','noundo','noaction','norestart','scanline',
      'case_sensitive','level_select','continue_is_level_select','level_select_lock','settings', 'runtime_metadata_twiddling', 'runtime_metadata_twiddling_debug', 'smoothscreen_debug','skip_title_screen','nokeyboard'];
    var keyword_array = ['checkpoint','objects', 'collisionlayers', 'legend', 'sounds', 'rules', '...','winconditions', 'levels','|','[',']','up', 'down', 'left', 'right', 'late','rigid', '^','v','\>','\<','no','randomdir','random', 'horizontal', 'vertical','any', 'all', 'no', 'some', 'moving','stationary','parallel','perpendicular','action','nosave','message','global','zoomscreen','flickscreen','smoothscreen','noundo','norestart','background_color','text_color','goto','message_text_align'];

    //  var keywordRegex = new RegExp("\\b(("+cons.join(")|(")+"))$", 'i');

    var fullSpriteMatrix = [
        '00000',
        '00000',
        '00000',
        '00000',
        '00000'
    ];

    return {
        copyState: function(state) {
            var objectsCopy = {};
            for (var i in state.objects) {
              if (state.objects.hasOwnProperty(i)) {
                var o = state.objects[i];
                objectsCopy[i] = {
                  colors: o.colors.concat([]),
                  lineNumber : o.lineNumber,
                  spritematrix: o.spritematrix.concat([])
                }
              }
            }

            var collisionLayersCopy = [];
            for (var i = 0; i < state.collisionLayers.length; i++) {
              collisionLayersCopy.push(state.collisionLayers[i].concat([]));
            }

            var legend_synonymsCopy = [];
            var legend_aggregatesCopy = [];
            var legend_propertiesCopy = [];
            var soundsCopy = [];
            var levelsCopy = [];
            var winConditionsCopy = [];

            for (var i = 0; i < state.legend_synonyms.length; i++) {
              legend_synonymsCopy.push(state.legend_synonyms[i].concat([]));
            }
            for (var i = 0; i < state.legend_aggregates.length; i++) {
              legend_aggregatesCopy.push(state.legend_aggregates[i].concat([]));
            }
            for (var i = 0; i < state.legend_properties.length; i++) {
              legend_propertiesCopy.push(state.legend_properties[i].concat([]));
            }
            for (var i = 0; i < state.sounds.length; i++) {
              soundsCopy.push(state.sounds[i].concat([]));
            }
            for (var i = 0; i < state.levels.length; i++) {
              levelsCopy.push(state.levels[i].concat([]));
            }
            for (var i = 0; i < state.winconditions.length; i++) {
              winConditionsCopy.push(state.winconditions[i].concat([]));
            }

            var original_case_namesCopy = Object.assign({},state.original_case_names);
            
            var nstate = {
              lineNumber: state.lineNumber,

              objects: objectsCopy,
              collisionLayers: collisionLayersCopy,

              commentLevel: state.commentLevel,
              section: state.section,
              visitedSections: state.visitedSections.concat([]),

              objects_candname: state.objects_candname,
              objects_section: state.objects_section,
              objects_spritematrix: state.objects_spritematrix.concat([]),

              tokenIndex: state.tokenIndex,
              currentSection: state.currentSection,

              legend_synonyms: legend_synonymsCopy,
              legend_aggregates: legend_aggregatesCopy,
              legend_properties: legend_propertiesCopy,

              sounds: soundsCopy,

              rules: state.rules.concat([]),

              names: state.names.concat([]),

              winconditions: winConditionsCopy,

              original_case_names : original_case_namesCopy,

              abbrevNames: state.abbrevNames.concat([]),

              metadata : state.metadata.concat([]),

              sprite_size : state.sprite_size,

              case_sensitive : state.case_sensitive,

              levels: levelsCopy,

              STRIDE_OBJ : state.STRIDE_OBJ,
              STRIDE_MOV : state.STRIDE_MOV
            };

            return nstate;        
        },
        blankLine: function(state) {
            blankLineHandle(state)
        },
        token: function(stream, state) {
           	var mixedCase = stream.string;
            var sol = stream.sol();
            if (sol) {
                if(!state.case_sensitive) {
                    stream.string = stream.string.toLowerCase();
                }
                state.tokenIndex=0;
                /*   if (state.lineNumber==undefined) {
                        state.lineNumber=1;
                }
                else {
                    state.lineNumber++;
                }*/

            }

            function registerOriginalCaseName(candname){

                function escapeRegExp(str) {
                  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                }

                var nameFinder;
                if(state.case_sensitive) {
                    nameFinder = new RegExp("\\b"+escapeRegExp(candname)+"\\b");
                } else {
                    nameFinder = new RegExp("\\b"+escapeRegExp(candname)+"\\b","i");
                }
                
                var match = mixedCase.match(nameFinder);
                if (match!=null){
                    state.original_case_names[candname] = match[0];
                }
            }

            stream.eatWhile(/[ \t]/);

            ////////////////////////////////
            // COMMENT PROCESSING BEGIN
            ////////////////////////////////

            //NESTED COMMENTS
            var ch = stream.peek();
            if (ch === '(' && state.tokenIndex !== -4) { // tokenIndex -4 indicates message command
                stream.next();
                state.commentLevel++;
            } else if (ch === ')') {
                stream.next();
                if (state.commentLevel > 0) {
                    state.commentLevel--;
                    if (state.commentLevel === 0) {
                        return 'comment';
                    }
                }
            }
            if (state.commentLevel > 0) {
                while (true) {
                    stream.eatWhile(/[^\(\)]+/);

                    if (stream.eol()) {
                        break;
                    }

                    ch = stream.peek();

                    if (ch === '(') {
                        state.commentLevel++;
                    } else if (ch === ')') {
                        state.commentLevel--;
                    }
                    stream.next();

                    if (state.commentLevel === 0) {
                        break;
                    }
                }
                return 'comment';
            }

            stream.eatWhile(/[ \t]/);

            if (sol && stream.eol()) {
                return blankLineHandle(state);
            }

            //  if (sol)
            {

                //MATCH '==="s AT START OF LINE
                if (sol && stream.match(reg_equalsrow, true)) {
                    return 'EQUALSBIT';
                }

                //MATCH SECTION NAME
                if (sol && stream.match(reg_sectionNames, true)) {
                    state.section = stream.string.slice(0, stream.pos).trim().toLowerCase();
                    if (state.visitedSections.indexOf(state.section) >= 0) {
                        logError('cannot duplicate sections (you tried to duplicate \"' + state.section + '").', state.lineNumber);
                    }
                    state.visitedSections.push(state.section);
                    var sectionIndex = sectionNames.indexOf(state.section);
                    if (sectionIndex == 0) {
                        state.objects_section = 0;
                        if (state.visitedSections.length > 1) {
                            logError('section "' + state.section + '" must be the first section', state.lineNumber);
                        }
                    } else if (state.visitedSections.indexOf(sectionNames[sectionIndex - 1]) == -1) {
                        if (sectionIndex===-1) {
                            logError('no such section as "' + state.section + '".', state.lineNumber);
                        } else {
                            logError('section "' + state.section + '" is out of order, must follow  "' + sectionNames[sectionIndex - 1] + '".', state.lineNumber);                            
                        }
                    }

                    if (state.section === 'sounds') {
                        //populate names from rules
                        for (var n in state.objects) {
                            if (state.objects.hasOwnProperty(n)) {
/*                                if (state.names.indexOf(n)!==-1) {
                                    logError('Object "'+n+'" has been declared to be multiple different things',state.objects[n].lineNumber);
                                }*/
                                state.names.push(n);
                            }
                        }
                        //populate names from legends
                        for (var i = 0; i < state.legend_synonyms.length; i++) {
                            var n = state.legend_synonyms[i][0];
                            /*
                            if (state.names.indexOf(n)!==-1) {
                                logError('Object "'+n+'" has been declared to be multiple different things',state.legend_synonyms[i].lineNumber);
                            }
                            */
                            state.names.push(n);
                        }
                        for (var i = 0; i < state.legend_aggregates.length; i++) {
                            var n = state.legend_aggregates[i][0];
                            /*
                            if (state.names.indexOf(n)!==-1) {
                                logError('Object "'+n+'" has been declared to be multiple different things',state.legend_aggregates[i].lineNumber);
                            }
                            */
                            state.names.push(n);
                        }
                        for (var i = 0; i < state.legend_properties.length; i++) {
                            var n = state.legend_properties[i][0];
                            /*
                            if (state.names.indexOf(n)!==-1) {
                                logError('Object "'+n+'" has been declared to be multiple different things',state.legend_properties[i].lineNumber);
                            }                           
                            */ 
                            state.names.push(n);
                        }
                    }
                    else if (state.section === 'levels') {
                        //populate character abbreviations
                        for (var n in state.objects) {
                            if (state.objects.hasOwnProperty(n) && n.length == 1) {
                                state.abbrevNames.push(n);
                            }
                        }

                        for (var i = 0; i < state.legend_synonyms.length; i++) {
                            if (state.legend_synonyms[i][0].length == 1) {
                                state.abbrevNames.push(state.legend_synonyms[i][0]);
                            }
                        }
                        for (var i = 0; i < state.legend_aggregates.length; i++) {
                            if (state.legend_aggregates[i][0].length == 1) {
                                state.abbrevNames.push(state.legend_aggregates[i][0]);
                            }
                        }
                    }
                    return 'HEADER';
                } else {
                    if (state.section === undefined) {
                        logError('must start with section "OBJECTS"', state.lineNumber);
                    }
                }

                if (stream.eol()) {
                    return null;
                }

                //if color is set, try to set matrix
                //if can't set matrix, try to parse name
                //if color is not set, try to parse color
                switch (state.section) {
                case 'objects':
                    {
						var tryParseName = function() {
                            //LOOK FOR NAME
                            var match_name = sol ? stream.match(reg_name, true) : stream.match(/[^\p{Z}\s\()]+[\p{Z}\s]*/u,true);
                            if (match_name == null) {
                                stream.match(reg_notcommentstart, true);
                                if (stream.pos>0){                                
                                    logWarning('Unknown junk in object section (possibly: the main names for objects have to be words containing only the letters a-z0.9 - if you want to call them something like ",", do it in the legend section).',state.lineNumber);
                                }
                                return 'ERROR';
                            } else {
                                var candname = match_name[0].trim();
                                if (state.objects[candname] !== undefined) {
                                    logError('Object "' + candname + '" defined multiple times.', state.lineNumber);
                                    return 'ERROR';
                                }
                                for (var i=0;i<state.legend_synonyms.length;i++) {
                                	var entry = state.legend_synonyms[i];
                                	if (entry[0]==candname) {
                                    	logError('Name "' + candname + '" already in use.', state.lineNumber);                                		
                                	}
                                }
                                if (keyword_array.indexOf(candname)>=0) {
                                    logWarning('You named an object "' + candname + '", but this is a keyword. Don\'t do that!', state.lineNumber);
                                }

                                if (sol) {
                                	state.objects_candname = candname;
                                    registerOriginalCaseName(candname);
                                	state.objects[state.objects_candname] = {
										                                	lineNumber: state.lineNumber,
										                                	colors: [],
                                                                            spritematrix: [],
                                                                            cloneSprite: ""
										                                };

								} else {
                                    //console.log(candname +" == "+ state.objects_candname);
                                    if (candname.substring(0, 5) == "copy:" && candname.length > 5) {
                                        var cloneName = candname.substring(5);
                                        if (state.objects[state.objects_candname].cloneSprite != "") {
                                            logError("You already assigned a sprite parent for " + cloneName + ", you can't have more than one!", state.lineNumber);
                                            return 'ERROR';
                                        } else if (cloneName == state.objects_candname) {
                                            logError("You attempted to set the sprite parent for " + cloneName + " to " + cloneName + "! Please don't, and keep the recursion in check.", state.lineNumber)
                                            return 'ERROR';
                                        } else {
                                            state.objects[state.objects_candname].cloneSprite = cloneName;
                                            //state.objects_section = 1;
                                            return "SPRITEPARENT";
                                        }
                                    }
									//set up alias
                                    registerOriginalCaseName(candname);
									var synonym = [candname,state.objects_candname];
									synonym.lineNumber = state.lineNumber;
									state.legend_synonyms.push(synonym);
                                }
                                
                                if(state.case_sensitive) {
                                    if((candname.toLowerCase() == "player" && candname != "player") || (candname.toLowerCase() == "background" && candname != "background")) {
                                        // setup aliases for special objects
                                        var synonym = [candname.toLowerCase(),state.objects_candname];
                                        synonym.lineNumber = state.lineNumber;
                                        state.legend_synonyms.push(synonym);
                                    }
                                }

                                state.objects_section = 1;
                                return 'NAME';
                            }
                        };

                        if (sol && state.objects_section == 2) {
                            state.objects_section = 3;
                        }

                        if (sol && state.objects_section == 1) {
                            state.objects_section = 2;
                        }

                        switch (state.objects_section) {
                        case 0:
                        case 1:
                            {
                                state.objects_spritematrix = [];
                                return tryParseName();
                                break;
                            }
                        case 2:
                            {
                                //LOOK FOR COLOR
                                stream.string = stream.string.toLowerCase();
                                state.tokenIndex = 0;

                                var match_color = stream.match(reg_color, true);
                                if (match_color == null) {
                                    var str = stream.match(reg_name, true) || stream.match(reg_notcommentstart, true);
                                    logError('Was looking for color for object ' + state.objects_candname + ', got "' + str + '" instead.', state.lineNumber);
                                    return null;
                                } else {
                                    if (state.objects[state.objects_candname].colors === undefined) {
                                        state.objects[state.objects_candname].colors = [match_color[0].trim()];
                                    } else {
                                        state.objects[state.objects_candname].colors.push(match_color[0].trim());
                                    }

                                    var candcol = match_color[0].trim().toLowerCase();
                                    if (candcol in colorPalettes.arnecolors) {
                                        return 'COLOR COLOR-' + candcol.toUpperCase();
                                    } else if (candcol==="transparent") {
                                        return 'COLOR FADECOLOR';
                                    } else {
                                        return 'MULTICOLOR'+match_color[0];
                                    }
                                }
                                break;
                            }
                        case 3:
                            {
                                var ch = stream.eat(/[.\d]/);
                                var spritematrix = state.objects_spritematrix;
                                if (ch === undefined) {
                                    if (spritematrix.length === 0) {
                                        return tryParseName();
                                    }
                                    logError('Unknown junk in spritematrix for object ' + state.objects_candname + '.', state.lineNumber);
                                    stream.match(reg_notcommentstart, true);
                                    return null;
                                }

                                if (sol) {
                                    spritematrix.push('');
                                }

                                var o = state.objects[state.objects_candname];

                                spritematrix[spritematrix.length - 1] += ch;
                                if (spritematrix[spritematrix.length-1].length>state.sprite_size){
                                    logError('Sprites must be ' + state.sprite_size + ' wide.', state.lineNumber);
                                    stream.match(reg_notcommentstart, true);
                                    return null;
                                }
                                o.spritematrix = state.objects_spritematrix;

                                if (ch!=='.') {
                                    var n = parseInt(ch);
                                    if (n>=o.colors.length) {
                                        logError("Trying to access color number "+n+" from the color palette of sprite " +state.objects_candname+", but there are only "+o.colors.length+" defined in it.",state.lineNumber);
                                        return 'ERROR';
                                    }
                                    if (isNaN(n)) {
                                        logError('Invalid character "' + ch + '" in sprite for ' + state.objects_candname, state.lineNumber);
                                        return 'ERROR';
                                    }
                                    return 'COLOR BOLDCOLOR COLOR-' + o.colors[n].toUpperCase();
                                }
                                return 'COLOR FADECOLOR';
                            }
                        default:
                        	{
                        	window.console.logError("EEK shouldn't get here.");
                        	}
                        }
                        break;
                    }
                case 'sounds':
                    {
                        if (sol) {
                            var ok = true;
                            var splits = reg_notcommentstart.exec(stream.string)[0].split(/[\p{Z}\s]/u).filter(function(v) {return v !== ''});                          
                            splits.push(state.lineNumber);
                            state.sounds.push(splits);
                        }
                        candname = stream.match(reg_soundverbs, true);
                        if (candname!==null) {
                        	return 'SOUNDVERB';
                        }
                        candname = stream.match(reg_sounddirectionindicators,true);
                        if (candname!==null) {
                        	return 'DIRECTION';
                        }
                        candname = stream.match(reg_soundseed, true);
                        if (candname !== null)
                        {
                            state.tokenIndex++;
                            return 'SOUND';
                        } 
                       	candname = stream.match(/[^\[\|\]\p{Z}\s]*/u, true);
                       	if (candname!== null ) {
                       		var m = candname[0].trim();
                       		if (state.names.indexOf(m)>=0) {
                       			return 'NAME';
                       		}
                       	} else {
                            //can we ever get here?
                            candname = stream.match(reg_notcommentstart, true);
                        }
                        logError('unexpected sound token "'+candname+'".' , state.lineNumber);
                        stream.match(reg_notcommentstart, true);
                        return 'ERROR';
                        break;
                    }
                case 'collisionlayers':
                    {
                        if (sol) {
                            //create new collision layer
                            state.collisionLayers.push([]);
                            state.tokenIndex=0;
                        }

                        var match_name = stream.match(reg_name, true);
                        if (match_name === null) {
                            //then strip spaces and commas
                            var prepos=stream.pos;
                            stream.match(reg_csv_separators, true);
                            if (stream.pos==prepos) {
                                logError("error detected - unexpected character " + stream.peek(),state.lineNumber);
                                stream.next();
                            }
                            return null;
                        } else {
                            //have a name: let's see if it's valid
                            var candname = match_name[0].trim();

                            var substitutor = function(n) {
                                if(!state.case_sensitive) {
                                    n = n.toLowerCase();
                                }
                            	if (n in state.objects) {
                            		return [n];
                            	} 


                                for (var i=0;i<state.legend_synonyms.length;i++) {
                                    var a = state.legend_synonyms[i];
                                    if (a[0]===n) {           
                                        return substitutor(a[1]);
                                    }
                                }

                            	for (var i=0;i<state.legend_aggregates.length;i++) {
                            		var a = state.legend_aggregates[i];
                            		if (a[0]===n) {           
                            			logError('"'+n+'" is an aggregate (defined using "and"), and cannot be added to a single layer because its constituent objects must be able to coexist.', state.lineNumber);
                            			return [];         
                            		}
                            	}
                            	for (var i=0;i<state.legend_properties.length;i++) {
                            		var a = state.legend_properties[i];
                            		if (a[0]===n) {  
                                        var result = [];
                                        for (var j=1;j<a.length;j++){
                                            if (a[j]===n){
                                                //error here superfluous, also detected elsewhere (cf 'You can't define object' / #789)
                                                //logError('Error, recursive definition found for '+n+'.', state.lineNumber);                                
                                            } else {
                                                result = result.concat(substitutor(a[j]));
                                            }
                                        }
                            			return result;
                            		}
                            	}
                            	logError('Cannot add "' + candname + '" to a collision layer; it has not been declared.', state.lineNumber);                                
                            	return [];
                            };
                            if (candname.toLowerCase()==='background' ) {
                                if (state.collisionLayers.length>0&&state.collisionLayers[state.collisionLayers.length-1].length>0) {
                                    logError("Background must be in a layer by itself.",state.lineNumber);
                                }
                                state.tokenIndex=1;
                            } else if (state.tokenIndex!==0) {
                                logError("Background must be in a layer by itself.",state.lineNumber);
                            }

                            var ar = substitutor(candname);

                            if (state.collisionLayers.length===0) {
                                logError("no layers found.",state.lineNumber);
                                return 'ERROR';
                            }
                            
                            var foundOthers=[];
                            for (var i=0;i<ar.length;i++){
                                var candname = ar[i];
                                for (var j=0;j<=state.collisionLayers.length-1;j++){
                                    var clj = state.collisionLayers[j];
                                    if (clj.indexOf(candname)>=0){
                                        if (j!=state.collisionLayers.length-1){
                                            foundOthers.push(j);
                                        }
                                    }
                                }
                            }
                            if (foundOthers.length>0){
                                var warningStr = 'Object "'+candname+'" included in multiple collision layers ( layers ';
                                for (var i=0;i<foundOthers.length;i++){
                                    warningStr+="#"+(foundOthers[i]+1)+", ";
                                }
                                warningStr+="#"+state.collisionLayers.length;
                                logWarning(warningStr +' ). You should fix this!',state.lineNumber);                                        
                            }

                            state.collisionLayers[state.collisionLayers.length - 1] = state.collisionLayers[state.collisionLayers.length - 1].concat(ar);
                            if (ar.length>0) {
                            	return 'NAME';                            
                            } else {
                            	return 'ERROR';
                            }
                        }
                        break;
                    }
                case 'legend':
                    {
                        if (sol) {


                            //step 1 : verify format
                            var longer = stream.string.replace('=', ' = ');
                            longer = reg_notcommentstart.exec(longer)[0];

                            var splits = longer.split(/[\p{Z}\s]/u).filter(function(v) {
                                return v !== '';
                            });
                            var ok = true;

                        	if (splits.length>0) {
                                var candname = splits[0];
                                if(!state.case_sensitive) {
                                    candname = candname.toLowerCase();
                                }
                                
	                            if (keyword_array.indexOf(candname)>=0) {
	                                logWarning('You named an object "' + candname + '", but this is a keyword. Don\'t do that!', state.lineNumber);
	                            }
                                if (splits.indexOf(candname, 2)>=2) {
                                    logError("You can't define object " + candname.toUpperCase() + " in terms of itself!", state.lineNumber);
                                    var idx = splits.indexOf(candname, 2);
                                    while (idx >=2){
                                        if (idx>=4){
                                            splits.splice(idx-1, 2);
                                        } else {
                                            splits.splice(idx, 2);
                                        }
                                        idx = splits.indexOf(candname, 2);
                                    }

                                    // ok = false;
                                }
                                checkNameNew(state,candname);
                        	}

                            if (!ok) {
                            } else if (splits.length < 3) {
                                ok = false;
                            } else if (splits[1] !== '=') {
                                ok = false;
                            } /*else if (splits[0].charAt(splits[0].length - 1) == 'v') {
                                logError('names cannot end with the letter "v", because it\'s is used as a direction.', state.lineNumber);
                                stream.match(reg_notcommentstart, true);
                                return 'ERROR';
                            } */ else if (splits.length === 3) {
                                var synonym = [splits[0], splits[2]];
                                if(!state.case_sensitive) {
                                    synonym[1] = synonym[1].toLowerCase();
                                }

                                synonym.lineNumber = state.lineNumber;

                                registerOriginalCaseName(splits[0]);
                                state.legend_synonyms.push(synonym);
                            } else if (splits.length % 2 === 0) {
                                ok = false;
                            } else {
                                var lowertoken = splits[3].toLowerCase();
                                if (lowertoken === 'and') {

	                                var substitutor = function(n) {
                                        if(!state.case_sensitive) {
                                            n = n.toLowerCase();
                                        }
	                                	if (n in state.objects) {
	                                		return [n];
	                                	} 
	                                	for (var i=0;i<state.legend_synonyms.length;i++) {
	                                		var a = state.legend_synonyms[i];
	                                		if (a[0]===n) {   
	                                			return substitutor(a[1]);
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_aggregates.length;i++) {
	                                		var a = state.legend_aggregates[i];
	                                		if (a[0]===n) {                                			
	                                			return [].concat.apply([],a.slice(1).map(substitutor));
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_properties.length;i++) {
	                                		var a = state.legend_properties[i];
	                                		if (a[0]===n) {         
	                                			logError("Cannot define an aggregate (using 'and') in terms of properties (something that uses 'or').", state.lineNumber);
	                                			ok=false;
	                                			return [n];
	                                		}
	                                	}
	                                	return [n];
	                                };

                                    for (var i = 5; i < splits.length; i += 2) {
                                        if (splits[i].toLowerCase() !== 'and') {
                                            ok = false;
                                            break;
                                        }
                                    }
                                    if (ok) {
                                        var newlegend = [splits[0]].concat(substitutor(splits[2])).concat(substitutor(splits[4]));
                                        for (var i = 6; i < splits.length; i += 2) {
                                            newlegend = newlegend.concat(substitutor(splits[i]));
                                        }
                                        newlegend.lineNumber = state.lineNumber;

                                        registerOriginalCaseName(newlegend[0]);
                                        state.legend_aggregates.push(newlegend);
                                    }
                                } else if (lowertoken === 'or') {

	                                var substitutor = function(n) {
                                        if(!state.case_sensitive) {
                                            n = n.toLowerCase();
                                        }

	                                	if (n in state.objects) {
	                                		return [n];
	                                	} 

	                                	for (var i=0;i<state.legend_synonyms.length;i++) {
	                                		var a = state.legend_synonyms[i];
	                                		if (a[0]===n) {   
	                                			return substitutor(a[1]);
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_aggregates.length;i++) {
	                                		var a = state.legend_aggregates[i];
	                                		if (a[0]===n) {           
	                                			logError("Cannot define a property (using 'or') in terms of aggregates (something that uses 'and').", state.lineNumber);
	                                			ok=false;          
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_properties.length;i++) {
	                                		var a = state.legend_properties[i];
	                                		if (a[0]===n) {  
                                                var result = [];
                                                for (var j=1;j<a.length;j++){
                                                    if (a[j]===n){
                                                        //error here superfluous, also detected elsewhere (cf 'You can't define object' / #789)
                                                        //logError('Error, recursive definition found for '+n+'.', state.lineNumber);                                
                                                    } else {
                                                        result = result.concat(substitutor(a[j]));
                                                    }
                                                }
                                                return result;
                                            }
	                                	}
	                                	return [n];
	                                };

                                    for (var i = 5; i < splits.length; i += 2) {
                                        if (splits[i].toLowerCase() !== 'or') {
                                            ok = false;
                                            break;
                                        }
                                    }
                                    if (ok) {
                                        var newlegend = [splits[0]].concat(substitutor(splits[2])).concat(substitutor(splits[4]));
                                        for (var i = 6; i < splits.length; i += 2) {
                                            if(state.case_sensitive) {
                                                newlegend.push(splits[i]);
                                            } else {
                                                newlegend.push(splits[i].toLowerCase());
                                            }
                                        }
                                        newlegend.lineNumber = state.lineNumber;

                                        registerOriginalCaseName(newlegend[0]);
                                        state.legend_properties.push(newlegend);
                                    }
                                } else {
                                    ok = false;
                                }
                            }

                            if (ok === false) {
                                logError('incorrect format of legend - should be one of A = B, A = B or C ( or D ...), A = B and C (and D ...)', state.lineNumber);
                                stream.match(reg_notcommentstart, true);
                                return 'ERROR';
                            }

                            state.tokenIndex = 0;
                        }

                        if (state.tokenIndex === 0) {
                            stream.match(/[^=]*/, true);
                            state.tokenIndex++;
                            return 'NAME';
                        } else if (state.tokenIndex === 1) {
                            stream.next();
                            stream.match(/[\p{Z}\s]*/u, true);
                            state.tokenIndex++;
                            return 'ASSSIGNMENT';
                        } else {
                            var match_name = stream.match(reg_name, true);
                            if (match_name === null) {
                                logError("Something bad's happening in the LEGEND", state.lineNumber);
                                stream.match(reg_notcommentstart, true);
                                return 'ERROR';
                            } else {
                                var candname = match_name[0].trim();

                                if (state.tokenIndex % 2 === 0) {

	                                var wordExists = function(n) {
                                        if(!state.case_sensitive) {
                                            n = n.toLowerCase();
                                        }

	                                	if (n in state.objects) {
	                                		return true;
	                                	} 
	                                	for (var i=0;i<state.legend_aggregates.length;i++) {
	                                		var a = state.legend_aggregates[i];
	                                		if (a[0]===n) {                                			
	                                			return true;
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_properties.length;i++) {
	                                		var a = state.legend_properties[i];
	                                		if (a[0]===n) {  
	                                			return true;
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_synonyms.length;i++) {
	                                		var a = state.legend_synonyms[i];
	                                		if (a[0]===n) {  
	                                			return true;
	                                		}
	                                	}
	                                	return false;
	                                };


                                    if (wordExists(candname)===false) {
                                            logError('Cannot reference "' + candname + '" in the LEGEND section; it has not been defined yet.', state.lineNumber);
                                            state.tokenIndex++;
                                            return 'ERROR';
                                    } else {
                                            state.tokenIndex++;
                                            return 'NAME';
                                    }
                                } else {
                                        state.tokenIndex++;
                                        return 'LOGICWORD';
                                }
                            }
                        }
                        break;
                    }
                case 'rules':
                    {                    	
                        if (sol) {
                            var rule = reg_notcommentstart.exec(stream.string)[0];
                            state.rules.push([rule, state.lineNumber, mixedCase]);
                            state.tokenIndex = 0;//in rules, records whether bracket has been found or not
                        }

                        if (state.tokenIndex===-4) {
                        	stream.skipToEnd();
                        	return 'MESSAGE';
                        }
                        if (stream.match(/[\p{Z}\s]*->[\p{Z}\s]*/u, true)) {
                            return 'ARROW';
                        }
                        if (ch === '[' || ch === '|' || ch === ']' || ch==='+') {
                        	if (ch!=='+') {
                            	state.tokenIndex = 1;
                            }
                            stream.next();
                            stream.match(/[\p{Z}\s]*/u, true);
                            return 'BRACKET';
                        } else {
                            var m = stream.match(/[^\[\|\]\p{Z}\s]*/u, true)[0].trim();

                            if (state.tokenIndex===0&&reg_loopmarker.exec(m)) {
                            	return 'BRACKET';
                            } else if (state.tokenIndex === 0 && reg_ruledirectionindicators.exec(m)) {
                                stream.match(/[\p{Z}\s]*/u, true);
                                return 'DIRECTION';
                            } else if (state.tokenIndex === 1 && reg_directions.exec(m)) {
                                stream.match(/[\p{Z}\s]*/u, true);
                                return 'DIRECTION';
                            } else {
                                if (state.names.indexOf(m) >= 0) {
                                    if (sol) {
                                        logError('Identifiers cannot appear outside of square brackets in rules, only directions can.', state.lineNumber);
                                        return 'ERROR';
                                    } else {
                                        stream.match(/[\p{Z}\s]*/u, true);
                                        return 'NAME';
                                    }
                                }
                                
                                m = m.toLowerCase();
                                if (m==='...') {
                                    return 'DIRECTION';
                                } else if (m==='rigid') {
                                    return 'DIRECTION';
                                } else if (m==='random') {
                                    return 'DIRECTION';
                                } else if (m==='global') {
                                    return 'DIRECTION';
                                }else if (commandwords.indexOf(m)>=0) {
									if (m==='message' || m==='goto' || twiddleable_params.includes(m)) {
										state.tokenIndex=-4;
									}                                	
                                	return 'COMMAND';
                                } else {
                                    logError('Name "' + m + '", referred to in a rule, does not exist.', state.lineNumber);
                                    return 'ERROR';
                                }
                            }
                        }

                        break;
                    }
                case 'winconditions':
                    {
                        if (sol) {
                        	var tokenized = reg_notcommentstart.exec(stream.string);
                        	var splitted = tokenized[0].split(/[\p{Z}\s]/u);
                        	var filtered = splitted.filter(function(v) {return v !== ''});
                            filtered.push(state.lineNumber);
                            
                            state.winconditions.push(filtered);
                            state.tokenIndex = -1;
                        }
                        state.tokenIndex++;

                        var match = stream.match(/[\p{Z}\s]*[\p{L}\p{N}_]+[\p{Z}\s]*/u);
                        if (match === null) {
                                logError('incorrect format of win condition.', state.lineNumber);
                                stream.match(reg_notcommentstart, true);
                                return 'ERROR';

                        } else {
                            var candword = match[0].trim();
                            if (state.tokenIndex === 0) {
                                if (reg_winconditionquantifiers.exec(candword)) {
                                    return 'LOGICWORD';
                                }
                                else {
                                    return 'ERROR';
                                }
                            }
                            else if (state.tokenIndex === 2) {
                                if (candword.toLowerCase() != 'on') {
                                    logError('Expecting the word "ON" but got "'+candword.toUpperCase()+"'.", state.lineNumber);
                                    return 'ERROR';
                                } else {
                                    return 'LOGICWORD';
                                }
                            }
                            else if (state.tokenIndex === 1 || state.tokenIndex === 3) {
                                if (state.names.indexOf(candword)===-1) {
                                    logError('Error in win condition: "' + candword + '" is not a valid object name.', state.lineNumber);
                                    return 'ERROR';
                                } else {
                                    return 'NAME';
                                }
                            }
                        }
                        break;
                    }
                case 'levels':
                    {
                        if (sol)
                        {
                            if (stream.match(/[\p{Z}\s]*message\b[\p{Z}\s]*/ui, true)) {
                                state.tokenIndex = 1;//1/2/3/4 = message/level/section/goto
                                var newdat = ['message', mixedCase.slice(stream.pos).trim(), state.lineNumber, state.currentSection];
                                if (state.levels[state.levels.length - 1].length == 0) {
                                    state.levels.splice(state.levels.length - 1, 0, newdat);
                                } else {
                                    state.levels.push(newdat);
                                }
                                return 'MESSAGE_VERB';//a duplicate of the previous section as a legacy thing for #589 
                            } else if (stream.match(/[\p{Z}\s]*message[\p{Z}\s]*/ui, true)) {//duplicating previous section because of #589
                                logWarning("You probably meant to put a space after 'message' innit.  That's ok, I'll still interpret it as a message, but you probably want to put a space there.",state.lineNumber);
								state.tokenIndex = 1;//1/2/3/4 = message/level/section/goto
                                var newdat = ['message', mixedCase.slice(stream.pos).trim(), state.lineNumber, state.currentSection];
                                if (state.levels[state.levels.length - 1].length == 0) {
                                    state.levels.splice(state.levels.length - 1, 0, newdat);
                                } else {
                                    state.levels.push(newdat);
                                }
                                return 'MESSAGE_VERB';
                            } else if (stream.match(/\s*section\s*/i, true)) {
                                state.tokenIndex = 3;//1/2/3/4 = message/level/section/goto
                                state.currentSection = mixedCase.slice(stream.pos).trim();
                                return 'SECTION_VERB';
                            } else if (stream.match(/\s*goto\s*/i, true)) {
                                state.tokenIndex = 4;//1/2/3/4 = message/level/section/goto
                                var newdat = ['goto', mixedCase.slice(stream.pos).trim(), state.lineNumber, state.currentSection];
                                if (state.levels[state.levels.length - 1].length == 0) {
                                    state.levels.splice(state.levels.length - 1, 0, newdat);
                                } else {
                                    state.levels.push(newdat);
                                }
                                return 'GOTO_VERB';
                            } else {
                                var matches = stream.match(reg_notcommentstart, false);
                                if (matches===null || matches.length===0){
                                    logError("Detected a comment where I was expecting a level. Oh gosh; if this is to do with you using '(' as a character in the legend, please don't do that ^^",state.lineNumber);
                                    state.commentLevel++;
                                    stream.skipToEnd();
                                    return 'comment';
                                } else {
                                    var line = matches[0].trim();
                                    state.tokenIndex = 2;
                                    var lastlevel = state.levels[state.levels.length - 1];
                                    if (lastlevel[0] == '\n') {
                                        state.levels.push([state.lineNumber, state.currentSection, line]);
                                    } else {
                                        if (lastlevel.length==0)
                                        {
                                            lastlevel.push(state.lineNumber);
                                            lastlevel.push(state.currentSection);
                                    }
                                        lastlevel.push(line);

                                        if (lastlevel.length>2)
                                        {
                                            if (line.length!=lastlevel[2].length) {
                                                logWarning("Maps must be rectangular, yo (In a level, the length of each row must be the same).",state.lineNumber);
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            if (state.tokenIndex == 1) {
                                stream.skipToEnd();
                               	return 'MESSAGE';
                            } else if (state.tokenIndex == 3) {
                                stream.skipToEnd();
                                return 'SECTION';
                            } else if (state.tokenIndex == 4) {
                                stream.skipToEnd();
                                return 'GOTO';
                            }
                        }

                        if (state.tokenIndex === 2 && !stream.eol()) {
                            var ch = stream.peek();
                            stream.next();
                            if (state.abbrevNames.indexOf(ch) >= 0) {
                                return 'LEVEL';
                            } else {
                                logError('Key "' + ch + '" not found. Do you need to add it to the legend, or define a new object?', state.lineNumber);
                                return 'ERROR';
                            }
                        }
                        break;
                    }
	                
	                default://if you're in the preamble
	                {
	            		if (sol) {
	            			state.tokenIndex=0;
	            		}
	            		if (state.tokenIndex==0) {
		                    var match = stream.match(/[\p{Z}\s]*[\p{L}\p{N}_]+[\p{Z}\s]*/u);	                    
		                    if (match!==null) {
		                    	var token = match[0].trim();
		                    	if (sol) {
		                    		if (preamble_params.indexOf(token)>=0) {
		                    			
                                        if (token==='youtube' || token==='author' || token==='homepage' || token==='title' || token==='custom_font' || token==='text_controls' || token==='text_message_continue') {
                                            stream.string=mixedCase;
                                        }
                                        
                                        var m2 = stream.match(reg_notcommentstart, false);
                                        
		                    			if(m2!=null) {
                                            if(token=='sprite_size') {
                                                state.sprite_size = parseInt(m2[0].trim(), 10);
                                            } else {
                                                state.metadata.push(token);
                                                state.metadata.push(m2[0].trim());
                                            }
		                    			} else {
		                    				logError('MetaData "'+token+'" needs a value.',state.lineNumber);
		                    			}
		                    			state.tokenIndex=1;
		                    			return 'METADATA';
		                    		} else if (preamble_keywords.indexOf(token)>=0) {
                                        if(token == 'case_sensitive') {
                                            state.case_sensitive = true;
                                            
                                            if (Object.keys(state.metadata).length > 0) {
                                                logWarningNoLine("[PS+] Please make sure that CASE_SENSITIVE is your topmost prelude flag. Sometimes this fixes errors with other prelude flags.", false, false)
                                            }
                                        }

                                        state.metadata.push(token);
		                    			state.metadata.push("true");
		                    			state.tokenIndex=-1;
		                    			return 'METADATA';
		                    		} else  {
		                    			logError('Unrecognised stuff in the prelude.', state.lineNumber);
		                    			return 'ERROR';
		                    		}
		                    	} else if (state.tokenIndex==-1) {
	                   				logError('MetaData "'+token+'" has no parameters.',state.lineNumber);
		                    		return 'ERROR';
		                    	}
		                    	return 'METADATA';
		                    }       
		               	} else {
		               		stream.match(reg_notcommentstart, true);
		               		return "METADATATEXT";
		               	}
	                	break;
	                }
	            }
            };

            if (stream.eol()) {
                return null;
            }
            if (!stream.eol()) {
                stream.next();
                return null;
            }
        },
        startState: function() {
            return {
                /*
                    permanently useful
                */
                objects: {},

                /*
                    for parsing
                */
                lineNumber: 0,

                commentLevel: 0,

                section: '',
                visitedSections: [],

                objects_candname: '',
                objects_section: 0, //whether reading name/color/spritematrix
                objects_spritematrix: [],

                collisionLayers: [],

                tokenIndex: 0,

                currentSection: null,

                legend_synonyms: [],
                legend_aggregates: [],
                legend_properties: [],

                sounds: [],
                rules: [],

                names: [],

                winconditions: [],
                metadata: [],

                sprite_size: 5,

                case_sensitive: false,

                original_case_names: {},

                abbrevNames: [],

                levels: [[]],

                subsection: ''
            };
        }
    };
};

window.CodeMirror.defineMode('puzzle', codeMirrorFn);
