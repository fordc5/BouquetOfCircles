var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

//*******************************************\\
// ******** Variable Initialization ******** \\

// Line locations
var topLineY = canvas.height * (1.5 / 10);
var botLineY = canvas.height * (9 / 10);
var triLineX = canvas.width * (8 / 10);
var topTriX = canvas.width * (8.7 / 10);
var topTriY = canvas.height * (9.2 / 10);
var botTriX = topTriX;
var botTriY = canvas.height * (9.8 / 10);
var leftTriX = canvas.width * (9.3 / 10);
var leftTriY = (topTriY + botTriY) / 2;

// Edge Colors
var blackEdge = "rgba(0,0,0,1)";
var greenEdge = "rgba(0,255,0,1)";
var redEdge   = "rgba(255,0,0,1)";
var blueEdge  = "rgba(0,0,255,1)";

// Edge and vertex texts (in the top pane)
var textEdges = "Edges: ";
var textVertices = "Vertices: ";
var textEdgesX = 10;
var textEdgesY = 15;
var textVerticesX = textEdgesX;
var textVerticesY = textEdgesY + 25;
var fontEdges = "14px Helvetica";
var fontVertices = fontEdges;
var fontEdgesColor = "rgba(0,0,0,1)";
var fontVerticesColor = "rgba(0,0,0,1)";

// Edge and vertex counts in graph
var numEdges = 0;
var numVertices = 0;

// Connected texts
var textConnected = "Connected? ";
var isConnected = false;
var fontConnected = "14px Helvetica";
var fontConnectedColor = "rgba(0,0,0,1)";
var textConnectedX = textEdgesX;
var textConnectedY = textVerticesY + 25;

// The graph
// e.g. G.vertices = {'1': {x:5,y:3.5}, '2': {x=47,y=42}}
// e.g. G.edges = ['1,2', '3,5']
var G = {
  'vertices': {},
  'edges': []
};

// Spanning tree
// array of edges
var S = [];

// Vertex properties:
// (Background for when highlighted/hovering)
var vertexColor           = "rgba(255,0,0,1)";
var vertexRadius          = 7;
var vertexBackground      = 0;
var vertexBackgroundColor = "rgba(210,0,0,1)";

// Vertex seperation 
// (cannot plot vertices closer than this to one another)
var separation = 100;

// Dragging
// select - vertex selected
// release - vertex released
select  = '0';
release = '0';

// Clear text
var textClear      = "Clear";
var fontClear      = "20px Helvetica";
var fontClearColor = "rgba(0,0,0,1)";
var textClearX     = (canvas.width * (4/10)) - (ctx.measureText(textClear).width);
var textClearY     = canvas.height * (9.5/10) + 8;

// Messages 
// To be displayed in the top bar
var hasMessage         = false;
var message            = "";
var fontMessage        = "16px Helvetica";
var fontMessageColor   = "rgba(200,0,0,0.9)";
var textMessageX       = (canvas.width/2) - (130);
var textMessageY       = canvas.height * (0.9/10);
var messageDisplayTime = 1500 // (milliseconds)

// Animating
var animating         = false;
var step              = 0; // counter for which step of algorithm we are on
var animationTime     = 4000; // (milliseconds) duration for each step
var finishedAnimating = false;

//building
var building = true;

// array of quads
var quads = [];

// array of triangle vertices
var triangles = [];

// edges touching a leaf
var leafEdges = [];
var leafVertices = [];

// array of edges that aren't on circle for cornucopia lemma n = 1.
var circleStems = [];



//******************************************\\


//*****************************\\
// ******** Listeners ******** \\

