function createSprite(name,spritegrid, colors, padding) {
	if (colors === undefined) {
		colors = [state.bgcolor, state.fgcolor];
	}

	var sprite = makeSpriteCanvas(name);
	var spritectx = sprite.getContext('2d');

    spritectx.clearRect(0, 0, cellwidth, cellheight);

	var w = spritegrid[0].length;
	var h = spritegrid.length;
	var cw = ~~(cellwidth / (w + (padding|0)));
    var ch = ~~(cellheight / (h + (padding|0)));
    var pixh=ch;
    if ("scanline" in state.metadata) {
        pixh=Math.ceil(ch/2);
    }
    spritectx.fillStyle = state.fgcolor;
    for (var j = 0; j < h; j++) {
        for (var k = 0; k < w; k++) {
            var val = spritegrid[j][k];
            if (val >= 0) {
                var cy = (j * ch)|0;
                var cx = (k * cw)|0;
                spritectx.fillStyle = colors[val];
                spritectx.fillRect(cx, cy, cw, pixh);
            }
        }
    }

    return sprite;
}

function drawTextWithCustomFont(txt, ctx, x, y) {
    ctx.fillStyle = state.fgcolor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    var fontSize = 1;
    if (state.metadata.font_size !== undefined) {
        fontSize = parseFloat(state.metadata.font_size)
    }
    ctx.font = (cellheight * fontSize) + "px PuzzleCustomFont";
    ctx.fillText(txt, x, y);
}

function regenText(spritecanvas,spritectx) {
	textImages={};

	for (var rowidx in titleImage) {
        var row=titleImage[rowidx];
        for (var nidx in row) {
            var n = row[nidx];
            if (font.hasOwnProperty(n) && !textImages.hasOwnProperty(n)) {
                fontstr = font[n].split('\n').map(a=>a.trim().split('').map(t=>parseInt(t)));
                fontstr.shift();
                textImages[n] = createSprite('char'+n,fontstr, undefined, 1);
            }
        }
    }
}

var editor_s_grille=[[0,1,1,1,0],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[0,1,1,1,0]];

var spriteimages;
function regenSpriteImages() {
	if (textMode) {
        spriteimages = [];
		regenText();
		return;
	} 
    
    if (IDE===true) {
        textImages['editor_s'] = createSprite('chars',editor_s_grille,undefined);
    }
    
    if (state.levels.length===0) {
        return;
    }
    spriteimages = [];

    for (var i = 0; i < sprites.length; i++) {
        if (sprites[i] == undefined) {
            continue;
        }
        spriteimages[i] = createSprite(i.toString(),sprites[i].dat, sprites[i].colors);
    }

    if (canOpenEditor) {
    	generateGlyphImages();
    }
}

var glyphImagesCorrespondance;
var glyphImages;
var glyphHighlight;
var glyphHighlightDiff;
var glyphHighlightResize;
var glyphPrintButton;
var glyphMouseOver;
var glyphSelectedIndex=0;
var editorRowCount=1;
var editorGlyphMovements=[];

var canvasdict={};
function makeSpriteCanvas(name) {
    var canvas;
    if (name in canvasdict) {
        canvas = canvasdict[name];
    } else {
        canvas = document.createElement('canvas');
        canvasdict[name]=canvas;
    }
	canvas.width = cellwidth;
	canvas.height = cellheight;
	return canvas;
}


