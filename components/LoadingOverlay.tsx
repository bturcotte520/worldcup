"use client";

interface LoadingOverlayProps {
  text?: string;
}

export default function LoadingOverlay({ text = "Loading..." }: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(10, 15, 30, 0.9)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="text-6xl"
          style={{
            animation: "spin 1s linear infinite",
          }}
        >
          ⚽
        </div>
        <div
          className="text-white/80 text-lg font-semibold tracking-wide"
          style={{
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          {text}
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