// event listener for mousedown
document.addEventListener("mousedown", mouseDownHandler, false);
function mouseDownHandler(e) {
    mousePos = getMousePos(canvas, e);
    quad = getQuad(mousePos);
    // if in the main frame
    if (quad == 1) { 
		if (!animating) {
            if (!finishedAnimating) {
                select = '0';
                // three options: (1) new vertex, (2) selecting an existing vertex, (3) bad click
                if (!tooClose(mousePos)) {
                    // add a vertex
                    numVertices++;
                    G.vertices[String(numVertices)] = {
                        'x': mousePos.x,
                        'y': mousePos.y
                    };
                } else if ((v = overVertex(mousePos)) !== '0' ) {
                    select = v;
                } else {
                    // display message
                    hasMessage = true;
                    message = "Space out your vertices!"
                }
            } else {
                // must clear to restart
                hasMessage = true;
                message = "Clear to restart";
            }
        }
    // if pressed the clear button
    } else if (quad == 2) {

        //added to eliminate delay when animating
        window.setTimeout(function(){timer.pause(); window.setTimeout(function(){timer.resume();}, 0);}, 0);

        // stop animating if animating
        animating = false;
        finishedAnimating = false;
        building = true;
        // clear graph object
        G = {
            'vertices': {},
            'edges': []
        };
        S = [];
        quads = [];
        triangles = [];
        leafEdges = [];
        leafVertices = [];
        circleStems = [];
        // reset headers
        numVertices = 0;
		numEdges = 0;
        isConnected = false;
        
    // if pressed the play button
    } else if (quad == 3) {
        // begin animating if not already animating
		if (!animating) {
            
            if (!finishedAnimating) {

                if (isConnected) {
                    step = 1;
                    animating = true;
                    building = false;
                } else {
                    // graph must be connected to animate
                    hasMessage = true;
                    message = "Graph must be connected";
                }
            } else {
                // must clear to restart
                hasMessage = true;
                message = "Clear to restart";
            }
        }
        
	}
}

// event listener for mouseup
document.addEventListener("mouseup", mouseUpListener, false);
function mouseUpListener(e) {
	releasePos = getMousePos(canvas,e)
    release = overVertex(releasePos)
	if (release != select && release != '0' && select != '0') {
        // add edge
		var vertexArray = [parseInt(release), parseInt(select)];
		vertexArray.sort(sortFunc); //sorting so when looking for edge between '1' and '4' we know to search for '1,4' not '4,1'
		G.edges.push(vertexArray.join(","));
		numEdges++;
	}
}

// checks if mouse is hovering of vertex to display highlighting
canvas.onmousemove = function(e) {
    loc = getMousePos(canvas, e);
    for (var v in G.vertices) {
      if (Math.pow(Math.pow((loc.x - G.vertices[v].x),2) + Math.pow((loc.y - G.vertices[v].y), 2),0.5) < vertexRadius) {
        vertexBackground = parseInt(v);
        return;
      }
    }
    vertexBackground = 0;
}

//*****************************\\



//**********************************\\
// ******** Helper Methods ******** \\

// contains method for arrays
// if: obj in arr return true
// else: return false
function contains(arr, obj) {
    var index = arr.length;
    while (index--) {
       if (arr[index] === obj) {
           return true;
       }
    }
    return false;
}

// int array sort helper
function sortFunc(a,b) {
    return a - b;
};

// quad 1 - main frame
// quad 2 - clear
// quad 3 - play
function getQuad(loc) {
    if (loc.x !== Infinity && loc.y !== Infinity) {
        if (loc.y > botLineY && loc.x > triLineX) {
            return 3
        } else if (loc.y > botLineY && loc.x < triLineX) {
            return 2
        } else if (loc.y > topLineY + vertexRadius && loc.y < botLineY - vertexRadius && loc.x > vertexRadius && loc.x < canvas.width - vertexRadius) {
            return 1
        }
    }
}

// returns mouse position object on screen
// where {x:0, y:0} is the top-left corner of the canvas element.
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
      y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

// input: {x: 5, y: 3.4}
// return true if location is too close to an existing vertex
// return false otherwise
function tooClose(loc) {
	for (var v in G.vertices) {
        // check if distance is less than the degree of separation
		if (Math.pow(Math.pow((loc.x - G.vertices[v].x), 2) + Math.pow((loc.y - G.vertices[v].y), 2), 0.5) < separation) {
			return true;
		}
	}
	return false;
}

// input: {x: 5, y: 3.4}
// if loc is over an existing vertex return the vertex e.g. '5'
// else return '0' 
function overVertex(loc) {
	for (var v in G.vertices) {
		if (Math.pow(Math.pow((loc.x - G.vertices[v].x), 2) + Math.pow((loc.y - G.vertices[v].y), 2), 0.5) < vertexRadius) {
			return v;
		}
	}
	return '0';
}

//**********************************\\



//***********************************\\
// ******** Drawing Methods ******** \\

