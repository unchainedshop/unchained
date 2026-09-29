import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCameraSupportProblem, classifyCameraError, createQrDecoder } from './camera.ts';

test('the camera needs a secure context and getUserMedia', () => {
  const getUserMedia = async () => ({});
  assert.equal(
    getCameraSupportProblem({ isSecureContext: false, navigator: { mediaDevices: { getUserMedia } } }),
    'INSECURE_CONTEXT',
  );
  // Browsers hide navigator.mediaDevices on plain http, so the secure context is checked first.
  assert.equal(getCameraSupportProblem({ isSecureContext: false, navigator: {} }), 'INSECURE_CONTEXT');
  assert.equal(getCameraSupportProblem({ isSecureContext: true, navigator: {} }), 'UNSUPPORTED');
  assert.equal(
    getCameraSupportProblem({ isSecureContext: true, navigator: { mediaDevices: { getUserMedia } } }),
    null,
  );
});

test('camera failures are explained by their DOMException name', () => {
  assert.equal(classifyCameraError({ name: 'NotAllowedError' }), 'PERMISSION_DENIED');
  assert.equal(classifyCameraError({ name: 'SecurityError' }), 'PERMISSION_DENIED');
  assert.equal(classifyCameraError({ name: 'NotFoundError' }), 'NO_CAMERA');
  assert.equal(classifyCameraError({ name: 'OverconstrainedError' }), 'NO_CAMERA');
  assert.equal(classifyCameraError({ name: 'NotReadableError' }), 'CAMERA_BUSY');
  assert.equal(classifyCameraError({ name: 'AbortError' }), 'CAMERA_BUSY');
  assert.equal(classifyCameraError(new Error('boom')), 'UNKNOWN');
  assert.equal(classifyCameraError(undefined), 'UNKNOWN');
});

test('the native BarcodeDetector decodes QR codes when the browser supports them', async () => {
  const created: unknown[] = [];
  let formats = ['qr_code', 'ean_13'];
  let detect = async (): Promise<{ rawValue: string }[]> => [{ rawValue: 'https://x.test/t1?hash=k' }];
  class FakeBarcodeDetector {
    static getSupportedFormats = async () => formats;
    constructor(options: unknown) {
      created.push(options);
    }
    detect() {
      return detect();
    }
  }

  const decoder = await createQrDecoder({ BarcodeDetector: FakeBarcodeDetector });
  assert.equal(decoder.kind, 'native');
  assert.deepEqual(created, [{ formats: ['qr_code'] }]);
  assert.equal(await decoder.decode({ videoWidth: 640, videoHeight: 480 }), 'https://x.test/t1?hash=k');
  detect = async () => [];
  assert.equal(await decoder.decode({ videoWidth: 640, videoHeight: 480 }), null);
  // A frame that is not ready yet is not an error.
  detect = async () => {
    throw new Error('InvalidStateError');
  };
  assert.equal(await decoder.decode({ videoWidth: 640, videoHeight: 480 }), null);

  formats = ['ean_13'];
  assert.equal((await createQrDecoder({ BarcodeDetector: FakeBarcodeDetector })).kind, 'jsqr');
  FakeBarcodeDetector.getSupportedFormats = async () => {
    throw new Error('not supported');
  };
  assert.equal((await createQrDecoder({ BarcodeDetector: FakeBarcodeDetector })).kind, 'jsqr');
});

test('without BarcodeDetector (iOS Safari, Firefox) frames are decoded with the bundled jsQR', async () => {
  const drawn: unknown[][] = [];
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: (...args: unknown[]) => drawn.push(args),
      getImageData: (_x: number, _y: number, width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }),
    }),
  };
  const decoder = await createQrDecoder({ createCanvas: () => canvas });
  assert.equal(decoder.kind, 'jsqr');
  // A video that has no frame yet is skipped.
  assert.equal(await decoder.decode({ videoWidth: 0, videoHeight: 0 }), null);
  assert.equal(drawn.length, 0);
  // Frames are scaled down to keep decoding cheap; an empty frame holds no code.
  const video = { videoWidth: 1920, videoHeight: 1080 };
  assert.equal(await decoder.decode(video), null);
  assert.equal(canvas.width, 800);
  assert.equal(canvas.height, 450);
  assert.deepEqual(drawn[0], [video, 0, 0, 800, 450]);
});
