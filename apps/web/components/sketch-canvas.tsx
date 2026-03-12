"use client";

import type { SketchStroke, StrokePoint } from "@openbook/core";
import { createId, formatNow } from "@openbook/core";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

interface SketchCanvasProps {
  initialStrokes: SketchStroke[];
  onSave: (strokes: SketchStroke[]) => void;
  onTitleReset: () => void;
}

function toSvgPoints(points: StrokePoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function SketchCanvas({ initialStrokes, onSave, onTitleReset }: SketchCanvasProps) {
  const [strokes, setStrokes] = useState<SketchStroke[]>(initialStrokes);
  const [currentStroke, setCurrentStroke] = useState<SketchStroke | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStrokes(initialStrokes);
  }, [initialStrokes]);

  function getPoint(event: ReactPointerEvent<HTMLDivElement>): StrokePoint {
    const rect = surfaceRef.current?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
      pressure: event.pressure || 0.6
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setCurrentStroke({
      strokeId: createId("stroke"),
      color: "#214d41",
      width: 4,
      tool: "pen",
      createdAt: formatNow(),
      points: [getPoint(event)]
    });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!currentStroke) {
      return;
    }

    const nextPoint = getPoint(event);
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, nextPoint]
    });
  }

  function finishStroke() {
    if (!currentStroke || currentStroke.points.length < 2) {
      setCurrentStroke(null);
      return;
    }

    setStrokes((existing) => [...existing, currentStroke]);
    setCurrentStroke(null);
  }

  return (
    <div className="sketch-shell">
      <div
        ref={surfaceRef}
        className="sketch-surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      >
        <svg viewBox="0 0 640 320" className="sketch-svg">
          {strokes.map((stroke) => (
            <polyline
              key={stroke.strokeId}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={toSvgPoints(stroke.points)}
            />
          ))}
          {currentStroke ? (
            <polyline
              fill="none"
              stroke={currentStroke.color}
              strokeWidth={currentStroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={toSvgPoints(currentStroke.points)}
            />
          ) : null}
        </svg>
      </div>
      <div className="card-actions">
        <button className="button button-ghost" type="button" onClick={() => setStrokes([])}>
          Clear
        </button>
        <button
          className="button button-ghost"
          type="button"
          onClick={() => {
            setStrokes([]);
            onTitleReset();
          }}
        >
          New note
        </button>
        <button className="button button-primary" type="button" onClick={() => onSave(strokes)}>
          Save sketch
        </button>
      </div>
    </div>
  );
}
