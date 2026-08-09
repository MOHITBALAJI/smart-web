import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrGeneratorProps {
  data: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  campName?: string;
  size?: number;
}

export function QrGenerator({
  data,
  beneficiaryId,
  beneficiaryName,
  campName,
  size = 200,
}: QrGeneratorProps) {
  const qrRef = useRef<SVGSVGElement>(null);

  const downloadQR = () => {
    if (!qrRef.current) return;

    // Convert SVG to canvas then download
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    canvas.width = size + 80;
    canvas.height = size + 120;

    img.onload = () => {
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = "#1e3a5f";
      ctx.fillRect(0, 0, canvas.width, 40);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("FloodResponse EMS", canvas.width / 2, 26);

      // QR Code
      ctx.drawImage(img, 40, 48, size, size);

      // Footer info
      ctx.fillStyle = "#374151";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      if (beneficiaryName) {
        ctx.fillText(beneficiaryName, canvas.width / 2, size + 68);
      }
      if (beneficiaryId) {
        ctx.font = "10px monospace";
        ctx.fillStyle = "#6b7280";
        ctx.fillText(beneficiaryId.toUpperCase(), canvas.width / 2, size + 84);
      }
      if (campName) {
        ctx.fillText(campName, canvas.width / 2, size + 100);
      }

      const link = document.createElement("a");
      link.download = `qr-${beneficiaryId || "beneficiary"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    img.src = URL.createObjectURL(blob);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Container */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-border flex flex-col items-center gap-3">
        {/* Header */}
        <div className="flex items-center gap-2 w-full justify-center pb-3 border-b border-border">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary">FloodResponse EMS</span>
        </div>

        <QRCodeSVG
          ref={qrRef}
          value={data}
          size={size}
          level="H"
          includeMargin={true}
          style={{ borderRadius: 8 }}
          fgColor="#1e3a5f"
          bgColor="#ffffff"
          imageSettings={{
            src: "/favicon.svg",
            height: 28,
            width: 28,
            excavate: true,
          }}
        />

        {/* Footer info */}
        <div className="text-center">
          {beneficiaryName && (
            <p className="text-sm font-bold text-foreground">{beneficiaryName}</p>
          )}
          {beneficiaryId && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {beneficiaryId.toUpperCase()}
            </p>
          )}
          {campName && (
            <p className="text-xs text-muted-foreground">{campName}</p>
          )}
        </div>
      </div>

      {/* What this QR contains */}
      <div className="w-full bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">This QR contains:</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Beneficiary ID</li>
          <li>Camp assignment</li>
          <li>Family group ID</li>
          <li>Distribution tracking</li>
        </ul>
      </div>

      <Button onClick={downloadQR} variant="outline" className="w-full gap-2">
        <Download className="w-4 h-4" />
        Download QR Code
      </Button>
    </div>
  );
}
