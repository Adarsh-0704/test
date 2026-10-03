"use client";

import {useRef, useState, PointerEvent} from "react";

interface Props {
  symbol: string;
  color: "white" | "black";
  isTurn: boolean;
  onDragStart: () => void;
  onDragEnd: (clientX: number, clientY: number) => Promise<boolean> | boolean | void;
}

function ChessPiece({ symbol, color, isTurn, onDragStart, onDragEnd }: Props) {
  const [isDrag, setIsDrag] = useState(false);
  
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const handleStart = (e: PointerEvent<HTMLDivElement>) => {
    if (!isTurn) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    start.current = { x: e.clientX, y: e.clientY };
    current.current = { x: 0, y: 0 };
    setIsDrag(true);
    
    onDragStart?.();
  };

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDrag || !ref.current) return;

    const x = e.clientX - start.current.x;
    const y = e.clientY - start.current.y;

    current.current = { x, y };
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const handleEnd = async (e: PointerEvent<HTMLDivElement>) => {
    if (!isDrag) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDrag(false);

    const isMoveValid = await onDragEnd?.(e.clientX, e.clientY);

    if (!isMoveValid && ref.current) {
      ref.current.style.transform = "translate3d(0px, 0px, 0)";
    }
  };

  const pieceColorClass = color === "white"
    ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
    : "text-black drop-shadow-[0_2px_2px_rgba(255,255,255,0.4)]";

  return (
    <div
      ref={ref}
      onPointerDown={handleStart}
      onPointerMove={handleMove}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      className={`flex h-full w-full items-center justify-center select-none touch-none ${
        isTurn ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      }`}
      style={{
        transform: "translate3d(0px, 0px, 0)",
        zIndex: isDrag ? 50 : 10,
        transition: isDrag ? "none" : "transform 0.15s ease-out",
      }}
    >
      <span
        className={`pointer-events-none text-[clamp(1.8rem,7vw,4rem)] leading-none ${pieceColorClass} ${
          isDrag ? "opacity-40 scale-105" : "opacity-100 scale-100"
        }`}
      >
        {symbol}
      </span>
    </div>
  );
}

export default ChessPiece;
