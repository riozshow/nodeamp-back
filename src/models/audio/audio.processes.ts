import { Injectable } from '@nestjs/common';

@Injectable()
export class AudioProcesses {
  async encodeFile(file: Express.Multer.File) {
    return file;
  }

  async readAudioData(file: Express.Multer.File) {
    const duration = Math.random() * 1000;
    const channels = 1 + Math.round(Math.random() * 1);
    const waveform = await this.getWaveform(1000);

    const { loudness, peak } = await this.analyzeAudio();

    return {
      duration,
      channels,
      waveform,
      loudness,
      peak,
    };
  }

  async getWaveform(resolution: number) {
    if (resolution > 2550) throw new Error('Waveform resolution is too high');
    const data = new ArrayBuffer(resolution);
    const view = new DataView(data, 0, resolution);
    for (let i = 0; i < resolution; i++) {
      view.setUint8(i, Math.round(Math.random() * 255));
    }
    return Buffer.from(view.buffer);
  }

  async analyzeAudio() {
    const loudness = -50 + Math.random() * 48;
    const peak = -10 + Math.random() * 10;

    return {
      loudness,
      peak,
    };
  }
}
