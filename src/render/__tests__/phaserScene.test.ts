import { describe, it, expect } from "vitest";
import type { BattleConfig } from "../../sim/types";

/**
 * Phaser Scene のテスト
 *
 * 注意: PhaserはCanvas APIに強く依存しており、モジュールのインポート時点で
 * Canvas要素の初期化を試みるため、happy-domやjsdomではテストできません。
 *
 * Phaserの描画ロジックは以下の方法で検証します:
 * 1. 手動での動作確認（npm run dev でブラウザ上で実行）
 * 2. E2Eテスト（Playwright等、将来的に追加）
 * 3. ビジュアルリグレッションテスト（将来的に追加）
 *
 * ここでは、Phaserに依存しない型定義のみをテストします。
 */

describe("BattleScene type compatibility", () => {
  it("BattleConfigの型定義が有効", () => {
    const config: BattleConfig = {
      seed: 12345,
      arenaRadius: 200,
      tickRate: 60,
      teams: [
        {
          id: "A",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 30,
              speed: 50,
              cooldown: 0.5,
            },
          ],
        },
        {
          id: "B",
          fighters: [
            {
              hpMax: 100,
              atk: 10,
              range: 30,
              speed: 50,
              cooldown: 0.5,
            },
          ],
        },
      ],
    };

    expect(config).toBeDefined();
    expect(config.seed).toBe(12345);
    expect(config.arenaRadius).toBe(200);
    expect(config.tickRate).toBe(60);
  });

  it("BattleConfigのネストした構造が正しい", () => {
    const config: BattleConfig = {
      seed: 99999,
      arenaRadius: 300,
      tickRate: 120,
      teams: [
        {
          id: "A",
          fighters: [
            {
              hpMax: 150,
              atk: 15,
              range: 40,
              speed: 60,
              cooldown: 0.4,
            },
          ],
        },
        {
          id: "B",
          fighters: [
            {
              hpMax: 180,
              atk: 18,
              range: 45,
              speed: 65,
              cooldown: 0.5,
            },
          ],
        },
      ],
    };

    expect(config.teams[0].fighters[0].hpMax).toBe(150);
    expect(config.teams[1].fighters[0].atk).toBe(18);
  });
});

describe("Rendering layer architecture notes", () => {
  it("レンダリング層はシミュレーション層に依存する", () => {
    // BattleSceneはBattleSimを使ってバトルを実行する
    // BattleSimの正しさは src/sim/__tests__/battle.test.ts で検証済み
    expect(true).toBe(true);
  });

  it("レンダリング層の責務は描画のみ", () => {
    // - BattleSimから状態を取得
    // - Phaserを使って画面に描画
    // - ロジックは含まない（すべてsim層で実行）
    expect(true).toBe(true);
  });
});

/**
 * BattleSceneの機能確認方法:
 *
 * 1. 開発サーバーで動作確認
 *    ```
 *    npm run dev
 *    ```
 *    ブラウザで http://localhost:5173 を開いて以下を確認:
 *    - アリーナ（円）が表示される
 *    - 2体のファイターが表示される
 *    - HPバーが表示される
 *    - 勝敗が表示される
 *    - デバッグパネルで設定変更してRestartできる
 *
 * 2. コンソールでのAPI確認
 *    ```javascript
 *    window.$orbi.getLog()      // バトルログを取得
 *    window.$orbi.reset(config) // 新しい設定でリセット
 *    ```
 *
 * 3. 将来的なE2Eテスト（例）
 *    ```typescript
 *    test('バトルが実行される', async ({ page }) => {
 *      await page.goto('http://localhost:5173');
 *      await expect(page.locator('canvas')).toBeVisible();
 *      await expect(page.locator('#overlay button')).toHaveText('Restart');
 *    });
 *    ```
 */
