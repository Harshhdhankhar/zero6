export interface ProcessedImage {
  file: Blob;
  dataUrl: string;
}

export function processImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: { w: number; h: number };
    quality?: number;
    maxSizeMB?: number;
  } = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    aspectRatio,
    quality = 0.85,
    maxSizeMB = 5,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;

      // Crop to aspect ratio first (center crop)
      if (aspectRatio) {
        const targetRatio = aspectRatio.w / aspectRatio.h;
        const imageRatio = sw / sh;

        if (imageRatio > targetRatio) {
          sw = sh * targetRatio;
        } else {
          sh = sw / targetRatio;
        }
      }

      // Scale down if too large
      let scale = 1;
      if (sw > maxWidth) scale = maxWidth / sw;
      if (sh * scale > maxHeight) scale = maxHeight / sh;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round((aspectRatio ? sw : img.naturalWidth) * scale);
      canvas.height = Math.round((aspectRatio ? sh : img.naturalHeight) * scale);

      const ctx = canvas.getContext("2d")!;

      // Center crop
      const sx = (img.naturalWidth - sw) / 2;
      const sy = (img.naturalHeight - sh) / 2;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      // Compress if over size limit
      const currentQuality = quality;
      const tryCompress = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to process image"));
            const dataUrl = canvas.toDataURL("image/jpeg", q);
            if (blob.size > maxSizeMB * 1024 * 1024 && q > 0.3) {
              tryCompress(q - 0.15);
            } else {
              resolve({ file: blob, dataUrl });
            }
          },
          "image/jpeg",
          q
        );
      };
      tryCompress(currentQuality);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export { processImage as processImageUpload };

export function getDefaultLogo(name: string): string {
  const colors = [
    "#FF5A1F", "#6366F1", "#8B5CF6", "#EC4899", "#14B8A6",
    "#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#06B6D4",
  ];
  const char = name?.charAt(0)?.toUpperCase() || "?";
  const code = char.charCodeAt(0);
  const color = colors[code % colors.length];

  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 80px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, 100, 100);

  return canvas.toDataURL("image/png");
}

export const DEFAULT_BANNER = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&h=675&fit=crop";
