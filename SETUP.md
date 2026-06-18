# セットアップガイド

## 現在の状態
- ✅ ログイン機能（初期PW: admin1234）
- ✅ 月別シフト管理
- ✅ スタッフ希望収集・自動割り振り
- ✅ お客さん予約
- ✅ 給与計算
- ✅ PWA（スマホのホーム画面に追加可能）
- ⬜ Supabase（クラウド保存）← 次のステップ

## パスワード変更
1. 管理者ログイン
2. 設定・共有URL タブ
3. 一番上の「パスワード変更」から変更

## Supabaseのセットアップ（クラウド保存）

### 1. アカウント作成
https://supabase.com → Start your project → GitHubアカウントでサインアップ

### 2. プロジェクト作成
- New Project
- 名前: shift-app
- パスワード: 任意（DBのパスワード）
- Region: Northeast Asia (Tokyo)

### 3. テーブル作成
SQL Editorで以下を実行:
```sql
create table app_data (
  key text primary key,
  data text,
  updated_at timestamp default now()
);
alter table app_data enable row level security;
create policy "Allow all" on app_data for all using (true);
```

### 4. APIキーを取得
Settings > API > Project URL と anon public key をコピー

### 5. アプリに設定
src/lib/supabase.js を開いて:
```js
export const SUPABASE_URL = 'https://xxxxx.supabase.co'  // ← 貼る
export const SUPABASE_KEY = 'eyJxxxxx...'                 // ← 貼る
```

### 6. 完了！
これでデータがクラウドに保存され、
スタッフがスマホから希望を入力すると管理者のPCにも即座に反映されます。
