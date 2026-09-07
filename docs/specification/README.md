# 項目定義書

このアプリで扱う項目の定義。

| ファイル                                   | 対象                                    |
| ------------------------------------------ | --------------------------------------- |
| [`screen-items.md`](./screen-items.md)     | 画面に表示・入力される項目              |
| [`url-parameters.md`](./url-parameters.md) | URL のクエリパラメータ                  |
| [`api-items.md`](./api-items.md)           | BFF と上流 API がやりとりするデータ項目 |

## 項目 ID の付け方

`<区分>-<連番>` の形式。区分は次のとおり。

| 接頭辞 | 区分                                   | 定義先              |
| ------ | -------------------------------------- | ------------------- |
| `HDR`  | ページヘッダー                         | `screen-items.md`   |
| `SEL`  | 都道府県セレクター                     | `screen-items.md`   |
| `TAB`  | 人口種別タブ                           | `screen-items.md`   |
| `CHT`  | グラフ                                 | `screen-items.md`   |
| `MSG`  | 状態表示（読み込み中・エラー・未選択） | `screen-items.md`   |
| `URL`  | URL クエリパラメータ                   | `url-parameters.md` |
| `API`  | BFF のエンドポイント                   | `api-items.md`      |
| `DAT`  | データ項目                             | `api-items.md`      |

## 画面構成

対象は 1 画面（`/`）。ほかにエラー画面（`app/error.tsx`）と 404 画面（`app/not-found.tsx`）がある。

```
/  （app/page.tsx）
├── HDR  ページヘッダー
└── PopulationDashboard          ← 唯一のオーケストレーター
    ├── SEL  都道府県セレクター    PrefectureSelector
    └── グラフ領域
        ├── TAB  人口種別タブ      PopulationTypeTabs
        └── タブパネル
            ├── MSG  状態表示
            └── CHT  グラフ        PopulationChart
```

## 前提

- 選択状態はコンポーネントの state ではなく **URL のクエリ**に持つ。`url-parameters.md` を参照
- 画面項目の「取得元」列は、`api-items.md` のデータ項目 ID（`DAT-xx`）で示す
- 表中の「—」は該当なし
