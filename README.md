# 聽覺訓練遊戲 (new-react)

學生登入後，在四個遊戲中隨機輪流練習：

| gameType | 遊戲 | 訓練內容 | 程式碼 |
|---|---|---|---|
| 1 | 噪音峽谷 | 噪音下語音聽辨 | `client/src/games/noiseCanyon/` |
| 2 | 音速競技場 | 快速語音辨識 | `client/src/games/speedArena/` |
| 3 (+5) | ㄅㄅ森林 | 聲韻覺識 | `client/src/games/bopomofoForest/` |
| 4 | 文字海 | 聽覺工作記憶 | `client/src/games/wordSea/` |

## 專案結構

```
client/                 React 前端 (Create React App)，部署到 Firebase Hosting
  public/audio, image   遊戲音檔與圖片
  src/
    api.js              所有後端 API 呼叫
    contexts/           AuthContext (登入狀態、背景)、AudioContext (播放器)
    components/         共用 UI 元件
    games/              GameSelector → GameComponent → 各遊戲元件；gameConfig.js 定義四個遊戲
scripts/                資料庫維護與題庫轉換腳本
```

後端是 Firebase Cloud Function `fn` (asia-east1，專案 `tlg-wang-4efd0`)。
**後端原始碼目前不在這個 repo 裡**，需要從 Google Cloud Console 的 Cloud Functions → `fn` → Source 下載。

## 開發

```bash
cd client
npm install
npm start          # http://localhost:3000，API 指向 .env.development 的 REACT_APP_API_URL
npm run build      # 輸出到 client/build
firebase deploy    # 部署 client/build 到 Firebase Hosting
```

注意：本機開發也會連到正式的 Cloud Function，遊玩會寫入正式資料庫的分數，請用測試帳號。

## 資料庫腳本

```bash
cd scripts
npm install
MONGODB_URI="<連線字串>" node deleteGameData.js 4-1 4-72
```

`scripts/data-prep/` 是把 Excel / Word 題庫轉成 MongoDB 匯入用 JSON 的 Python 腳本，需在該資料夾內執行。
