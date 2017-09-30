// genie-to-circle.js

// Morph the genie into a circle.  Illustrates tweening with
// interleaved attributes in the vertex buffer

const numpts  = 14000;                // Number of points on each curve
var gl;
var vertices = [];
var size = 0.25;          // Genie parameter
var tweenLoc;    // Location of the shader's uniform tweening variable
var goingToCircle = true;
var bounce = false;
var tweenFactor = 0.0;
var canvas;
var tweenRate = 0.015;

var pMatrix;
var projection;
var u_colorLocation;

// this one messes with the dragon
var firstFrac = {
	LEFT: -14.5,
	RIGHT: 14.75,
	BOTTOM: -5.5,
	TOP: 15.0
};

// this one messes with carpet
var secondFrac = {
	LEFT: -10.0,
	RIGHT: 10.0,
	BOTTOM: -10.0,
	TOP: 10.0
};

window.onload = function init(){
    canvas = document.getElementById( "gl-canvas" );
    
    //    gl = WebGLUtils.setupWebGL( canvas );
    gl = WebGLDebugUtils.makeDebugContext( canvas.getContext("webgl") ); // For debugging
    if ( !gl ) { alert( "WebGL isn't available" );
               }
    
    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Manufacture the interleaved genie and circle points
    //genieAndCircle(size);
	generateFractalPoints();
	
    //    console.log(sizeof.vec2);     // This outputs 8, which is very
                                        // useful to know below
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer

    var sPosition = gl.getAttribLocation( program, "sPosition" );
    gl.vertexAttribPointer(
        sPosition, // Specifies the index of the generic vertex attribute to be modified.
        2,         // Specifies the number of components per generic vertex attribute. 
                                       // Must be 1, 2, 3, or 4. 
        gl.FLOAT,  // Specifies the data type of each component in the array. 
            // GL_BYTE, GL_UNSIGNED_BYTE, GL_SHORT, GL_UNSIGNED_SHORT, GL_FIXED, or GL_FLOAT. 
        false,     // Specifies whether fixed-point data values should be normalized (GL_TRUE) 
            // or converted directly as fixed-point values (GL_FALSE) when they are accessed.
        16,            // Specifies the byte offset between consecutive generic vertex attributes. 
            // If stride is 0, the generic vertex attributes are understood 
            // to be tightly packed in the array.
        0              // Specifies a pointer to the first component 
            // of the first generic vertex attribute in the array.
                          );
    gl.enableVertexAttribArray( sPosition );    

    var gPosition = gl.getAttribLocation( program, "gPosition" );
    gl.vertexAttribPointer(
        gPosition, // Specifies the index of the generic vertex attribute to be modified.
        2,         // Specifies the number of components per generic vertex attribute. 
                                       // Must be 1, 2, 3, or 4. 
        gl.FLOAT,  // Specifies the data type of each component in the array. 
            // GL_BYTE, GL_UNSIGNED_BYTE, GL_SHORT, GL_UNSIGNED_SHORT, GL_FIXED, or GL_FLOAT. 
        false,     // Specifies whether fixed-point data values should be normalized (GL_TRUE) 
            // or converted directly as fixed-point values (GL_FALSE) when they are accessed.
        16,            // Specifies the byte offset between consecutive generic vertex attributes. 
            // If stride is 0, the generic vertex attributes are understood 
            // to be tightly packed in the array.
        8              // Specifies a pointer to the first component 
            // of the first generic vertex attribute in the array.
                          );
    gl.enableVertexAttribArray( gPosition );
	
	u_colorLocation = gl.getUniformLocation(program, "u_Color");

    tweenLoc = gl.getUniformLocation(program, "tween");
	
	projection = gl.getUniformLocation( program, "projection" );

    render();
};

function generateFractalPoints () {

    var iter, t1, t2;
    var oldfrac1x = 0;
    var oldfrac1y = 0;
	
	var oldfrac2x = 0;
    var oldfrac2y = 0;
    var frac1x, frac1y, frac2x, frac2y, p;
    var cumulative_prob1 = [];
	var cumulative_prob2 = [];

    cumulative_prob1.push(frac1.transformations[0].prob);
    for (var i = 1; i < frac1.transformations.length; i++)
	cumulative_prob1.push(cumulative_prob1[i-1] + frac1.transformations[i].prob); // Make probability cumulative

	cumulative_prob2.push(frac2.transformations[0].prob);
    for (var i = 1; i < frac2.transformations.length; i++)
	cumulative_prob2.push(cumulative_prob2[i-1] + frac2.transformations[i].prob); // Make probability cumulative

    iter = 0;
    while (iter < numpts)
    {
		p = Math.random();
			
		// Select transformation t
		t1 = 0;
		while ((p > cumulative_prob1[t1]) && (t1 < frac1.transformations.length - 1)) t1++;
		
		// Transform point by transformation t 
		frac1x = frac1.transformations[t1].rotate_scalexx*oldfrac1x
			+ frac1.transformations[t1].rotate_scalexy*oldfrac1y
			+ frac1.transformations[t1].trans_x;
		frac1y = frac1.transformations[t1].rotate_scaleyx*oldfrac1x
			+ frac1.transformations[t1].rotate_scaleyy*oldfrac1y
			+ frac1.transformations[t1].trans_y;
			
		t2 = 0;
		while ((p > cumulative_prob2[t2]) && (t2 < frac2.transformations.length - 1)) t2++;
		
		// Transform point by transformation t 
		frac2x = frac2.transformations[t2].rotate_scalexx*oldfrac2x
			+ frac2.transformations[t2].rotate_scalexy*oldfrac2y
			+ frac2.transformations[t2].trans_x;
		frac2y = frac2.transformations[t2].rotate_scaleyx*oldfrac2x
			+ frac2.transformations[t2].rotate_scaleyy*oldfrac2y
			+ frac2.transformations[t2].trans_y;
			
		// Jump around for awhile without plotting to make
		//   sure the first point seen is attracted into the
		//   fractal
		if (iter > 20) {
			vertices.push(vec2(frac1x, frac1y, 0.0));
			vertices.push(vec2(frac2x, frac2y, 0.0));
		}
		oldfrac1x = frac1x;
		oldfrac1y = frac1y;
		
		oldfrac2x = frac2x;
		oldfrac2y = frac2y;
		iter++;
    }
};


