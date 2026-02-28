# GeonicDB Docs — CLAUDE.md

## プロジェクト概要

GeonicDB の公式ドキュメントサイト。[VitePress](https://vitepress.dev/) を使用して構築されており、日本語（`docs/ja/`）と英語（`docs/en/`）の二言語対応。

ドキュメントのソースは `geolonia/geonicdb` リポジトリの `docs/` ディレクトリから自動同期・翻訳される。

## ビルド手順

```bash
pnpm install
pnpm docs:build
```

開発サーバー（ホットリロード付き）:

```bash
pnpm docs:dev
```

## テスト

```bash
# ユニットテスト
pnpm test:unit

# E2E テスト（Playwright）
pnpm test:e2e
```

## 翻訳ルール

### 用語集準拠

翻訳・編集時は必ず `glossary.yaml` に準拠すること。

- **commit 前に glossary check を実行すること**:
  ```bash
  npx @geolonia/yuuhitsu glossary check --input <file> --glossary glossary.yaml --lang ja
  ```
- 新しい用語を追加した場合は `glossary.yaml` も更新すること
- コードブロック・URL 内の用語は対象外
- `type: brand` の用語は翻訳せず原語のまま保持すること

### 翻訳ディレクトリ構成

- `docs/ja/` — 日本語ドキュメント（一次ソース）
- `docs/en/` — 英語ドキュメント（yuuhitsu による自動翻訳）

## CI（GitHub Actions）

### test.yml

PR / mainへのpushで実行:
- `unit-tests` — `pnpm test:unit`
- `e2e-tests` — Playwright E2E テスト
- `glossary-check` — `docs/ja/` 全ファイルに対して glossary 用語チェック（**warn-only**。cmd_206 完了後に strict に切り替える）

### sync-and-translate.yml

`workflow_dispatch` または `repository_dispatch` で実行:
1. `geolonia/geonicdb` の `docs/` を同期
2. 変更された日本語ファイルを英語に翻訳（yuuhitsu）
3. ドキュメント品質修正
4. PR 作成

翻訳後に glossary compliance check が走る（warn-only）。

## 重要ファイル

| ファイル | 役割 |
|---------|------|
| `glossary.yaml` | 用語集（翻訳・表記ゆれチェックの基準） |
| `yuuhitsu.config.yaml` | yuuhitsu CLI 設定（provider, model, glossary パス） |
| `.github/workflows/test.yml` | CI テスト + glossary check |
| `.github/workflows/sync-and-translate.yml` | 自動同期・翻訳パイプライン |
| `scripts/fix-doc-quality.ts` | ドキュメント品質修正スクリプト |
