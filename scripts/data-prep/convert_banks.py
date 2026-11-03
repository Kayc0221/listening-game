# convert_banks.py — 把原始題庫 (Word / Excel) 轉成可以匯入 Google 試算表的 TSV
#
# 用法 (在專案根目錄)：
#   python -I scripts/data-prep/convert_banks.py <題庫資料夾> <輸出資料夾>
# 題庫資料夾需要：modeule1.docx、modeule2.xlsx、modeule3.xlsx、Communication skills tips.docx
# 輸出：
#   questions.tsv  遊戲 1、2、3、5 的題目 (questions 工作表的 gameId / text / ans / voice)
#   tips.tsv       溝通小訣竅 (tips 工作表的 index / class / tip)
# 會同時檢查每一題是否符合遊戲的需求 (例如答案的字都在選字格裡、注音答案有音檔)，有問題的列出來。

import json
import os
import re
import sys

import docx
import openpyxl

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
AUDIO = os.path.join(ROOT, "client", "public", "audio")

# ㄅㄅ森林後段 (gameType 5) 的 4 個難度依序使用的選項組；難度 0 最簡單
GAME5_GROUPS = [("雙拼", "真音"), ("雙拼", "假音"), ("三拼", "真音"), ("三拼", "假音")]
GAME5_FIRST_ID = 145  # 沿用舊資料的編號 5-145 起

TIP_CLASS = "1"  # client/src/games/gameConfig.js 的 TIP_CLASS

problems = []


def problem(game_id, message):
    problems.append(f"{game_id}: {message}")


def clean(value):
    """去掉前後空白、tab 和全形空白；數字欄位 (Excel 會讀成 1.0) 轉成整數字串"""
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return re.sub(r"[\s　]+", "", str(value))


def cell(value):
    return json.dumps(value, ensure_ascii=False) if isinstance(value, list) else value


# ---- 注音 → 音檔名稱 (與 client/src/games/bopomofoForest/zhuyin.js 相同) ----
SPELL = {c: f"{i:02d}" for i, c in enumerate("ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ", start=1)}
SPELL["一"] = SPELL["ㄧ"]
TONE = {"ˊ": "02", "ˇ": "03", "ˋ": "04"}


def zhuyin_code(text):
    code = ""
    for ch in text:
        if ch in SPELL:
            code += SPELL[ch] + "_"
        elif ch in TONE:
            return code + TONE[ch]
    return code + "01"


def check_zhuyin_audio(game_id, text):
    if not os.path.exists(os.path.join(AUDIO, "game3", zhuyin_code(text) + ".mp3")):
        problem(game_id, f"沒有「{text}」的音檔 game3/{zhuyin_code(text)}.mp3")


# ---- 遊戲 1 噪音峽谷：Word，每題三段 = 「題號 + 正確句子」、選字第一行、選字第二行 ----
def game1(folder):
    paras = [clean(p.text) for p in docx.Document(os.path.join(folder, "modeule1.docx")).paragraphs]
    paras = [p for p in paras if p and p != "正確與干擾句"]
    rows = []
    for i in range(0, len(paras) - 2, 3):
        m = re.match(r"^(\d+)(.+)$", paras[i])
        if not m:
            problem(f"1-? (第 {i + 1} 段)", f"開頭不是題號：{paras[i]}")
            continue
        game_id, ans, grid = f"1-{m.group(1)}", m.group(2), paras[i + 1] + paras[i + 2]
        if len(grid) != 20:
            problem(game_id, f"選字應該是 20 個字，實際 {len(grid)} 個：{grid}")
        missing = [ch for ch in ans if ch not in grid]
        if missing:
            problem(game_id, f"答案的字不在選字裡：{''.join(missing)}")
        if not os.path.exists(os.path.join(AUDIO, "game1", f"{game_id}.wav")):
            problem(game_id, f"沒有音檔 game1/{game_id}.wav")
        rows.append([game_id, grid, ans, game_id])
    return rows


# ---- 遊戲 2 音速競技場：Excel，只有填了「題號」的列才是題目 ----
def game2(folder):
    ws = openpyxl.load_workbook(os.path.join(folder, "modeule2.xlsx"), data_only=True).worksheets[0]
    header = [clean(c) for c in next(ws.iter_rows(min_row=1, max_row=1, values_only=True))]
    col = {name: header.index(name) for name in ("1(正確解答)", "2(混淆答案)", "題號")}
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        number = clean(r[col["題號"]])
        if not number:
            continue
        game_id, ans, confusing = f"2-{number}", clean(r[col["1(正確解答)"]]), clean(r[col["2(混淆答案)"]])
        if not ans or not confusing:
            problem(game_id, "缺少正確解答或混淆答案")
        for part in (1, 2):
            if not os.path.exists(os.path.join(AUDIO, "game2", f"{game_id}-{part}.wav")):
                problem(game_id, f"沒有音檔 game2/{game_id}-{part}.wav")
        rows.append([game_id, confusing, ans, game_id])
    return rows


