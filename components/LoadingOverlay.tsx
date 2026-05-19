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
        <div className="text-6xl animate-spin">
          ⚽
        </div>
        <div className="text-white/80 text-lg font-semibold tracking-wide animate-pulse" style={{ animationDuration: "1.5s" }}>
          {text}
        </div>
      </div>
    </div>
  );
}
