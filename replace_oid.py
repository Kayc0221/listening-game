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
            "gameId": f"2-{row['題號']}",
            "variant": str(row['題號']),
            "img": f"2-{row['題號']}",
            "voice": f"2-{row['題號']}",
            "text": row['2(混淆答案)'],
            "ans": row['1(正確解答)']
        }
        json_list.append(json_obj)

    return json_list

# 使用您的 Excel 文件路径
excel_file_path = 'data2.xlsx'
json_data = convert_excel_to_json(excel_file_path)

# 将 JSON 数据写入文件
with open('output.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=4)
