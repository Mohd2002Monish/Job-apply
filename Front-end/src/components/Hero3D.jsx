import React, { useEffect, useRef } from 'react';

/**
 * Dependency-free 3D hero visual.
 * Renders a rotating wireframe icosahedron with two orbiting particle rings
 * using a hand-rolled perspective projection — no three.js payload needed.
 * The whole scene tilts toward the cursor for a parallax feel.
 */
const Hero3D = ({ isDark }) => {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrameId;
    let size = 0;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      size = Math.min(rect.width, 560);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    };
    resize();

    // ── Icosahedron geometry (12 vertices from golden-ratio rectangles) ──
    const t = (1 + Math.sqrt(5)) / 2;
    const raw = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ];
    const norm = Math.hypot(1, t);
    const vertices = raw.map(([x, y, z]) => [x / norm, y / norm, z / norm]);

    // Edges = vertex pairs at the icosahedron's uniform edge length
    const edges = [];
    const edgeLen = 2 / norm;
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const d = Math.hypot(
          vertices[i][0] - vertices[j][0],
          vertices[i][1] - vertices[j][1],
          vertices[i][2] - vertices[j][2]
        );
        if (Math.abs(d - edgeLen) < 0.001) edges.push([i, j]);
      }
    }

    // ── Orbit rings: particles on tilted circular paths ──
    const makeRing = (count, radius, tiltX, tiltZ, speed, phase = 0) =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2 + phase,
        radius, tiltX, tiltZ, speed,
      }));
    const rings = [
      makeRing(26, 1.55, 0.45, 0.2, 0.0035),
      makeRing(20, 1.95, -0.35, 0.55, -0.0022, 1.2),
    ];

    const rotate = ([x, y, z], ax, ay) => {
      // Rotate around Y then X
      let nx = x * Math.cos(ay) + z * Math.sin(ay);
      let nz = -x * Math.sin(ay) + z * Math.cos(ay);
      let ny = y * Math.cos(ax) - nz * Math.sin(ax);
      nz = y * Math.sin(ax) + nz * Math.cos(ax);
      return [nx, ny, nz];
    };

    const FOCAL = 3.4;
    const project = ([x, y, z]) => {
      const scale = FOCAL / (FOCAL + z);
      const r = size * 0.26;
      return {
        x: size / 2 + x * r * scale,
        y: size / 2 + y * r * scale,
        scale,
        z,
      };
    };

    const handlePointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerRef.current.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const handleLeave = () => {
      pointerRef.current.tx = 0;
      pointerRef.current.ty = 0;
    };
    window.addEventListener('mousemove', handlePointer);
    window.addEventListener('mouseleave', handleLeave);
    window.addEventListener('resize', resize);

    let rotY = 0.4;
    let rotX = 0.25;

    const palette = () => (isDark
      ? { edge: '129, 140, 248', vertex: '196, 181, 253', ring1: '45, 212, 191', ring2: '244, 114, 182', core: '99, 102, 241' }
      : { edge: '79, 70, 229', vertex: '124, 58, 237', ring1: '13, 148, 136', ring2: '219, 39, 119', core: '99, 102, 241' });

    const tick = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const c = palette();

      // Ease pointer tilt
      const p = pointerRef.current;
      p.x += (p.tx - p.x) * 0.06;
      p.y += (p.ty - p.y) * 0.06;

      if (!reduceMotion) rotY += 0.0042;
      const ax = rotX + p.y * 0.45;
      const ay = rotY + p.x * 0.55;

      // Core glow
      const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.3);
      glow.addColorStop(0, `rgba(${c.core}, ${isDark ? 0.16 : 0.10})`);
      glow.addColorStop(1, `rgba(${c.core}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // Icosahedron
      const projected = vertices.map((v) => project(rotate(v, ax, ay)));
      edges.forEach(([i, j]) => {
        const a = projected[i];
        const b = projected[j];
        const depth = 1 - ((a.z + b.z) / 2 + 1) / 2; // 0 far → 1 near
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${c.edge}, ${0.12 + depth * 0.55})`;
        ctx.lineWidth = 0.6 + depth * 1.2;
        ctx.stroke();
      });
      projected.forEach((v) => {
        const depth = 1 - (v.z + 1) / 2;
        ctx.beginPath();
        ctx.arc(v.x, v.y, 1.6 + depth * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.vertex}, ${0.35 + depth * 0.6})`;
        ctx.fill();
      });

      // Orbit rings
      rings.forEach((ring, ri) => {
        const color = ri === 0 ? c.ring1 : c.ring2;
        ring.forEach((pt) => {
          if (!reduceMotion) pt.angle += pt.speed;
          const base = [
            Math.cos(pt.angle) * pt.radius,
            Math.sin(pt.angle) * pt.radius * Math.sin(pt.tiltX),
            Math.sin(pt.angle) * pt.radius * Math.cos(pt.tiltX),
          ];
          const tilted = rotate(base, pt.tiltZ, 0);
          const v = project(rotate(tilted, ax * 0.6, ay * 0.6));
          const depth = 1 - (v.z + 1.4) / 2.8;
          ctx.beginPath();
          ctx.arc(v.x, v.y, 0.8 + depth * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${0.15 + depth * 0.55})`;
          ctx.fill();
        });
      });

      animationFrameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointer);
      window.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto select-none" aria-hidden="true">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default Hero3D;
