export type FighterParams = {
  hpMax: number;
  atk: number;
  range: number;
  speed: number;
  cooldown: number;
};

export type BattleConfig = {
  seed: number;
  arenaRadius: number;
  tickRate: number; // fixed update per second
  fighterA: FighterParams;
  fighterB: FighterParams;
};

export type Vec2 = { x: number; y: number };

export type FighterState = {
  id: "A" | "B";
  pos: Vec2;
  hp: number;
  cooldown: number;
  alive: boolean;
  params: FighterParams;
};

export type BattleState = {
  t: number;
  winner: "A" | "B" | null;
  a: FighterState;
  b: FighterState;
};
