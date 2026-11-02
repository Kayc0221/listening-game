# 聽覺訓練遊戲 (new-react)

學生登入後，在四個遊戲中隨機輪流練習：

| gameType | 遊戲 | 訓練內容 | 程式碼 |
|---|---|---|---|
| 1 | 噪音峽谷 | 噪音下語音聽辨 | `client/src/games/noiseCanyon/` |
| 2 | 音速競技場 | 快速語音辨識 | `client/src/games/speedArena/` |
| 3 (+5) | ㄅㄅ森林 | 聲韻覺識 | `client/src/games/bopomofoForest/` |
| 4 | 文字海 | 聽覺工作記憶 | `client/src/games/wordSea/` |

## 架構

```
client/                 React 前端 (Create React App)，部署到 GitHub Pages
  public/audio, image   遊戲音檔與圖片
  src/
    api.js              所有後端 API 呼叫
    asset.js            public/ 檔案的網址 (處理 GitHub Pages 子路徑)
    contexts/           AuthContext (登入狀態、背景)、AudioContext (播放器)
    components/         共用 UI 元件
    games/              GameSelector → GameComponent → 各遊戲元件；gameConfig.js 定義四個遊戲
apps-script/Code.gs     後端：Google Apps Script 網頁應用程式，資料存在 Google 試算表
scripts/
  mock/server.js        本機 mock 後端 (在 Node 執行同一份 Code.gs)
  questions-to-tsv.js   題目 JSON → 可貼進試算表的 TSV
  data-prep/            舊的 Excel / Word 題庫轉換腳本
.github/workflows/      推到 GitHub 後自動建置並部署到 GitHub Pages
```

## 本機開發 (不需要 Google 帳號)

```bash
node scripts/mock/server.js      # mock 後端 http://localhost:3010，帳號 test / 密碼 test
cd client
npm install
npm start                        # http://localhost:3000，.env.development 指向 mock
```

mock 的資料都在記憶體裡，重新啟動就會清空。文字海用的是真實題目 (`scripts/data-prep/output2.json`)，
其他三個遊戲用 `scripts/mock/fixtures.json` 裡的假題目，只是讓流程能跑。

## 設定 Google 試算表後端

1. 用你自己的 Google 帳號建立一個新的試算表。
2. 擴充功能 → Apps Script，把 `apps-script/Code.gs` 整份貼上並儲存。
3. 回到試算表重新整理，上方會出現「遊戲管理」選單 → 「建立 / 修正工作表」，會建立四個工作表，
   並把 ID 類欄位設成純文字 (否則試算表會把 `4-1` 自動轉成日期 4 月 1 日)：

   | 工作表 | 欄位 | 說明 |
   |---|---|---|
   | `users` | username, password_sha256 | 用「遊戲管理 → 新增 / 重設學生帳號」新增，密碼只存雜湊值 |
   | `questions` | gameId, text, ans, voice | gameId 例如 `4-1`，`-` 前的數字是 gameType；多個值用 JSON 陣列 |
   | `tips` | index, class, tip | 遊戲結束後的溝通小訣竅，`index` 對應 `public/audio/tips/<index>.wav` |
   | `scores` | timestamp, username, gameId, score | 遊戲自動寫入，可直接在試算表查看或下載 |

4. 匯入文字海題目：
   ```bash
   node scripts/questions-to-tsv.js scripts/data-prep/output2.json > game4.tsv
   ```
   在 `questions` 工作表 → 檔案 → 匯入 → 上傳 `game4.tsv` → 「附加到目前的工作表」，
   並**取消勾選「將文字轉換為數字、日期和公式」**。
5. Apps Script 右上角「部署」→「新增部署作業」→ 類型「網頁應用程式」，
   執行身分「我」、存取權「所有人」→ 部署，複製網址 (`https://script.google.com/macros/s/.../exec`)。
   之後修改 Code.gs 要選「管理部署作業」→ 編輯 → 新版本，網址才會維持不變。

每個 gameType 一次冒險挑幾關定義在 `Code.gs` 的 `LEVELS_PER_GAME` (1:3, 2:4, 3:5, 4:2, 5:8)。
已經有分數紀錄的題目不會再被選到；某個 gameType 的題目都玩過時，遊戲會顯示「沒有更多遊戲可以玩了」。

注意：網頁應用程式網址是公開的，任何人知道網址都能呼叫 (與舊後端相同)。
它只會比對帳號密碼與寫入分數，不會回傳密碼或其他人的資料。

## 部署到 GitHub Pages

1. 在 GitHub 建立 repo，把這個專案推上去。
2. repo 的 Settings → Pages → Source 選「GitHub Actions」。
3. Settings → Secrets and variables → Actions → Variables 新增 `REACT_APP_API_URL`，值是第 5 步的 Apps Script 網址。
4. 推到 `main` 或 `master` 就會自動部署，網址是 `https://<帳號>.github.io/<repo>/`。
   (若 repo 名稱就是 `<帳號>.github.io`，把 workflow 裡的 `PUBLIC_URL` 改成空字串。)
