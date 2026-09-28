import { useEffect, useRef, useState } from "react";
import { createRenderer } from "@/lib/radiance-cascades/renderer";

export function AgentRadianceField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createRenderer({
      canvas,
      onReady: () => setState("ready"),
      onUnavailable: (error) => {
        console.info("Radiance field is using its static artwork fallback.", error);
        setState("fallback");
      },
    });
    void renderer.ready;
    return () => renderer.dispose();
  }, []);

  return (
    <div className="elc-radiance-field" data-state={state} aria-hidden="true">
      <div className="elc-radiance-fallback" />
      <canvas ref={canvasRef} className="elc-radiance-canvas" />
    </div>
  );
}
