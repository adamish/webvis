class PluginLandscape extends Plugin {
	getVertexShader() {
		return `
		    attribute vec2 aVertexPositionXY;
		    attribute float aVertexPositionZ;
			
			uniform mat4 uModelViewMatrix;
		    uniform mat4 uProjectionMatrix;

			varying highp vec3 vertexPositionRaw;

		    void main(void) {
		      vec4 vertexPosition = vec4(aVertexPositionXY.x, aVertexPositionXY.y, aVertexPositionZ, 1.0);
		      gl_Position = uProjectionMatrix * uModelViewMatrix * vertexPosition;
		      vertexPositionRaw = vec3(vertexPosition);
		      gl_PointSize = 1.0 + aVertexPositionZ;
		    }`;
	}

	getFragmentShader() {
		return `
    		varying highp vec3 vertexPositionRaw;            
            uniform lowp float uClockMillis;

			void main(void) {
				lowp float r = 0.2;
				lowp float g = 0.2;
				lowp float b = 0.2;
                lowp vec2 point = vec2(vertexPositionRaw.x, vertexPositionRaw.y);
                lowp vec2 light1 = vec2(0.6 * sin(uClockMillis / 1000.0), 0.6 * cos(uClockMillis / 1000.0));
                lowp vec2 light2 = vec2(0.6 * sin(uClockMillis / 500.0), 0.6 * cos(uClockMillis / 1000.0));
                lowp vec2 light3 = vec2(0.6 * sin(uClockMillis / 1000.0), 0.6 * cos(uClockMillis / 500.0));

                lowp float d1 = distance(point, light1);
                if (d1 < 0.2) {
                    r = 1.0;
                }
                lowp float d2 = distance(point, light2);
                if (d2 < 0.2) {
                    g = 1.0;
                }
                lowp float d3 = distance(point, light3);
                if (d3 < 0.2) {
                    b = 1.0;
                }                                
	      		gl_FragColor = vec4(r, g, b, 1.0);
	    	}`
	}

	loadVariables(gl, shaderProgram) {
		this.vertexPositionXY = gl.getAttribLocation(shaderProgram, 'aVertexPositionXY');
        this.vertexPositionZ = gl.getAttribLocation(shaderProgram, 'aVertexPositionZ');
        
        this.uClockMillis = gl.getUniformLocation(shaderProgram, 'uClockMillis');
	}

	init(gl, options) {
		this.insertPos = 0;
		this.gl = gl;
		this.width = options.frequencyBinCount;
		this.height = 100;
		this.bufferCyclic = new Float32Array(this.width * this.height);
        this.lightX = 0;
        this.lightY = 0;
        this.clock = 0;

        const bufferXY = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferXY);
        var positionsXY = [];
        var x = 0;
        var y = 0;
       	for (y = 0; y < this.height; y++) {
            for (x = 0; x < this.width; x++) {
                positionsXY.push(-0.5 + x / this.width);
                positionsXY.push(2 * (-0.5 + y / this.height));
            }
        }
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsXY),
            gl.STATIC_DRAW);

        const bufferZ = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferZ);
        var positionsZ = new Array(this.width * this.height);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsZ),
            gl.DYNAMIC_DRAW);
            
        this.bufferXY = bufferXY;
        this.bufferZ = bufferZ;
	}

	writeFft(fft) {
        const gl = this.gl;
                 
        var dest = this.insertPos * this.width;
        var valid = Math.min(fft.length, this.width);
        for (var i = 0; i < valid; i++) {
            this.bufferCyclic[dest++] = fft[i] / 512.0;
        }

        // example
        // 0: 14
        // 1: 13
        // 2: 17 <== insert pos here
        // 3: 16
        // 4: 15
        
         // render (17, 16, 15) to position 0
        var headRows = this.height - this.insertPos;
        var headPortion = this.bufferCyclic.slice(this.insertPos * this.width);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferZ);     
        gl.bufferSubData(gl.ARRAY_BUFFER,
            0,
            headPortion);

        // head (14, 13)
        var tailRows = this.insertPos;
        var tailPortion = this.bufferCyclic.slice(0, (tailRows * this.width));
        if (tailRows > 0) {
            gl.bufferSubData(gl.ARRAY_BUFFER,
                    headRows * this.width * 4, // <== byte location
                    tailPortion);

        }

        this.insertPos--;
        if (this.insertPos < 0) {
            this.insertPos = this.height - 1;
        }
    }

    draw(context) {
    	const gl = this.gl;
    	gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferXY);
        gl.vertexAttribPointer(this.vertexPositionXY, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.vertexPositionXY, 0); // webgl2
        gl.enableVertexAttribArray(this.vertexPositionXY);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferZ);
        gl.vertexAttribPointer(this.vertexPositionZ, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.vertexPositionZ, 0); // webgl2
        gl.enableVertexAttribArray(this.vertexPositionZ);
        
        gl.uniform1f(this.uClockMillis, context.clockMillis);

        //this.gl.drawArrays(this.gl.POINTS, 0, this.width * this.height);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferXY);
        gl.vertexAttribPointer(this.vertexPositionXY, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.vertexPositionXY, 0); // webgl2        
        gl.enableVertexAttribArray(this.vertexPositionXY);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferZ);
        gl.vertexAttribPointer(this.vertexPositionZ, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.vertexPositionZ, 0); // webgl2        
        gl.enableVertexAttribArray(this.vertexPositionZ);
        var y = 0;
        for (y = 0; y < this.height; y++) {
        	this.gl.drawArrays(this.gl.LINE_STRIP, y * this.width, this.width - 4);
		}

        this.clock++;
    }
}

pluginRegistry.add(new PluginLandscape());