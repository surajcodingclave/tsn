"use client";

import { useRef, useEffect, useState } from "react";
import { Eraser, Check } from "lucide-react";
import { Button } from "@/components/ui";

/** Capture a signature and surface its data URL to the parent via onChange. */
export function SigCanvas({ onChange, onClose, height = 160 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const down = (e) => {
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
  };
  const move = (e) => {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };
  const up = () => {
    drawing.current = false;
    setHas(true);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHas(false);
  };

  const save = () => {
    onChange(canvasRef.current.toDataURL("image/png"));
    onClose && onClose();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-white" style={{ width: "100%", touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={clear}><Eraser className="h-4 w-4" /> Clear</Button>
        <Button size="sm" variant="success" disabled={!has} onClick={save}><Check className="h-4 w-4" /> Use signature</Button>
      </div>
    </div>
  );
}