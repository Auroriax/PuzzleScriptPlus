// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE
(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
        "use strict";

        var WORD = /[\w$#]+/,
            RANGE = 500;

        var PRELUDE_COMMAND_WORDS = [
            "METADATA",//tag
            ["author", "Gill Bloggs", "Your name goes here. This will appear in the title screen of the game."],
            ["color_palette", "arne", "By default, when you use colour names, they are pulled from a variation of <a href='http://androidarts.com/palette/16pal.htm'>Arne</a>'s 16-Colour palette. However, there are other palettes to choose from: <p> <ul> <li>1 - mastersystem </li> <li>2 - gameboycolour </li> <li>3 - amiga </li> <li>4 - arnecolors </li> <li>5 - famicom </li> <li>6 - atari </li> <li>7 - pastel </li> <li>8 - ega </li> <li>9 - amstrad </li> <li>10 - proteus_mellow </li> <li>11 - proteus_rich </li> <li>12 - proteus_night </li> <li>13 - c64 </li> <li>14 - whitingjp </li> </ul> <p> (you can also refer to them by their numerical index)"],
            ["again_interval", "0.1", "The amount of time it takes an 'again' event to trigger."],
            ["background_color", "blue", "Can accept a color name or hex code (in the form #412bbc). Controls the background color of title/message screens, as well as the background color of the website. Text_color is its sibling."],
            ["debug", "", "This outputs the compiled instructions whenever you build your file."],
            ["flickscreen", "8x5", "Setting flickscreen divides each level into WxH grids, and zooms the camera in so that the player can only see one at a time"],
            ["homepage", "www.puzzlescript.net", "A link to your homepage!"],
            ["key_repeat_interval", "0.1", "When you hold down a key, how long is the delay between repeated presses getting sent to the game (in seconds)?"],
            ["noaction", "", "Hides the action key (X) instruction from the title screen, and does not respond when the player pressed it (outside of menus and cutscenes and the like)."],
            ["norepeat_action", "", "The action button will only respond to individual presses, and not auto-trigger when held down."],
            ["noundo", "", "Disables the undo key (Z)"],
            ["norestart", "", "Disables the restart key (R)"],
            ["realtime_interval", "", "The number indicates how long each realtime frame should be."],
            ["require_player_movement", "", "If the player doesn't move, cancel the whole move."],
            ["run_rules_on_level_start", "", "Applies the rules once on level-load, before the player has moved"],
            ["scanline", "", "Applies a scanline visual effect"],
            ["text_color", "orange", "Can accept a color name or hex code (in the form #412bbc). Controls the font color of title/message screens, as well as the font color in the website. Background_color is its sibling."],
            ["title", "My Amazing Puzzle Game", "The name of your game. Appears on the title screen."],
            ["throttle_movement", "", "For use in conjunction with realtime_interval - this stops you from moving crazy fast - repeated keypresses of the same movement direction will not increase your speed. This doesn't apply to the action button."],
            ["verbose_logging", "", "As you play the game, spits out information about all rules applied as you play, and also allows visual inspection of what exactly the rules do by hovering over them with your mouse (or tapping them on touchscreen)."],
            ["zoomscreen", "WxH", "Zooms the camera in to a WxH section of the map around the player, centered on the player."],
            ["mouse_left","lmb","Sets the object to place when pressing left mouse button."],
            ["mouse_drag","drag","Sets the object to place when moving the mouse while left mouse button is held."],
            ["mouse_up","lmbup","Sets the object to place when left mouse button is released."],
            ["mouse_right","rmb","Sets the object to place when pressing right mouse button."],
            ["mouse_rdrag","rdrag","Sets the object to place when moving the mouse while right mouse button is held."],
            ["mouse_rup","rmbup","Sets the object to place when right mouse button is released."],
            ["nokeyboard","","Allows the game to run without a Player object and movement."],
            ["smoothscreen", "[flick] WxH [IxJ] [S]", "Zooms the camera in to a WxH section of the map around the player and smoothly scrolls to follow the player. The optional argument IxJ (default: 1x1) specifies a boundary in which the player can move without moving the camera. The optional speed argument (default: 0.125) specifies how far the camera will move towards the player each frame as a fraction of the distance to the player. The optional flick keyword makes the camera move like flickscreen."],
            ["smoothscreen_debug", "", "Draw smoothscreen debug information."],
            ["sprite_size", "5", "Size of sprites."],
            ["case_sensitive", "", "Makes object names and legend case sensitive."],
            ["level_select", "", "Show level selection option on main screen (use with sections in levels)."],
            ["continue_is_level_select", "", "Don't show separate option on main menu for level selection."],
            ["level_select_lock", "", "Level selection will have unsolved levels locked."],
            ["level_select_unlocked_ahead", "1", "Level selection will have N number of unsolved levels unlocked after last solved level."],
            ["level_select_solve_symbol", "x", "Symbol that will be used for solved levels in level select menu"],
            ["custom_font", "", "Custom font to use for text rendering."],
            ["font_size", "", "Controls the size of the custom_font"], 
            ["local_radius", "X", "Radius around the player to execute rules in"],
            ["runtime_metadata_twiddling", "", "Allows you to change some prelude flags during runtime using rules"],
            ["runtime_metadata_twiddling_debug", "", "Prints in the console each time the metadata is twiddled"],
            ["skip_title_screen", "", "Will skip the title screen when the game initializes, booting straight into the level or level select"],
            ["tween_length", "0.05", "Will animate objects that are moving using LEFT, RIGHT, UP, and DOWN. Duration in seconds."],
            ["tween_easing", "linear", "How movement animations should lerp when using TWEEN_LENGTH, e.g. 'easeInQuad', 'easeOutCubic', etc."],
            ["tween_snap", "5", "With how much granularity to snap to the underlying sprite grid. Uses the SPRITE_SIZE by default."],
            ["message_text_align", "center", "Towards which side message text should align. left, center (default), or right."],
            ["text_controls", "arrow keys to move \\nX to action", "Overwrite keyboard/mouse control description on the title screen."],
            ["text_message_continue", "[x] or [space] to continue!", "Overwrite the text below messages that normally says 'X to continue'."],
            ["level_select_unlocked_rollover", "3", "An alternative to LEVEL_SELECT_UNLOCKED_AHEAD, which applies a strict maximum number of unsolved levels."],
            ["sitelock_origin_whitelist", "https://auroriax.github.io:1234","Exported versions of the game will only run on sites with this origin."],
            ["sitelock_hostname_whitelist", "auroriax.github.io","Exported versions of the game will only run on sites with this hostname."]
        ];

        var COLOR_WORDS = [
            "COLOR",//special tag
            "black", "white", "darkgray", "lightgray", "gray", "red", "darkred", "lightred", "brown", "darkbrown", "lightbrown", "orange", "yellow", "green", "darkgreen", "lightgreen", "blue", "lightblue", "darkblue", "purple", "pink", "transparent"];
        var RULE_COMMAND_WORDS = [
            "COMMAND",
            "sfx0", "sfx1", "sfx2", "sfx3", "sfx4", "sfx5", "sfx6", "sfx7", "sfx8", "sfx9", "sfx10", "cancel", "checkpoint", "restart", "win", "message", "again", "nosave", "quit",
            "global", "zoomscreen", "flickscreen", "smoothscreen", "key_repeat_interval", "again_interval", "realtime_interval", "background_color", "text_color", "noundo", "norestart", "goto", "undo", "message_text_align"];

        var CARDINAL_DIRECTION_WORDS = [
            "DIRECTION",
            "up","down","left","right","horizontal","vertical"]

        var RULE_DIRECTION_WORDS = [
            "DIRECTION",//tag
            "up", "down", "left", "right", "random", "horizontal", "vertical","late","rigid"]

        var LOOP_WORDS = [
            "BRACKET",//tag
            "startloop","endloop"]
            
        var PATTERN_DIRECTION_WORDS = [
            "DIRECTION",
            "up", "down", "left", "right", "moving", "stationary", "no", "randomdir", "random", "horizontal", "vertical", "orthogonal", "perpendicular", "parallel", "action"]


        var SOUND_EVENTS = [
            "SOUNDEVENT",
            "undo", "restart", "titlescreen", "startgame", "cancel", "endgame", "startlevel", "endlevel", "showmessage", "closemessage", "sfx0", "sfx1", "sfx2", "sfx3", "sfx4", "sfx5", "sfx6", "sfx7", "sfx8", "sfx9", "sfx10"
        ];

        var SOUND_VERBS = [
            "SOUNDVERB",
            "move", "action", "create", "destroy", "cantmove"
        ];

        var SOUND_DIRECTIONS = [
            "DIRECTION",
            "up","down","left","right","horizontal","vertical","orthogonal"]

        var WINCONDITION_WORDS = [
            "LOGICWORD",
            "some", "on", "no", "all"]

        var LEGEND_LOGICWORDS = [
                "LOGICWORD",
                "and","or"
            ]

        var PRELUDE_COLOR_PALETTE_WORDS = [
            "mastersystem", "gameboycolour", "amiga", "arnecolors", "famicom", "atari", "pastel", "ega", "amstrad", "proteus_mellow", "proteus_rich", "proteus_night", "c64", "whitingjp"
        ]

        function renderHint(elt,data,cur){
            var t1=cur.text;
            var t2=cur.extra;
            var tag=cur.tag;
            if (t1.length==0){
                t1=cur.extra;
                t2=cur.text;
            }
            var wrapper = document.createElement("span")
            wrapper.className += " cm-s-midnight ";

            var h = document.createElement("span")                // Create a <h1> element
            // h.style.color="white";
            var t = document.createTextNode(t1);     // Create a text node

            h.appendChild(t);   
            wrapper.appendChild(h); 

            if (tag!=null){
                h.className += "cm-" + tag;
            }

            elt.appendChild(wrapper);//document.createTextNode(cur.displayText || getText(cur)));

            if (t2.length>0){
                var h2 = document.createElement("span")                // Create a <h1> element
                h2.style.color="orange";
                var t2 = document.createTextNode(" "+t2);     // Create a text node
                h2.appendChild(t2);  
                h2.style.color="orange";
                elt.appendChild(t2);
            }
        }

        CodeMirror.registerHelper("hint", "anyword", function(editor, options) {

            var word = options && options.word || WORD;
            var range = options && options.range || RANGE;
            var cur = editor.getCursor(),
                curLine = editor.getLine(cur.line);

            var end = cur.ch,
                start = end;

            var lineToCursor = curLine.substr(0,end);

            while (start && word.test(curLine.charAt(start - 1))) --start;
            var curWord = start != end && curLine.slice(start, end);

            var tok = editor.getTokenAt(cur);
            var state = tok.state;

            // ignore empty word
            if (!curWord || state.commentLevel>0) {
                // if ( 
                //         ( state.section=="" && curLine.trim()=="")  
                //         // || ( state.section=="objects" && state.objects_section==2 ) 
                //     ) {
                //     curWord="";
                // } else {
                    return {
                        list: []
                    };
                // }            
            }

            var addObjects = false;
            var excludeProperties = false;
            var excludeAggregates = false;
            var candlists = [];
            var toexclude = [];
            switch (state.section) {
                case 'objects':
                    {
                        if (state.objects_section==2){
                            candlists.push(COLOR_WORDS);
                        }
                        break;
                    }
                case 'legend':
                    {
                        var splits = lineToCursor.toLowerCase().split(/[\p{Z}\s]/u).filter(function(v) {
                            return v !== '';
                        });
                        toexclude=splits.filter(a => LEGEND_LOGICWORDS.indexOf(a)===-1);//don't filter out and or or
                        if (lineToCursor.indexOf('=')>=0){
                            if ((lineToCursor.trim().split(/\s+/ ).length%2)===1){
                                addObjects=true;
                            } else {
                                candlists.push(LEGEND_LOGICWORDS);                      
                            }
                        } //no hints before equals
                        break;
                    }
                case 'sounds':
                    {
                        /*
                        SOUNDEVENT SOUND 
                        NAME
                            SOUNDVERB <SOUND>
                            SOUNDVERB
                                <SOUND>
                                DIRECTION+ <SOUND>
                                */
                        var last_idx = state.current_line_wip_array.length-1;
                        if (last_idx>0 && state.current_line_wip_array[last_idx]==="ERROR"){
                            //if there's an error, just try to match greedily
                            candlists.push(SOUND_VERBS);
                            candlists.push(SOUND_DIRECTIONS);
                            candlists.push(SOUND_EVENTS);
                            addObjects=true;
                            excludeAggregates=true;       
                        } else if (state.current_line_wip_array.length<=1 ){
                            candlists.push(SOUND_EVENTS);
                            addObjects=true;
                            excludeAggregates=true;                            
                        } else  {
                            var lastType =  state.current_line_wip_array[last_idx][1];
                            switch (lastType){
                                case "SOUNDEVENT":
                                    {
                                        break;
                                    }
                                case "NAME":
                                    {
                                        candlists.push(SOUND_VERBS);
                                        break;
                                    }
                                case "SOUNDVERB":
                                case "DIRECTION":
                                    {
                                        candlists.push(SOUND_DIRECTIONS);
                                        break;
                                    }
                                case "SOUND":
                                    {
                                    }
                            }                                                 
                        }
                        break;
                    }
                case 'collisionlayers':
                    {
                        var splits = lineToCursor.toLowerCase().split(/[,\p{Z}\s]/u).filter(function(v) {
                            return v !== '';
                        });
                        toexclude=splits;
                        addObjects=true;
                        excludeAggregates=true;
                        break;
                    }
                case 'rules':
                    {   
                        //if inside of roles,can use some extra directions
                        if (lineToCursor.indexOf("[")==-1) {
                            candlists.push(RULE_DIRECTION_WORDS);
                            candlists.push(LOOP_WORDS);
                        } else {
                            candlists.push(PATTERN_DIRECTION_WORDS);                            
                        }
                        if (lineToCursor.indexOf("->")>=0) {
                            candlists.push(RULE_COMMAND_WORDS);
                        }
                        addObjects=true;
                        break;
                    }
                case 'winconditions':
                    {
                        if ((lineToCursor.trim().split(/\s+/ ).length%2)===0){
                            addObjects=true;
                        }
                        candlists.push(WINCONDITION_WORDS);
                        break;
                    }
                case 'levels':
                    {
                        if ("message".indexOf(lineToCursor.trim())===0) {
                            candlists.push(["MESSAGE_VERB","message"]);
                            candlists.push(["SECTION_VERB","section"]);
                            candlists.push(["GOTO_VERB"   ,"goto"   ]);
                        }
                        break;
                    }
                default: //preamble
                    {
                        var lc = lineToCursor.toLowerCase();
                        if (lc.indexOf("background_color")>=0 ||
                            lc.indexOf("text_color")>=0) {
                            candlists.push(COLOR_WORDS);
                        } else {
                            var linewords =lineToCursor.trim().split(/\s+/ );

                            if (linewords.length<2) {
                                candlists.push(PRELUDE_COMMAND_WORDS);
                            } else if (linewords.length==2 && linewords[0].toLowerCase()=='color_palette'){
                                candlists.push(PRELUDE_COLOR_PALETTE_WORDS);
                            }
                        }

                        break;
                    }
            }
            // case insensitive
            curWord = curWord.toLowerCase();

            var list = options && options.list || [],
                seen = {};

            //first, add objects if needed
            if (addObjects){
                var obs = state.objects;
                for (var key in obs) {
                    if (obs.hasOwnProperty(key)) {
                        var w = key;
                        var matchWord = w.toLowerCase();
                        // if (matchWord === curWord) continue;
                        if ((!curWord || matchWord.lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, matchWord)) {
                            seen[matchWord] = true;
                            var hint = state.original_case_names[w]; 
                            list.push({text:hint,extra:"",tag:"NAME",render:renderHint});
                        }
                    }
                }

                var legendbits = [state.legend_synonyms];
                if (!excludeProperties){
                    legendbits.push(state.legend_properties);
                }
                if (!excludeAggregates){
                    legendbits.push(state.legend_aggregates);
                }

                //go throuhg all derived objects
                for (var i=0;i<legendbits.length;i++){
                    var lr = legendbits[i];
                    for (var j=0;j<lr.length;j++){
                        var w = lr[j][0];
                        var matchWord = w.toLowerCase();
                        // if (matchWord === curWord) continue;
                        if ((!curWord || matchWord.lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, matchWord)) {
                            seen[matchWord] = true;
                            var hint = state.original_case_names[w]; 
                            list.push({text:hint,extra:"",tag:"NAME",render:renderHint});
                        }
                    }
                }

            }

            // go through random names
            for (var i = 0; i < candlists.length; i++) {
                var candlist = candlists[i]
                var tag = candlist[0];
                for (var j = 1; j < candlist.length; j++) {
                    var m = candlist[j];
                    var orig = m;
                    var extra=""
                    if (typeof m !== 'string'){
                        if (m.length>1){
                            extra=m[1]
                        }
                        m=m[0];
                    }
                    var matchWord=m;
                    var matchWord = matchWord.toLowerCase();
                    // if (matchWord === curWord) continue;
                    if ((!curWord || matchWord.lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, matchWord)) {
                        seen[matchWord] = true;

                        var mytag = tag;
                        if (mytag==="COLOR"){
                            mytag = "COLOR-"+m.toUpperCase();
                        }                    

                        list.push({text:m,extra:extra,tag:mytag,render:renderHint});
                    }
                }
            }
            

            //state.legend_aggregates
            //state.legend_synonyms
            //state.legend_properties
            //state.objects

            //remove words from the toexclude list

            
            if (toexclude.length>0){
                if (toexclude[toexclude.length-1]===curWord){
                    splits.pop();
                }
                for (var i=0;i<list.length;i++){
                    var lc = list[i].text.toLowerCase();
                    if (toexclude.indexOf(lc)>=0){
                        list.splice(i,1);
                        i--;
                    }
                }
            }
                    //if list is a single word and that matches what the current word is, don't show hint
            if (list.length===1 && list[0].text.toLowerCase()===curWord){
                list=[];
            }
            //if list contains the word that you've typed, put it to top of autocomplete list
            for (var i=1;i<list.length;i++){
                if (list[i].text.toLowerCase()===curWord){
                    var newhead=list[i];
                    list.splice(i,1);
                    list.unshift(newhead);
                    break;
                }
            }
            //if you're editing mid-word rather than at the end, no hints.
            if (tok.string.trim().length>curWord.length){
                list=[];
            }
            return {
                list: list,
                from: CodeMirror.Pos(cur.line, start),
                to: CodeMirror.Pos(cur.line, end)
            };
        });

    // https://statetackoverflow.com/questions/13744176/codemirror-autocomplete-after-any-keyup
    CodeMirror.ExcludedIntelliSenseTriggerKeys = {
        "9": "tab",
        "13": "enter",
        "16": "shift",
        "17": "ctrl",
        "18": "alt",
        "19": "pause",
        "20": "capslock",
        "27": "escape",
        "33": "pageup",
        "34": "pagedown",
        "35": "end",
        "36": "home",
        "37": "left",
        "38": "up",
        "39": "right",
        "40": "down",
        "45": "insert",
        "91": "left window key",
        "92": "right window key",
        "93": "select",
        "107": "add",
        "109": "subtract",
        "110": "decimal point",
        "111": "divide",
        "112": "f1",
        "113": "f2",
        "114": "f3",
        "115": "f4",
        "116": "f5",
        "117": "f6",
        "118": "f7",
        "119": "f8",
        "120": "f9",
        "121": "f10",
        "122": "f11",
        "123": "f12",
        "144": "numlock",
        "145": "scrolllock",
        "186": "semicolon",
        "187": "equalsign",
        "188": "comma",
        // "189": "dash",
        "190": "period",
        "191": "slash",
        "192": "graveaccent",
        "220": "backslash",
        "222": "quote"
    }
});
