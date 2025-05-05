class ScreenRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.onDataAvailable = null;
    this.onStop = null;
  }

  async startRecording(options = {
    video: {
      cursor: "always",
      displaySurface: "browser"
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }
  }) {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia(options);
      
      // Get audio track if available
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: options.audio 
      });
      
      // Combine video and audio streams
      const tracks = [
        ...this.stream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ];
      
      const combinedStream = new MediaStream(tracks);

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: 'video/webm'
        });
        
        if (this.onStop) {
          this.onStop(blob);
        }
        
        // Clean up
        this.recordedChunks = [];
        tracks.forEach(track => track.stop());
      };

      this.mediaRecorder.start(1000); // Capture every second
      return true;
    } catch (error) {
      console.error('Error starting screen recording:', error);
      throw error;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      return true;
    }
    return false;
  }

  isRecording() {
    return this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }

  getState() {
    return this.mediaRecorder ? this.mediaRecorder.state : 'inactive';
  }

  setOnDataAvailable(callback) {
    this.onDataAvailable = callback;
  }

  setOnStop(callback) {
    this.onStop = callback;
  }
}

export default new ScreenRecorder();