function initialize() {
    // Create top and bottom lines
    ctx.beginPath();
    ctx.moveTo(0, topLineY);
    ctx.lineTo(canvas.width, topLineY);
    ctx.strokeStyle = blackEdge
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, botLineY);
    ctx.lineTo(canvas.width, botLineY);
    ctx.strokeStyle = blackEdge
    ctx.stroke();

    // Create vertical tri line
    ctx.beginPath();
    ctx.moveTo(triLineX, botLineY);
    ctx.lineTo(triLineX, canvas.height);
    ctx.strokeStyle = blackEdge
    ctx.stroke();

    // Create triangle
    ctx.beginPath();
    ctx.moveTo(topTriX, topTriY);
    ctx.lineTo(botTriX, botTriY);
    ctx.lineTo(leftTriX, leftTriY);
    ctx.lineTo(topTriX, topTriY)
    ctx.strokeStyle = greenEdge
    ctx.stroke();
    
    // Display 'Clear' text
    ctx.font = fontClear;
    ctx.fillStyle = fontClearColor;
    ctx.fillText(textClear, textClearX, textClearY);
}

function headerData() {
    // Edge and vertex labels/counts
    ctx.font = fontEdges;
    ctx.fillStyle = fontEdgesColor;
    ctx.fillText(textEdges + numEdges, textEdgesX, textEdgesY);

    ctx.font = fontVertices;
    ctx.fillStyle = fontVerticesColor;
    ctx.fillText(textVertices + numVertices, textVerticesX, textVerticesY);

    // Connected label
    ctx.font = fontConnected;
    ctx.fillStyle = fontConnectedColor;
    if (isConnected) {
        ctx.fillText(textConnected + "yes", textConnectedX, textConnectedY);
    } else {
        ctx.fillText(textConnected + "no", textConnectedX, textConnectedY);
    }
}

function drawVertexBackground() {
    if (vertexBackground != 0) {
        ctx.beginPath();
        ctx.arc(G.vertices[String(vertexBackground)].x, G.vertices[String(vertexBackground)].y, vertexRadius + 2, 0, Math.PI * 2, false);
        ctx.fillStyle = vertexBackgroundColor;
        ctx.fill();
        ctx.closePath();
    }
}

function drawVertices() {
    for (var vertex in G.vertices) {
        ctx.beginPath();
        ctx.arc(G.vertices[vertex].x, G.vertices[vertex].y, vertexRadius, 0, Math.PI * 2, false);
        ctx.fillStyle = vertexColor;
        ctx.fill();
        ctx.closePath();
    }
}

function drawEdges() {
	for (var edge in G.edges) {
		var spl = G.edges[edge].split(',');
		var start = spl[0];
		var end = spl[1];
		ctx.beginPath();
		ctx.moveTo(G.vertices[start].x, G.vertices[start].y);
		ctx.lineTo(G.vertices[end].x, G.vertices[end].y);
		if (contains(S,G.edges[edge])) {
			ctx.strokeStyle = redEdge;
        } else if (contains(leafEdges, G.edges[edge])) {
            ctx.strokeStyle = blueEdge;
        }else if (contains(circleStems, G.edges[edge])) {
            ctx.strokeStyle = greenEdge;
        } else {
			ctx.strokeStyle = blackEdge;
		}
		ctx.stroke();
	}
}

function displayMessage() {
	if (hasMessage) {
		// Message text
		ctx.font = fontMessage;
		ctx.fillStyle = fontMessageColor;
		ctx.fillText(message, textMessageX, textMessageY);
        if (!animating) { //animating takes care of its own pauses
            // pause while displaying message
            window.setTimeout(function(){timer.pause(); window.setTimeout(function () {  timer.resume(); }, messageDisplayTime); }, 0)
        }
		hasMessage = false;
		message = "";
	}
}

function drawTriangles() {
    for (var triangleIndex in triangles) {

        first = triangles[triangleIndex][0];
        second = triangles[triangleIndex][1];
        third = triangles[triangleIndex][2];

        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        ctx.lineTo(second.x, second.y);
        ctx.lineTo(third.x, third.y);
        ctx.fillStyle = "rgba(60,60,60,1)";
        ctx.fill();
    }
}

//***********************************\\

// find the spanning tree in graph
// output is put in S[]
// spanning tree found using BFS search
// also checks if the graph is connected.
function bfsSpanning() {
    var numVerts = Object.keys(G.vertices).length;
    if (numVerts > 0) {
        var visited = [];
        for (x = 0; x < numVerts; x++) {
            visited.push(false);
        }
        var queue = [];
        queue.push('1');
        visited[parseInt('1') - 1] = true;
        S = [];
        while (queue.length != 0) {
            s = queue.pop(0);
            for (var edge in G.edges) {
                var edgeArr = G.edges[edge].split(",");
                if (edgeArr[0] == s) {
                    if (visited[parseInt(edgeArr[1]) - 1] == false) {
                        queue.push(edgeArr[1]);
                        visited[parseInt(edgeArr[1]) - 1] = true;
                        S.push(G.edges[edge]);
                    }
                } else if (edgeArr[1] == s) {
                    if (visited[parseInt(edgeArr[0]) - 1] == false) {
                        queue.push(edgeArr[0]);
                        visited[parseInt(edgeArr[0]) - 1] = true;
                        S.push(G.edges[edge]);
                    }
                }
            }
        }
        // check if graph is connected using helper method
        isConnected = checkConnected(visited)
        if (!isConnected) {
            S = [];
        }
    }
}

