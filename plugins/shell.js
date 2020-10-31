class PluginShell extends Plugin {
	getVertexShader() {
		return `
            attribute vec4 aVertexPosition;
            attribute vec2 aTextureCoord;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

            varying highp vec2 vTextureCoord;

            void main(void) {
              gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
              vTextureCoord = aTextureCoord;
            }`;
	}

	getFragmentShader() {
		return `
            varying highp vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform int uTextureHeadOffset;
            uniform int uTextureHeight;
            uniform int uClock;
            void main(void) {
              mediump vec4 v = texture2D(uSampler, vec2(1.0 - sqrt(vTextureCoord.x * vTextureCoord.x + vTextureCoord.y * vTextureCoord.y), 0));
              gl_FragColor = vec4(min(3.0 * v.a, 1.0), 0.0, 0.0, 1.0);
            }`
	}

	loadVariables(gl, shaderProgram) {
        this.programInfo = {};
        this.programInfo.vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.programInfo.textureCoord = gl.getAttribLocation(shaderProgram, 'aTextureCoord');

        this.programInfo.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
        this.programInfo.textureHeadOffset = gl.getUniformLocation(shaderProgram, 'uTextureHeadOffset');
        this.programInfo.textureHeight = gl.getUniformLocation(shaderProgram, 'uTextureHeight');
        this.programInfo.clock = gl.getUniformLocation(shaderProgram, 'uClock');
	}

	init(gl, options) {
        this.gl = gl;
        this.textureWidth = options.frequencyBinCount;
        this.textureHeight = 1;
    
        this.clock = 0;

        // positions
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        var positions = [];
        var c = 0;
        var r = 0;
        var d = 0;

        for (c = 0; c < 360; c++) {
            r = c / 720;
            d = c / 180 * Math.PI;
            positions.push(r * Math.cos(2 * d));
            positions.push(r * Math.sin(2 * d));
            positions.push(0.5);
            positions.push(0);
            positions.push(0);
            positions.push(0);
        }
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);

        // mappings
        const textureCoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoord);
        const positionsTexture = [];

        for (c = 0; c < 360; c++) {
            r = c / 180 * Math.PI;
            positionsTexture.push(Math.cos(r));
            positionsTexture.push(Math.sin(r));
            positionsTexture.push(0);
            positionsTexture.push(0);
        }          
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsTexture),
            gl.STATIC_DRAW);
            
        this.positionBuffer = positionBuffer;
        this.textureCoord = textureCoord;

        // texutre
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        const border = 0;
        const srcFormat = gl.ALPHA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array(this.textureWidth * this.textureHeight * 4);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA,
                    this.textureWidth, this.textureHeight, border, srcFormat, srcType,
                    pixel);
        this.texture = texture;
    }

	writeFft(fft) {
        const gl = this.gl;
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.textureWidth, 1, gl.ALPHA, gl.UNSIGNED_BYTE, fft);
        
    }

    draw() {
        const gl = this.gl;

        gl.uniform1i(this.programInfo.textureHeadOffset, this.textureHeadOffset);
        gl.uniform1i(this.programInfo.textureHeight, this.textureHeight);
        gl.uniform1i(this.programInfo.clock, this.clock);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoord);
        gl.vertexAttribPointer(this.programInfo.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.textureCoord);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.programInfo.positionBuffer, 3, this.gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.positionBuffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.programInfo.uSampler, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 720);

    }
}

pluginRegistry.add(new PluginShell())