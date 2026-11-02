// zhuyin.js — 把注音轉成 public/audio/game3 底下的音檔名稱
// 例如 "ㄅㄚˇ" → "01_25_03" (聲母_韻母_聲調)，沒有聲調符號時視為一聲 "01"

const spellDict = {
    'ㄅ': '01', 'ㄆ': '02', 'ㄇ': '03', 'ㄈ': '04', 'ㄉ': '05', 'ㄊ': '06', 'ㄋ': '07', 'ㄌ': '08',
    'ㄍ': '09', 'ㄎ': '10', 'ㄏ': '11', 'ㄐ': '12', 'ㄑ': '13', 'ㄒ': '14', 'ㄓ': '15', 'ㄔ': '16',
    'ㄕ': '17', 'ㄖ': '18', 'ㄗ': '19', 'ㄘ': '20', 'ㄙ': '21',
    'ㄧ': '22', '一': '22', // 題庫中有時用國字「一」代替注音「ㄧ」
    'ㄨ': '23', 'ㄩ': '24', 'ㄚ': '25', 'ㄛ': '26', 'ㄜ': '27', 'ㄝ': '28', 'ㄞ': '29', 'ㄟ': '30',
    'ㄠ': '31', 'ㄡ': '32', 'ㄢ': '33', 'ㄣ': '34', 'ㄤ': '35', 'ㄥ': '36', 'ㄦ': '37',
};

const soundDict = {
    '': '01',
    'ˊ': '02',
    'ˇ': '03',
    'ˋ': '04',
};

export const translateZhuyinToCode = (zhuyinStr) => {
    let codeStr = '';
    let hasTone = false;

    for (let char of zhuyinStr) {
        if (char in spellDict) {
            codeStr += spellDict[char] + '_';
        } else if (char in soundDict) {
            codeStr += soundDict[char];
            hasTone = true;
            break;
        }
    }

    if (!hasTone) {
        codeStr += '01';
    }

    return codeStr;
};
