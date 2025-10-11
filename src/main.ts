import Phaser from "phaser";
import { BattleScene } from "./render/phaserScene";
import { createDebugPanel } from "./ui/debugPanel";
import { defaults } from "./config/defaults";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0e0f13",
  scale: {
    width: 960,
    height: 540,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BattleScene],
});

// Debug UI
createDebugPanel(defaults);

// Expose for console tweak
// @ts-expect-error
window.$orbi = { game };
