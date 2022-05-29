/*
 * aVertexPositionN is just an index list
 * vertex shader calculates position using index
 * aVertexPositionZ is used to pass in sound data
 */
class DebugLevels extends Plugin {
    getId() {
        return "debug-levels";
    }
    getVertexShader() {
        return `
            attribute float aVertexPositionN;
            attribute float aVertexPositionZ;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform lowp float uClockMillis;

            varying highp vec4 vTextureCoord;

            void main(void) {
              lowp float t = uClockMillis / 2000.0;

              highp float rad = t + aVertexPositionN * 3.1415 * 2.0;

              highp float r = 1.2 * abs(cos(t));
              lowp float circle2Multipler = 3.0 + 8.0 * sin(t);
              lowp float circle2R = 0.4 + 0.1 * sin(-t * 0.3);
              lowp float circle2Min = 0.5 + cos(t * 2.0);

              lowp vec2 circle2 = vec2(circle2Min + circle2R * sin(rad * circle2Multipler), circle2Min + circle2R * cos(rad * circle2Multipler));
              vec4 vertexPosition = vec4(r * sin(rad) + circle2.x,r * cos(rad) + circle2.y, aVertexPositionZ * 0.3, 1.0);
            
              gl_Position = uProjectionMatrix * uModelViewMatrix * vertexPosition;
              gl_PointSize = 2.0;
              vTextureCoord = vertexPosition;
            }`;
    }

    getFragmentShader() {
        return `
            uniform lowp float uClockMillis;        
            varying highp vec4 vTextureCoord;

            void main(void) {
                lowp float r = 0.8 + 0.2 * cos(2.0 * vTextureCoord.x);
                lowp float g = 0.4 + 0.2 * sin(2.0 * vTextureCoord.y + uClockMillis);
                lowp float b = 0.8 + 0.2 * cos(3.0 * vTextureCoord.y);

              gl_FragColor = vec4(r, g, b, 1.0);
          }`
    }

    getInputType() {
        return "time-float";
    }

    loadVariables(gl, shaderProgram) {
        this.vertexPositionXY = gl.getAttribLocation(shaderProgram, 'aVertexPositionN');
        this.vertexPositionZ = gl.getAttribLocation(shaderProgram, 'aVertexPositionZ');
        this.vertexPositionT = gl.getAttribLocation(shaderProgram, 'aVertexPositionT');
        this.uClockMillis = gl.getUniformLocation(shaderProgram, 'uClockMillis');
    }

    init(gl, options) {
        this.gl = gl;
        this.width = options.timeBinCount;
        this.amplitudeIntoTime = 0;

        const bufferN = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferN);
        var positionsN = [];
        var x = 0;
        for (x = 0; x < this.width; x++) {
            positionsN.push(x / (this.width - 1));
        }
        positionsN.push(0);

        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsN),
            gl.STATIC_DRAW);

        const bufferZ = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferZ);
        var positionsZ = new Array(this.width + 1);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsZ),
            gl.DYNAMIC_DRAW);

        this.bufferN = bufferN;
        this.bufferZ = bufferZ;
    }

    writeTime(time) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferZ);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, time);
        var bonus = new Float32Array(1);
        bonus[0] = time[0];
        gl.bufferSubData(gl.ARRAY_BUFFER, time.length, bonus);

        var total = 0;
        var n = time.length;
        var i = 0;
        for (i = 0; i < n; i++) {
            total += Math.abs(time[i]);
        }
        var average = total / n;

        if (average > 0.01) {
            this.amplitudeIntoTime += 20;
        } else if (average > 0.02) {
            this.amplitudeIntoTime += 50;
        } else {
            this.amplitudeIntoTime += 10;
        }
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

        gl.uniform1f(this.uClockMillis, this.amplitudeIntoTime);
        gl.lineWidth(10.0);

        this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.width + 1);

    }

}

pluginRegistry.add(new DebugLevels());