// 刪除 maindata.gamedatas 中 gameId 介於 <from> 與 <to> 之間的題目 (字串比較)
//
// 用法 (先在 scripts/ 執行一次 npm install)：
//   MONGODB_URI="mongodb+srv://..." node deleteGameData.js 4-1 4-72
//
// 連線字串不要寫進程式碼或 commit 進 git。
const { MongoClient } = require('mongodb');

const [from, to] = process.argv.slice(2);
const uri = process.env.MONGODB_URI;

if (!uri || !from || !to) {
    console.error('Usage: MONGODB_URI=<connection string> node deleteGameData.js <fromGameId> <toGameId>');
    process.exit(1);
}

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const collection = client.db('maindata').collection('gamedatas');
        const result = await collection.deleteMany({ gameId: { $gte: from, $lte: to } });
        console.log(`${result.deletedCount} 個文件已被刪除`);
    } finally {
        await client.close();
    }
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
