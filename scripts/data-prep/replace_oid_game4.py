import pandas as pd
from bson import ObjectId
import json

def convert_excel_to_json(excel_file_path):
    # 读取 Excel 文件
    excel_data = pd.read_excel(excel_file_path)
    json_list = []

    for index, row in excel_data.iterrows():
        # 合併成一個連續的字符串
        combined_text_1 = f"{row['ANS1']}{row['Fake1-1']}{row['Fake1-2']}" \
                         f"{row['ANS2']}{row['Fake2-1']}{row['Fake2-2']}" \
                         f"{row['ANS3']}{row['Fake3-1']}{row['Fake3-2']}"
        combined_ANS = f"{row['ANS1']}{row['ANS2']}{row['ANS3']}"
        combined_Target = f"{row['Target1']}{row['Target2']}{row['Target3']}"

        json_obj = {
            "_id": str(ObjectId()),
            "gameId": f"4-{row['題號']}",
            "variant": str(row['題號']),
            "img": f"4-{row['題號']}",
            "voice": f"4-{row['題號']}",
            "text": [combined_text_1, row['題目全文']],
            "ans": [combined_Target, combined_ANS]
        }
        json_list.append(json_obj)

    return json_list

# 使用您的 Excel 文件路径
excel_file_path = 'data4.xlsx'
json_data = convert_excel_to_json(excel_file_path)

# 将 JSON 数据写入文件
with open('output2.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=4)
