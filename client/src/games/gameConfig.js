// gameConfig.js — 四個遊戲的名稱、說明，以及每一關使用的元件
// 注意：import 順序決定 CSS 載入順序 (各遊戲的 CSS 有重複的 class)，請勿任意調整
import ChoiceGrid from './noiseCanyon/ChoiceGrid';
import SpeedRun from './speedArena/SpeedRun';
import SeaofWord from './wordSea/SeaofWord';
import BForest from './bopomofoForest/BForest';
import BForest2 from './bopomofoForest/BForest2';

export const GAMES = {
    1: {
        name: '噪音峽谷',
        description: '「 歡迎來到噪音峽谷，在這個地方你要在充滿環境噪音的狀況下，辨認出正確的句子，完成後便能獲得燃料元素喔。」',
        levelComponent: () => ChoiceGrid,
    },
    2: {
        name: '音速競技場',
        description: '「 歡迎來到音速競技場，在這裡你會聽到不同語速的句子，請仔細聽題目，並選出答案。 」',
        levelComponent: () => SpeedRun,
    },
    3: {
        name: 'ㄅㄅ森林',
        description: '「 歡迎進入ㄅㄅ森林，在這裡你會聽到許多讀音，有些發音你可能沒有聽過，這並不影響作答。 」',
        // 前 5 關是兩題一組的 BForest，之後是 gameType 5 的 BForest2
        levelComponent: (level) => (level >= 5 ? BForest2 : BForest),
    },
    4: {
        name: '文字海',
        description: '「 這裡是文字海，本遊戲會需要用到一點記憶力，題目會要求你記住一個關鍵字，作答時你需要回答關鍵字前面出現的字 」',
        levelComponent: () => SeaofWord,
    },
};

// 每個遊戲結束後顯示的溝通小訣竅類別 (目前四個遊戲都使用同一類)
export const TIP_CLASS = '1';
