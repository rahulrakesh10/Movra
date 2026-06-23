import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

/**
 * Camera-based barcode scanner using ZXing. Loaded only on the
 * client (dynamic import) because the library touches `navigator`.
 */
export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const handledRef = useRef(false);
  // Stable ref for onDetected so it never triggers effect re-run
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const [status, setStatus] = useState<"loading" | "active" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Small delay to ensure the video element is mounted in the DOM
      await new Promise((r) => setTimeout(r, 50));
      if (cancelled || !videoRef.current) return;

      if (!navigator?.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            "Camera requires a secure context (HTTPS) or localhost. Please open this app over HTTPS or type the barcode digits manually.",
          );
        }
        return;
      }

      try {
        // Two top-level imports — both work reliably with Vite
        const [zxingBrowser, zxingLib] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        if (cancelled) return;

        const { BrowserMultiFormatReader } = zxingBrowser;
        const { BarcodeFormat, DecodeHintType } = zxingLib;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
          BarcodeFormat.CODABAR,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 80,
          delayBetweenScanSuccess: 300,
          tryPlayVideoTimeout: 5000,
        });

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        if (cancelled) return;

        controlsRef.current = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err) => {
            // err is a NotFoundException on every failed frame — ignore it
            if (!result || handledRef.current) return;
            handledRef.current = true;
            controlsRef.current?.stop();
            onDetectedRef.current(result.getText());
          },
        );

        if (!cancelled) setStatus("active");
      } catch (error: unknown) {
        const err = error as Error | null;
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            err?.name === "NotAllowedError"
              ? "Camera permission denied. Please allow camera access and try again."
              : err?.name === "NotFoundError"
                ? "No camera found on this device."
                : err?.message ||
                  "Couldn't start camera. Check permissions or try a different device.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []); // intentionally empty — onDetected is handled via ref

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <p className="text-sm font-bold uppercase tracking-wider text-white/90">Scan barcode</p>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20 active:bg-white/30"
          aria-label="Close scanner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative flex flex-1 items-center justify-center px-4">
        {/* Loading overlay */}
        {status === "loading" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/70">
            <Camera className="h-10 w-10 animate-pulse" />
            <p className="text-sm">Starting camera…</p>
          </div>
        )}

        {/* Error overlay */}
        {status === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center text-white/90">
            <div className="rounded-full bg-red-500/10 p-3 text-red-500">
              <Camera className="h-8 w-8 text-red-400 animate-pulse" />
            </div>
            <p className="font-semibold text-red-400">Secure Connection Required</p>
            <p className="text-xs text-white/60 max-w-xs">{errorMsg}</p>
          </div>
        )}

        <video
          ref={videoRef}
          className="h-full max-h-[62vh] w-full max-w-md rounded-2xl object-cover"
          muted
          playsInline
          autoPlay
        />

        {/* Scan area frame */}
        <div
          className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2"
          style={{ height: "clamp(100px, 28vw, 130px)" }}
        >
          {/* Dim overlay outside the scan box */}
          <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.50)]" />
          {/* Corner brackets */}
          <div className="absolute left-0 top-0 h-6 w-6 border-l-4 border-t-4 border-white rounded-tl-sm" />
          <div className="absolute right-0 top-0 h-6 w-6 border-r-4 border-t-4 border-white rounded-tr-sm" />
          <div className="absolute left-0 bottom-0 h-6 w-6 border-l-4 border-b-4 border-white rounded-bl-sm" />
          <div className="absolute right-0 bottom-0 h-6 w-6 border-r-4 border-b-4 border-white rounded-br-sm" />
          {/* Scanning laser line */}
          {status === "active" && (
            <div
              className="absolute left-1 right-1 top-1/2 h-0.5 -translate-y-1/2 bg-red-400/90 shadow-[0_0_12px_rgba(248,113,113,0.9)]"
              style={{ animation: "scan-line 1.8s ease-in-out infinite" }}
            />
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div
        className="px-6 pt-4 text-center text-sm font-medium leading-snug"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {status === "error" ? (
          <p className="text-red-400">{errorMsg}</p>
        ) : status === "loading" ? (
          <p className="text-white/50">Requesting camera access…</p>
        ) : (
          <p className="text-white/70">Point at a barcode and hold steady</p>
        )}
      </div>

      <style>{`
        @keyframes scan-line {
          0%, 100% { transform: translateY(-200%); opacity: 0.6; }
          50%       { transform: translateY(200%);  opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
