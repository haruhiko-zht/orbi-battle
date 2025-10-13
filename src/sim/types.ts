import type { AIType } from "./ai";

/**
 * ファイターのパラメータ定義
 * - すべて正の数値を想定
 */
export type FighterParams = {
  /** 最大HP */
  hpMax: number;
  /** 攻撃力（1回あたりのダメージ） */
  atk: number;
  /** 攻撃射程（この距離以下で攻撃可能）[px] */
  range: number;
  /** 移動速度 [px/s] */
  speed: number;
  /** 攻撃後のクールダウン時間 [秒] */
  cooldown: number;
  /** AI の種類（デフォルト: "nearest"） */
  aiType?: AIType;
};

/**
 * バトル全体の設定
 */
export type BattleConfig = {
  /** 乱数シード（同じシードで同じ結果を保証） */
  seed: number;
  /** アリーナの半径 [px] */
  arenaRadius: number;
  /** シミュレーションの更新頻度 [Hz] (例: 60 = 1秒間に60回更新) */
  tickRate: number;
  /** チーム構成（複数チーム、各チーム複数ファイター対応） */
  teams: Array<{
    /** チームID（例: "A", "B"） */
    id: string;
    /** チーム内のファイター配列 */
    fighters: FighterParams[];
  }>;
};

/** 2次元ベクトル（位置・方向を表現） */
export type Vec2 = { x: number; y: number };

/**
 * ファイターの現在の状態
 */
export type FighterState = {
  /** ファイターの一意識別子（例: "A-0", "B-1"） */
  id: string;
  /** 所属チームID */
  teamId: string;
  /** 現在位置（アリーナ中心が原点） */
  pos: Vec2;
  /** 現在のHP（0以下で敗北） */
  hp: number;
  /** 攻撃クールダウンの残り時間 [秒] */
  cooldown: number;
  /** 生存フラグ */
  alive: boolean;
  /** このファイターのパラメータ */
  params: FighterParams;
};

/**
 * バトル全体の状態（1フレーム分）
 */
export type BattleState = {
  /** 経過時間 [秒] */
  t: number;
  /** 勝者（null = まだ決着していない、チームID または "Draw"） */
  winner: string | null;
  /** 全ファイターの状態（フラット配列） */
  fighters: FighterState[];
};
