class Input {
    init(callback) {
        this.callback = callback;
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(this.handleSuccess.bind(this));
    }
    handleSuccess(stream) {
        const context = new AudioContext();
        this.analyser = context.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.minDecibels = -170;
        this.analyser.maxDecibels = -5;
        this.fftArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.fftArrayFloat = new Float32Array(this.analyser.frequencyBinCount);
        this.frequencyBinCount = this.analyser.frequencyBinCount;
        this.timeBinCount = this.frequencyBinCount;
        this.timeArrayFloat = new Float32Array(this.timeBinCount);
        this.analyserInit = true;    
        const source = context.createMediaStreamSource(stream);
        source.connect(this.analyser);
        this.callback.apply();
    }
    getFft() {
        if (this.analyserInit) {
            this.analyser.getByteFrequencyData(this.fftArray);
        }
        return this.fftArray;
    }
    getFftFloat() {
        if (this.analyserInit) {
            this.analyser.getFloatFrequencyData(this.fftArrayFloat);
        }
        return this.fftArrayFloat;
    }
    getTimeFloat() {
        if (this.analyserInit) {
            this.analyser.getFloatTimeDomainData(this.timeArrayFloat);
        }
        return this.timeArrayFloat;
    }         
    getFrequencyBinCount() {
        return this.frequencyBinCount;
    }
    getTimeBinCount() {
        return this.timeBinCount;
    }
}