function generateGlyphImages() {
    if (cellwidth===0||cellheight===0) {
        return;
    }
	glyphImagesCorrespondance=[];
	glyphImages=[];
	
    seenobjects = {};
	for (var n in state.glyphDict) {
		if (n.length==1 && state.glyphDict.hasOwnProperty(n)) {            
			var g=state.glyphDict[n];

            /* hide duplicate entries from editor palette*/
            var trace = g.join(",");
            if (seenobjects.hasOwnProperty(trace)){
                continue;
            }
            
			var sprite = makeSpriteCanvas("C"+n)
			var spritectx = sprite.getContext('2d');
			glyphImagesCorrespondance.push(n);
            seenobjects[trace]=true;

			for (var i=0;i<g.length;i++){
				var id = g[i];
				if (id===-1) {
					continue;
				}
				spritectx.drawImage(spriteimages[id], 0, 0);
			}
			glyphImages.push(sprite);
		}
	}

	if (IDE) {
		//make highlight thingy
		glyphHighlight = makeSpriteCanvas("highlight");
		var spritectx = glyphHighlight.getContext('2d');
		spritectx.fillStyle = '#FFFFFF';

		spritectx.fillRect(0,0,cellwidth,1);
		spritectx.fillRect(0,0,1,cellheight);
		
		spritectx.fillRect(0,cellheight-1,cellwidth,1);
		spritectx.fillRect(cellwidth-1,0,1,cellheight);

		glyphPrintButton = textImages['editor_s'];

		//make diff highlighter thingy
		glyphHighlightDiff = makeSpriteCanvas("glyphHighlightDiff");
		var spritectx = glyphHighlightDiff.getContext('2d');
        
		spritectx.fillStyle =  state.bgcolor;

		spritectx.fillRect(0,0,cellwidth,2);
		spritectx.fillRect(0,0,2,cellheight);
		
		spritectx.fillRect(0,cellheight-2,cellwidth,2);
		spritectx.fillRect(cellwidth-2,0,2,cellheight);

		spritectx.fillStyle = state.fgcolor;

		spritectx.fillRect(0,0,cellwidth,1);
		spritectx.fillRect(0,0,1,cellheight);
		
		spritectx.fillRect(0,cellheight-1,cellwidth,1);
		spritectx.fillRect(cellwidth-1,0,1,cellheight);

        

		glyphPrintButton = textImages['editor_s'];


		//make highlight thingy
		glyphHighlightResize = makeSpriteCanvas("highlightresize");
		var spritectx = glyphHighlightResize.getContext('2d');
		spritectx.fillStyle = '#FFFFFF';
		
		var minx=((cellwidth/2)-1)|0;
		var xsize=cellwidth-minx-1-minx;
		var miny=((cellheight/2)-1)|0;
		var ysize=cellheight-miny-1-minx;

		spritectx.fillRect(minx,0,xsize,cellheight);
		spritectx.fillRect(0,miny,cellwidth,ysize);

		//make highlight thingy
		glyphMouseOver = makeSpriteCanvas("glyphMouseOver");
		var spritectx = glyphMouseOver.getContext('2d');
		spritectx.fillStyle = 'yellow';
		
		spritectx.fillRect(0,0,cellwidth,2);
		spritectx.fillRect(0,0,2,cellheight);
		
		spritectx.fillRect(0,cellheight-2,cellwidth,2);
		spritectx.fillRect(cellwidth-2,0,2,cellheight);

        //make movement glyphs

        /* 
        up:1
        down:2
        left:4
        right:8
        action:16

        */
        const coords = [
            //up
            [ [3,2],[5,0],[7,2]],
            //down
            [ [3,8],[5,10],[7,8]],
            //left
            [ [2,3],[0,5],[2,7]],
            //right
            [ [7,3],[10,5],[7,7]],
            //action
            [ [3,5],[5,7],[7,5],[5,3]],
        ];

        for (var i=0;i<coords.length;i++){
            editorGlyphMovements[i]=makeSpriteCanvas("editorGlyphMovements"+i);
            var path = coords[i];

            var spritectx = editorGlyphMovements[i].getContext('2d');
            spritectx.lineWidth=1;
            
            
		    spritectx.fillStyle =  state.bgcolor;
		    spritectx.strokeStyle = state.fgcolor;


            spritectx.beginPath();       // Start a new path
            spritectx.moveTo(path[0][0]*cellwidth/10.0, path[0][1]*cellheight/10.0);    
            for (var j=1;j<path.length;j++){
                spritectx.lineTo(path[j][0]*cellwidth/10.0, path[j][1]*cellheight/10.0);   
            }
            spritectx.closePath();
            spritectx.fill();
            spritectx.stroke();          // Render the path

                

        }
	}
}

var canvas;
var ctx;


var x;
var y;
var cellwidth;
var cellheight;
var xoffset;
var yoffset;

