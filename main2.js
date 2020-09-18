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
       this.textureWidth = 128;
       this.textureHeight = 200;
      const border = 0;
      const srcFormat = gl.ALPHA;
      const srcType = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array(this.textureWidth * this.textureHeight * 3);
      console.log(pixel.length);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    this.textureWidth, this.textureHeight, border, srcFormat, srcType,
                    pixel);

       return texture;
    }

    shadersDefine() {
        this.vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }            `;

        this.fsSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;
}
              
    shadersLoad() {
        const shaderProgram = initShaderProgram(this.gl, this.vsSource, this.fsSource);
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                positionX1: this.gl.getUniformLocation(shaderProgram, 'uPositionX1'),
                positionY1: this.gl.getUniformLocation(shaderProgram, 'uPositionY1'),
                positionX2: this.gl.getUniformLocation(shaderProgram, 'uPositionX2'),
                positionY2: this.gl.getUniformLocation(shaderProgram, 'uPositionY2'),
                simple: this.gl.getUniformLocation(shaderProgram, 'uSimple'),
            },
        };
    }

    initBuffers() {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        var positions = [];
        this.width = 128;
        this.height = 4;

        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                positions.push(x / this.width);
                positions.push(y / this.height);
                positions.push(0);//sMath.sin((x + y) / 30));
            }
        }
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            3 * 4 * this.width * this.height,
            this.gl.DYNAMIC_DRAW);
        return {
            position: positionBuffer,
        };
    }
    
    writeData(fft) {


      //  var y = (this.clock * 1) % this.height;
        
         this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);        
                 
        for (var y = 0; y < this.height; y++) {
            var positions = [];
            var i = 0;
            for (var x = 0; x < this.width; x++) {
                positions.push(x / this.width);
                positions.push(y / this.height);
                positions.push(fft[i] / 256.0);
                i++;
            }
            
         this.gl.bufferSubData(this.gl.ARRAY_BUFFER,
            y * this.width * 4 * 3,
            new Float32Array(positions),
            0,
            2);
        }
        const gl = this.gl;
        
        this.offset = (this.offset + 1) % this.textureHeight;
        
        //  gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, this.offset, 0, this.textureWidth, 1, gl.ALPHA, gl.UNSIGNED_BYTE, fft);

        
         this.clock++;
   
    }

    drawScene() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            3,
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

        this.gl.useProgram(this.programInfo.program);
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);

        for (var y = 0; y < this.height; y++) {
            this.gl.drawArrays(this.gl.LINE_STRIP, 0 + y * this.width, this.width);
        }
        
        const gl = this.gl;
        
         // Tell WebGL we want to affect texture unit 0
          gl.activeTexture(gl.TEXTURE0);

          // Bind the texture to texture unit 0
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
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


        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(this.handleSuccess.bind(this));
    }

    handleSuccess(stream) {
        const context = new AudioContext();
        this.analyser = context.createAnalyser();
        this.analyser.fftSize = 256;
        this.minDecibels = -90;
                this.maxDecibels = -10;
        this.fftArray = new Uint8Array(this.analyser.frequencyBinCount);
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
            this.analyser.getByteFrequencyData(this.fftArray);
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
    vis.setRotateY(clock % 360);
    clock++;
}

tick();
