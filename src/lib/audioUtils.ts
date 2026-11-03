/**
 * Encode an AudioBuffer to WAV format for download.
 * Based on Web Audio API patterns for Float32 PCM -> WAV.
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, ch) => audioBuffer.getChannelData(ch));
  return channelsToWavBlob(channels, audioBuffer.sampleRate);
}

/** The same encoding from planar samples, for workers, which have no AudioBuffer. */
export function channelsToWavBlob(channels: Float32Array[], sampleRate: number): Blob {
  const numChannels = channels.length;
  const channelLength = channels[0].length;

  // Interleave channels
  const interleaved = new Float32Array(channelLength * numChannels);
  channels.forEach((channel, ch) => {
    for (let i = 0; i < channelLength; i++) {
      interleaved[i * numChannels + ch] = channel[i];
    }
  });

  const header = getWavHeader({
    isFloat: true,
    numChannels,
    sampleRate,
    numFrames: channelLength,
  });
  return new Blob([header, interleaved.buffer as ArrayBuffer], { type: "audio/wav" });
}

function getWavHeader(options: {
  isFloat: boolean;
  numChannels: number;
  sampleRate: number;
  numFrames: number;
}): ArrayBuffer {
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

  return headerBuffer;
}
