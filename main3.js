class WebGl {
    constructor() {
        this.rotateX = 0;
        this.rotateY = 0;
        this.rotateZ = 0;
    }
    main() {
        const canvas = document.querySelector('#glcanvas');
        this.gl = canvas.getContext('webgl');

        // If we don't have a GL context, give up now

        if (!this.gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }
        
        this.shadersDefine();
        this.shadersLoad();
        this.clock = 0;
       this.textureWidth = 128;
       this.textureHeight = 128;
       this.insertPos = this.textureHeight - 1;
       this.bufferCyclic = new Float32Array(this.textureWidth * this.textureHeight);
      this.bufferPrerender = new Float32Array(this.textureWidth * this.textureHeight);
        this.buffers = this.initBuffers();
        this.texture = this.createTexture();
        // Draw the scene
        this.drawScene();

    }
    
    createTexture() {
      const gl = this.gl;       
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const level = 0;
      const internalFormat = gl.ALPHA;

       this.textureHeadOffset = 0;
      const border = 0;
      const srcFormat = gl.ALPHA;
      const srcType = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array(this.textureWidth * this.textureHeight * 4);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                   this.textureWidth, this.textureHeight, border, srcFormat, srcType,
                    pixel);

       return texture;
    }

    shadersDefine() {
        this.vsSource = `
    attribute vec2 aVertexPositionXY;
    attribute float aVertexPositionZ;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

    void main(void) {
      vec4 vertexPosition = vec4(aVertexPositionXY.x, aVertexPositionXY.y, aVertexPositionZ, 1.0);
      gl_Position = uProjectionMatrix * uModelViewMatrix * vertexPosition;
      gl_PointSize = 1.0 + aVertexPositionZ;
    }`;

        this.fsSource = `
    void main(void) {
      gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    }
  `;
}
              
    shadersLoad() {
        var gl = this.gl;
        const shaderProgram = initShaderProgram(this.gl, this.vsSource, this.fsSource);
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPositionXY: this.gl.getAttribLocation(shaderProgram, 'aVertexPositionXY'),
                vertexPositionZ: this.gl.getAttribLocation(shaderProgram, 'aVertexPositionZ'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                 uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
                 textureHeadOffset: gl.getUniformLocation(shaderProgram, 'textureHeadOffset'),
              textureHeight: gl.getUniformLocation(shaderProgram, 'textureHeight'),
                clock: gl.getUniformLocation(shaderProgram, 'clock')
            },
        };
    }

    initBuffers() {
        const bufferXY = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferXY);
        var positionsXY = [];
        var x = 0;
        var y = 0;
       for (y = 0; y < this.textureHeight; y++) {
            for (x = 0; x < this.textureWidth; x++) {
                positionsXY.push(-0.5 + x / this.textureWidth);
                positionsXY.push(-0.5 + y / this.textureHeight);
            }
        }
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(positionsXY),
            this.gl.STATIC_DRAW);

        const bufferZ = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferZ);
        var positionsZ = [];
        for (var x = 0; x < this.textureWidth; x++) {
            for (var y = 0; y < this.textureHeight; y++) {
                positionsZ.push(0);
            }
        }
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(positionsZ),
            this.gl.DYNAMIC_DRAW);
            
                        
        return {
            bufferXY: bufferXY,
            bufferZ: bufferZ
        };
    }
    
    writeData(fft) {
        const gl = this.gl;
                
 
                 
        var dest = this.insertPos * this.textureWidth;
        var valid = Math.min(fft.length, this.textureWidth);
        for (var i = 0; i < valid; i++) {
            this.bufferCyclic[dest++] = fft[i] / 256.0;
        }
        if (fft.length != this.textureWidth) {
           console.warn(fft.length + " vs " + this.textureWidth);
        }
           

           
        // 0: 14
        // 1: 13
        // 2: 17 <== insert pos here
        // 3: 16
        // 4: 15
        
        // 0: 14, 14
        // 1: 13, 13
        // 2: 12, 12 
        // 3: 11, 11
        // 4: 15, 15 <== insert pos here
        
        
         // void gl.bufferSubData(target, offset, ArrayBuffer srcData); 
         // render (17, 16, 15) to position 0
        var headRows = this.textureHeight - this.insertPos;
        var headPortion = this.bufferCyclic.slice(this.insertPos * this.textureWidth);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.bufferZ);     
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER,
            0,
            headPortion);

        // head (14, 13)
        var tailRows = this.insertPos;
        var tailPortion = this.bufferCyclic.slice(0, (tailRows * this.textureWidth));
        if (tailRows > 0) {
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER,
                    headRows * this.textureWidth * 4, // <== byte location
                    tailPortion);

        }

        this.insertPos--;
        if (this.insertPos < 0) {
            this.insertPos = this.textureHeight - 1;
        }
    }

    drawScene() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.gl.useProgram(this.programInfo.program);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2,
            this.gl.FLOAT,
            false,
            0,
            0);

        this.gl.enableVertexAttribArray(
            this.programInfo.attribLocations.vertexPosition);

        const fieldOfView = 30 * Math.PI / 180;
        const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        const zNear = 1;
        const zFar = 100.0;
        const projectionMatrix = glMatrix.mat4.create();

        glMatrix.mat4.perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);


        const modelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(modelViewMatrix,
            modelViewMatrix,
            [-0.5, -0.5, -5.0]);

        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix,
            this.rotateX / 180 * Math.PI,
            [1, 0, 0]);

        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix,
            this.rotateY / 180 * Math.PI,
            [0, 1, 0]);

        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix,
            this.rotateZ / 180 * Math.PI,
            [0, 0, 1]);


        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);

       this.gl.uniform1i(this.programInfo.uniformLocations.clock, this.clock);
        
        const gl = this.gl;
            
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bufferXY);
        gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPositionXY, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPositionXY);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bufferZ);
        gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPositionZ, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPositionZ);
        
        this.gl.drawArrays(this.gl.POINTS, 0, this.textureWidth * this.textureHeight);
    }

    setRotateX(rotateX) {
        this.rotateX = rotateX;
        this.drawScene();
    }
    setRotateY(rotateY) {
        this.rotateY = rotateY;
        this.drawScene();
    }

    setRotateZ(rotateZ) {
        this.rotateZ = rotateZ;
        this.drawScene();
    }
        getTextureWidth() {
        return this.textureWidth;
    }
    getTextureHeight() {
        return this.textureHeight;
    }

}

