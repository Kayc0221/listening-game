from docx import Document
import csv
import json
import re
from bson import ObjectId


# 讀取Word文檔
doc = Document('D:\\LS_Game\\data\\module1_sppech_in_noise\\game_data.docx')

# 初始變量
paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip() != '']
# 移除數字和\t
clean_paragraphs = [re.sub(r'^\d+\t*', '', p) for p in paragraphs]
ans = ""
text = ""
gameId_prefix = "1"
variant = 1
data_list = []


# 打印移除空白後的段落
for i, paragraph in enumerate(clean_paragraphs):
    print(f"Paragraph {i+1}: {paragraph}")

# 遍歷段落，每3個段落為一組
for i in range(0, len(clean_paragraphs), 3):
    ans = clean_paragraphs[i].split(" ", 1)[-1]
    text = clean_paragraphs[i + 1] + clean_paragraphs[i + 2]
    gameId = f"{gameId_prefix}-{variant}"
    variant += 1

    data = {
        "_id": str(ObjectId()),
        "gameId": gameId,
        "variant": str(gameId.split('-')[1]),
        "img": gameId,
        "voice": gameId,
        "text": text,
        "ans": ans
    }
    data_list.append(data)

# 寫入CSV
keys = data_list[0].keys()
with open('game_data.csv', 'w', newline='', encoding='utf-8') as output_file:
    dict_writer = csv.DictWriter(output_file, fieldnames=keys)
    dict_writer.writeheader()
    dict_writer.writerows(data_list)

# 寫入JSON
with open('game_data.json', 'w', encoding='utf-8') as json_file:
    json.dump(data_list, json_file, ensure_ascii=False, indent=4)
