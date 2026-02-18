/**
 * Encode an AudioBuffer to WAV format for download.
 * Based on Web Audio API patterns for Float32 PCM -> WAV.
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const channelLength = audioBuffer.length;

  // Interleave channels
  const interleaved = new Float32Array(channelLength * numChannels);
  for (let i = 0; i < channelLength; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      interleaved[i * numChannels + ch] = audioBuffer.getChannelData(ch)[i];
    }
  }

  const wavBytes = getWavBytes(interleaved.buffer, {
    isFloat: true,
    numChannels,
    sampleRate,
    numFrames: channelLength,
  });
  return new Blob([wavBytes], { type: "audio/wav" });
}

function getWavBytes(buffer: ArrayBuffer, options: {
  isFloat: boolean;
  numChannels: number;
  sampleRate: number;
  numFrames: number;
}): Uint8Array {
  const bytesPerSample = options.isFloat ? 4 : 2;
  const format = options.isFloat ? 3 : 1;
  const blockAlign = options.numChannels * bytesPerSample;
  const byteRate = options.sampleRate * blockAlign;
  const dataSize = options.numFrames * blockAlign;

  const headerBuffer = new ArrayBuffer(44);
  const dv = new DataView(headerBuffer);
  let p = 0;

  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(p++, s.charCodeAt(i));
  };
  const writeUint32 = (d: number) => {
    dv.setUint32(p, d, true);
    p += 4;
  };
  const writeUint16 = (d: number) => {
    dv.setUint16(p, d, true);
    p += 2;
  };

  writeString("RIFF");
  writeUint32(dataSize + 36);
  writeString("WAVE");
  writeString("fmt ");
  writeUint32(16);
  writeUint16(format);
  writeUint16(options.numChannels);
  writeUint32(options.sampleRate);
  writeUint32(byteRate);
  writeUint16(blockAlign);
  writeUint16(bytesPerSample * 8);
  writeString("data");
  writeUint32(dataSize);

  const wavBytes = new Uint8Array(44 + buffer.byteLength);
  wavBytes.set(new Uint8Array(headerBuffer), 0);
  wavBytes.set(new Uint8Array(buffer), 44);
  return wavBytes;
}
