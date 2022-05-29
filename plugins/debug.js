class Debug extends Plugin {
    getId() {
        return "debug";
    }
    getVertexShader() {
        return `
	     	attribute float aSoundData;
            attribute float aIndexBuffer;
            uniform float uSoundDataSize;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

            void main(void) {
              //vec4 aVertexPosition = vec4(aIndexBuffer / uSoundDataSize - 0.5, aSoundData * 100.0, 0.0, 1.0);
             float theta = aIndexBuffer / uSoundDataSize * 3.1415 * 2.0;
             float r = 0.5 + min(0.2, abs(aSoundData) * 200.0);
             vec4 aVertexPosition = vec4(r * sin(theta), r * cos(theta), 0.0, 1.0);

              gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
              gl_PointSize = 2.0 + aSoundData / 256.0;
            }`;
    }

    getFragmentShader() {
        return `
            void main(void) {
              gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
            }`
    }

    loadVariables(gl, shaderProgram) {
        this.programInfo = {};
        this.programInfo.aIndexBuffer = gl.getAttribLocation(shaderProgram, 'aIndexBuffer');
        this.programInfo.aSoundData = gl.getAttribLocation(shaderProgram, 'aSoundData');
        this.programInfo.uClock = gl.getUniformLocation(shaderProgram, 'uClock');
        this.programInfo.uSoundDataSize = gl.getUniformLocation(shaderProgram, 'uSoundDataSize');

    }

    init(gl, options) {
        this.gl = gl;
        this.clock = 0;
        // positions
        this.width = options.frequencyBinCount;

        // create buffer with just indexes
        this.aIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.aIndexBuffer);
        var data = [];
        var x;
        for (x = 0; x < this.width; x++) {
            data.push(x);
        }
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(data),
            gl.STATIC_DRAW);

        // placeholder for FFT data
        this.aSoundData = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.aSoundData);
        var data2 = [];
        for (x = 0; x < this.width; x++) {
            data2.push(x);
        }

        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(data2),
            gl.STATIC_DRAW);
    }

    writeTime(fft) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.aSoundData);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, fft);
    }

    getRotationPreference() {
        return undefined; //[0, 0, 0];
    }

    draw() {
        const gl = this.gl;

        // just indexes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.aIndexBuffer);
        gl.vertexAttribPointer(this.programInfo.aIndexBuffer, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.aIndexBuffer, 0); // webgl2
        gl.enableVertexAttribArray(this.programInfo.aIndexBuffer);

        // just sound data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.aSoundData);
        gl.vertexAttribPointer(this.programInfo.aSoundData, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.aSoundData, 0); // webgl2
        gl.enableVertexAttribArray(this.programInfo.aSoundData);

        // share the number of points
        gl.uniform1f(this.programInfo.uSoundDataSize, this.width);
        gl.drawArrays(gl.POINTS, 0, this.width);
        this.clock++;
    }
    getInputType() {
        return "time-float";
    }
}

pluginRegistry.add(new Debug())