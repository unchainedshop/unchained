import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  classifyCameraError,
  createQrDecoder,
  getCameraSupportProblem,
  type CameraProblem,
} from '../utils/camera.ts';
import { createRepeatGuard } from '../utils/scan.ts';

// Pause between two decoded frames: fast enough for a queue, light on phone batteries.
const SCAN_INTERVAL_MS = 150;
// A code held in front of the camera is reported once, until it has been out of view this long.
const REPEAT_WINDOW_MS = 2500;

const useCameraProblemMessage = () => {
  const { formatMessage } = useIntl();
  return (problem: CameraProblem) => {
    switch (problem) {
      case 'INSECURE_CONTEXT':
        return formatMessage({
          id: 'gate_camera_insecure',
          defaultMessage:
            'The camera only works on a secure connection. Open the admin UI through https:// (or on localhost).',
        });
      case 'UNSUPPORTED':
        return formatMessage({
          id: 'gate_camera_unsupported',
          defaultMessage:
            'This browser cannot use the camera. Type the ticket code or use a barcode scanner instead.',
        });
      case 'PERMISSION_DENIED':
        return formatMessage({
          id: 'gate_camera_denied',
          defaultMessage:
            'Camera access was denied. Allow the camera for this site in the browser settings, then start the camera again.',
        });
      case 'NO_CAMERA':
        return formatMessage({
          id: 'gate_camera_missing',
          defaultMessage: 'No camera was found on this device.',
        });
      case 'CAMERA_BUSY':
        return formatMessage({
          id: 'gate_camera_busy',
          defaultMessage:
            'The camera is used by another app or tab, or it stopped. Close the other app and start the camera again.',
        });
      default:
        return formatMessage({
          id: 'gate_camera_failed',
          defaultMessage: 'The camera could not be started.',
        });
    }
  };
};

/**
 * Reads QR codes with the device camera (rear camera preferred) and reports every new code once.
 * Uses the browser's BarcodeDetector where it reads QR codes and the bundled jsQR elsewhere
 * (iOS Safari, Firefox). The camera is released when the scanner unmounts, the page is hidden or
 * the user stops it; the screen is kept awake while it runs where the browser allows it.
 */
const QrCameraScanner = ({
  onCode,
  onStart,
}: {
  onCode: (text: string) => void;
  /** Called from the click that starts the camera, e.g. to unlock audio feedback */
  onStart?: () => void;
}) => {
  const { formatMessage } = useIntl();
  const describeProblem = useCameraProblemMessage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeLockRef = useRef<{ release(): Promise<void> } | null>(null);
  // Every start and stop begins a new session; async work of an older session gives up.
  const sessionRef = useRef(0);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  const [state, setState] = useState<'off' | 'starting' | 'on'>('off');
  const [problem, setProblem] = useState<CameraProblem | null>(null);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    wakeLockRef.current?.release().catch(() => undefined);
    wakeLockRef.current = null;
    setState('off');
  }, []);

  const start = useCallback(async () => {
    stop();
    const session = sessionRef.current;
    const isCurrent = () => session === sessionRef.current;
    const unsupported = getCameraSupportProblem({
      isSecureContext: window.isSecureContext,
      navigator,
    });
    setProblem(unsupported);
    if (unsupported) return;

    setState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (!isCurrent()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      const decoder = await createQrDecoder();
      if (!isCurrent()) return;

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (!isCurrent()) return;
        stop();
        setProblem('CAMERA_BUSY');
      });
      (navigator as any).wakeLock
        ?.request('screen')
        .then((lock) => {
          if (isCurrent()) wakeLockRef.current = lock;
          else lock.release().catch(() => undefined);
        })
        .catch(() => undefined);
      setState('on');

      const isNew = createRepeatGuard(REPEAT_WINDOW_MS);
      const tick = async () => {
        if (!isCurrent()) return;
        const text = await decoder.decode(video).catch(() => null);
        if (!isCurrent()) return;
        if (text && isNew(text)) onCodeRef.current(text);
        timerRef.current = setTimeout(tick, SCAN_INTERVAL_MS);
      };
      tick();
    } catch (error) {
      if (!isCurrent()) return;
      stop();
      setProblem(classifyCameraError(error));
    }
  }, [stop]);

  // Release the camera when leaving the gate and while the page is in the background.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
    };
  }, [stop]);

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-lg bg-slate-900"
        style={{ display: state === 'off' ? 'none' : 'block', aspectRatio: '4 / 3' }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="h-full w-full object-cover"
          aria-label={formatMessage({ id: 'gate_camera_preview', defaultMessage: 'Camera preview' })}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '15%',
            border: '3px solid rgba(255, 255, 255, 0.85)',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)',
          }}
        />
        {state === 'starting' && (
          <p
            className="text-center text-sm text-white"
            style={{ position: 'absolute', left: 0, right: 0, bottom: '0.75rem' }}
          >
            {formatMessage({ id: 'gate_camera_starting', defaultMessage: 'Starting camera…' })}
          </p>
        )}
      </div>
      {problem && (
        <p role="alert" className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
          {describeProblem(problem)}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {state === 'off' ? (
          <button
            type="button"
            onClick={() => {
              onStart?.();
              start();
            }}
            className="inline-flex flex-1 items-center justify-center rounded-md bg-slate-800 px-4 py-3 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
          >
            {formatMessage({ id: 'gate_camera_start', defaultMessage: 'Scan with camera' })}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-border-default px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            {formatMessage({ id: 'gate_camera_stop', defaultMessage: 'Stop camera' })}
          </button>
        )}
      </div>
    </div>
  );
};

export default QrCameraScanner;
