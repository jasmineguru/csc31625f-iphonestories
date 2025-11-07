import pandas as pd
import json
import os

# we converted 2021 xlxs file to csv with online converter
# now convert that into a json
# and then we'll parse the json to get our data


INPUT_CSV = "data/neighbourhood-profiles-2021-158-model.csv"
OUTPUT_JSON = "target_data/csv_to_json.json"
os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

print("📘 Loading CSV data...")
df = pd.read_csv(INPUT_CSV, header=0)
print(f"✅ Raw shape: {df.shape}")


print("🔹 First few entries in first column:")
print(df.iloc[:10, 0].to_list())

# first column = attributes
attr_col = df.columns[0]
print(f"🧩 Treating '{attr_col}' as the Attribute column.")

# transpose so neighbourhoods become rows
df_t = df.set_index(attr_col).T.reset_index()

# renaming columns 
df_t = df_t.rename(columns={"index": "Neighbourhood Name"})
print(f"✅ Transposed shape: {df_t.shape}")
print(f"✅ Columns after transposing: {df_t.columns.tolist()[:10]}...")

# drop metadata rows if they exist
drop_rows = ["Neighbourhood Number", "TSNS 2020 Designation"]
df_t = df_t[~df_t["Neighbourhood Name"].isin(drop_rows)].copy()

# rebud json structure: neighbourhood → attribute:value
data_json = {}
for _, row in df_t.iterrows():
    name = row["Neighbourhood Name"]
    attributes = row.drop("Neighbourhood Name").to_dict()
    data_json[name] = attributes

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(data_json, f, ensure_ascii=False, indent=2)

print(f"succcesss! saved to {OUTPUT_JSON}")
print(f"extracted {len(data_json)} neighbourhoods")
