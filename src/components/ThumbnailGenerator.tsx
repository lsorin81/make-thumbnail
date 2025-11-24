"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Download, Upload } from "lucide-react";

export default function ThumbnailGenerator() {
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isCaptionApplied, setIsCaptionApplied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setIsCaptionApplied(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaption(e.target.value);
    setIsCaptionApplied(false);
  };

  const applyCaption = () => {
    setIsCaptionApplied(true);
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      if (isCaptionApplied && caption) {
        // Text settings
        const fontSize = Math.max(60, img.width * 0.08); // Increased font size
        ctx.font = `bold ${fontSize}px Impact, sans-serif`;
        ctx.fillStyle = "#FFD700"; // Gold
        ctx.strokeStyle = "#8B4513"; // Brown
        ctx.lineWidth = fontSize * 0.05;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        // Text Wrapping Logic
        const maxWidth = img.width * 0.4; // Limit width to 40% of image
        const words = caption.toUpperCase().split(" ");
        let line = "";
        const lines = [];

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && i > 0) {
            lines.push(line);
            line = words[i] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        // Position and rotation
        ctx.save();
        ctx.translate(img.width * 0.1, img.height * 0.2); // Increased top margin
        ctx.rotate((-15 * Math.PI) / 180); // Rotate -15 degrees
        
        // Draw each line
        lines.forEach((l, index) => {
            ctx.strokeText(l, 0, index * fontSize * 1.1);
            ctx.fillText(l, 0, index * fontSize * 1.1);
        });
        
        ctx.restore();
      }
    };
  };

  useEffect(() => {
    if (image) {
      renderCanvas();
    }
  }, [image, caption, isCaptionApplied]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Start with high quality JPEG
    let quality = 0.95;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    
    // Check size (approximate: base64 length * 0.75)
    // 1.9 MB = 1.9 * 1024 * 1024 bytes
    const maxBytes = 1.9 * 1024 * 1024;
    
    while (dataUrl.length * 0.75 > maxBytes && quality > 0.1) {
        quality -= 0.05;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    const link = document.createElement("a");
    link.download = "thumbnail.jpg"; // Changed to jpg for better compression
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center bg-neutral-900 text-white transition-colors duration-300"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {!image ? (
        <div className="flex h-screen w-full flex-col items-center justify-center border-4 border-dashed border-neutral-700 bg-neutral-800/50 text-neutral-400 transition-all hover:border-neutral-500 hover:bg-neutral-800/80">
          <Upload className="mb-4 h-20 w-20 opacity-50" />
          <h1 className="text-4xl font-bold">Drop your image here</h1>
          <p className="mt-2 text-lg">or click to browse (not implemented yet, just drag & drop)</p>
        </div>
      ) : (
        <div className="relative flex h-screen w-full flex-col items-center justify-center p-8">
          <div className="relative flex max-h-full max-w-full flex-col items-center justify-center overflow-hidden rounded-lg shadow-2xl">
             {/* Canvas is the main display */}
            <canvas
              ref={canvasRef}
              className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-lg"
            />
            
            {/* Controls Overlay */}
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/60 p-4 backdrop-blur-md transition-all hover:bg-black/80">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={caption}
                  onChange={handleCaptionChange}
                  placeholder="Enter caption..."
                  className="w-64 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 outline-none transition-all focus:border-white/50 focus:bg-white/20"
                />
                <button
                  onClick={applyCaption}
                  className="ml-2 rounded-full bg-green-500 p-2 text-white transition-transform hover:scale-110 hover:bg-green-600 active:scale-95"
                  title="Apply Caption"
                >
                  <Check size={20} />
                </button>
              </div>

              {isCaptionApplied && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-full bg-blue-500 px-6 py-2 font-bold text-white transition-transform hover:scale-105 hover:bg-blue-600 active:scale-95"
                >
                  <Download size={20} />
                  Download
                </button>
              )}
            </div>
            
            {/* Reset Button (Optional but good for UX) */}
             <button 
                onClick={() => setImage(null)}
                className="absolute top-4 right-4 rounded-full bg-red-500/80 p-2 text-white hover:bg-red-600"
                title="Remove Image"
             >
                 ✕
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
