class Sphere extends Plugin {
	getVertexShader() {
		return `
            attribute vec4 aVertexPosition;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

            void main(void) {
              gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
              gl_PointSize = 1.0;
            }`;
	}

	getFragmentShader() {
		return `
		    uniform lowp float uClock;
            void main(void) {
              gl_FragColor = vec4(0.0, 0.5 + abs(mod(uClock / 40.0, 0.5) - 0.25), 0.5, 1.0);
            }`
	}

	loadVariables(gl, shaderProgram) {
        this.programInfo = {};
        this.programInfo.aVertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.programInfo.uClock = gl.getUniformLocation(shaderProgram, 'uClock');
	}

	init(gl, options) {
        this.gl = gl;
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
        for (b = 0; b < 180; b+=bDelta) {
            for (a= 0; a < 360; a+=aDelta) {
                aRad = a/ 180 * Math.PI;
                bRad = b/ 180 * Math.PI;
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
    }

	writeFft(fft) {
        const gl = this.gl;
        
    }

    draw() {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.programInfo.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.aVertexPosition, 0); // webgl2
        gl.enableVertexAttribArray(this.programInfo.aVertexPosition);
    
        gl.uniform1f(this.programInfo.uClock, this.clock);
        gl.drawArrays(gl.POINTS, 0, this.totalPoints);
        this.clock++;
    }
    getInputType() {
        return "fft";
    }    
}

pluginRegistry.add(new Sphere())