/**
 * レンダリング定数
 * - Phaser シーンで使用する描画パラメータを集約
 * - マジックナンバーの排除とメンテナンス性向上
 */

/** 背景色設定 */
export const BACKGROUND_COLOR = "#0e0f13";

/** シミュレーション座標系の基準解像度 */
export const SIM_VIEWPORT = {
  width: 960,
  height: 540,
} as const;

/** 実際の描画キャンバス解像度 */
export const CANVAS_VIEWPORT = {
  width: 1920,
  height: 1080,
} as const;

const widthScale = CANVAS_VIEWPORT.width / SIM_VIEWPORT.width;
const heightScale = CANVAS_VIEWPORT.height / SIM_VIEWPORT.height;
const SCALE_TOLERANCE = 1e-6;

if (Math.abs(widthScale - heightScale) > SCALE_TOLERANCE) {
  throw new Error(
    `[renderConstants] 解像度の縦横比が一致しません: widthScale=${widthScale}, heightScale=${heightScale}`
  );
}

/**
 * 描画スケール係数
 * シミュレーション座標系の値をキャンバス座標へ変換する
 */
export const RENDER_SCALE = widthScale;

/** アリーナ描画設定 */
export const ARENA = {
  /** 境界線の太さ [px] */
  strokeWidth: 4,
  /** 境界線の色 */
  strokeColor: 0x4a90e2,
  /** 塗りつぶしの透明度 (0 = 完全透明) */
  fillAlpha: 0,
} as const;

/** ファイター描画設定 */
export const FIGHTER = {
  /** ファイターの円の半径 [px] (描画専用、シミュレーション座標系とは独立) */
  radius: 6,
  /** 生存時の不透明度 */
  aliveAlpha: 1.0,
  /** 死亡時の不透明度 */
  deadAlpha: 0.3,
} as const;

/** ファイター攻撃範囲の描画設定 */
export const FIGHTER_RANGE = {
  /** 境界線の太さ [px] */
  strokeWidth: 2,
  /** 生存時の境界線透過度 */
  strokeAlphaAlive: 0.6,
  /** 死亡時の境界線透過度 */
  strokeAlphaDead: 0.2,
  /** 生存時の塗りつぶし透過度 */
  fillAlphaAlive: 0.1,
  /** 死亡時の塗りつぶし透過度 */
  fillAlphaDead: 0.04,
} as const;

/** HPバー描画設定 */
export const HP_BAR = {
  /** HPバーの幅 [px] */
  width: 640,
  /** HPバーの高さ [px] */
  height: 16,
  /** HPバー間の余白 [px] */
  padding: 4,
  /** 左端からのオフセット [px] */
  leftOffset: 40,
  /** 背景色 */
  backgroundColor: 0x333333,
} as const;

/** HPテキスト設定 */
export const HP_TEXT = {
  /** テキスト色 */
  color: "#ffffff",
  /** フォントサイズ */
  fontSize: "16px",
  /** フォントファミリー */
  fontFamily: "monospace",
} as const;

/** 勝敗表示テキスト設定 */
export const RESULT_TEXT = {
  /** テキスト色 */
  color: "#ffffff",
  /** フォントサイズ */
  fontSize: "48px",
  /** フォントファミリー */
  fontFamily: "monospace",
  /** 表示位置 X [px] */
  x: 24,
  /** 表示位置 Y [px] */
  y: 24,
} as const;

/** チームカラーパレット */
export const TEAM_COLOR_PALETTE = [
  0x7bd389, // soft green
  0xf97070, // soft red
  0x6cc0f7, // sky blue
  0xf7f36c, // warm yellow
  0xc27bf7, // lavender
  0xf79bd1, // pink
] as const;

/** フレーム制御設定 */
export const FRAME_CONTROL = {
  /** 最大デルタタイム [秒] - 大きなフレーム落ちを抑制 */
  maxDeltaTime: 0.05,
} as const;
