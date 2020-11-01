class PluginSpirals extends Plugin {
	getVertexShader() {
		return `
            attribute float aVertexPositionN;
            attribute float aVertexPositionZ;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform lowp float uClockMillis;

            varying highp vec4 vTextureCoord;

            void main(void) {
              lowp float offset = aVertexPositionN * 3.14 * 5.0 + uClockMillis / 1500.0;
              lowp float r = 0.5 + aVertexPositionZ / 512.0 * sin(aVertexPositionN * 3.0 * 3.14 * uClockMillis / 2000.0);
              vec2 p = vec2(r * sin(offset), r * cos(offset));
              vec4 vertexPosition = vec4(p.x, p.y, aVertexPositionZ / 512.0, 1.0);
            
              gl_Position = uProjectionMatrix * uModelViewMatrix * vertexPosition;
              gl_PointSize = 2.0;
              vTextureCoord = vec4(aVertexPositionN, aVertexPositionZ / 256.0, 0.0, 0.0);
            }`;
	}

	getFragmentShader() {
		return `
            uniform lowp float uClockMillis;        
            varying highp vec4 vTextureCoord;

            void main(void) {
                lowp float r = (1.0 + sin(vTextureCoord.r + uClockMillis / 1000.0)) * 0.5;
                lowp float g = (1.0 + cos(vTextureCoord.r + uClockMillis / 1000.0)) * 0.5;
                lowp float b = (1.0 + sin(1.0 + vTextureCoord.g + uClockMillis / 100.0)) * 0.5;

              gl_FragColor = vec4(r, g, b, 1.0);
            }`
	}

    getInputType() {
        return "fft-float";
    }

	loadVariables(gl, shaderProgram) {
        this.vertexPositionXY = gl.getAttribLocation(shaderProgram, 'aVertexPositionN');
        this.vertexPositionZ = gl.getAttribLocation(shaderProgram, 'aVertexPositionZ');
        this.uClockMillis = gl.getUniformLocation(shaderProgram, 'uClockMillis');
	}

	init(gl, options) {        
        this.gl = gl;
        this.width = options.timeBinCount;

        const bufferN = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferN);
        var positionsN = [];
        var x = 0;
        for (x = 0; x < this.width; x++) {
            positionsN.push(x / this.width);
        }
        
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsN),
            gl.STATIC_DRAW);

        const bufferZ = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferZ);
        var positionsZ = new Array(this.width);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsZ),
            gl.DYNAMIC_DRAW);
            
        this.bufferN = bufferN;
        this.bufferZ = bufferZ;
    }

	writeFft(time) {
        const gl = this.gl;
                
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferZ);     
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, time);
    }

    draw(context) {

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferN);
        gl.vertexAttribPointer(this.vertexPositionN, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.vertexPositionN, 0); // webgl2
        gl.enableVertexAttribArray(this.vertexPositionN);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferZ);
        gl.vertexAttribPointer(this.vertexPositionZ, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.vertexPositionZ, 0); // webgl2        
        gl.enableVertexAttribArray(this.vertexPositionZ);
        
        gl.uniform1f(this.uClockMillis, context.clockMillis);
        gl.lineWidth(3.0);
        
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.width);

    }
}

pluginRegistry.add(new PluginSpirals());