window.addEventListener('resize', canvasResize, false);
canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');
x = 0;
y = 0;

function glyphCount(){
    var count=0;
    for (var n in state.glyphDict) {
        if (n.length==1 && state.glyphDict.hasOwnProperty(n)) {
            count++;
        }
    }    
    return count;
}

function redraw() {
    if (cellwidth===0||cellheight===0) {
        return;
    }
    if (spriteimages===undefined) {
        regenSpriteImages();
    }
	
    if (textMode) {
        ctx.fillStyle = state.bgcolor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if(state.metadata.custom_font === undefined || !loadedCustomFont) { 
            for (var i = 0; i < titleWidth; i++) {
                for (var j = 0; j < titleHeight; j++) {
                    var ch = titleImage[j].charAt(i);
                    if (ch in textImages) {
                        var sprite = textImages[ch];
                        ctx.drawImage(sprite, xoffset + i * cellwidth, yoffset + j * cellheight);                   
                    }
                }
            }
        } else {
            for(var i = 0; i < titleHeight; i++) {
                var row = titleImage[i];
                drawTextWithCustomFont(row, ctx, xoffset + titleWidth * cellwidth / 2, yoffset + i * cellheight + cellheight/2);           
            }
        }
        return;
    } else {
        var curlevel = level;
        if (diffToVisualize!==null){
            curlevel = new Level(-1,diffToVisualize.width,diffToVisualize.height,diffToVisualize.layerCount,diffToVisualize.objects);
            curlevel.movements = diffToVisualize.movements;
        }
        ctx.fillStyle = state.bgcolor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var mini=0;
        var maxi=screenwidth;
        var minj=0;
        var maxj=screenheight;

        var cameraOffset = {
            x: 0,
            y: 0
        };

        if (levelEditorOpened) {
            var glyphcount = glyphCount();
            editorRowCount = Math.ceil(glyphcount/(screenwidth-1));
            maxi-=2;
            maxj-=2+editorRowCount;
        } else if (flickscreen) {
            var playerPositions = getPlayerPositions();
            if (playerPositions.length>0) {
                var playerPosition=playerPositions[0];
                var px = (playerPosition/(curlevel.height))|0;
                var py = (playerPosition%curlevel.height)|0;

                var screenx = (px/screenwidth)|0;
                var screeny = (py/screenheight)|0;
                mini=screenx*screenwidth;
                minj=screeny*screenheight;
                maxi=Math.min(mini+screenwidth,curlevel.width);
                maxj=Math.min(minj+screenheight,curlevel.height);

                oldflickscreendat=[mini,minj,maxi,maxj];
            } else if (oldflickscreendat.length>0){
                mini=oldflickscreendat[0];
                minj=oldflickscreendat[1];
                maxi=oldflickscreendat[2];
                maxj=oldflickscreendat[3];
            }
        } else if (zoomscreen) {
            var playerPositions = getPlayerPositions();
            if (playerPositions.length>0) {
                var playerPosition=playerPositions[0];
                var px = (playerPosition/(curlevel.height))|0;
                var py = (playerPosition%curlevel.height)|0;
                mini=Math.max(Math.min(px-((screenwidth/2)|0),curlevel.width-screenwidth),0);
                minj=Math.max(Math.min(py-((screenheight/2)|0),curlevel.height-screenheight),0);
                maxi=Math.min(mini+screenwidth,curlevel.width);
                maxj=Math.min(minj+screenheight,curlevel.height);
                oldflickscreendat=[mini,minj,maxi,maxj];
            }  else if (oldflickscreendat.length>0){
                mini=oldflickscreendat[0];
                minj=oldflickscreendat[1];
                maxi=oldflickscreendat[2];
                maxj=oldflickscreendat[3];
            }         
        } else if (smoothscreen) {
            if (cameraPositionTarget !== null) {
                ['x', 'y'].forEach(function (coord) {
                    var cameraTargetVector = cameraPositionTarget[coord] - cameraPosition[coord];

                    if (cameraTargetVector === 0) {
                        return;
                    } else if (Math.abs(cameraTargetVector) < (0.5 / cellwidth)) {
                        // Canvas doesn't actually render subpixels, but when the camera is less than half a subpixel away from target, snap to target
                        cameraPosition[coord] = cameraPositionTarget[coord]
                        return
                    }

                    cameraPosition[coord] += cameraTargetVector * state.metadata.smoothscreen.cameraSpeed;
                    cameraOffset[coord] = cameraPosition[coord] % 1;
                })

                mini=Math.max(Math.min(Math.floor(cameraPosition.x)-Math.floor(screenwidth/2), level.width-screenwidth),0);
                minj=Math.max(Math.min(Math.floor(cameraPosition.y)-Math.floor(screenheight/2), level.height-screenheight),0);

                maxi=Math.min(mini+screenwidth,level.width);
                maxj=Math.min(minj+screenheight,level.height);
                oldflickscreendat=[mini,minj,maxi,maxj];
            } else if (oldflickscreendat.length>0) {
                mini=oldflickscreendat[0];
                minj=oldflickscreendat[1];
                maxi=oldflickscreendat[2];
                maxj=oldflickscreendat[3];
            }

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(xoffset, yoffset);
            ctx.lineTo(xoffset + (maxi - mini) * cellwidth, yoffset);
            ctx.lineTo(xoffset + (maxi - mini) * cellwidth, yoffset + (maxj - minj) * cellwidth);
            ctx.lineTo(xoffset, yoffset + (maxj - minj) * cellwidth);
            ctx.clip();
        }
	    
		screenOffsetX = mini;
		screenOffsetY = minj;

		// make sure tween map exists
		if (level.tweens.length == 0){
			level.tweens = new Array(level.width * level.height).fill(new Array(256).fill([0,0]));
		}
		
        var renderBorderSize = smoothscreen ? 1 : 0;
        for (var k = 0; k < state.objectCount; k++) {
			for (var i = Math.max(mini - renderBorderSize, 0); i < Math.min(maxi + renderBorderSize, curlevel.width); i++) {
				for (var j = Math.max(minj - renderBorderSize, 0); j < Math.min(maxj + renderBorderSize, curlevel.height); j++) {
					var posIndex = j + i * curlevel.height;
					var posMask = curlevel.getCellInto(posIndex,_o12);
					
					var tween_dir = curlevel.tweens[posIndex];
					//console.log(tween_dir)
                    if (posMask.get(k) != 0) {
                        var sprite = spriteimages[k];
						var x = xoffset + (i-mini-cameraOffset.x) * cellwidth;
						var y = yoffset + (j-minj-cameraOffset.y) * cellheight;
						
						
						//ctx.drawImage(sprite, Math.round(x), Math.round(y)); // placeholder
						
						var dir = tween_dir[k]
						
						var tween = tweentimer/tweentimer_max;
						var shiftx = cellwidth*dir[0]*tween
						var shifty = cellheight*dir[1]*tween
						
						ctx.drawImage(sprite, Math.round(x-shiftx), Math.round(y-shifty));
						
						// //debug text
						// ctx.fillStyle = 'red';
						// ctx.font = 'bold 24px serif';
						// ctx.fillText(dir.join("-"), Math.round(x), Math.round(y));
						
						// //debug line
						// x += cellwidth*0.5
						// y += cellheight*0.5
						// ctx.strokeStyle = 'red';
						// ctx.lineWidth = 8;
						// ctx.beginPath();
						// ctx.moveTo(Math.round(x), Math.round(y));
						// ctx.lineTo(Math.round(x-shiftx), Math.round(y-shifty));
						// ctx.stroke();
						
                    }
                }
            }
        }
        
        if (diffToVisualize!==null){
            //find previous state (this is never called on the very first state, the one before player inputs are applied, so there is always a previous state)
            var prevstate_lineNumberIndex=diffToVisualize.lineNumber-1;
            for (;prevstate_lineNumberIndex>=-1;prevstate_lineNumberIndex--)
            {
                if (debug_visualisation_array[diffToVisualize.turnIndex].hasOwnProperty(prevstate_lineNumberIndex)){
                    break;
                }
            }

            var prev_state = debug_visualisation_array[diffToVisualize.turnIndex][prevstate_lineNumberIndex];
			
            var prevlevel = new Level(-1,prev_state.width,prev_state.height,prev_state.layerCount,prev_state.objects);
            prevlevel.movements = prev_state.movements;
        
            for (var i = mini; i < maxi; i++) {
                for (var j = minj; j < maxj; j++) {
                    var posIndex = j + i * curlevel.height;
                    var movementbitvec_PREV = prevlevel.getMovements(posIndex);
                    var movementbitvec = curlevel.getMovements(posIndex);
                    
                    var posMask_PREV = prevlevel.getCellInto(posIndex,_o11); 
                    var posMask = curlevel.getCellInto(posIndex,_o12); 
                    if (!movementbitvec.equals(movementbitvec_PREV) || !posMask.equals(posMask_PREV)){
                        ctx.drawImage(glyphHighlightDiff, xoffset + (i-mini) * cellwidth, yoffset + (j-minj) * cellheight);

                    }
                }
            }
        
            //draw movements!
            for (var i = mini; i < maxi; i++) {
                for (var j = minj; j < maxj; j++) {
                    var posIndex = j + i * curlevel.height;
                    var movementbitvec = curlevel.getMovements(posIndex);
                    for (var layer=0;layer<curlevel.layerCount;layer++) {
                        var layerMovement = movementbitvec.getshiftor(0x1f, 5*layer);
                        for (var k = 0; k < 5; k++) {
                            if ((layerMovement&Math.pow(2,k))!==0){
                                ctx.drawImage(editorGlyphMovements[k], xoffset + (i-mini) * cellwidth, yoffset + (j-minj) * cellheight);
                            }
                        }
                    }                             
                }
            }
        }

        if (smoothscreen) {
            if (state.metadata.smoothscreen.debug) {
                drawSmoothScreenDebug(ctx);
            }
            ctx.restore();
        }

	    if (levelEditorOpened) {
	    	drawEditorIcons(mini,minj);
	    }
    }
}

