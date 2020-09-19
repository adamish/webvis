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
       this.textureHeight = 64;
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
    uniform int textureHeadOffset;
    uniform int textureHeight;
    uniform int clock;
    void main(void) {
      mediump float o = float(textureHeadOffset) / float(textureHeight);
      mediump float offset = o - vTextureCoord.y;
      if (offset < 0.0) {
         offset = 1.0 + offset;
      }
      mediump vec4 v = texture2D(uSampler, vec2(vTextureCoord.x, offset));
      gl_FragColor = vec4(min(v.a * 5.0, 1.0), 0.4 * abs(sin(float(clock)/180.0)) , 0.0, 1.0);
    }
  `;
}
              
    shadersLoad() {
        var gl = this.gl;
        const shaderProgram = initShaderProgram(this.gl, this.vsSource, this.fsSource);
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
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
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0,  1.0,
             1.0,  1.0,
            -1.0, -1.0,
             1.0, -1.0,
          ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(positions),
            this.gl.STATIC_DRAW);
            
        const textureCoord = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoord);
        const positionsTexture = [
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            1.0,  1.0
          ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(positionsTexture),
            this.gl.STATIC_DRAW);
            
        return {
            position: positionBuffer,
            textureCoord: textureCoord
        };
    }
    
    writeData(fft) {
        const gl = this.gl;
        
        var offset = (this.clock % this.textureHeight);
        
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, offset, this.textureWidth, 1, gl.ALPHA, gl.UNSIGNED_BYTE, fft);
        if (offset == 0) {
          //      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.textureWidth, this.textureHeight, gl.ALPHA, gl.UNSIGNED_BYTE, new Uint8Array(this.textureWidth * this.textureHeight));
         }

    this.textureHeadOffset = offset;
             this.clock++;
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

        this.gl.uniform1i(this.programInfo.uniformLocations.textureHeadOffset, this.textureHeadOffset);
       this.gl.uniform1i(this.programInfo.uniformLocations.textureHeight, this.textureHeight);
       this.gl.uniform1i(this.programInfo.uniformLocations.clock, this.clock);
        
        const gl = this.gl;
        
          const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.textureCoord);
    gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, num, type, false, 0, 0);
    gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
    
          gl.activeTexture(gl.TEXTURE0);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
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
this.minDb = -30;

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(this.handleSuccess.bind(this));
    }
    setMinDb(minDb) {
        this.minDb = minDb;
    }
    handleSuccess(stream) {
        const context = new AudioContext();
        this.analyser = context.createAnalyser();
        this.analyser.fftSize = 512;
        this.minDecibels = minDb;
                this.maxDecibels = 0;
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

var minDb = document.getElementById("minDb");
minDb.addEventListener('input', function() {
    input.setMinDb(minDb.value);
});

tick();