var vis = new WebGl();
vis.main();

var rotateX = document.getElementById("rotateX");
rotateX.addEventListener('input', function() {
    vis.setRotateX(rotateX.value);
});
var rotateY = document.getElementById("rotateY");
rotateY.addEventListener('input', function() {
    vis.setRotateY(rotateY.value);
});
var rotateZ = document.getElementById("rotateZ");
rotateZ.addEventListener('input', function() {
    vis.setRotateZ(rotateZ.value);
});


class Input {
    init() {
this.minDb = -30;

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(this.handleSuccess.bind(this));
    }
    setMinDb(minDb) {
        this.minDb = minDb;
        this.analyser.minDecibels = minDb;
    }
    handleSuccess(stream) {
        const context = new AudioContext();
        this.analyser = context.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.minDecibels = -50;
        this.analyser.maxDecibels = -10;
        this.fftArray = new Float32Array(this.analyser.frequencyBinCount);
        this.analyserInit = true;    
       const source = context.createMediaStreamSource(stream);
       // const processor = context.createScriptProcessor(1024, 1, 1);

       // processor.onaudioprocess = function(e) {
          //  var input = e.inputBuffer.getChannelData(0);
            //console.log(input);
        //};
        
        source.connect(this.analyser);
      //  this.analyser.connect(context.destination);
        

    }
    getFft() {
        if (this.analyserInit) {
            this.analyser.getFloatFrequencyData(this.fftArray);
         //   console.log(this.fftArray);
        }
        return this.fftArray;
    }
    
    
}

var input = new Input();
input.init();

var clock = 0;
function tick() {
    var fft = input.getFft();
    if (fft) {
        vis.writeData(fft);
        vis.drawScene();
    }
    requestAnimationFrame(tick);
    //vis.setRotateY(clock % 360);
    clock++;
}


function tick2() {
    var i;
    var diff;
    var width = vis.getTextureWidth();
        var fft = new Uint8Array(width);
    var target = clock % width;
    for (i = 0; i < width; i++) {
        if (i == target) {
            fft[i] = 20;
        }
    }
    //console.log(fft);
    
    if (fft) {
        vis.writeData(fft);
        vis.drawScene();
    }
    if (clock < 10 * vis.getTextureHeight()) {
        requestAnimationFrame(tick2);
    }
    //vis.setRotateY(clock % 360);
    clock++;
}



var minDb = document.getElementById("minDb");
minDb.addEventListener('input', function() {
    input.setMinDb(minDb.value);
});

tick();
