export type TargetMime = "image/jpeg" | "image/webp";

export interface EncodeImageOptions {
  targetBytes: number;
  /** Floor. JPEG can be padded with COM bytes to reach it. WebP cannot. */
  minBytes?: number;
  mime: TargetMime;
}

export interface EncodeImageResult {
  bytes: Uint8Array;
  mime: TargetMime;
  quality: number;
  scale: number;
  width: number;
  height: number;
  padded: boolean;
  paddingBytes: number;
  withinTarget: boolean;
  metMinimum: boolean;
}
