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
const KICK_AREA_FRACTION = 0.42;

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
  const prevScoreRef = useRef({ player: 0, ai: 0 });
  const prevPhaseRef = useRef<string>("");
  const prevKickoffPhaseRef = useRef(false);

  const [displayScore, setDisplayScore] = useState({ player: 0, ai: 0 });
  const [displayTime, setDisplayTime] = useState(180);
  const [displayHalf, setDisplayHalf] = useState(1);
  const [displayPhase, setDisplayPhase] = useState<string>("kickoff");
  const [scorePulseKey, setScorePulseKey] = useState(0);
  const [controlHintsVisible, setControlHintsVisible] = useState(true);
  const [countdownValue, setCountdownValue] = useState("");
  const [countdownKey, setCountdownKey] = useState(0);
  const [goalFlash, setGoalFlash] = useState(false);
  const [goalConfetti, setGoalConfetti] = useState(false);
  const [goalTeamSlide, setGoalTeamSlide] = useState(false);
  const [goalColorBg, setGoalColorBg] = useState(false);
  const [showHalftime, setShowHalftime] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setControlHintsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (displayScore.player > prevScoreRef.current.player || displayScore.ai > prevScoreRef.current.ai) {
      setScorePulseKey(k => k + 1);
      setGoalFlash(true);
      setGoalConfetti(true);
      setGoalTeamSlide(true);
      setGoalColorBg(true);
      setTimeout(() => setGoalFlash(false), 600);
      setTimeout(() => setGoalConfetti(false), 1500);
      setTimeout(() => setGoalTeamSlide(false), 2000);
      setTimeout(() => setGoalColorBg(false), 1500);
    }
    prevScoreRef.current = { ...displayScore };
  }, [displayScore]);

  useEffect(() => {
    if (displayPhase === "halftime") {
      setShowHalftime(true);
    } else {
      setShowHalftime(false);
    }
  }, [displayPhase]);

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
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1a6b2e");
    grad.addColorStop(0.5, "#1e8035");
    grad.addColorStop(1, "#1a6b2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

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
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.beginPath();
    ctx.moveTo(W / 2, 4);
    ctx.lineTo(W / 2, H - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();

    const penW = W * 0.14;
    const penH = H * 0.42;
    const penY = (H - penH) / 2;
    ctx.strokeRect(4, penY, penW, penH);
    ctx.strokeRect(W - 4 - penW, penY, penW, penH);

    const gaW = W * 0.07;
    const gaH = H * 0.24;
    const gaY = (H - gaH) / 2;
    ctx.strokeRect(4, gaY, gaW, gaH);
    ctx.strokeRect(W - 4 - gaW, gaY, gaW, gaH);
  }, []);

  const drawGoals = useCallback((ctx: CanvasRenderingContext2D, goals: [GoalState, GoalState]) => {
    for (const goal of goals) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(goal.x + 2, goal.y + 2, goal.width, goal.height);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(goal.x, goal.y, goal.width, 3);
      ctx.fillRect(goal.x, goal.y + goal.height - 3, goal.width, 3);
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
      ctx.beginPath();
      ctx.ellipse(x + 2, y + 3, radius * 0.9, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      const bodyGrad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius);
      bodyGrad.addColorStop(0, lightenColor(country.primaryColor, 30));
      bodyGrad.addColorStop(1, country.primaryColor);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      ctx.strokeStyle = country.secondaryColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = `${radius * 0.9}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(country.flag, x, y);

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
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, radius * 0.9, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const ballGrad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
    ballGrad.addColorStop(0, "#FFFFFF");
    ballGrad.addColorStop(0.6, "#F0F0F0");
    ballGrad.addColorStop(1, "#C0C0C0");
    ctx.fillStyle = ballGrad;
    ctx.fill();

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#333";
    ctx.fill();
  }, []);

  const drawJoystick = useCallback((ctx: CanvasRenderingContext2D, input: TouchInput) => {
    if (!input.joystickActive) return;

    const { x: ox, y: oy } = input.joystickOrigin;
    const { x: cx, y: cy } = input.joystickCurrent;
    const dx = cx - ox;
    const dy = cy - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const t = Math.min(1, dist / JOYSTICK_RADIUS);

    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 250);
    const glowAlpha = 0.12 + t * 0.35;
    const glowR = JOYSTICK_RADIUS + 15 + pulse * 8;
    const glow = ctx.createRadialGradient(ox, oy, JOYSTICK_RADIUS - 5, ox, oy, glowR);
    glow.addColorStop(0, `rgba(255, 224, 0, ${glowAlpha})`);
    glow.addColorStop(1, "rgba(255, 224, 0, 0)");
    ctx.beginPath();
    ctx.arc(ox, oy, glowR, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ox, oy, JOYSTICK_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + t * 0.3})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (dist > 8) {
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 224, 0, ${0.4 + t * 0.5})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        const offset = 14 + i * 9;
        const ax = ox + nx * offset;
        const ay = oy + ny * offset;
        const size = 5 - i;
        ctx.beginPath();
        ctx.moveTo(ax + nx * size, ay + ny * size);
        ctx.lineTo(ax - nx * size * 0.5 - ny * size * 0.5, ay - ny * size * 0.5 + nx * size * 0.5);
        ctx.moveTo(ax + nx * size, ay + ny * size);
        ctx.lineTo(ax - nx * size * 0.5 + ny * size * 0.5, ay - ny * size * 0.5 - nx * size * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, JOYSTICK_RADIUS * 0.42, 0, Math.PI * 2);
    const knobGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, JOYSTICK_RADIUS * 0.42);
    knobGrad.addColorStop(0, "rgba(255,255,255,0.6)");
    knobGrad.addColorStop(1, "rgba(255,255,255,0.35)");
    ctx.fillStyle = knobGrad;
    ctx.fill();
  }, []);

  const drawKickButton = useCallback(
    (ctx: CanvasRenderingContext2D, field: FieldDimensions, isPressed: boolean) => {
      const x = field.width * (1 - KICK_AREA_FRACTION / 2);
      const y = field.height - 70;
      const r = 32;

      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);

      ctx.save();
      const glowR = isPressed ? r + 22 : r + 10 + pulse * 8;
      const glowA = isPressed ? 0.5 : 0.12 + pulse * 0.12;
      const glow = ctx.createRadialGradient(x, y, r - 2, x, y, glowR);
      glow.addColorStop(0, `rgba(255, 200, 0, ${glowA})`);
      glow.addColorStop(1, "rgba(255, 200, 0, 0)");
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      const btnGrad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, r);
      btnGrad.addColorStop(0, isPressed ? "rgba(255, 230, 100, 0.85)" : "rgba(255, 220, 80, 0.5)");
      btnGrad.addColorStop(1, isPressed ? "rgba(255, 200, 0, 0.7)" : "rgba(255, 200, 0, 0.35)");
      ctx.fillStyle = btnGrad;
      ctx.fill();
      ctx.strokeStyle = isPressed ? "rgba(255, 240, 150, 1)" : `rgba(255, 220, 0, ${0.4 + pulse * 0.2})`;
      ctx.lineWidth = isPressed ? 3 : 2.5;
      ctx.stroke();

      if (isPressed) {
        ctx.beginPath();
        ctx.arc(x, y, r + 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 220, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.font = "bold 13px system-ui";
      ctx.fillStyle = isPressed ? "#000" : "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (!isPressed) {
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 3;
      }
      ctx.fillText("KICK", x, y);
      ctx.shadowBlur = 0;
      ctx.restore();
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
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 6;
        ctx.fillText(state.half === 1 ? "KICK OFF!" : "2ND HALF!", field.centerX, field.centerY);
        ctx.font = "14px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText("Get ready...", field.centerX, field.centerY + 32);
        ctx.shadowBlur = 0;
      }

      if (state.phase === "goal_player") {
        ctx.fillStyle = "rgba(0, 30, 0, 0.65)";
        ctx.fillRect(0, 0, field.width, field.height);
        ctx.font = "bold 42px system-ui";
        ctx.fillStyle = "#FFE000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 8;
        ctx.fillText("⚽ GOAL!", field.centerX, field.centerY - 15);
        ctx.font = "18px system-ui";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`${playerCountry.flag} ${playerCountry.name} scores!`, field.centerX, field.centerY + 28);
        ctx.shadowBlur = 0;
      }

      if (state.phase === "goal_ai") {
        ctx.fillStyle = "rgba(60, 0, 0, 0.65)";
        ctx.fillRect(0, 0, field.width, field.height);
        ctx.font = "bold 36px system-ui";
        ctx.fillStyle = "#FF4444";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 8;
        ctx.fillText("⚽ GOAL!", field.centerX, field.centerY - 15);
        ctx.font = "18px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(`${aiCountry.flag} ${aiCountry.name} scores!`, field.centerX, field.centerY + 28);
        ctx.shadowBlur = 0;
      }

      if (state.phase === "halftime") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, field.width, field.height);
        ctx.font = "bold 30px system-ui";
        ctx.fillStyle = "#FFE000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 6;
        ctx.fillText("HALF TIME", field.centerX, field.centerY - 20);
        ctx.font = "22px system-ui";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          `${playerCountry.flag} ${state.score.player}  –  ${state.score.ai} ${aiCountry.flag}`,
          field.centerX,
          field.centerY + 20
        );
        ctx.shadowBlur = 0;
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

      const wasKickPressed = inputRef.current.kickPressed;

      const newState = stepGame(
        stateRef.current,
        fieldRef.current,
        goalsRef.current,
        inputRef.current,
        dt
      );
      stateRef.current = newState;
      inputRef.current.kickPressed = false;

      setDisplayScore({ ...newState.score });
      setDisplayTime(Math.ceil(newState.timeLeft));
      setDisplayHalf(newState.half);
      setDisplayPhase(newState.phase);

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
      const dpr = window.devicePixelRatio || 1;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
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

  const truncateTeamName = (name: string) => {
    return name.length > 8 ? name.slice(0, 7) + "…" : name;
  };

  const confettiPositions = [
    { left: "10%", delay: "0ms", color: "#FFE000", size: 8 },
    { left: "20%", delay: "100ms", color: "#FFA500", size: 6 },
    { left: "35%", delay: "50ms", color: "#FFFFFF", size: 10 },
    { left: "50%", delay: "150ms", color: "#FFE000", size: 7 },
    { left: "65%", delay: "80ms", color: "#FFA500", size: 9 },
    { left: "80%", delay: "200ms", color: "#FFFFFF", size: 6 },
    { left: "90%", delay: "120ms", color: "#FFE000", size: 8 },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: "none" }}
      />

      {/* Goal flash overlay */}
      {goalFlash && (
        <div className="absolute inset-0 z-30 pointer-events-none animate-whiteFlash bg-white" />
      )}

      {/* Goal color pulse background */}
      {goalColorBg && (
        <div className="absolute inset-0 z-20 pointer-events-none animate-colorPulseBg bg-gradient-to-t from-yellow-900/40 via-transparent to-yellow-900/20" />
      )}

      {/* Top HUD - Glass-morphism Pill */}
      <div className="absolute top-3 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
        <div className="glass-pill flex items-center gap-3 px-4 py-1.5 shadow-lg shadow-black/30">
          {/* Player side */}
          <div className="flex items-center gap-1.5">
            <span className="text-lg drop-shadow-md">{playerCountry.flag}</span>
            <span
              key={scorePulseKey}
              className="text-yellow-300 text-xl font-black tabular-nums drop-shadow-md animate-scorePulse min-w-[1.5rem] text-center"
            >
              {displayScore.player}
            </span>
            <span
              className="text-white text-xs font-semibold max-w-[5rem] truncate drop-shadow-md opacity-80"
              title={playerCountry.name}
            >
              {truncateTeamName(playerCountry.name)}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-white/15 mx-1" />

          {/* Timer + Half */}
          <div className="text-center px-1">
            <div
              className={`font-black text-lg tabular-nums drop-shadow-md leading-none transition-colors duration-300 ${
                displayTime <= 30
                  ? "text-red-400"
                  : "text-white"
              }`}
            >
              {formatTime(displayTime)}
            </div>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-white/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
              {displayHalf === 1 ? "1H" : "2H"}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-white/15 mx-1" />

          {/* AI side */}
          <div className="flex items-center gap-1.5">
            <span
              className="text-white text-xs font-semibold max-w-[5rem] truncate drop-shadow-md opacity-80"
              title={aiCountry.name}
            >
              {truncateTeamName(aiCountry.name)}
            </span>
            <span
              key={scorePulseKey + 100}
              className="text-red-400 text-xl font-black tabular-nums drop-shadow-md animate-scorePulse min-w-[1.5rem] text-center"
            >
              {displayScore.ai}
            </span>
            <span className="text-lg drop-shadow-md">{aiCountry.flag}</span>
          </div>
        </div>
      </div>

      {/* Kickoff countdown overlay */}
      {countdownValue && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
          <div
            key={countdownKey}
            className="text-7xl font-black text-yellow-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] animate-scaleDown"
          >
            {countdownValue}
          </div>
        </div>
      )}

      {/* Goal celebration overlay */}
      {(goalConfetti || goalTeamSlide) && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center pointer-events-none">
          {/* Confetti dots */}
          {goalConfetti &&
            confettiPositions.map((dot, i) => (
              <div
                key={`confetti-${i}`}
                className="absolute animate-confetti rounded-full"
                style={{
                  left: dot.left,
                  top: "35%",
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  backgroundColor: dot.color,
                  animationDelay: dot.delay,
                }}
              />
            ))}

          {/* GOAL text */}
          {goalTeamSlide && (
            <div className="animate-bounceIn">
              <span className="text-6xl font-black text-gradient drop-shadow-[0_4px_16px_rgba(255,224,0,0.6)]">
                GOAL!
              </span>
            </div>
          )}

          {/* Team name slide-up */}
          {goalTeamSlide && (
            <div className="animate-slideUpName mt-4 flex items-center gap-2 glass-card px-4 py-2">
              <span className="text-2xl">{playerCountry.flag}</span>
              <span className="text-white text-lg font-bold drop-shadow-md">
                {playerCountry.name}
              </span>
              <span className="text-yellow-400 text-sm font-bold">scores!</span>
            </div>
          )}
        </div>
      )}

      {/* Halftime overlay */}
      {showHalftime && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
          <div className="animate-slideDown flex flex-col items-center">
            <div className="glass-card px-8 py-6 shadow-xl shadow-black/40">
              <div className="text-center">
                <span className="text-3xl font-black text-gradient drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  HALF TIME
                </span>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{playerCountry.flag}</span>
                    <span className="text-yellow-300 text-2xl font-black">
                      {displayScore.player}
                    </span>
                  </div>
                  <span className="text-white/30 text-xl">–</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 text-2xl font-black">
                      {displayScore.ai}
                    </span>
                    <span className="text-2xl">{aiCountry.flag}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control hints - Icon-based, fade out */}
      <div
        className={`absolute bottom-4 left-0 right-0 z-15 flex items-end justify-between px-5 pointer-events-none transition-opacity duration-1000 ${
          controlHintsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <path d="M7 10.5C7 10.5 9 9 12 9C15 9 17 10.5 17 10.5V18H7V10.5Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 18C7 19.6569 5.65685 21 4 21V14C5.65685 14 7 15.3431 7 17V18Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 18C17 19.6569 18.3431 21 20 21V14C18.3431 14 17 15.3431 17 17V18Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 6L12 3L15 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-white/50 text-xs drop-shadow-md">Drag to move</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs drop-shadow-md">Tap to kick</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <circle cx="12" cy="12" r="8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
            <path d="M12 8V12L15 15" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 4L8 2" stroke="rgba(255,200,0,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M15 4L16 2" stroke="rgba(255,200,0,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
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
