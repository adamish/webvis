class Horse extends Plugin {
    getId() {
        return "horse";
    }
    getVertexShader() {
        return `
            attribute vec4 aVertexPosition;
            attribute vec2 aTextureCoord;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform lowp float uClock;

            varying highp vec2 vTextureCoord;

            void main(void) {
              gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition.x + cos(float(uClock)/8.0) * 0.01 , aVertexPosition.y, aVertexPosition.z, aVertexPosition.a);
              vTextureCoord = aTextureCoord;
            }`;
    }

    getFragmentShader() {
        return `
            varying highp vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform lowp float uClock;
            void main(void) {
              mediump vec4 v = texture2D(uSampler, vec2(vTextureCoord.x, 0));
              gl_FragColor = vec4(cos(uClock/180.0 + 0.5), cos(uClock/180.0), sin(uClock/180.0), 2.0 * (v.a - 0.5));
            }`
    }

    loadVariables(gl, shaderProgram) {
        this.programInfo = {};
        this.programInfo.positionBuffer = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.programInfo.textureCoord = gl.getAttribLocation(shaderProgram, 'aTextureCoord');

        this.programInfo.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
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
        var r = 1;
        var d = 0;

        for (c = 0; c < 360; c++) {
            r = (1 + Math.sin(c / 180 * Math.PI)) / 2.0
            d = c / 180 * Math.PI;
            positions.push(r * Math.sin(d * 4));
            positions.push(r * Math.cos(d * 4));
            positions.push(0);
            positions.push(1.1 * r * Math.sin(d * 4));
            positions.push(1.1 * r * Math.cos(d * 4));
            positions.push(0.5);
        }
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);

        // mappings
        const textureCoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoord);
        const positionsTexture = [];

        for (c = 0; c < 360; c++) {
            r = 1;
            positionsTexture.push(0);
            positionsTexture.push(0);
            positionsTexture.push(1.0);
            positionsTexture.push(1.0);
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
        const pixel = new Uint8Array(this.textureWidth);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA,
            this.textureWidth, 1.0, border, srcFormat, srcType,
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
        gl.uniform1f(this.programInfo.clock, this.clock);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoord);
        gl.vertexAttribPointer(this.programInfo.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.programInfo.textureCoord, 0); // webgl2
        gl.enableVertexAttribArray(this.programInfo.textureCoord);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.programInfo.positionBuffer, 3, this.gl.FLOAT, false, 0, 0);
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

        gl.drawArrays(gl.TRIANGLES, 0, 720);
        this.clock++;
    }
    getInputType() {
        return "fft";
    }
}

pluginRegistry.add(new Horse())