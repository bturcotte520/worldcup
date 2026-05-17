import type {
  GameState,
  BallState,
  PlayerState,
  FieldDimensions,
  Vec2,
  GoalState,
  TouchInput,
} from "./gameTypes";
import type { Country } from "./countries";

const PLAYER_SPEED = 3.2;
const AI_SPEED = 2.6;
const BALL_FRICTION = 0.97;
const PLAYER_FRICTION = 0.82;
const KICK_POWER = 9;
const PLAYER_RADIUS = 14;
const BALL_RADIUS = 9;
const POSSESSION_DIST = 22;
const KICK_COOLDOWN = 20; // frames
const GOAL_PAUSE = 3; // seconds
const HALF_DURATION = 180; // 3 min per half

export function createField(canvasW: number, canvasH: number): FieldDimensions {
  return {
    width: canvasW,
    height: canvasH,
    goalWidth: 12,
    goalHeight: Math.floor(canvasH * 0.28),
    centerX: canvasW / 2,
    centerY: canvasH / 2,
  };
}

export function createGoals(field: FieldDimensions): [GoalState, GoalState] {
  const leftGoal: GoalState = {
    x: 0,
    y: field.centerY - field.goalHeight / 2,
    width: field.goalWidth,
    height: field.goalHeight,
    side: "left",
  };
  const rightGoal: GoalState = {
    x: field.width - field.goalWidth,
    y: field.centerY - field.goalHeight / 2,
    width: field.goalWidth,
    height: field.goalHeight,
    side: "right",
  };
  return [leftGoal, rightGoal];
}

export function createInitialState(field: FieldDimensions): GameState {
  return {
    phase: "kickoff",
    half: 1,
    timeLeft: HALF_DURATION,
    phaseTimer: 1.5,
    score: { player: 0, ai: 0 },
    player: {
      pos: { x: field.centerX - 60, y: field.centerY },
      vel: { x: 0, y: 0 },
      radius: PLAYER_RADIUS,
      hasBall: false,
      kickCooldown: 0,
    },
    ai: {
      pos: { x: field.centerX + 60, y: field.centerY },
      vel: { x: 0, y: 0 },
      radius: PLAYER_RADIUS,
      hasBall: false,
      kickCooldown: 0,
    },
    ball: {
      pos: { x: field.centerX, y: field.centerY },
      vel: { x: 0, y: 0 },
      radius: BALL_RADIUS,
      lastTouched: null,
    },
  };
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function resolveBodies(a: PlayerState | BallState, b: PlayerState | BallState): void {
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const minDist = a.radius + b.radius;
  if (d < minDist && d > 0) {
    const overlap = (minDist - d) / 2;
    const nx = dx / d;
    const ny = dy / d;
    a.pos.x -= nx * overlap;
    a.pos.y -= ny * overlap;
    b.pos.x += nx * overlap;
    b.pos.y += ny * overlap;

    // bounce velocities
    const relVx = b.vel.x - a.vel.x;
    const relVy = b.vel.y - a.vel.y;
    const dot = relVx * nx + relVy * ny;
    if (dot < 0) {
      const impulse = dot * 0.6;
      a.vel.x += impulse * nx;
      a.vel.y += impulse * ny;
      b.vel.x -= impulse * nx;
      b.vel.y -= impulse * ny;
    }
  }
}

function keepInField(entity: Entity, field: FieldDimensions): void {
  const r = entity.radius;
  entity.pos.x = clamp(entity.pos.x, r, field.width - r);
  entity.pos.y = clamp(entity.pos.y, r, field.height - r);
  if (entity.pos.x <= r || entity.pos.x >= field.width - r) {
    entity.vel.x *= -0.5;
  }
  if (entity.pos.y <= r || entity.pos.y >= field.height - r) {
    entity.vel.y *= -0.5;
  }
}

interface Entity {
  pos: Vec2;
  vel: Vec2;
  radius: number;
}

function isBallInGoal(
  ball: BallState,
  goals: [GoalState, GoalState]
): GoalState | null {
  for (const goal of goals) {
    const inX = ball.pos.x + ball.radius > goal.x && ball.pos.x - ball.radius < goal.x + goal.width;
    const inY = ball.pos.y + ball.radius > goal.y && ball.pos.y - ball.radius < goal.y + goal.height;
    if (inX && inY) return goal;
  }
  return null;
}

// AI decision making
function updateAI(
  state: GameState,
  field: FieldDimensions,
  goals: [GoalState, GoalState],
  dt: number
): void {
  const ai = state.ai;
  const ball = state.ball;
  // goals[0] = left goal  → ball here = AI scores (goal_ai)
  // goals[1] = right goal → ball here = player scores (goal_player)
  const aiTargetGoal = goals[0]; // AI attacks left goal to score
  const aiDefendGoal = goals[1]; // AI defends right goal

  ai.kickCooldown = Math.max(0, ai.kickCooldown - 1);

  const dToBall = dist(ai.pos, ball.pos);
  const playerDist = dist(state.player.pos, ball.pos);

  let targetX: number;
  let targetY: number;

  if (dToBall < playerDist * 1.1) {
    // Go for ball
    targetX = ball.pos.x;
    targetY = ball.pos.y;
  } else {
    // Defensive positioning: sit between ball and the goal AI is defending
    const defensiveX = aiDefendGoal.x - 50 - ((1 - ball.pos.x / field.width) * 60);
    const defensiveY = clamp(ball.pos.y, field.centerY - 60, field.centerY + 60);
    targetX = clamp(defensiveX, field.centerX, aiDefendGoal.x - 20);
    targetY = defensiveY;
  }

  const dx = targetX - ai.pos.x;
  const dy = targetY - ai.pos.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > 5) {
    ai.vel.x += (dx / d) * AI_SPEED * 0.4;
    ai.vel.y += (dy / d) * AI_SPEED * 0.4;
  }

  // Kick if close to ball
  if (dToBall < POSSESSION_DIST + 4 && ai.kickCooldown === 0) {
    // Aim at left goal (AI scores there)
    const goalCenterY = aiTargetGoal.y + aiTargetGoal.height / 2;
    const aimX = aiTargetGoal.x + aiTargetGoal.width - ai.pos.x;
    const aimY = goalCenterY - ai.pos.y;
    const aimDir = normalize({ x: aimX, y: aimY });

    // Add slight randomness
    const spread = 0.3;
    const finalDir = normalize({
      x: aimDir.x + (Math.random() - 0.5) * spread,
      y: aimDir.y + (Math.random() - 0.5) * spread,
    });

    ball.vel.x = finalDir.x * KICK_POWER * (0.8 + Math.random() * 0.4);
    ball.vel.y = finalDir.y * KICK_POWER * (0.8 + Math.random() * 0.4);
    ball.lastTouched = "ai";
    ai.kickCooldown = KICK_COOLDOWN;
  }
}