function drawSmoothScreenDebug(ctx) {
    ctx.save();

    var smoothscreenConfig = state.metadata.smoothscreen;
    var boundarySize = smoothscreenConfig.boundarySize;

    var playerPositions = getPlayerPositions();
    if (playerPositions.length > 0) {
        var playerPosition = {
            x: (playerPositions[0]/(level.height))|0,
            y: (playerPositions[0]%level.height)|0
        };

        var playerOffsetX = playerPosition.x - cameraPosition.x;
        var playerOffsetY = playerPosition.y - cameraPosition.y;

        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(
            xoffset + (Math.floor(screenwidth / 2) + playerOffsetX + 0.5) * cellwidth,
            yoffset + (Math.floor(screenheight / 2) + playerOffsetY + 0.5) * cellheight,
            cellwidth / 4,
            0, 2* Math.PI
        );
        ctx.fill()
    }

    var targetOffsetX = cameraPositionTarget.x - cameraPosition.x;
    var targetOffsetY = cameraPositionTarget.y - cameraPosition.y;

    ctx.fillStyle = '#0000ff';
    ctx.beginPath();
    ctx.arc(
        xoffset + (Math.floor(screenwidth / 2) + targetOffsetX) * cellwidth,
        yoffset + (Math.floor(screenheight / 2) + targetOffsetY) * cellheight,
        cellwidth / 8,
        0, 2* Math.PI
    );
    ctx.fill()

    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = cellwidth / 16;
    ctx.strokeRect(
        xoffset + (Math.floor(screenwidth / 2) + targetOffsetX - Math.floor(boundarySize.width / 2)) * cellwidth,
        yoffset + (Math.floor(screenheight / 2) + targetOffsetY - Math.floor(boundarySize.height / 2)) * cellheight,
        boundarySize.width * cellwidth,
        boundarySize.height * cellheight
    );

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
        xoffset + Math.floor(screenwidth / 2) * cellwidth,
        yoffset + Math.floor(screenheight / 2) * cellheight,
        cellwidth / 4,
        0, 2* Math.PI
    );
    ctx.fill()

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = cellwidth / 8;
    ctx.strokeRect(
        xoffset + (Math.floor(screenwidth / 2) - Math.floor(boundarySize.width / 2)) * cellwidth,
        yoffset + (Math.floor(screenheight / 2) - Math.floor(boundarySize.height / 2)) * cellheight,
        boundarySize.width * cellwidth,
        boundarySize.height * cellheight
    );

    ctx.restore()
}

