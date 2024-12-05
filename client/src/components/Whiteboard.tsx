// client/src/components/Whiteboard.tsx
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

const SOCKET_SERVER = "http://192.168.1.74:5001";

interface Point {
  x: number;
  y: number;
  color: string;
  size: number;
}

export const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);
  const socketRef = useRef<any>(null);
  const currentPathRef = useRef<Point[]>([]);
  const [drawingHistory, setDrawingHistory] = useState<Point[][]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [drawingName, setDrawingName] = useState("");
  const [cannotRedo, setCannotRedo] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    contextRef.current = ctx;

    socketRef.current = io(SOCKET_SERVER);

    socketRef.current.on("drawingHistory", (history: Point[][]) => {
      setDrawingHistory(history);
      setCurrentHistoryIndex(history.length - 1);
      redrawCanvas(history, history.length - 1);
    });

    socketRef.current.on("draw", (points: Point[]) => {
      if (!ctx) return;
      drawPoints(ctx, points);
    });

    socketRef.current.on("clear", () => {
      clearCanvas();
    });

    return () => socketRef.current.disconnect();
  }, []);

  const drawPoints = (ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.strokeStyle = points[0].color;
    ctx.lineWidth = points[0].size;

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  };

  const redrawCanvas = (
    history: Point[][] = drawingHistory,
    index: number = currentHistoryIndex
  ) => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i <= index; i++) {
      if (history[i]) {
        drawPoints(ctx, history[i]);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPathRef.current = [
      {
        x,
        y,
        color,
        size,
      },
    ];

    redrawCanvas();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPathRef.current.push({
      x,
      y,
      color,
      size,
    });

    const ctx = contextRef.current;
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      redrawCanvas();
      drawPoints(ctx, currentPathRef.current);
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentPathRef.current.length > 0) {
      const newPath = [...currentPathRef.current];
      socketRef.current.emit("draw", newPath);
      socketRef.current.emit("requestHistory");
    }
    setIsDrawing(false);
    currentPathRef.current = [];
  };

  const undo = () => {
    if (currentHistoryIndex >= 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      socketRef.current.emit("undo", newIndex);
      socketRef.current.emit("requestHistory");
      setCannotRedo(false); // Enable redo after an undo action
    }
  };

  const redo = () => {
    console.log("Redo function called");
    if (currentHistoryIndex <= (drawingHistory.length - 1)) {
      const newIndex = currentHistoryIndex + 1;
      console.log("New index for redo:", newIndex);
      setCurrentHistoryIndex(newIndex);
      // redrawCanvas(drawingHistory, newIndex);
      socketRef.current.emit("redo", newIndex);
      socketRef.current.emit("requestHistory");
    } else {
      console.log("Redo not possible, currentHistoryIndex:", currentHistoryIndex);
    }
  };

  const clearCanvas = () => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingHistory([]);
    setCurrentHistoryIndex(-1);
    socketRef.current.emit("clear");
  };

  const saveDrawing = async () => {
    try {
      await axios.post(`${SOCKET_SERVER}/save`, {
        name: drawingName,
        drawing: drawingHistory,
      });
      alert("Drawing saved successfully");
    } catch (error) {
      console.error("Error saving drawing:", error);
      alert("Failed to save drawing");
    }
  };

  const loadDrawing = async () => {
    try {
      const response = await axios.get(`${SOCKET_SERVER}/load/${drawingName}`);
      const loadedDrawing = response.data;
      
      setDrawingHistory(loadedDrawing);
      setCurrentHistoryIndex(loadedDrawing.length - 1);
      redrawCanvas(loadedDrawing, loadedDrawing.length - 1);
      socketRef.current.emit("drawingHistory", loadedDrawing);
    } catch (error) {
      console.error("Error loading drawing:", error);
      alert("Failed to load drawing");
    }
  };

  return (
    <div className="whiteboard-container">
      <div className="controls">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="range"
          min="1"
          max="20"
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
        />
        <button onClick={undo} disabled={currentHistoryIndex < 0}>
          Undo
        </button>
        <button
          onClick={redo}
          disabled={cannotRedo}
        >
          Redo
        </button>
        <button onClick={clearCanvas} disabled={currentHistoryIndex === -1}>Clear</button>
        <input
          type="text"
          placeholder="Drawing name"
          value={drawingName}
          onChange={(e) => setDrawingName(e.target.value)}
        />
        <button onClick={saveDrawing}>Save</button>
        <button onClick={loadDrawing}>Load</button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ border: "1px solid black", width: "800px", height: "600px" }}
      />
    </div>
  );
};
