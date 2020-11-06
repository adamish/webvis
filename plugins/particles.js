class PluginParticles extends Plugin {
	getVertexShader() {
		return `
            attribute float aParticleTime0;
            attribute vec2 aParticleShape;
            attribute vec3 aParticlePos0;
            attribute vec3 aParticleSpeed;
            attribute float aParticleMod;
            attribute vec2 aTextureCoord;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform highp float uTimeRelative;

            varying highp float fade;
            varying highp vec2 vTextureCoord;
            varying highp float mod;

            void main(void) {
              
              vec3 newPos = vec3(aParticleShape * 0.1, 0.0) + aParticlePos0 + (uTimeRelative - aParticleTime0) /1000.0 * aParticleSpeed;
              
              gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(newPos, 1.0);
              fade = 1.0 - distance(newPos, aParticlePos0) / 2.0;
              mod = aParticleMod;
              vTextureCoord = aTextureCoord;
            }`;
	}

	getFragmentShader() {
		return `
            varying highp float fade;
            uniform sampler2D uSampler;
            varying highp vec2 vTextureCoord;
            varying highp float mod;

            void main(void) {
                mediump vec4 v = texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y));
                gl_FragColor = vec4(v.r + cos(mod), fade + mod, sin(mod), v.a * fade);
            }`
	}

    getInputType() {
        return "fft-float";
    }

	loadVariables(gl, shaderProgram) {
        this.aParticleShape = gl.getAttribLocation(shaderProgram, 'aParticleShape');
        this.aParticleTime0 = gl.getAttribLocation(shaderProgram, 'aParticleTime0');
        this.aParticlePos0 = gl.getAttribLocation(shaderProgram, 'aParticlePos0');
        this.aParticleSpeed = gl.getAttribLocation(shaderProgram, 'aParticleSpeed');
        this.aParticleMod = gl.getAttribLocation(shaderProgram, 'aParticleMod');
        this.aTextureCoord = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        this.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
        this.uTimeRelative = gl.getUniformLocation(shaderProgram, 'uTimeRelative');
	}

	init(gl, options) {        
        this.gl = gl;
        this.nextParticle = 0;
        this.particles = 5000;
        this.time0 = Date.now();
        this.particlesData = new Array(this.particles);
        var i = 0;
        this.elementsPerParticle = 8;
        for (i = 0; i < this.particles; i++) {
            this.particlesData[i] = new Float32Array(this.elementsPerParticle);
        }
        const bufferParticles = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticles);
        var data = new Float32Array(this.particles * this.elementsPerParticle);
        // structure is
        // [timeStart, posX, posY, posZ, speedX, speedY, speedZ]
        
        gl.bufferData(gl.ARRAY_BUFFER,
            data,
            gl.DYNAMIC_DRAW);            
        this.bufferParticles = bufferParticles;

        // positions
        const shapeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer);
        var p = 0.1
        const shape = [
            -p,  p,
             p,  p,
            -p, -p,
             p, -p,
          ];
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(shape),
            gl.DYNAMIC_DRAW);
        this.shapeBuffer = shapeBuffer;

        // shape to texture mapping
        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        const positionsTexture = [
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            1.0,  1.0
          ];
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsTexture),
            gl.STATIC_DRAW);
        this.textureCoordBuffer = textureCoordBuffer;

        // texutre
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.activeTexture(gl.TEXTURE0);        
        var textureWidth = 9;
        var textureHeight = 9;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        var pixel = new Uint8Array(textureWidth * textureHeight * 4);
        this.buildTexture(pixel, textureWidth, textureHeight);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                    textureWidth, textureHeight, border, srcFormat, srcType,
                    pixel);
        this.texture = texture;

     

        this.clock = 0;
    }
    buildTexture(target, width, height) {
        var centerX = Math.floor(width / 2);
        var centerY = Math.floor(height / 2);
        var x = 0;
        var y = 0;
        var i = 0;
        var r = 0;
        var rMax = Math.hypot(width - centerX, height - centerY);
        for (y = 0; y < width; y++) {
            for (x = 0; x < width; x++) {
                r = Math.hypot(x - centerX, y - centerY);
                target[i++] = 255;
                target[i++] = 0;
                target[i++] = 0;
                target[i++] = Math.random() < 0.5 ? 255: 0;
            }
        }
    }

	writeFft(time) {
        const gl = this.gl;
        
        var i;
        var start = Math.floor(time.length * 0.2);
        var end = Math.floor(time.length * 0.8);
        var radsPerIndex = Math.PI * 2 / (end - start);
        var radsPerIndexFull = Math.PI * 2 / time.length;

        var biggest = -1000;
        var biggestI = 0;
        for (i = time.length - 1; i > 0; i--) {
            if (time[i] > biggest) {
                biggestI = i;
                biggest = time[i];
            }
        }

        for (i = 0; i < time.length; i++) {
            if (Math.abs(biggestI -i) < 2 && biggest > -50) {
                this.spawnNextParticle(i * radsPerIndexFull, -60);
            }
        }

        for (i = start; i < end; i+=1) {
            if (time[i] > -90) {
                this.spawnNextParticle((i - start) * radsPerIndex, time[i]);
            }
        }
    }

    draw(context) {

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticles);
        var stride = this.elementsPerParticle * 4;
        gl.vertexAttribPointer(this.aParticleTime0, 1, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(this.aParticleTime0);
        gl.vertexAttribDivisor(this.aParticleTime0, 1); // webgl2

        gl.vertexAttribPointer(this.aParticlePos0, 3, gl.FLOAT, false, stride, 1 * 4);
        gl.enableVertexAttribArray(this.aParticlePos0);
        gl.vertexAttribDivisor(this.aParticlePos0, 1); // webgl2

        gl.vertexAttribPointer(this.aParticleSpeed, 3, gl.FLOAT, false, stride, 4 * 4);
        gl.enableVertexAttribArray(this.aParticleSpeed);
        gl.vertexAttribDivisor(this.aParticleSpeed, 1); // webgl2

        gl.vertexAttribPointer(this.aParticleMod, 1, gl.FLOAT, false, stride, 7 * 4);
        gl.enableVertexAttribArray(this.aParticleMod);
        gl.vertexAttribDivisor(this.aParticleMod, 1); // webgl2        

        gl.bindBuffer(gl.ARRAY_BUFFER, this.shapeBuffer);
        gl.vertexAttribPointer(this.aParticleShape, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aParticleShape);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.vertexAttribPointer(this.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aTextureCoord);        
      
        
        this.relativeTime = Date.now() - this.time0;
        gl.uniform1f(this.uTimeRelative, this.relativeTime);

        var i = 0;
        if (this.clock % 10 == 0) {
            for (i = 0; i < this.particles; i++) {
                if (this.particlesData[i][0] === 0 && Math.random() < 0.4) {
                    //this.spawnParticle(i);   
                }
            }
        }

        for (i = 0; i < this.particles; i++) {
            if (this.particleAge(i) > 2000 + Math.random() * 200) {
              //  this.spawnParticle(i);
            }
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uSampler, 0);
        

        gl.drawArraysInstanced(this.gl.TRIANGLE_STRIP, 0, 4, this.particles);
        
        
        this.clock++;

    }
    particleDistance(i) {
        var speedX = this.particlesData[i][4];
        var speedY = this.particlesData[i][5];
        var time = (this.relativeTime- this.particlesData[i][0]) / 1000.0;
        return time * Math.sqrt(speedX * speedX + speedY * speedY);
    }
    particleAge(i) {
        return this.relativeTime- this.particlesData[i][0];        
    }    
    spawnParticle(i) {
        const gl = this.gl;

        var data = new Float32Array(8);
        data[0] = Date.now() - this.time0;
    
        data[1] = (-0.5 + Math.random()) * 0.05;
        data[2] = (-0.5 + Math.random()) * 0.05;
        data[3] = (-0.5 + Math.random()) * 0.05;

        data[4] = (-0.5 + Math.random()) * 0.5;
        data[5] = (-0.5 + Math.random()) * 0.2;
        data[6] = (-0.5 + Math.random()) * 0.5;
        data[6] = (-0.5 + Math.random()) * 0.5;
        data[7] = 1;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticles);
        this.particlesData[i] = data;
        gl.bufferSubData(gl.ARRAY_BUFFER, i * 8 * 4, data);
    }

    spawnNextParticle(angle, amplitude) {
        const gl = this.gl;

        var data = new Float32Array(8);
        data[0] = Date.now() - this.time0;
    
        var angle2 = Date.now() / 50;
        var mod2 = (Date.now() / 1000) % 5;
        data[1] = 0.5 * Math.sin(angle2) + 0.1 * Math.sin(mod2 * angle2);
        data[2] = 0.5 * Math.cos(angle2) + 0.1 * Math.cos(mod2 * angle2);
        data[3] = 0;

        data[4] = Math.sin(angle) * amplitude / -50;
        data[5] = Math.cos(angle) * amplitude / -50;
        data[6] = 0;
        data[7] = amplitude;
        var i = this.nextParticle;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticles);
        this.particlesData[i] = data;
        gl.bufferSubData(gl.ARRAY_BUFFER, i * 8 * 4, data);
        this.nextParticle = (this.nextParticle + 1) % this.particlesData.length;
    }
}

pluginRegistry.add(new PluginParticles());