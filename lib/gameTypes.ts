export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vec2;
  vel: Vec2;
  radius: number;
}

export interface PlayerState extends Entity {
  hasBall: boolean;
  kickCooldown: number;
}

export interface BallState extends Entity {
  lastTouched: "player" | "ai" | null;
}

export interface GoalState {
  x: number;
  y: number;
  width: number;
  height: number;
  side: "left" | "right";
}

export type GamePhase =
  | "kickoff"
  | "playing"
  | "goal_player"
  | "goal_ai"
  | "halftime"
  | "ended";

export interface GameState {
  phase: GamePhase;
  player: PlayerState;
  ai: PlayerState;
  ball: BallState;
  score: { player: number; ai: number };
  timeLeft: number; // seconds
  half: 1 | 2;
  phaseTimer: number; // for goal/pause animations
}

export interface TouchInput {
  joystickActive: boolean;
  joystickOrigin: Vec2;
  joystickCurrent: Vec2;
  kickPressed: boolean;
}

export interface FieldDimensions {
  width: number;
  height: number;
  goalWidth: number;
  goalHeight: number;
  centerX: number;
  centerY: number;
}
