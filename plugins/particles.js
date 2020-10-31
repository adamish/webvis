class PluginParticles extends Plugin {
	getVertexShader() {
		return `
            attribute float aParticleTime0;
            attribute vec3 aParticlePos0;
            attribute vec3 aParticleSpeed;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform highp float uTimeRelative;

            varying highp float fade;

            void main(void) {
              
              vec3 newPos = aParticlePos0 + (uTimeRelative - aParticleTime0) /1000.0 * aParticleSpeed;
              gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(newPos, 1.0);
              fade = 1.0 - distance(newPos, aParticlePos0) / 0.5;
              gl_PointSize = fade * 5.0;
            }`;
	}

	getFragmentShader() {
		return `
            varying highp float fade;
            void main(void) {   
                gl_FragColor = vec4(1.0, fade, 0.0, 255.0);
            }`
	}

    getInputType() {
        return "fft-float";
    }

	loadVariables(gl, shaderProgram) {
        this.aParticleTime0 = gl.getAttribLocation(shaderProgram, 'aParticleTime0');
        this.aParticlePos0 = gl.getAttribLocation(shaderProgram, 'aParticlePos0');
        this.aParticleSpeed = gl.getAttribLocation(shaderProgram, 'aParticleSpeed');

        this.uTimeRelative = gl.getUniformLocation(shaderProgram, 'uTimeRelative');
	}

	init(gl, options) {        
        this.gl = gl;
        this.particles = 40000;
        this.time0 = Date.now();
        this.particlesData = new Array(this.particles);
        var i = 0;
        for (i = 0; i < this.particles; i++) {
            this.particlesData[i] = new Float32Array(7);
        }
        const bufferParticles = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticles);
        var data = new Float32Array(this.particles * 7);
        // structure is
        // [timeStart, posX, posY, posZ, speedX, speedY, speedZ]
        
        gl.bufferData(gl.ARRAY_BUFFER,
            data,
            gl.DYNAMIC_DRAW);
            
        this.bufferParticles = bufferParticles;
        this.clock = 0;
    }

	writeFft(time) {
        const gl = this.gl;
    }

    draw(context) {

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticles);
        gl.vertexAttribPointer(this.aParticleTime0, 1, gl.FLOAT, false, 7 * 4, 0);
        gl.enableVertexAttribArray(this.aParticleTime0);
        
        gl.vertexAttribPointer(this.aParticlePos0, 3, gl.FLOAT, false, 7 * 4, 1 * 4);
        gl.enableVertexAttribArray(this.aParticlePos0);
        
        gl.vertexAttribPointer(this.aParticleSpeed, 3, gl.FLOAT, false, 7 * 4, 4 * 4);
        gl.enableVertexAttribArray(this.aParticleSpeed);
        
        this.relativeTime = Date.now() - this.time0;
        gl.uniform1f(this.uTimeRelative, this.relativeTime);

        var i = 0;
        if (this.clock % 10 == 0) {
            for (i = 0; i < this.particles; i++) {
                if (this.particlesData[i][0] === 0 && Math.random() < 0.5) {
                    this.spawnParticle(i);   
                }
            }
        }

        for (i = 0; i < this.particles; i++) {
            if (this.particleAge(i) > 3000 + Math.random() * 2000) {
                this.spawnParticle(i);
            }
        }
        

        this.gl.drawArrays(this.gl.POINTS, 0, this.particles);

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

        var data = new Float32Array(7);
        data[0] = Date.now() - this.time0;
    
        data[1] = (-0.5 + Math.random()) * 0.05;
        data[2] = (-0.5 + Math.random()) * 0.05;
        data[3] = (-0.5 + Math.random()) * 0.05;

        data[4] = (-0.5 + Math.random()) * 0.5;
        data[5] = Math.random(); // (-0.5 + Math.random()) * 0.2;
        data[6] = (-0.5 + Math.random()) * 0.5;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticles);
        this.particlesData[i] = data;
        gl.bufferSubData(gl.ARRAY_BUFFER, i * 7 * 4, data);
    }
}

pluginRegistry.add(new PluginParticles());