// helper method for determining if graph connected
// method actually just checks if every element in bool[] is true
function checkConnected(arr) {
    for (var edgeIndex in arr) {
        if (arr[edgeIndex] == false) {
            return false;
        }
    }
    return true;
}


//***************************\\
// ******** Animate ******** \\

function animate() {

    // STEP 1: Show the message for spanning tree
	if (step == 1) {
        hasMessage = true;
		message = "Step 1: spanning tree (ST) is in red";

        // move to next step
		step++;
	}
    
    // STEP 2: For every edge not in the spanning tree we will turn it into 3 edges
	else if (step == 2) {

        hasMessage = true;
		message = "Step 2: every edge not in ST -> 3 edges";
        
        // Must create a temporary G because we will be adding edges and vertices
        tempG = JSON.parse(JSON.stringify(G));

		// Update graph with new edges and vertices
		for (var edgeIndex in tempG.edges) {

            // if edge not in spanning tree
			if (!contains(S, tempG.edges[edgeIndex])) {
                
                miniquad = [];

				var spl = tempG.edges[edgeIndex].split(',');
				var start = spl[0];
				var end = spl[1];
				var oneThirdPos = getOneThirdPos(start, end);
                var twoThirdsPos = getTwoThirdsPos(start, end);
                
                //remove old edge from graph
                var eIndex = G.edges.indexOf(tempG.edges[edgeIndex]);
                G.edges.splice(eIndex, 1);
                numEdges--;

				// add vertex at third pos
				numVertices++;
				G.vertices[String(numVertices)] = {
					'x': oneThirdPos.x,
					'y': oneThirdPos.y
                };
                
				// add edge between start and third pos
                var vertexArray = [parseInt(start), numVertices];
		        vertexArray.sort(sortFunc);
				G.edges.push(vertexArray.join(","));
                numEdges++;
                
                // add vertex at twoThirds pos
				numVertices++;
				G.vertices[String(numVertices)] = {
					'x': twoThirdsPos.x,
					'y': twoThirdsPos.y
				};
				
				// add edge between third and twoThirds pos
                var vertexArray = [numVertices - 1, numVertices];
                vertexArray.sort(sortFunc);
				G.edges.push(vertexArray.join(","));
                numEdges++;
                
                // add edge between twoThirds and end pos
                var vertexArray = [numVertices, parseInt(end)];
                vertexArray.sort(sortFunc);
				G.edges.push(vertexArray.join(","));
                numEdges++;

                miniquad.push(start);
                miniquad.push(String(numVertices-1));
                miniquad.push(String(numVertices));
                miniquad.push(end);
                //find an edge in spanning tree connected to start
                spanningEdgeWithStart = '';
                for (var edgeIndex in S) {
                    if (S[edgeIndex].split(',')[0] == start ||
                        S[edgeIndex].split(',')[1] == start) {
                        spanningEdgeWithStart = S[edgeIndex];
                    }
                }
                otherElement = '';
                spl = spanningEdgeWithStart.split(',');
                for (var vIndex in spl) {
                    if (spl[vIndex] !== start) {
                        otherElement = spl[vIndex];
                    }
                }
                miniquad.push(otherElement);
                quads.push(miniquad);
			}
        }
		// Increment step counter
        step++;
	}
	
	else if (step == 3) {

        hasMessage = true;
        message = "Step 3: Apply Cornucopia Lemma for 2-simplices (1)";

        for (var quadIndex in quads) {
            startElement = quads[quadIndex][0];
            secondElement = quads[quadIndex][1];
            otherElement = quads[quadIndex][4];
            
            startElementLoc = G.vertices[startElement];
            secondElementLoc = G.vertices[secondElement];
            otherElementLoc = G.vertices[otherElement];

            triVertexArr = [startElementLoc, secondElementLoc, otherElementLoc];

            triangles.push(triVertexArr);

        }

        // Increment step counter
        step++;
		
    }

    else if (step == 4) {

        hasMessage = true;
        message = "Step 4: Apply Cornucopia Lemma for 2-simplices (1)";
        
        triangles = [];
        
        for (quadIndex in quads) {
            start = quads[quadIndex][0];
            first = quads[quadIndex][1];
            other = quads[quadIndex][4];

            // remove edge start-other from G
            var vertexArray = [parseInt(start), parseInt(other)];
            vertexArray.sort(sortFunc);
            tempEdge = vertexArray.join(",");
            var eIndex = G.edges.indexOf(tempEdge);
            G.edges.splice(eIndex, 1);
            numEdges--;

            var vertexArray = [parseInt(first), parseInt(other)];
            vertexArray.sort(sortFunc);
            tempEdge = vertexArray.join(",");
            G.edges.push(tempEdge);
            numEdges++;

        }


        // Increment step counter
        step++;
    }

    else if (step == 5) {

        hasMessage = true;
        message = "Step 5: Apply Cornucopia Lemma for 2-simplices (2)";
        

        for (var quadIndex in quads) {
            startElement = quads[quadIndex][1];
            secondElement = quads[quadIndex][2];
            otherElement = quads[quadIndex][4];
            
            startElementLoc = G.vertices[startElement];
            secondElementLoc = G.vertices[secondElement];
            otherElementLoc = G.vertices[otherElement];

            triVertexArr = [startElementLoc, secondElementLoc, otherElementLoc];

            triangles.push(triVertexArr);
        }

        // Increment step counter
        step++;
    }

    else if (step == 6) {

        hasMessage = true;
        message = "Step 6: Apply Cornucopia Lemma for 2-simplices (2)";
        
        triangles = [];

        for (quadIndex in quads) {
            start = quads[quadIndex][1];
            first = quads[quadIndex][2];
            other = quads[quadIndex][4];

            // remove edge start-other from G
            var vertexArray = [parseInt(start), parseInt(other)];
            vertexArray.sort(sortFunc);
            tempEdge = vertexArray.join(",");
            var eIndex = G.edges.indexOf(tempEdge);
            G.edges.splice(eIndex, 1);
            numEdges--;

            // add new edge
            var vertexArray = [parseInt(first), parseInt(other)];
            vertexArray.sort(sortFunc);
            tempEdge = vertexArray.join(",");
            G.edges.push(tempEdge);
            numEdges++;
        }

        

        // Increment step counter
        step++;
    }

    else if (step == 7) {

        hasMessage = true;
        message = "Step 7: Find edges with a 'leaf' as an endpoint";

        keysArr = Object.keys(G.vertices);
        for (vertexIndex in keysArr) {
            count = 0;
            recentEdge = '';
            for (edgeIndex in G.edges) {
                if (G.edges[edgeIndex].split(',')[0] == keysArr[vertexIndex] ||
                    G.edges[edgeIndex].split(',')[1] == keysArr[vertexIndex]) {
                    count++;
                    recentEdge = G.edges[edgeIndex];
                }
            }
            if (count < 2) {
                leafEdges.push(recentEdge);
                leafVertices.push(keysArr[vertexIndex]);
            }
        }

        // Increment step counter
        step++;
    }

    else if (step == 8) {

        hasMessage = true;
        message = "Step 8: Remove leaf edges";

        // remove edges
        for (edgeIndex in leafEdges) {
            var eIndex = G.edges.indexOf(leafEdges[edgeIndex]);
            G.edges.splice(eIndex, 1);
            numEdges--;
        }

        // remove vertices
        for (vertexIndex in leafVertices) {
            delete G.vertices[leafVertices[vertexIndex]];
            numVertices--;
        }

        leafEdges = [];
        leafVertices = [];
        
        // check if more leaf edges now exist after first layer of removal
        keysArr = Object.keys(G.vertices);
        numLeafEdges = 0;
        for (vertexIndex in keysArr) {
            count = 0;
            recentEdge = '';
            for (edgeIndex in G.edges) {
                if (G.edges[edgeIndex].split(',')[0] == keysArr[vertexIndex] ||
                    G.edges[edgeIndex].split(',')[1] == keysArr[vertexIndex]) {
                    count++;
                    recentEdge = G.edges[edgeIndex];
                }
            }
            if (count < 2) {
                numLeafEdges++;
            }
        }
        // if more exist go back to step 7
        if (numLeafEdges > 0) {
            step--;
        } else {
            // Increment step counter
            step++;
        }
    }

    else if (step == 9) {

        hasMessage = true;
        message = "Step 9: Identity circle stems";
        S = [];

        edgesOnCircles = [];

        for (var quadIndex in quads) {
            startElement = quads[quadIndex][2];
            secondElement = quads[quadIndex][3];
            otherElement = quads[quadIndex][4];

            var vertexArray = [parseInt(startElement), parseInt(secondElement)];
            vertexArray.sort(sortFunc);
            tempEdge = vertexArray.join(",");
            edgesOnCircles.push(tempEdge);

            var vertexArray = [parseInt(otherElement), parseInt(secondElement)];
            vertexArray.sort(sortFunc);
            tempEdge = vertexArray.join(",");
            edgesOnCircles.push(tempEdge);

            var vertexArray = [parseInt(startElement), parseInt(otherElement)];
            vertexArray.sort(sortFunc);
            tempEdge = vertexArray.join(",");
            edgesOnCircles.push(tempEdge);
        }

        for (edgeIndex in G.edges) {
            if (!contains(edgesOnCircles, G.edges[edgeIndex])) {
                for (eIndex in edgesOnCircles) {
                    if (G.edges[edgeIndex].split(',')[0] == edgesOnCircles[eIndex].split(',')[0] || 
                        G.edges[edgeIndex].split(',')[0] == edgesOnCircles[eIndex].split(',')[1] ||
                        G.edges[edgeIndex].split(',')[1] == edgesOnCircles[eIndex].split(',')[0] ||
                        G.edges[edgeIndex].split(',')[1] == edgesOnCircles[eIndex].split(',')[1]) {
                        
                        circleStems.push(G.edges[edgeIndex]);
                    }
                }
                
            }
        }

        // Increment step counter
        step++;
    }

    else if (step == 10) {

        hasMessage = true;
        message = "Apply Cornucopia Lemma for 1-simplices";

        
        

        // Increment step counter
        step++;
    }
    
    else if (step == 11) {
        animating = false;
        finishedAnimating = true;
    }

    
}

