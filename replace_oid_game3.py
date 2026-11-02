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
            "gameId": f"3-{row['ORA']}",
            "variant": str(row['ORA']),
            "img": f"3-{row['ORA']}",
            "voice": f"3-{row['ORA']}",
            "text": [[row['ANS_ORA'],row['TEXT_ORA']],[row['ANS_TA'],row['TEXT_TA1'],row['TEXT_TA2']]],
            "ans": [row['ANS_ORA'], row['ANS_TA']]
        }
        json_list.append(json_obj)

    return json_list

# 使用您的 Excel 文件路径
excel_file_path = 'data3.xlsx'
json_data = convert_excel_to_json(excel_file_path)

# 将 JSON 数据写入文件
with open('output3.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=4)
