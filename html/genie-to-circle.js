// genie-to-circle.js

// Morph the genie into a circle.  Illustrates tweening with
// interleaved attributes in the vertex buffer

const NUM = 300;                // Number of points on each curve
var gl;
var vertices = [];
var size = 0.25;          // Genie parameter
var tweenLoc;    // Location of the shader's uniform tweening variable
var goingToCircle = true;
var tweenFactor = 0.0;
var canvas;

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
    genieAndCircle(size);
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

    tweenLoc = gl.getUniformLocation(program, "tween");

    render();
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

    if (goingToCircle) {
        tweenFactor = Math.min(tweenFactor + 0.01, 1.0);
        if (tweenFactor >= 1.0)  {
            goingToCircle = false;
            document.getElementById('caption-for-the-goal').innerHTML="Circle-to-genie";
        }
	
    }
    else {
        tweenFactor = Math.max(tweenFactor - 0.01, 0.0);
        if (tweenFactor <= 0.0) {
            goingToCircle = true;
            document.getElementById('caption-for-the-goal').innerHTML="Genie-to-circle";
        }           
    }
    gl.uniform1f(tweenLoc, tweenFactor);
    gl.drawArrays( gl.LINE_LOOP, 0, vertices.length/2 ); // Why divide by 2?
    requestAnimFrame( render );
}