//***************************\\




//**********************************************\\
// ******** Helper Methods For Animate ******** \\

//input parameters are integers as strings (vertex name)
function getOneThirdPos(start, end) {
	var startLoc = G.vertices[start];
	var endLoc = G.vertices[end];
	return {
		'x': ((1-(1/3)) * startLoc.x) + ((1/3) * endLoc.x),
		'y': ((1-(1/3)) * startLoc.y) + ((1/3) * endLoc.y)
	};
}

function getTwoThirdsPos(start, end) {
	var startLoc = G.vertices[start];
	var endLoc = G.vertices[end];
	return {
		'x': ((1-(2/3)) * startLoc.x) + ((2/3) * endLoc.x),
		'y': ((1-(2/3)) * startLoc.y) + ((2/3) * endLoc.y)
	};
}

//**********************************************\\



//************************\\
// ******** Draw ******** \\

function draw() {
    if (animating) {
        // pause for step
        window.setTimeout(function(){timer.pause(); window.setTimeout(function(){timer.resume();}, animationTime);}, 0)
        animate();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        initialize();
        headerData();
        drawVertexBackground();
        drawVertices();
        drawEdges();
        displayMessage();
        drawTriangles();
        
    }

    else if (building) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        initialize();
        headerData();
        drawVertexBackground();
        bfsSpanning();
        drawVertices();
        drawEdges();
        displayMessage();
    }
    else {
    //else if (finishedAnimating) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        initialize();
        headerData();
        drawVertexBackground();
        drawVertices();
	    drawEdges();
	    displayMessage();
    }

    
}

//************************\\



//********************************\\
// ******** Timer Details ******** \\

// Timer/execution details
function InvervalTimer(callback, interval) {
        var timerId, startTime, remaining = 0;
        var state = 0; // 0 = idle, 1 = running, 2 = paused, 3= resumed

        this.pause = function () {
            if (state != 1) return;
            remaining = interval - (new Date() - startTime);
            window.clearInterval(timerId);
            state = 2;
        };

        this.resume = function () {
            if (state != 2) return;
            state = 3;
            window.setTimeout(this.timeoutCallback, remaining);
        };

        this.timeoutCallback = function () {
            if (state != 3) return;
            callback();
            startTime = new Date();
            timerId = window.setInterval(callback, interval);
            state = 1;
        };

        startTime = new Date();
        timerId = window.setInterval(callback, interval);
        state = 1;
}

// timer that controls all graphics
// calls the draw() function every 20 milliseconds
var timer = new InvervalTimer(function(){draw()}, 20);
		
//********************************\\

