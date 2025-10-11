/**
 * Orbi Battle - エントリーポイント
 * - Phaserゲームの初期化
 * - デバッグパネルの生成
 * - グローバルAPI（window.$orbi）の公開
 */
import Phaser from "phaser";
import { BattleScene } from "./render/phaserScene";
import { createDebugPanel } from "./ui/debugPanel";
import { defaults } from "./config/defaults";

// Phaserゲームインスタンスの生成
const game = new Phaser.Game({
  type: Phaser.AUTO, // WebGL または Canvas を自動選択
  parent: "app", // 描画先の親要素ID
  backgroundColor: "#0e0f13",
  scale: {
    width: 960,
    height: 540,
    mode: Phaser.Scale.FIT, // アスペクト比を保持してフィット
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BattleScene],
});

// デバッグUI（右側のパネル）
createDebugPanel(defaults);

// コンソールからの操作用グローバルAPI
// @ts-expect-error
window.$orbi = { game };
