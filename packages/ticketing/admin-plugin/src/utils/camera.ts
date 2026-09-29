// Camera access and QR decoding for the gate scanner. The browser APIs are passed in, so the
// selection logic runs in node --test.
import jsQR from 'jsqr';

export type CameraProblem =
  'INSECURE_CONTEXT' | 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'NO_CAMERA' | 'CAMERA_BUSY' | 'UNKNOWN';

interface CameraEnvironment {
  isSecureContext?: boolean;
  navigator?: { mediaDevices?: { getUserMedia?: unknown } };
}

/** Browsers only offer the camera on https:// (or localhost); plain http hides mediaDevices. */
export function getCameraSupportProblem(environment: CameraEnvironment): CameraProblem | null {
  if (environment.isSecureContext === false) return 'INSECURE_CONTEXT';
  if (typeof environment.navigator?.mediaDevices?.getUserMedia !== 'function') return 'UNSUPPORTED';
  return null;
}

/** Explains a rejected getUserMedia() by its DOMException name. */
export function classifyCameraError(error: unknown): CameraProblem {
  switch ((error as { name?: string })?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'PERMISSION_DENIED';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'NO_CAMERA';
    case 'NotReadableError':
    case 'AbortError':
      return 'CAMERA_BUSY';
    default:
      return 'UNKNOWN';
  }
}

interface VideoFrameSource {
  videoWidth: number;
  videoHeight: number;
}

interface CanvasLike {
  width: number;
  height: number;
  getContext(
    type: '2d',
    options?: { willReadFrequently?: boolean },
  ): {
    drawImage(source: any, x: number, y: number, width: number, height: number): void;
    getImageData(x: number, y: number, width: number, height: number): { data: Uint8ClampedArray };
  } | null;
}

interface BarcodeDetectorLike {
  detect(source: any): Promise<{ rawValue: string }[]>;
}

// Not in the TypeScript DOM library yet.
interface BarcodeDetectorConstructor {
  new (options?: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

export interface QrDecoderEnvironment {
  BarcodeDetector?: BarcodeDetectorConstructor;
  createCanvas?: () => CanvasLike;
}

export interface QrDecoder {
  /** native: the browser's BarcodeDetector; jsqr: the bundled decoder (iOS Safari, Firefox) */
  kind: 'native' | 'jsqr';
  /** Text of the QR code in the current video frame, or null */
  decode(video: VideoFrameSource): Promise<string | null>;
}

// Scanning a downscaled frame is much faster and still reads tickets held up to the camera.
const MAX_FRAME_SIZE = 800;

const browserEnvironment = (): QrDecoderEnvironment => ({
  BarcodeDetector: (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector,
  createCanvas: () => document.createElement('canvas') as unknown as CanvasLike,
});

async function supportsQrCodes(BarcodeDetector: BarcodeDetectorConstructor) {
  try {
    return (await BarcodeDetector.getSupportedFormats?.())?.includes('qr_code') ?? false;
  } catch {
    return false;
  }
}

function createJsQrDecoder(createCanvas: () => CanvasLike): QrDecoder {
  let canvas: CanvasLike | null = null;
  return {
    kind: 'jsqr',
    async decode(video) {
      if (!video.videoWidth || !video.videoHeight) return null;
      const scale = Math.min(1, MAX_FRAME_SIZE / Math.max(video.videoWidth, video.videoHeight));
      const width = Math.round(video.videoWidth * scale);
      const height = Math.round(video.videoHeight * scale);
      canvas ??= createCanvas();
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return null;
      context.drawImage(video, 0, 0, width, height);
      const { data } = context.getImageData(0, 0, width, height);
      return jsQR(data, width, height, { inversionAttempts: 'dontInvert' })?.data || null;
    },
  };
}

/**
 * Uses the browser's BarcodeDetector when it reads QR codes (Chrome on Android, Safari on macOS),
 * otherwise the bundled jsQR on canvas frames: iOS Safari and Firefox have no BarcodeDetector.
 */
export async function createQrDecoder(
  environment: QrDecoderEnvironment = browserEnvironment(),
): Promise<QrDecoder> {
  const { BarcodeDetector } = environment;
  if (BarcodeDetector && (await supportsQrCodes(BarcodeDetector))) {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    return {
      kind: 'native',
      async decode(video) {
        try {
          const [code] = await detector.detect(video);
          return code?.rawValue || null;
        } catch {
          // No frame yet (InvalidStateError) or a frame the detector could not read.
          return null;
        }
      },
    };
  }
  return createJsQrDecoder(environment.createCanvas ?? browserEnvironment().createCanvas!);
}
