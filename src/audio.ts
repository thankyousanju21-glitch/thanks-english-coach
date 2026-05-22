export class AudioStreamInterface {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private nextStartTime: number = 0;
  
  public isActive: boolean = false;
  
  public sessionLogs: string[] = [];
  private onTranscriptUpdate?: (text: string) => void;
  private recognition: any = null;

  public setTranscriptCallback(cb: (text: string) => void) {
    this.onTranscriptUpdate = cb;
  }
  private pcmToBase64(pcmData: Float32Array): string {
    const buffer = new ArrayBuffer(pcmData.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < pcmData.length; i++) {
        let s = Math.max(-1, Math.min(1, pcmData[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async start(
    settings: any,
    onStateChange: (active: boolean) => void,
    onError: (err: string) => void
  ) {
    this.sessionLogs = [];
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser. If you are accessing this over HTTP on a local network IP, mobile browsers block microphone access. You must use HTTPS or localhost.");
      }
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      const params = new URLSearchParams();
      if (settings?.personality) params.append("personality", settings.personality);
      if (settings?.mode) params.append("mode", settings.mode);
      if (settings?.pace) params.append("pace", settings.pace);
      if (settings?.language) params.append("language", settings.language);
      if (settings?.replyLength) params.append("replyLength", settings.replyLength);
      if (settings?.userName) params.append("userName", settings.userName);
      if (settings?.userGender) params.append("userGender", settings.userGender);
      if (settings?.thinkingLanguage) params.append("thinkingLanguage", settings.thinkingLanguage);
      if (settings?.grammarCorrection !== undefined) params.append("grammarCorrection", settings.grammarCorrection.toString());
      
      let chatHistoryContext = "";
      const storedChats = localStorage.getItem('chat_summaries');
      if (storedChats) {
        try {
           const parsed = JSON.parse(storedChats);
           chatHistoryContext = parsed.map((c: any) => c.title + ": " + c.summary).join("\n");
        } catch(e) {}
      }
      if (chatHistoryContext.length > 0) {
        params.append("historyContext", chatHistoryContext.substring(0, 500)); // Send truncated context to not bloat url
      }

      if (settings?.apiKey) params.append("apiKey", settings.apiKey);

      const wsUrl = `ws://192.168.1.7:3000/live?${params.toString()}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onmessage = this.handleDownstreamAudio.bind(this);
      
      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError("Could not connect to the backend server. Make sure the Node server is running on 192.168.1.7:3000.");
        this.stop(onStateChange);
      };

      this.ws.onclose = () => {
        if (this.isActive) {
          onError("Connection to the server was closed.");
          this.stop(onStateChange);
        }
      };
      
      this.ws.onopen = () => {
        processor.onaudioprocess = (e) => {
          if (!this.isActive || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const base64 = this.pcmToBase64(inputData);
          this.ws.send(JSON.stringify({ audio: base64 }));
        };
        source.connect(processor);
        processor.connect(this.audioContext!.destination);
      };
      
      this.isActive = true;
      this.nextStartTime = this.audioContext!.currentTime;
      onStateChange(true);
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        
        const fillerWords = ["umm", "um", "uh", "like", "basically", "you know"];
        
        this.recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          if (transcript) {
            this.sessionLogs.push("User: " + transcript);
            if (this.onTranscriptUpdate) {
              this.onTranscriptUpdate("User: " + transcript);
            }
            
            if (settings?.buzzerEnabled) {
              let count = 0;
              const lowerTranscript = transcript.toLowerCase();
              for (const word of fillerWords) {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = lowerTranscript.match(regex);
                if (matches) count += matches.length;
              }
              
              if (count > 2) {
                // Trigger soft ding and haptic
                try {
                  if (navigator.vibrate) navigator.vibrate(200);
                  
                  if (this.audioContext) {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    
                    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                    
                    osc.start(this.audioContext.currentTime);
                    osc.stop(this.audioContext.currentTime + 0.3);
                  }
                } catch (e) {
                  console.error("Buzzer error", e);
                }
              }
            }
          }
        };
        try {
          this.recognition.start();
        } catch(e) {}
      }

    } catch (e: any) {
      onError(`Error: ${e.message || e}`);
      this.stop(onStateChange);
      console.error(e);
    }
  }
  
  private handleDownstreamAudio(event: MessageEvent) {
     if (!this.audioContext) return;
     const msg = JSON.parse(event.data);
     
     if (msg.interrupted) {
       this.nextStartTime = this.audioContext.currentTime; // Reset queue
       return;
     }

     if (msg.audio) {
       const binaryStr = atob(msg.audio);
       const buffer = new ArrayBuffer(binaryStr.length);
       const view = new DataView(buffer);
       for (let i = 0; i < binaryStr.length; i++) {
         view.setUint8(i, binaryStr.charCodeAt(i));
       }
       
       const int16Array = new Int16Array(buffer);
       const float32Array = new Float32Array(int16Array.length);
       for (let i = 0; i < int16Array.length; i++) {
         float32Array[i] = int16Array[i] / (int16Array[i] >= 0 ? 32767 : 32768);
       }
       
       const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
       audioBuffer.getChannelData(0).set(float32Array);
       
       const source = this.audioContext.createBufferSource();
       source.buffer = audioBuffer;
       source.connect(this.audioContext.destination);
       
       const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
       source.start(startTime);
       this.nextStartTime = startTime + audioBuffer.duration;
     }

     if (msg.text) {
       this.sessionLogs.push(msg.text);
       if (this.onTranscriptUpdate) {
         this.onTranscriptUpdate(msg.text);
       }
     }
  }
  
  stop(onStateChange: (active: boolean) => void) {
    this.isActive = false;
    onStateChange(false);
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    if (this.ws) {
      this.ws.close();
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e) {}
      this.recognition = null;
    }
  }
}

export const audioInterface = new AudioStreamInterface();
