import { useEffect, useRef } from "react";

export default function DynamicWeatherBackground({ effect = "clear", windSpeed = 10 }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // -------------------------
    // INIT PARTICLES
    // -------------------------
    const init = () => {
      const particles = [];

      if (effect === "rain") {
        for (let i = 0; i < 250; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            len: Math.random() * 15 + 10,
            speed: Math.random() * 10 + 5,
            wind: windSpeed * 0.2,
            opacity: Math.random() * 0.5 + 0.3,
          });
        }
      }

      if (effect === "snow") {
        for (let i = 0; i < 150; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 4 + 1,
            speed: Math.random() * 2 + 1,
            sway: Math.random() * 50,
            opacity: Math.random() * 0.8 + 0.2,
          });
        }
      }

      if (effect === "fog") {
        for (let i = 0; i < 60; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 180 + 80,
            speed: 0.3,
            opacity: Math.random() * 0.2 + 0.05,
          });
        }
      }

      particlesRef.current = particles;
    };

    init();

    let time = 0;

 
    const animate = () => {
      const particles = particlesRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // SKY BASE (always drawn first)
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);

      if (effect === "rain" || effect === "storm") {
        sky.addColorStop(0, "rgba(70, 110, 200, 0.75)");
        sky.addColorStop(1, "rgba(30, 60, 140, 0.75)");
      } else if (effect === "snow") {
        sky.addColorStop(0, "rgba(170, 210, 255, 0.95)");
        sky.addColorStop(1, "rgba(220, 240, 255, 0.95)");
      } else if (effect === "fog") {
        sky.addColorStop(0, "rgba(180, 200, 220, 0.95)");
        sky.addColorStop(1, "rgba(210, 220, 230, 0.95)");
      } else {
        sky.addColorStop(0, "rgba(135, 206, 235, 1)");
        sky.addColorStop(1, "rgba(180, 230, 255, 1)");
      }

      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.01;


      // RAIN
      if (effect === "rain" || effect === "storm") {
        particles.forEach((p) => {
          ctx.strokeStyle = `rgba(180, 200, 255, ${p.opacity})`;
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.wind, p.y + p.len);
          ctx.stroke();

          p.y += p.speed;
          p.x += p.wind * 0.2;

          if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        });
      }

      // SNOW
      if (effect === "snow") {
        particles.forEach((p) => {
          ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speed;
          p.x += Math.sin(time + p.sway) * 0.6;

          if (p.y > canvas.height) {
            p.y = 0;
            p.x = Math.random() * canvas.width;
          }
        });
      }

      // FOG
      if (effect === "fog") {
        particles.forEach((p) => {
          ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.speed;
          if (p.x > canvas.width) p.x = 0;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [effect, windSpeed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,              
        pointerEvents: "none",
        display: "block"
      }}
    />
  );
}