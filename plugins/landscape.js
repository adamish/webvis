class PluginLandscape extends Plugin {
	getVertexShader() {
		return `
		    attribute vec2 aVertexPositionXY;
		    attribute float aVertexPositionZ;
			
			uniform mat4 uModelViewMatrix;
		    uniform mat4 uProjectionMatrix;

			varying highp vec3 vCunt;

		    void main(void) {
		      vec4 vertexPosition = vec4(aVertexPositionXY.x, aVertexPositionXY.y, aVertexPositionZ, 1.0);
		      gl_Position = uProjectionMatrix * uModelViewMatrix * vertexPosition;
		      vCunt = vec3(aVertexPositionXY.x, aVertexPositionXY.y, aVertexPositionZ);
		      gl_PointSize = 1.0 + aVertexPositionZ;
		    }`;
	}

	getFragmentShader() {
		return `
    		varying highp vec3 vCunt;

			void main(void) {
				lowp float r = abs(sin(vCunt.x));
				lowp float g = abs(sin(0.3 + vCunt.z));
				lowp float b = abs(sin(2.0 * vCunt.y));
	      		gl_FragColor = vec4(r, g, b, 1.0);
	    	}`
	}

	loadVariables(gl, shaderProgram) {
		this.vertexPositionXY = gl.getAttribLocation(shaderProgram, 'aVertexPositionXY');
        this.vertexPositionZ = gl.getAttribLocation(shaderProgram, 'aVertexPositionZ');
	}

	init(gl, options) {
		this.insertPos = 0;
		this.gl = gl;
		this.width = options.frequencyBinCount;
		this.height = 100;
		this.bufferCyclic = new Float32Array(this.width * this.height);
        
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
            this.bufferCyclic[dest++] = fft[i] / 256.0;
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

    draw() {
    	const gl = this.gl;
    	gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferXY);
        gl.vertexAttribPointer(this.vertexPositionXY, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertexPositionXY);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferZ);
        gl.vertexAttribPointer(this.vertexPositionZ, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertexPositionZ);
        
        //this.gl.drawArrays(this.gl.POINTS, 0, this.width * this.height);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferXY);
        gl.vertexAttribPointer(this.vertexPositionXY, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertexPositionXY);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferZ);
        gl.vertexAttribPointer(this.vertexPositionZ, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertexPositionZ);
        var y = 0;
        for (y = 0; y < this.height; y++) {
        	this.gl.drawArrays(this.gl.LINE_STRIP, y * this.width, this.width - 4);
		}

    }
}