def sheet_rows(wb, name):
    return [r for r in wb[name].iter_rows(min_row=2, values_only=True) if any(clean(c) for c in r)]


# ---- 遊戲 3 ㄅㄅ森林前段：「ORA TA」工作表，ORA 二選一、TA 三選一 ----
def game3(wb):
    rows = []
    for r in sheet_rows(wb, "ORA TA"):
        ora_no, ora_ans, ora_wrong, _, ta_no, ta_ans, ta_wrong1, ta_wrong2 = (clean(c) for c in r[:8])
        game_id = f"3-{ora_no}"
        if ora_no != ta_no:
            problem(game_id, f"ORA 題號 {ora_no} 和 TA 題號 {ta_no} 不一致")
        if not all([ora_ans, ora_wrong, ta_ans, ta_wrong1, ta_wrong2]):
            problem(game_id, "有空白的選項")
        for z in (ora_ans, ta_ans):
            check_zhuyin_audio(game_id, z)
        # 正確答案放在每組的第一個 (遊戲會自己打亂按鈕順序)
        rows.append([game_id, [[ora_ans, ora_wrong], [ta_ans, ta_wrong1, ta_wrong2]], [ora_ans, ta_ans], game_id])
    return rows


# ---- 遊戲 5 ㄅㄅ森林後段：「雙拼」「三拼」兩張工作表的同一列合成一題，共 4 組 (難度 0-3) ----
def game5(wb):
    # 每張工作表：真音 (題號, 答案, 干擾一, 干擾二)、空欄、假音 (題號, 答案, 干擾一, 干擾二)
    def groups(name):
        out = []
        for r in sheet_rows(wb, name):
            c = [clean(x) for x in r[:9]]
            out.append({"no": c[0], "真音": c[1:4], "假音": c[6:9], "假音題號": c[5]})
        return out

    sheets = {name: groups(name) for name in ("雙拼", "三拼")}
    if len(sheets["雙拼"]) != len(sheets["三拼"]):
        problem("5-*", f"雙拼 {len(sheets['雙拼'])} 列、三拼 {len(sheets['三拼'])} 列，數量不一致")
    rows = []
    for i in range(min(len(sheets["雙拼"]), len(sheets["三拼"]))):
        game_id = f"5-{GAME5_FIRST_ID + i}"
        options = []
        for sheet, kind in GAME5_GROUPS:
            row = sheets[sheet][i]
            if row["no"] != str(i + 1) or row["假音題號"] != str(i + 1):
                problem(game_id, f"{sheet} 第 {i + 1} 列的題號是 {row['no']} / {row['假音題號']}")
            group = row[kind]
            if not all(group):
                problem(game_id, f"{sheet}{kind} 有空白的選項：{group}")
            check_zhuyin_audio(game_id, group[0])
            options.append(group)
        rows.append([game_id, options, [g[0] for g in options], game_id])
    return rows


# ---- 溝通小訣竅：Word，「題號.內容」，中間夾著署名行 (例如 Lace) ----
def tips(folder):
    rows = []
    for p in docx.Document(os.path.join(folder, "Communication skills tips.docx")).paragraphs:
        m = re.match(r"^\s*(\d+)\s*[.．、]\s*(.+?)\s*$", p.text)
        if m:
            index = m.group(1)
            if not os.path.exists(os.path.join(AUDIO, "tips", f"{index}.wav")):
                problem(f"tip {index}", f"沒有語音 tips/{index}.wav")
            rows.append([index, TIP_CLASS, m.group(2)])
    return rows


def write_tsv(path, rows):
    with open(path, "w", encoding="utf-8", newline="") as f:
        for row in rows:
            f.write("\t".join(str(cell(v)).replace("\t", " ") for v in row) + "\n")


def main(folder, out_dir):
    wb3 = openpyxl.load_workbook(os.path.join(folder, "modeule3.xlsx"), data_only=True)
    by_game = {"1": game1(folder), "2": game2(folder), "3": game3(wb3), "5": game5(wb3)}
    tip_rows = tips(folder)

    os.makedirs(out_dir, exist_ok=True)
    write_tsv(os.path.join(out_dir, "questions.tsv"), [r for rows in by_game.values() for r in rows])
    write_tsv(os.path.join(out_dir, "tips.tsv"), tip_rows)

    for game, rows in by_game.items():
        ids = [r[0] for r in rows]
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        if dupes:
            problems.append(f"遊戲 {game}: 重複的 gameId {', '.join(dupes)}")
        print(f"遊戲 {game}: {len(rows)} 題 ({ids[0]} ~ {ids[-1]})" if rows else f"遊戲 {game}: 0 題")
    print(f"小訣竅: {len(tip_rows)} 則")
    print(f"\n檢查到 {len(problems)} 個問題" + ("：" if problems else ""))
    for p in problems:
        print("  -", p)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python -I scripts/data-prep/convert_banks.py <題庫資料夾> <輸出資料夾>")
    main(sys.argv[1], sys.argv[2])
