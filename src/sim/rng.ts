/**
 * Mulberry32 擬似乱数生成器
 * - 軽量で高速
 * - シード値から決定論的な乱数列を生成
 * - 同じシードで同じ結果を保証（リプレイ・検証に必須）
 *
 * @param seed 初期シード値（符号なし32bit整数として扱われる）
 * @returns 0.0〜1.0 の範囲の乱数を返す関数
 */
export function makeRng(seed: number) {
  let s = seed >>> 0; // 符号なし32bit整数に変換
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