function drawEditorIcons(mini,minj) {
	var glyphCount = glyphImages.length;
	var glyphStartIndex=0;
	var glyphEndIndex = glyphImages.length;/*Math.min(
							glyphStartIndex+10,
							screenwidth-2,
							glyphStartIndex+Math.max(glyphCount-glyphStartIndex,0)
							);*/
	var glyphsToDisplay = glyphEndIndex-glyphStartIndex;

	ctx.drawImage(glyphPrintButton,xoffset-cellwidth,yoffset-cellheight*(1+editorRowCount));
	if (mouseCoordY===(-1-editorRowCount)&&mouseCoordX===-1) {
			ctx.drawImage(glyphMouseOver,xoffset-cellwidth,yoffset-cellheight*(1+editorRowCount));								
	}

	var ypos = editorRowCount-(-mouseCoordY-2)-1;
	var mouseIndex=mouseCoordX+(screenwidth-1)*ypos;

	for (var i=0;i<glyphsToDisplay;i++) {
		var glyphIndex = glyphStartIndex+i;
		var sprite = glyphImages[glyphIndex];
        var xpos=i%(screenwidth-1);
        var ypos=(i/(screenwidth-1))|0;
		ctx.drawImage(sprite,xoffset+(xpos)*cellwidth,yoffset+ypos*cellheight-cellheight*(1+editorRowCount));
		if (mouseCoordX>=0&&mouseCoordX<(screenwidth-1)&&mouseIndex===i) {
			ctx.drawImage(glyphMouseOver,xoffset+xpos*cellwidth,yoffset+ypos*cellheight-cellheight*(1+editorRowCount));						
		}
		if (i===glyphSelectedIndex) {
			ctx.drawImage(glyphHighlight,xoffset+xpos*cellwidth,yoffset+ypos*cellheight-cellheight*(1+editorRowCount));
		} 		
	}

    //filched from https://raw.githubusercontent.com/ClementSparrow/Pattern-Script/master/src/js/graphics.js
    var tooltip_string = ''
    var tooltip_objects = null
    // prepare tooltip: legend for highlighted editor icon
    if ( (mouseCoordX >= 0) && (mouseCoordX < screenwidth) && (mouseIndex >= 0) && (mouseIndex < glyphsToDisplay) )
    {
        const glyphIndex = glyphStartIndex + mouseIndex
        const identifier_index = glyphImagesCorrespondance[glyphIndex]
        tooltip_string = identifier_index 
        if (identifier_index in state.synonymsDict){
            tooltip_string += " = " + state.synonymsDict[identifier_index];
        } else if (identifier_index in state.aggregatesDict){
            tooltip_string += " = " + state.aggregatesDict[identifier_index].join(" and ");
            
        }
    }
    // prepare tooltip: content of a level's cell
    else if ( (mouseCoordX >= 0) && (mouseCoordY >= 0) && (mouseCoordX < screenwidth) && (mouseCoordY < screenheight-editorRowCount) )
    {
        const posMask = level.getCellInto((mouseCoordY+minj) + (mouseCoordX+mini)*level.height, _o12);
        tooltip_objects = state.idDict.filter( (x,k) => (posMask.get(k) != 0) )
            // prepare tooltip: object names
        if (tooltip_objects !== null)
        {
            tooltip_string = tooltip_objects.join(', ')
        }
    }

    // show tooltip
    if (tooltip_string.length > 0)
    {
        ctx.fillStyle = state.fgcolor;
        ctx.font = `16px "Source Sans Pro", Helvetica, Arial, sans-serif`;
        ctx.fillText(tooltip_string, xoffset, yoffset-0.4*cellheight);
    }

	if (mouseCoordX>=-1&&mouseCoordY>=-1&&mouseCoordX<screenwidth-1&&mouseCoordY<screenheight-1-editorRowCount) {
		if (mouseCoordX==-1||mouseCoordY==-1||mouseCoordX==screenwidth-2||mouseCoordY===screenheight-2-editorRowCount) {
			ctx.drawImage(glyphHighlightResize,
				xoffset+mouseCoordX*cellwidth,
				yoffset+mouseCoordY*cellheight
				);								
		} else {
			ctx.drawImage(glyphHighlight,
				xoffset+mouseCoordX*cellwidth,
				yoffset+mouseCoordY*cellheight
				);				
		}
	}

}

