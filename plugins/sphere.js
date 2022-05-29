/**
 * aVertexPosition are 3D coordinates of points on a sphere
 * vSoundData - varying with sound data used to tweak colours 
 * 
 */
class Sphere extends Plugin {
    getId() {
        return "sphere";
    }
    getVertexShader() {
        return `
            attribute vec4 aVertexPosition;
            attribute lowp float aSoundData;
            varying lowp float vSoundData;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

            void main(void) {
              gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
              gl_PointSize = 1.0;
              vSoundData = aSoundData;
            }`;
    }

    getFragmentShader() {
        return `
		    varying lowp float vSoundData;
		    uniform lowp float uClock;
            void main(void) {
              gl_FragColor = vec4(0.8 + abs(vSoundData)  / 100.0, 0.0, 0.0, 1.0);
            }`
    }

    loadVariables(gl, shaderProgram) {
        this.programInfo = {};
        this.programInfo.aVertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.programInfo.uClock = gl.getUniformLocation(shaderProgram, 'uClock');
        this.programInfo.aSoundData = gl.getAttribLocation(shaderProgram, 'aSoundData');
    }

    init(gl, options) {
        this.gl = gl;
        this.width = options.frequencyBinCount;
        this.clock = 0;
        // positions
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        var positions = [];
        var a = 0;
        var aDelta = 5;
        var b = 0;
        var bDelta = 5;
        var aRad = 0;
        var bRad = 0;
        var r = 0.6;
        for (b = 0; b < 180; b += bDelta) {
            for (a = 0; a < 360; a += aDelta) {
                aRad = a / 180 * Math.PI;
                bRad = b / 180 * Math.PI;
                positions.push(r * Math.sin(aRad) * Math.cos(bRad));
                positions.push(r * Math.cos(aRad));
                positions.push(r * Math.sin(bRad) * Math.sin(aRad));
            }
        }
        this.totalPoints = positions.length / 3;
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);

        this.positionBuffer = positionBuffer;

        // placeholder for FFT data
        this.aSoundData = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.aSoundData);
        var data2 = [];
        var x;
        for (x = 0; x < this.width; x++) {
            data2.push(x);
        }

        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(data2),
            gl.STATIC_DRAW);
    }

    writeFft(fft) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.aSoundData);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, fft);
    }

    draw() {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.programInfo.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.aVertexPosition, 0); // webgl2
        gl.enableVertexAttribArray(this.programInfo.aVertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.aSoundData);
        gl.vertexAttribPointer(this.programInfo.aSoundData, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.aSoundData, 1); // webgl2
        gl.enableVertexAttribArray(this.programInfo.aSoundData);

        gl.uniform1f(this.programInfo.uClock, this.clock);
        gl.drawArrays(gl.POINTS, 0, this.totalPoints);
        this.clock++;
    }
    getInputType() {
        return "fft";
    }
}

pluginRegistry.add(new Sphere())