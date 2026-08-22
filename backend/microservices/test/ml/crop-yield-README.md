# crop-yield-model

Standalone module to train + serve a **Crop Yield prediction model** (regression) from
`crop_yield_dataset.csv`. Built to slot straight into your `Krishi-Setu-SIH` repo.

## Folder structure

```
crop-yield-model/
├── data/
│   └── crop_yield_dataset.csv      # raw dataset (36,520 rows, 10 crops, 5 soil types)
├── scripts/
│   └── train_model.py              # training pipeline (run this to (re)train)
├── models/                         # generated after training
│   ├── xgb_crop_model.joblib       # trained XGBRegressor
│   ├── label_encoder.joblib        # dict of {col: LabelEncoder} for Crop_Type, Soil_Type
│   ├── metrics.json                # MAE / RMSE / R2 on held-out test set
│   └── feature_columns.json        # exact feature order the model expects
├── test/
│   └── test_predict.py             # sanity-check inference script
└── notebooks/                      # empty — for your crop-prediction.ipynb style EDA
```

## Where this fits in your repo

Your screenshot shows `backend/microservices/models/` already has
`label_encoder.joblib` + `xgb_crop_model.joblib` (likely a crop *recommendation*
classifier). This module produces a **yield regression** model with the same
artifact names, so you have two options:

1. **Separate service** — keep this as `backend/microservices/yield-model/` next
   to your existing `models/` folder (recommended, since it's a different task:
   yield regression vs. crop recommendation).
2. **Replace/extend** — if `xgb_crop_model.joblib` was meant to be this exact
   yield model, just copy `models/*.joblib` over the existing ones.

Also copy `crop-prediction.ipynb` style — drop `notebooks/` content in there for EDA,
and `test_predict.py` into your existing `test/ml/` folder alongside `test.ipynb`.

## Run training

```bash
cd crop-yield-model
pip install pandas scikit-learn xgboost joblib
python scripts/train_model.py --data data/crop_yield_dataset.csv --out models/
```

## Current results (baseline run)

| Metric | Value |
|--------|-------|
| MAE    | 2.43  |
| RMSE   | 3.91  |
| R²     | 0.977 |

## Features used

`Crop_Type`, `Soil_Type` (label-encoded), `Soil_pH`, `Temperature`, `Humidity`,
`Wind_Speed`, `N`, `P`, `K`, `Soil_Quality`, `Month` (derived from `Date`).
Target: `Crop_Yield`.

## Next steps / ideas

- Try per-crop models if yield ranges vary a lot by crop (many `Crop_Yield=0`
  rows suggest off-season entries — worth checking if that's real or noise).
- Add cross-validation + hyperparameter search (`RandomizedSearchCV`/Optuna).
- Wrap `models/*.joblib` in a small FastAPI/Flask endpoint under
  `backend/microservices/` to serve predictions to your `frontend/`.
- Feature importance / SHAP to explain predictions to farmers in the UI.
