import pandas as pd
from bson import ObjectId
import json

def convert_excel_to_json(excel_file_path):
    # 读取 Excel 文件
    excel_data = pd.read_excel(excel_file_path)
    json_list = []

    for index, row in excel_data.iterrows():
        json_obj = {
            "_id": str(ObjectId()),
            "gameId": f"5-{index + 145}",
            "variant": str(index + 145),
            "img": f"5-{index + 145}",
            "voice": f"5-{index + 145}",
            "text": [[row['答案1'],row['干擾一1'],row['干擾二1']],
                     [row['答案2'], row['干擾一2'], row['干擾二2']],
                     [row['答案3'], row['干擾一3'], row['干擾二3']],
                     [row['答案4'], row['干擾一4'], row['干擾二4']]],
            "ans": [row['答案1'], row['答案2'], row['答案3'], row['答案4']]
        }
        json_list.append(json_obj)

    return json_list

# 使用您的 Excel 文件路径
excel_file_path = 'data3.xlsx'
json_data = convert_excel_to_json(excel_file_path)

# 将 JSON 数据写入文件
with open('output5-2.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=4)
