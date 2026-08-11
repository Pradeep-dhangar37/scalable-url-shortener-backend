"use client";

import QRCodeGenerator from "./QRCodeGenerator";

export default function QrModal({ activeQrLink, setActiveQrLink }) {
  if (!activeQrLink) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-[4px] p-4">
      <div className="relative border border-border rounded-lg bg-card max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={() => setActiveQrLink(null)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1 rounded hover:bg-muted"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-x-lg"
            viewBox="0 0 16 16"
          >
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
          </svg>
        </button>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">
          Link QR Code
        </h3>
        <QRCodeGenerator url={activeQrLink.url} shortCode={activeQrLink.shortCode} />
      </div>
    </div>
  );
}
