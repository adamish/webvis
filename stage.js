class Stage {
    constructor() {
        this.rotateX = 300;
        this.rotateY = 0;
        this.rotateZ = -30;
        this.clock = 0;
        this.context = {};
    }
    
    init(target, input) {
        this.gl = target.getContext('webgl2', { preserveDrawingBuffer: true });

        if (!this.gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }
        this.input = input;

        this.plugins = [];
        this.pluginIndex = 0;

        this.plugins = pluginRegistry.getAll();
        
        this.next();
        this.tick();
    }

    next() {
        this.pluginIndex = (this.pluginIndex + 1) % this.plugins.length;
        this.setPlugin(this.plugins[this.pluginIndex]);
    }

    tick() {
        if ("fft" === this.plugin.getInputType()) {
            this.plugin.writeFft(input.getFft());
        } else if ("fft-float" === this.plugin.getInputType()) {
            this.plugin.writeFft(input.getFftFloat());
        } else if ("time-float" === this.plugin.getInputType()) {
            this.plugin.writeTime(input.getTimeFloat());
        }
        this.draw();
        requestAnimationFrame(this.tick.bind(this));
        this.clock++;
    }
              
    setPlugin(plugin) {
        const gl = this.gl;

        this.plugin = plugin;
        const shaderProgram = this.initShaderProgram(gl, this.plugin.getVertexShader(), this.plugin.getFragmentShader());
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            }
        };
        this.plugin.loadVariables(gl, shaderProgram);

        this.plugin.init(gl, {frequencyBinCount: this.input.getFrequencyBinCount(), timeBinCount: this.input.getTimeBinCount()});
        this.pluginTime0 = Date.now();
    }

    draw() {
        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 1;
        const zFar = 100.0;
        const projectionMatrix = glMatrix.mat4.create();

        glMatrix.mat4.perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);

        const modelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(modelViewMatrix,
            modelViewMatrix,
            [-0.5, -0.5, -5.0]);

        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix,
            this.rotateX / 180 * Math.PI,
            [1, 0, 0]);

        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix,
            this.rotateY / 180 * Math.PI,
            [0, 1, 0]);

        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix,
            this.rotateZ / 180 * Math.PI,
            [0, 0, 1]);

        gl.useProgram(this.programInfo.program);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);

        this.context.clockMillis = Date.now() - this.pluginTime0;
        this.plugin.draw(this.context);
    }

    setRotateX(rotateX) {
        this.rotateX = rotateX;
        this.draw();
    }

    setRotateY(rotateY) {
        this.rotateY = rotateY;
        this.draw();
    }

    setRotateZ(rotateZ) {
        this.rotateZ = rotateZ;
        this.draw();
    }

    initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }


    loadShader(gl, type, source) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

}
