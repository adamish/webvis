class PluginMatrix extends Plugin {
    getId() {
        return "matrix";
    }
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
              mediump float o = float(uTextureHeadOffset) / float(uTextureHeight);
              mediump float offset = o - vTextureCoord.y;
              if (offset < 0.0) {
                 offset = 1.0 + offset;
              }
              mediump vec4 v = texture2D(uSampler, vec2(vTextureCoord.x, offset));
              gl_FragColor = vec4(min(v.a * 5.0, 1.0), 0.4 * abs(sin(float(uClock)/180.0)) , 0.0, 1.0);
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
        this.textureHeight = 256;
        this.textureHeadOffset = 0;
        this.clock = 0;

        // positions
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0,  1.0,
             1.0,  1.0,
            -1.0, -1.0,
             1.0, -1.0,
          ];
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);

        // mappings
        const textureCoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoord);
        const positionsTexture = [
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            1.0,  1.0
          ];
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
        
        var offset = (this.clock % this.textureHeight);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, offset, this.textureWidth, 1, gl.ALPHA, gl.UNSIGNED_BYTE, fft);

        this.textureHeadOffset = offset;
        this.clock++;
    }

    draw() {
        const gl = this.gl;

        gl.uniform1i(this.programInfo.textureHeadOffset, this.textureHeadOffset);
        gl.uniform1i(this.programInfo.textureHeight, this.textureHeight);
        gl.uniform1i(this.programInfo.clock, this.clock);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoord);
        gl.vertexAttribPointer(this.programInfo.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.textureCoord, 0); // webgl2        
        gl.enableVertexAttribArray(this.programInfo.textureCoord);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.programInfo.positionBuffer, 2, this.gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.positionBuffer, 0); // webgl2        
        gl.enableVertexAttribArray(this.programInfo.positionBuffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.programInfo.uSampler, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    }
}

pluginRegistry.add(new PluginMatrix());