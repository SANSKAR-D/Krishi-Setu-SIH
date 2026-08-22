import pandas as pd

crops = pd.read_csv("crops_planner.csv")
mandi = pd.read_csv("mandi_prices.csv")

merged = pd.merge(mandi, crops, left_on="crop_slug", right_on="slug")
merged.to_csv("combined_data.csv", index=False,encoding="utf-8")