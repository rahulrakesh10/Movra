import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

const REGION_ID = "barcode-scanner-region";

/**
 * Camera-based barcode scanner using html5-qrcode. Loaded only on the
 * client (dynamic import) because the library touches `navigator`.
 */
export function BarcodeScanner({ onDetected, onClose }: Props) {
  const scannerRef = useRef<any>(null);
  const handledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let scanner: any;

    (async () => {
      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;
        const { Html5Qrcode } = mod;
        scanner = new Html5Qrcode(REGION_ID, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 140 },
            aspectRatio: 1.7778,
          },
          (decodedText: string) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onDetected(decodedText);
          },
          () => {
            /* ignore per-frame decode errors */
          }
        );
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.message ||
              "Couldn't start camera. Check permissions or try a different device."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95">
      <div className="flex items-center justify-between p-4 text-white">
        <p className="text-sm font-bold uppercase tracking-wider">
          Scan barcode
        </p>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
          aria-label="Close scanner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-2">
        <div
          id={REGION_ID}
          className="w-full max-w-md overflow-hidden rounded-xl"
        />
      </div>
      <div className="p-4 text-center text-xs text-white/70">
        {error
          ? error
          : "Point your camera at a product barcode. Hold steady until it scans."}
      </div>
    </div>
  );
}