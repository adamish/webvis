/**
 * sphere drawn in vertex shader
 * 
 */
class Sphere2 extends Plugin {
    getId() {
        return "sphere-2";
    }
    getVertexShader() {
        return `
            #define PI 3.1415926538
            attribute float aVertexPositionN;
            attribute lowp float aSoundData;
            varying lowp float vSoundData;
            varying lowp float vVertexPositionN;
            uniform lowp float uPointsPerCircle;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform lowp float uClock;
            void main(void) {
              float beta = floor(aVertexPositionN / uPointsPerCircle) / uPointsPerCircle * PI * 2.0;
              float alpha = mod(aVertexPositionN, uPointsPerCircle) / uPointsPerCircle * PI * 2.0;
              float r = 0.9;

              float speed = 2.0;
              float shift1 = sin(uClock / 75.0) * speed;
              float shift2 = sin(uClock / 50.0) * speed;
              float shift3 = sin(uClock / 50.0) * speed;

              float x = r * sin(alpha + shift1) * cos(beta + shift1) * sin(shift1);
              float y = r * cos(alpha + shift2)* cos(shift1);
              float z = r * sin(beta + shift3) * sin(alpha + shift3);
              
              gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(x, y, z, 1.0);
    
              gl_PointSize = 3.0;
              vSoundData = aSoundData;
              vVertexPositionN = aVertexPositionN;
            }`;
    }

    getFragmentShader() {
        return `
		    varying lowp float vSoundData;
		    varying lowp float vVertexPositionN;
		    uniform lowp float uClock;
		    uniform lowp float uPointsPerCircle;
            void main(void) {
              lowp float r = mod(vVertexPositionN + uClock, uPointsPerCircle * uPointsPerCircle) / (uPointsPerCircle * uPointsPerCircle);
              lowp float g = 0.0;
              lowp float b = 0.0 - vSoundData / 128.0;
              gl_FragColor = vec4(r, g, b, 1.0);
            }`
    }

    loadVariables(gl, shaderProgram) {
        this.programInfo = {};
        this.programInfo.aVertexPositionN = gl.getAttribLocation(shaderProgram, 'aVertexPositionN');
        this.programInfo.aSoundData = gl.getAttribLocation(shaderProgram, 'aSoundData');
        this.programInfo.uClock = gl.getUniformLocation(shaderProgram, 'uClock');
        this.programInfo.pointsPerCircle = gl.getUniformLocation(shaderProgram, 'uPointsPerCircle');
    }

    init(gl, options) {
        this.gl = gl;
        this.width = options.frequencyBinCount;
        this.clock = 0;
        const bufferN = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferN);
        this.pointsPerCircle = 75;
        this.totalPoints = this.pointsPerCircle * this.pointsPerCircle;
        var positionsN = [];
        var i = 0;
        for (i = 0; i < this.pointsPerCircle * this.pointsPerCircle; i++) {
            positionsN.push(i);
        }
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsN),
            gl.STATIC_DRAW);
        this.bufferN = bufferN;

        const aSoundData = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, aSoundData);
        var positionsZ = new Array(this.totalPoints);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsZ),
            gl.DYNAMIC_DRAW);

        this.aSoundData = aSoundData;
    }

    writeFft(fft) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.aSoundData);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, fft);
    }

    draw() {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferN);
        gl.vertexAttribPointer(this.programInfo.vertexPositionN, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.vertexPositionN, 0); // webgl2
        gl.enableVertexAttribArray(this.programInfo.vertexPositionN);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.aSoundData);
        gl.vertexAttribPointer(this.programInfo.aSoundData, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.aSoundData, 0); // webgl2        
        gl.enableVertexAttribArray(this.programInfo.aSoundData);

        gl.uniform1f(this.programInfo.uClock, this.clock);
        gl.uniform1f(this.programInfo.pointsPerCircle, this.pointsPerCircle);

        if (this.clock % 100 > 25) {
            gl.drawArrays(gl.POINTS, 0, this.totalPoints);
        } else {
            gl.drawArrays(gl.LINE_STRIP, 0, this.totalPoints);
        }
        this.clock++;
    }
    getInputType() {
        return "fft-float";
    }
    getRotationPreference() {
        return [0, 0, 1];
    }
}

pluginRegistry.add(new Sphere2())