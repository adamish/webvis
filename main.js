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

        // Draw the scene
        this.drawScene();

    }

    shadersDefine() {
        // Vertex shader program
        this.vsSource = `
            attribute vec4 aVertexPosition;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying highp vec3 fragCoord;
            void main() {
              gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
              fragCoord = vec3(gl_Position.x, gl_Position.y, gl_Position.z);
            }   
            `;

        // Fragment shader program

        this.fsSource = `
            precision highp float;
            uniform float uPositionX1;
            uniform float uPositionY1;
            uniform float uPositionX2;
            uniform float uPositionY2;
            uniform float uSimple;
            
            varying highp vec3 fragCoord;
            
            void main() {
              gl_FragColor = vec4(fragCoord.z * 4.0, 0.5, fragCoord.z, 1);
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

        var positions = [];
        var i = 0;
        var y = (this.clock * 1) % this.height;
        for (var x = 0; x < this.width; x++) {
            positions.push(x / this.width);
            positions.push(y / this.height);
            positions.push(fft[i] / 256.0);
            i++;
        }
    
         this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);        

         this.gl.bufferSubData(this.gl.ARRAY_BUFFER,
            y * this.width * 4 * 3,
            new Float32Array(positions),
            0,
            2);
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
            [-0.5, -0.5, -2.0]);

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