export function stepGame(
  state: GameState,
  field: FieldDimensions,
  goals: [GoalState, GoalState],
  input: TouchInput,
  dt: number // delta time in seconds
): GameState {
  const next = JSON.parse(JSON.stringify(state)) as GameState;
  const frames = dt * 60; // normalize to 60fps

  if (next.phase === "kickoff") {
    next.phaseTimer -= dt;
    if (next.phaseTimer <= 0) {
      next.phase = "playing";
      next.phaseTimer = 0;
    }
    return next;
  }

  if (next.phase === "goal_player" || next.phase === "goal_ai") {
    next.phaseTimer -= dt;
    if (next.phaseTimer <= 0) {
      // Reset positions
      const reset = createInitialState(field);
      next.player = reset.player;
      next.ai = reset.ai;
      next.ball = reset.ball;
      next.phase = "kickoff";
      next.phaseTimer = 1.5;
    }
    return next;
  }

  if (next.phase === "halftime") {
    next.phaseTimer -= dt;
    if (next.phaseTimer <= 0) {
      next.half = 2;
      next.timeLeft = HALF_DURATION;
      const reset = createInitialState(field);
      next.player = reset.player;
      next.ai = reset.ai;
      next.ball = reset.ball;
      next.phase = "kickoff";
      next.phaseTimer = 1.5;
    }
    return next;
  }

  if (next.phase === "ended") {
    return next;
  }

  // Update timer
  next.timeLeft = Math.max(0, next.timeLeft - dt);
  if (next.timeLeft <= 0) {
    if (next.half === 1) {
      next.phase = "halftime";
      next.phaseTimer = 3;
    } else {
      next.phase = "ended";
    }
    return next;
  }

  // Player movement from joystick
  const { player } = next;
  player.kickCooldown = Math.max(0, player.kickCooldown - 1);

  if (input.joystickActive) {
    const jx = input.joystickCurrent.x - input.joystickOrigin.x;
    const jy = input.joystickCurrent.y - input.joystickOrigin.y;
    const jLen = Math.sqrt(jx * jx + jy * jy);
    const maxRadius = 50;
    const clamped = Math.min(jLen, maxRadius);
    if (jLen > 0) {
      const nx = jx / jLen;
      const ny = jy / jLen;
      const t = clamped / maxRadius;
      player.vel.x += nx * PLAYER_SPEED * t * frames * 0.15;
      player.vel.y += ny * PLAYER_SPEED * t * frames * 0.15;
    }
  }

  // Kick
  if (input.kickPressed && player.kickCooldown === 0) {
    const dToBall = dist(player.pos, next.ball.pos);
    if (dToBall < POSSESSION_DIST + 8) {
      // Kick toward AI goal (right side) with directional influence
      const goalCenterX = goals[1].x;
      const goalCenterY = goals[1].y + goals[1].height / 2;
      let aimX = goalCenterX - player.pos.x;
      let aimY = goalCenterY - player.pos.y;

      // Blend with ball direction from player
      const toBallX = next.ball.pos.x - player.pos.x;
      const toBallY = next.ball.pos.y - player.pos.y;
      const toBallDir = normalize({ x: toBallX, y: toBallY });
      const goalDir = normalize({ x: aimX, y: aimY });

      const finalDir = normalize({
        x: goalDir.x * 0.7 + toBallDir.x * 0.3,
        y: goalDir.y * 0.7 + toBallDir.y * 0.3,
      });

      next.ball.vel.x = finalDir.x * KICK_POWER;
      next.ball.vel.y = finalDir.y * KICK_POWER;
      next.ball.lastTouched = "player";
      player.kickCooldown = KICK_COOLDOWN;
    }
  }

  // AI update
  updateAI(next, field, goals, dt);

  // Apply velocities (scaled by frames for frame-rate independence)
  next.player.pos.x += next.player.vel.x * frames * 0.5;
  next.player.pos.y += next.player.vel.y * frames * 0.5;
  next.ai.pos.x += next.ai.vel.x * frames * 0.5;
  next.ai.pos.y += next.ai.vel.y * frames * 0.5;
  next.ball.pos.x += next.ball.vel.x * frames * 0.5;
  next.ball.pos.y += next.ball.vel.y * frames * 0.5;

  // Apply friction
  next.player.vel.x *= PLAYER_FRICTION;
  next.player.vel.y *= PLAYER_FRICTION;
  next.ai.vel.x *= PLAYER_FRICTION;
  next.ai.vel.y *= PLAYER_FRICTION;
  next.ball.vel.x *= BALL_FRICTION;
  next.ball.vel.y *= BALL_FRICTION;

  // Constrain player to left half (approx)
  next.player.pos.x = clamp(next.player.pos.x, PLAYER_RADIUS, field.width - PLAYER_RADIUS);
  next.player.pos.y = clamp(next.player.pos.y, PLAYER_RADIUS, field.height - PLAYER_RADIUS);

  next.ai.pos.x = clamp(next.ai.pos.x, PLAYER_RADIUS, field.width - PLAYER_RADIUS);
  next.ai.pos.y = clamp(next.ai.pos.y, PLAYER_RADIUS, field.height - PLAYER_RADIUS);

  // Ball wall bounce (but allow goals)
  keepBallInField(next.ball, field, goals);

  // Collision
  resolveBodies(next.player, next.ball);
  resolveBodies(next.ai, next.ball);
  resolveBodies(next.player, next.ai);

  // Set lastTouched on collision with ball
  if (dist(next.player.pos, next.ball.pos) < POSSESSION_DIST) {
    next.ball.lastTouched = "player";
  } else if (dist(next.ai.pos, next.ball.pos) < POSSESSION_DIST) {
    next.ball.lastTouched = "ai";
  }

  // Goal detection
  const scoredGoal = isBallInGoal(next.ball, goals);
  if (scoredGoal) {
    if (scoredGoal.side === "right") {
      // Ball in right goal = player scores
      next.score.player += 1;
      next.phase = "goal_player";
      next.phaseTimer = GOAL_PAUSE;
    } else {
      // Ball in left goal = AI scores
      next.score.ai += 1;
      next.phase = "goal_ai";
      next.phaseTimer = GOAL_PAUSE;
    }
  }

  return next;
}

