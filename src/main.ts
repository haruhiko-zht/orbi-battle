/**
 * Orbi Battle - エントリーポイント
 * - Phaserゲームの初期化
 * - デバッグパネルの生成
 * - グローバルAPI（window.$orbi）の公開
 */
import Phaser from "phaser";
import { BattleScene } from "./render/phaserScene";
import { createDebugPanel } from "./ui/debugPanel";
import { defaults3v3 } from "./config/defaults";
import { CANVAS_VIEWPORT } from "./config/renderConstants";

// Phaserゲームインスタンスの生成
const game = new Phaser.Game({
  type: Phaser.AUTO, // WebGL または Canvas を自動選択
  parent: "app", // 描画先の親要素ID
  backgroundColor: "#0e0f13",
  scale: {
    width: CANVAS_VIEWPORT.width,
    height: CANVAS_VIEWPORT.height,
    mode: Phaser.Scale.FIT, // アスペクト比を保持してフィット
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true, // アンチエイリアスを有効化して滑らかに
    antialiasGL: true, // WebGL のアンチエイリアスも有効化
    pixelArt: false, // ピクセルアート用の設定を無効化
    roundPixels: false, // ピクセル位置の丸め込みを無効化
    powerPreference: "high-performance", // 高性能GPUを優先
    mipmapFilter: "LINEAR_MIPMAP_LINEAR", // 高品質なテクスチャフィルタリング
  },
  scene: [BattleScene],
});

// コンソールからの操作用グローバルAPI
window.$orbi = { game } as Window["$orbi"];

// デバッグUI（右側のパネル）
createDebugPanel(defaults3v3, "3v3");