function genieAndCircle(size) {
    const NUM = 300;
    var i, fact, fact_now, fact7, fact8;
    
    fact = 2.0 * Math.PI / NUM;
    for (i = 0; i < NUM; ++i) {
        fact_now = fact * i;
        fact7 = fact_now * 7;
        fact8 = fact_now * 8;
	// A genie vertex coordinate
        vertices.push( vec2(size * (Math.cos(fact_now) + Math.sin(fact8)),
                            size * (2.0 * Math.sin(fact_now) + Math.sin(fact7))));
	// A circle vertex coordinate
        vertices.push( vec2(Math.cos(fact_now), Math.sin(fact_now)));
    }
};

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );
	
	var left, right, bottom, top;

    if (goingToCircle) {
		tweenFactor = Math.min(tweenFactor + tweenRate, 1.0);
		left = (tweenFactor * firstFrac.LEFT) + ((1-tweenFactor) * secondFrac.LEFT);
		right = (tweenFactor * firstFrac.RIGHT) + ((1-tweenFactor) * secondFrac.RIGHT); 
		bottom = (tweenFactor * firstFrac.BOTTOM) + ((1-tweenFactor) * secondFrac.BOTTOM); 
		top = (tweenFactor * firstFrac.TOP) + ((1-tweenFactor) * secondFrac.TOP); 		
		pMatrix = ortho(left, right, bottom, top, -1.0, 1.0);
		
		//pMatrix = ortho(secondFrac.LEFT, secondFrac.RIGHT, secondFrac.BOTTOM, secondFrac.TOP, -1.0, 1.0);
        
        if (tweenFactor >= 1.0)  {
			if(bounce){
				goingToCircle = !goingToCircle;
			}
            document.getElementById('caption-for-the-goal').innerHTML="Dragon-to-Carpet";
        }
	
    }
    else {
		tweenFactor = Math.max(tweenFactor - tweenRate, 0.0);
		left = (tweenFactor * firstFrac.LEFT) + ((1-tweenFactor) * secondFrac.LEFT);
		right = (tweenFactor * firstFrac.RIGHT) + ((1-tweenFactor) * secondFrac.RIGHT); 
		bottom = (tweenFactor * firstFrac.BOTTOM) + ((1-tweenFactor) * secondFrac.BOTTOM); 
		top = (tweenFactor * firstFrac.TOP) + ((1-tweenFactor) * secondFrac.TOP);
		pMatrix = ortho(left, right, bottom, top, -1.0, 1.0);
		
		//pMatrix = ortho(firstFrac.LEFT, firstFrac.RIGHT, firstFrac.BOTTOM, firstFrac.TOP, -1.0, 1.0);
        
        if (tweenFactor <= 0.0) {
			if(bounce){
				goingToCircle = !goingToCircle;
			}
            document.getElementById('caption-for-the-goal').innerHTML="Carpet-to-Dragon";
        }           
    }
	
	gl.uniform4f(u_colorLocation, 1.0*tweenFactor, 1.0*tweenFactor, 1.0*tweenFactor, 1);
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
	
    gl.uniform1f(tweenLoc, tweenFactor);
    gl.drawArrays( gl.Points, 0, vertices.length/2 ); // Why divide by 2?
    requestAnimFrame( render );
}

window.onkeyup = function(e) {
   var key = e.keyCode ? e.keyCode : e.which;
	
   if (key == 82) {
	    // 82 == 'r'
		goingToCircle = !goingToCircle;
   }else if(key == 38){
	   // key up
	   tweenRate = Math.min(tweenRate + .01, .3);
   }else if(key == 40){
	   // key down
	   tweenRate = Math.max(tweenRate - .01, .0001);
   }else if( key == 69){
	   //explode
	   tweenRate = -.05;
   }else if(key == 66){
	   bounce = !bounce;
   }else{
	   tweenRate = .15;
   }
}