function keepBallInField(
  ball: BallState,
  field: FieldDimensions,
  goals: [GoalState, GoalState]
): void {
  const r = ball.radius;

  // Top/bottom walls
  if (ball.pos.y - r < 0) {
    ball.pos.y = r;
    ball.vel.y = Math.abs(ball.vel.y) * 0.7;
  }
  if (ball.pos.y + r > field.height) {
    ball.pos.y = field.height - r;
    ball.vel.y = -Math.abs(ball.vel.y) * 0.7;
  }

  // Left wall - allow goal
  const leftGoal = goals[0];
  const inLeftGoalY =
    ball.pos.y + r > leftGoal.y && ball.pos.y - r < leftGoal.y + leftGoal.height;

  if (ball.pos.x - r < 0) {
    if (!inLeftGoalY) {
      ball.pos.x = r;
      ball.vel.x = Math.abs(ball.vel.x) * 0.7;
    }
    // If inside goal vertically, ball can pass through (goal check handles scoring)
  }

  // Right wall - allow goal
  const rightGoal = goals[1];
  const inRightGoalY =
    ball.pos.y + r > rightGoal.y && ball.pos.y - r < rightGoal.y + rightGoal.height;

  if (ball.pos.x + r > field.width) {
    if (!inRightGoalY) {
      ball.pos.x = field.width - r;
      ball.vel.x = -Math.abs(ball.vel.x) * 0.7;
    }
  }
}