var lastDownTarget;

var oldcellwidth=0;
var oldcellheight=0;
var oldtextmode=-1;
var oldfgcolor=-1;
var forceRegenImages=false;
function canvasResize() {
    canvas.width = canvas.parentNode.clientWidth;
    canvas.height = canvas.parentNode.clientHeight;

    screenwidth=level.width;
    screenheight=level.height;
    if (state!==undefined){
        flickscreen=state.metadata.flickscreen!==undefined;
        zoomscreen=state.metadata.zoomscreen!==undefined;
        smoothscreen=state.metadata.smoothscreen!==undefined;
	    if (levelEditorOpened) {
            screenwidth+=2;
            var glyphcount = glyphCount();
            editorRowCount = Math.ceil(glyphcount/(screenwidth-1));
            screenheight+=2+editorRowCount;
        } else if (flickscreen) {
	        screenwidth=state.metadata.flickscreen[0];
	        screenheight=state.metadata.flickscreen[1];
	    } else if (zoomscreen) {
	        screenwidth=state.metadata.zoomscreen[0];
	        screenheight=state.metadata.zoomscreen[1];
	    } else if (smoothscreen) {
	        screenwidth=state.metadata.smoothscreen.screenSize.width;
	        screenheight=state.metadata.smoothscreen.screenSize.height;
	    }
	}

    if (textMode) {
        screenwidth=titleWidth;
        screenheight=titleHeight;
    }
    
    cellwidth = canvas.width / screenwidth;
    cellheight = canvas.height / screenheight;

    var w = 5;
    var h = 5;

    if (sprites.length >= 2) {
        var w = sprites[1].dat.length;
        var h = sprites[1].dat.length;//sprites[1].dat[0].length;
    }

    if (textMode) {
        w=5 + 1;
        h=font['X'].length/(w) + 1;
    }


    cellwidth =w * Math.max( ~~(cellwidth / w),1);
    cellheight = h * Math.max(~~(cellheight / h),1);

    if ((cellwidth == 0 || cellheight == 0) && !textMode) {
        cellwidth = w;
        cellheight = h;
        console.log("Resized below 1");
    }

    xoffset = 0;
    yoffset = 0;

    if (cellwidth / w > cellheight / h  || (textMode && state.metadata.custom_font !== undefined && loadedCustomFont)) {
        cellwidth = cellheight * w / h;
        xoffset = (canvas.width - cellwidth * screenwidth) / 2;
        yoffset = (canvas.height - cellheight * screenheight) / 2;
    }
    else { //if (cellheight > cellwidth) {
        cellheight = cellwidth * h / w;
        yoffset = (canvas.height - cellheight * screenheight) / 2;
        xoffset = (canvas.width - cellwidth * screenwidth) / 2;
    }

    if (levelEditorOpened && !textMode) {
    	xoffset+=cellwidth;
    	yoffset+=cellheight*(1+editorRowCount);
    }

    cellwidth = cellwidth|0;
    cellheight = cellheight|0;
    xoffset = xoffset|0;
    yoffset = yoffset|0;

    if (oldcellwidth!=cellwidth||oldcellheight!=cellheight||oldtextmode!=textMode||textMode||oldfgcolor!=state.fgcolor||forceRegenImages){
    	forceRegenImages=false;
    	regenSpriteImages();
    }

    oldcellheight=cellheight;
    oldcellwidth=cellwidth;
    oldtextmode=textMode;
    oldfgcolor=state.fgcolor;

    redraw();
}




