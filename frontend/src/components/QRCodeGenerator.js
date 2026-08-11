"use client";

import { useState } from "react";
import { Download, Check, Clipboard } from "lucide-react";

export default function QRCodeGenerator({ url, shortCode }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    url
  )}`;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${shortCode || "shorturl"}-qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Failed to download QR code", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center p-5 border border-border bg-card rounded-lg gap-4">
      <div className="bg-white p-2 border border-border rounded">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImageUrl}
          alt="QR Code"
          className="w-32 h-32 object-contain"
          loading="lazy"
        />
      </div>

      <div className="text-center w-full">
        <span className="text-[11px] font-medium text-muted-foreground block truncate max-w-[150px] mx-auto">
          {url.replace(/^https?:\/\//, "")}
        </span>
      </div>

      <div className="flex gap-2 w-full">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-medium rounded border border-border hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3 h-3" />
          {downloading ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 text-xs font-medium rounded bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Clipboard className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
