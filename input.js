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
        this.minDecibels = -90;
        this.maxDecibels = -10;
        this.fftArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.frequencyBinCount = this.analyser.frequencyBinCount;
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
    getFrequencyBinCount() {
        return this.frequencyBinCount;
    }
}

