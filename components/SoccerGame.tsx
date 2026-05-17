"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { Country } from "@/lib/countries";
import type { GameState, TouchInput, FieldDimensions, GoalState } from "@/lib/gameTypes";
import {
  createField,
  createGoals,
  createInitialState,
  stepGame,
} from "@/lib/gameEngine";

interface Props {
  playerCountry: Country;
  aiCountry: Country;
  onGameEnd: (score: { player: number; ai: number }) => void;
}

const JOYSTICK_RADIUS = 50;
const KICK_AREA_FRACTION = 0.42; // right 42% of screen = kick zone

export default function SoccerGame({ playerCountry, aiCountry, onGameEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const fieldRef = useRef<FieldDimensions | null>(null);
  const goalsRef = useRef<[GoalState, GoalState] | null>(null);
  const inputRef = useRef<TouchInput>({
    joystickActive: false,
    joystickOrigin: { x: 0, y: 0 },
    joystickCurrent: { x: 0, y: 0 },
    kickPressed: false,
  });
  const kickTouchIdRef = useRef<number | null>(null);
  const joystickTouchIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const gameEndedRef = useRef(false);
  const [displayScore, setDisplayScore] = useState({ player: 0, ai: 0 });
  const [displayTime, setDisplayTime] = useState(180);
  const [displayHalf, setDisplayHalf] = useState(1);
  const [displayPhase, setDisplayPhase] = useState<string>("kickoff");

  const initGame = useCallback((canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;
    const field = createField(w, h);
    const goals = createGoals(field);
    fieldRef.current = field;
    goalsRef.current = goals;
    stateRef.current = createInitialState(field);
    gameEndedRef.current = false;
  }, []);

  const drawField = useCallback((ctx: CanvasRenderingContext2D, field: FieldDimensions) => {
    const { width: W, height: H } = field;

    // Grass gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1a6b2e");
    grad.addColorStop(0.5, "#1e8035");
    grad.addColorStop(1, "#1a6b2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Grass stripes
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(i * (W / 8), 0, W / 8, H);
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;

    // Border
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // Center line
    ctx.beginPath();
    ctx.moveTo(W / 2, 4);
    ctx.lineTo(W / 2, H - 4);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.12, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();

    // Penalty areas
    const penW = W * 0.14;
    const penH = H * 0.42;
    const penY = (H - penH) / 2;
    ctx.strokeRect(4, penY, penW, penH);
    ctx.strokeRect(W - 4 - penW, penY, penW, penH);

    // Goal areas (smaller box)
    const gaW = W * 0.07;
    const gaH = H * 0.24;
    const gaY = (H - gaH) / 2;
    ctx.strokeRect(4, gaY, gaW, gaH);
    ctx.strokeRect(W - 4 - gaW, gaY, gaW, gaH);
  }, []);

  const drawGoals = useCallback((ctx: CanvasRenderingContext2D, goals: [GoalState, GoalState]) => {
    for (const goal of goals) {
      // Goal post shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(goal.x + 2, goal.y + 2, goal.width, goal.height);

      // Goal net
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

      // Goal posts
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(goal.x, goal.y, goal.width, 3);
      ctx.fillRect(goal.x, goal.y + goal.height - 3, goal.width, 3);

      // Net lines
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.5;
      for (let y = goal.y + 8; y < goal.y + goal.height; y += 8) {
        ctx.beginPath();
        ctx.moveTo(goal.x, y);
        ctx.lineTo(goal.x + goal.width, y);
        ctx.stroke();
      }
    }
  }, []);

  const drawPlayer = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      country: Country,
      isPlayer: boolean,
      hasBall: boolean
    ) => {
      // Shadow
      ctx.beginPath();
      ctx.ellipse(x + 2, y + 3, radius * 0.9, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fill();

      // Body (jersey color)
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      const bodyGrad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius);
      bodyGrad.addColorStop(0, lightenColor(country.primaryColor, 30));
      bodyGrad.addColorStop(1, country.primaryColor);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Jersey outline
      ctx.strokeStyle = country.secondaryColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Flag emoji label
      ctx.font = `${radius * 0.9}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(country.flag, x, y);

      // Player indicator ring
      if (isPlayer) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 230, 0, 0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
    []
  );

  const drawBall = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    // Shadow
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, radius * 0.9, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // Ball
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const ballGrad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
    ballGrad.addColorStop(0, "#FFFFFF");
    ballGrad.addColorStop(0.6, "#F0F0F0");
    ballGrad.addColorStop(1, "#C0C0C0");
    ctx.fillStyle = ballGrad;
    ctx.fill();

    // Pentagons pattern (simplified)
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Center pentagon
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#333";
    ctx.fill();
  }, []);

  const drawJoystick = useCallback((ctx: CanvasRenderingContext2D, input: TouchInput) => {
    if (!input.joystickActive) return;

    const { x: ox, y: oy } = input.joystickOrigin;
    const { x: cx, y: cy } = input.joystickCurrent;

    // Outer ring
    ctx.beginPath();
    ctx.arc(ox, oy, JOYSTICK_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner knob
    ctx.beginPath();
    ctx.arc(cx, cy, JOYSTICK_RADIUS * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();
  }, []);

  const drawKickButton = useCallback(
    (ctx: CanvasRenderingContext2D, field: FieldDimensions, isPressed: boolean) => {
      const x = field.width * (1 - KICK_AREA_FRACTION / 2);
      const y = field.height - 70;
      const r = 32;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isPressed ? "rgba(255, 200, 0, 0.7)" : "rgba(255, 200, 0, 0.35)";
      ctx.fill();
      ctx.strokeStyle = isPressed ? "rgba(255, 220, 0, 0.95)" : "rgba(255, 220, 0, 0.6)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = "bold 13px system-ui";
      ctx.fillStyle = isPressed ? "#000" : "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KICK", x, y);
    },
    []
  );

  const drawOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, state: GameState, field: FieldDimensions) => {
      if (state.phase === "kickoff") {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, field.width, field.height);
        ctx.font = "bold 28px system-ui";
        ctx.fillStyle = "#FFE000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(state.half === 1 ? "KICK OFF!" : "2ND HALF!", field.centerX, field.centerY);
        ctx.font = "14px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText("Get ready...", field.centerX, field.centerY + 32);
      }

      if (state.phase === "goal_player") {
        ctx.fillStyle = "rgba(0, 30, 0, 0.65)";
        ctx.fillRect(0, 0, field.width, field.height);
        ctx.font = "bold 42px system-ui";
        ctx.fillStyle = "#FFE000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚽ GOAL!", field.centerX, field.centerY - 15);
        ctx.font = "18px system-ui";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`${playerCountry.flag} ${playerCountry.name} scores!`, field.centerX, field.centerY + 28);
      }

      if (state.phase === "goal_ai") {
        ctx.fillStyle = "rgba(60, 0, 0, 0.65)";
        ctx.fillRect(0, 0, field.width, field.height);
        ctx.font = "bold 36px system-ui";
        ctx.fillStyle = "#FF4444";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚽ GOAL!", field.centerX, field.centerY - 15);
        ctx.font = "18px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(`${aiCountry.flag} ${aiCountry.name} scores!`, field.centerX, field.centerY + 28);
      }

      if (state.phase === "halftime") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, field.width, field.height);
        ctx.font = "bold 30px system-ui";
        ctx.fillStyle = "#FFE000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("HALF TIME", field.centerX, field.centerY - 20);
        ctx.font = "22px system-ui";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          `${playerCountry.flag} ${state.score.player}  –  ${state.score.ai} ${aiCountry.flag}`,
          field.centerX,
          field.centerY + 20
        );
      }
    },
    [playerCountry, aiCountry]
  );

  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !stateRef.current || !fieldRef.current || !goalsRef.current) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      // Capture kick state before resetting
      const wasKickPressed = inputRef.current.kickPressed;

      // Step game logic
      const newState = stepGame(
        stateRef.current,
        fieldRef.current,
        goalsRef.current,
        inputRef.current,
        dt
      );
      stateRef.current = newState;

      // Reset kick after one frame
      inputRef.current.kickPressed = false;

      // Update display state
      setDisplayScore({ ...newState.score });
      setDisplayTime(Math.ceil(newState.timeLeft));
      setDisplayHalf(newState.half);
      setDisplayPhase(newState.phase);

      // Draw
      const field = fieldRef.current;
      drawField(ctx, field);
      drawGoals(ctx, goalsRef.current);
      drawPlayer(ctx, newState.player.pos.x, newState.player.pos.y, newState.player.radius, playerCountry, true, newState.player.hasBall);
      drawPlayer(ctx, newState.ai.pos.x, newState.ai.pos.y, newState.ai.radius, aiCountry, false, newState.ai.hasBall);
      drawBall(ctx, newState.ball.pos.x, newState.ball.pos.y, newState.ball.radius);
      drawJoystick(ctx, inputRef.current);
      drawKickButton(ctx, field, wasKickPressed);
      drawOverlay(ctx, newState, field);

      if (newState.phase === "ended" && !gameEndedRef.current) {
        gameEndedRef.current = true;
        setTimeout(() => onGameEnd(newState.score), 1200);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [drawField, drawGoals, drawPlayer, drawBall, drawJoystick, drawKickButton, drawOverlay, playerCountry, aiCountry, onGameEnd]
  );

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !fieldRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    for (const touch of Array.from(e.changedTouches)) {
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      const isKickZone = x > fieldRef.current.width * (1 - KICK_AREA_FRACTION);

      if (isKickZone && kickTouchIdRef.current === null) {
        kickTouchIdRef.current = touch.identifier;
        inputRef.current.kickPressed = true;
      } else if (!isKickZone && joystickTouchIdRef.current === null) {
        joystickTouchIdRef.current = touch.identifier;
        inputRef.current.joystickActive = true;
        inputRef.current.joystickOrigin = { x, y };
        inputRef.current.joystickCurrent = { x, y };
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === joystickTouchIdRef.current) {
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        const dx = x - inputRef.current.joystickOrigin.x;
        const dy = y - inputRef.current.joystickOrigin.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > JOYSTICK_RADIUS) {
          inputRef.current.joystickCurrent = {
            x: inputRef.current.joystickOrigin.x + (dx / d) * JOYSTICK_RADIUS,
            y: inputRef.current.joystickOrigin.y + (dy / d) * JOYSTICK_RADIUS,
          };
        } else {
          inputRef.current.joystickCurrent = { x, y };
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        inputRef.current.joystickActive = false;
        inputRef.current.joystickOrigin = { x: 0, y: 0 };
        inputRef.current.joystickCurrent = { x: 0, y: 0 };
      }
      if (touch.identifier === kickTouchIdRef.current) {
        kickTouchIdRef.current = null;
      }
    }
  }, []);

  // Mouse support for desktop testing
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !fieldRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const isKickZone = x > fieldRef.current.width * (1 - KICK_AREA_FRACTION);
    if (isKickZone) {
      inputRef.current.kickPressed = true;
    } else {
      inputRef.current.joystickActive = true;
      inputRef.current.joystickOrigin = { x, y };
      inputRef.current.joystickCurrent = { x, y };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!inputRef.current.joystickActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const dx = x - inputRef.current.joystickOrigin.x;
    const dy = y - inputRef.current.joystickOrigin.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > JOYSTICK_RADIUS) {
      inputRef.current.joystickCurrent = {
        x: inputRef.current.joystickOrigin.x + (dx / d) * JOYSTICK_RADIUS,
        y: inputRef.current.joystickOrigin.y + (dy / d) * JOYSTICK_RADIUS,
      };
    } else {
      inputRef.current.joystickCurrent = { x, y };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    inputRef.current.joystickActive = false;
    inputRef.current.joystickOrigin = { x: 0, y: 0 };
    inputRef.current.joystickCurrent = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.width = vw;
      canvas.height = vh;
      initGame(canvas);
    };

    resize();
    window.addEventListener("resize", resize);

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseup", handleMouseUp);

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [initGame, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp, gameLoop]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        {/* Player side */}
        <div className="flex items-center gap-1.5">
          <span className="text-2xl">{playerCountry.flag}</span>
          <div>
            <div className="text-white text-xs font-semibold leading-none opacity-80">{playerCountry.name}</div>
            <div className="text-yellow-300 text-2xl font-black leading-none">{displayScore.player}</div>
          </div>
        </div>

        {/* Timer + Half */}
        <div className="text-center">
          <div
            className="text-white font-black text-xl tabular-nums leading-none"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            {formatTime(displayTime)}
          </div>
          <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider">
            {displayHalf === 1 ? "1st Half" : "2nd Half"}
          </div>
        </div>

        {/* AI side */}
        <div className="flex items-center gap-1.5">
          <div className="text-right">
            <div className="text-white text-xs font-semibold leading-none opacity-80">{aiCountry.name}</div>
            <div className="text-red-400 text-2xl font-black leading-none text-right">{displayScore.ai}</div>
          </div>
          <span className="text-2xl">{aiCountry.flag}</span>
        </div>
      </div>

      {/* Control hints */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between px-4 pb-2 pointer-events-none">
        <div className="text-white/40 text-xs">
          ← Drag to move
        </div>
        <div className="text-white/40 text-xs">
          Tap to kick →
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `rgb(${r},${g},${b})`;
}
