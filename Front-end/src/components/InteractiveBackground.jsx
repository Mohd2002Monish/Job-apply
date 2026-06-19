import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

const InteractiveBackground = () => {
  const isDark = useSelector((state) => state.auth.isDark);
  const canvasRef = useRef(null);
  
  // Keep mouse, scroll, and ripples in refs to prevent re-triggering effects
  const mouseRef = useRef({ x: null, y: null, targetX: null, targetY: null });
  const scrollRef = useRef({ current: 0, target: 0 });
  const ripplesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle Configuration
    const particleCount = Math.min(1000, Math.floor((width * height) / 20000));
    const particles = [];
    
    // Theme-dependent colors
    const colors = {
      dark: {
        line: 'rgba(167, 139, 250, 0.18)',
        ripple: 'rgba(167, 139, 250, 0.3)'
      },
      light: {
        line: 'rgba(139, 92, 246, 0.15)',
        ripple: 'rgba(139, 92, 246, 0.22)'
      }
    };

    const particlePalettes = {
      dark: {
        base: [
          'rgba(99, 102, 241, 0.35)',  // Indigo
          'rgba(167, 139, 250, 0.35)', // Violet
          'rgba(244, 114, 182, 0.35)', // Pink
          'rgba(45, 212, 191, 0.35)'   // Teal
        ],
        glow: [
          'rgba(99, 102, 241, 0.55)',
          'rgba(167, 139, 250, 0.55)',
          'rgba(244, 114, 182, 0.55)',
          'rgba(45, 212, 191, 0.55)'
        ]
      },
      light: {
        base: [
          'rgba(79, 70, 229, 0.25)',   // Indigo
          'rgba(139, 92, 246, 0.25)',  // Violet
          'rgba(236, 72, 153, 0.25)',  // Pink
          'rgba(20, 184, 166, 0.25)'   // Teal
        ],
        glow: [
          'rgba(79, 70, 229, 0.45)',
          'rgba(139, 92, 246, 0.45)',
          'rgba(236, 72, 153, 0.45)',
          'rgba(20, 184, 166, 0.45)'
        ]
      }
    };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1.5;
        this.baseRadius = this.radius;
        this.colorIndex = Math.floor(Math.random() * 4);
      }

      update(scrollOffset) {
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around borders
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Mouse interaction (hover push/glow)
        const mouse = mouseRef.current;
        if (mouse.x !== null) {
          const dx = mouse.x - this.x;
          // Account for scroll offset on the mouse y relative to particles
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < 150) {
            // Push particles away slightly
            const force = (150 - dist) / 150;
            this.x -= (dx / dist) * force * 0.8;
            this.y -= (dy / dist) * force * 0.8;
            this.radius = this.baseRadius + force * 2.5;
          } else {
            this.radius = Math.max(this.baseRadius, this.radius - 0.1);
          }
        } else {
          this.radius = Math.max(this.baseRadius, this.radius - 0.1);
        }
      }

      draw(scrollOffset, isDarkState) {
        ctx.beginPath();
        // Draw with scroll parallax shift
        const drawY = (this.y - scrollOffset * 0.15 + height) % height;
        ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
        
        const palette = isDarkState ? particlePalettes.dark : particlePalettes.light;
        ctx.fillStyle = this.radius > this.baseRadius ? palette.glow[this.colorIndex] : palette.base[this.colorIndex];
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = null;
      mouseRef.current.targetY = null;
    };

    const handleMouseDown = (e) => {
      // Add a ripple wave
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.35,
        speed: 4,
        alpha: 1,
      });
      // Limit total ripples to prevent performance drops
      if (ripplesRef.current.length > 5) {
        ripplesRef.current.shift();
      }
    };

    const handleScroll = () => {
      scrollRef.current.target = window.scrollY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll);

    // Render loop
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse position transitions
      const mouse = mouseRef.current;
      if (mouse.targetX !== null) {
        if (mouse.x === null) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.1;
          mouse.y += (mouse.targetY - mouse.y) * 0.1;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      // Smooth scroll parallax
      const scroll = scrollRef.current;
      scroll.current += (scroll.target - scroll.current) * 0.1;

      const currentColors = isDark ? colors.dark : colors.light;

      // Update and draw particles
      particles.forEach((p) => {
        p.update(scroll.current);
        p.draw(scroll.current, isDark);
      });

      // Draw constellation connections
      const maxDistance = 140;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        const p1Y = (p1.y - scroll.current * 0.15 + height) % height;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const p2Y = (p2.y - scroll.current * 0.15 + height) % height;

          const dx = p1.x - p2.x;
          const dy = p1Y - p2Y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const alpha = (maxDistance - dist) / maxDistance;
            
            // Highlight connections near mouse
            let connectionColor = currentColors.line;
            if (mouse.x !== null) {
              const mouseDist1 = Math.hypot(mouse.x - p1.x, mouse.y - p1Y);
              const mouseDist2 = Math.hypot(mouse.x - p2.x, mouse.y - p2Y);
              if (mouseDist1 < 120 || mouseDist2 < 120) {
                connectionColor = isDark 
                  ? `rgba(167, 139, 250, ${alpha * 0.3})` 
                  : `rgba(139, 92, 246, ${alpha * 0.3})`;
              }
            }

            ctx.beginPath();
            ctx.moveTo(p1.x, p1Y);
            ctx.lineTo(p2.x, p2Y);
            ctx.strokeStyle = connectionColor;
            ctx.lineWidth = alpha * 0.8;
            ctx.stroke();
          }
        }
      }

      // Update and draw ripples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.radius += ripple.speed;
        ripple.alpha = 1 - ripple.radius / ripple.maxRadius;

        if (ripple.alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        
        // Dynamic ripple gradient
        const gradient = ctx.createRadialGradient(
          ripple.x, ripple.y, ripple.radius * 0.8,
          ripple.x, ripple.y, ripple.radius
        );
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
        gradient.addColorStop(1, isDark 
          ? `rgba(129, 140, 248, ${ripple.alpha * 0.25})`
          : `rgba(99, 102, 241, ${ripple.alpha * 0.15})`
        );

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.stroke();
        return true;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 block transition-opacity duration-500"
      style={{ mixBlendMode: isDark ? 'screen' : 'multiply' }}
    />
  );
};

export default InteractiveBackground;
