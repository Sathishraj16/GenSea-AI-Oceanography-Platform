import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor


def load_ocean_data() -> pd.DataFrame:
    """Load the ocean_data.csv that lives next to this script, robustly.

    Resolves the path relative to this file so it works no matter the CWD.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "ocean_data.csv")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"ocean_data.csv not found at {csv_path}. Ensure the file is in ML_Modal/."
        )

    # low_memory=False avoids dtype inference warnings on large, mixed-type CSVs
    # encoding errors are ignored gracefully for wider compatibility
    return pd.read_csv(csv_path, low_memory=False, encoding_errors="ignore")


if __name__ == "__main__":
    df = load_ocean_data()

    # Quick peek
    print(df.head())
    print(df.columns.tolist())
    # df.info() prints summary and returns None; call without wrapping in print()
    df.info()
    # Define required columns
    feature_columns = ['ist', 'sob', 'mlotst', 'siage', 'usi', 'vsi']
    target_column = 'sithick'  # could also try 'siconc'

    missing = [c for c in feature_columns + [target_column] if c not in df.columns]
    if missing:
        raise KeyError(
            f"Missing required column(s): {missing}. Available columns: {list(df.columns)}"
        )

    # Coerce to numeric in case of mixed types/strings
    for col in feature_columns + [target_column]:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Build X, y and drop rows with NaNs only for those columns
    X = df[feature_columns]
    y = df[target_column]
    valid = X.notna().all(axis=1) & y.notna()
    X = X[valid]
    y = y[valid]

    if len(X) < 10:
        raise ValueError(
            f"Not enough valid rows to train (have {len(X)} after cleaning)."
        )

    # Use float32 to reduce memory footprint
    X = X.astype('float32')
    y = y.astype('float32')

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Cap training sample size to avoid high memory; subsample if very large
    max_train_samples = 80000
    if len(X_train) > max_train_samples:
        X_train = X_train.sample(n=max_train_samples, random_state=42)
        y_train = y.loc[X_train.index]

    # Train RF with conservative settings to avoid MemoryError
    # - fewer trees
    # - limited depth
    # - single-threaded to limit parallel memory duplication
    # - subsample per-tree via bootstrap max_samples
    per_tree_samples = min(50000, len(X_train))
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        n_jobs=1,
        bootstrap=True,
        max_samples=per_tree_samples if per_tree_samples > 0 else None,
    )
    model.fit(X_train, y_train)

    r2 = model.score(X_test, y_test)
    print("R² Score:", r2)

    # Add predictions + risk on the cleaned subset only
    preds = model.predict(X)
    pred_col = pd.Series(index=df.index, dtype=float)
    pred_col.loc[X.index] = preds
    df['pred_sithick'] = pred_col

    drop_threshold_m = 0.2  # meters
    risk_col = pd.Series(index=df.index, dtype=bool)
    risk_col.loc[X.index] = (y - preds) < (-drop_threshold_m)
    df['risk'] = risk_col.fillna(False)

    # Optional: write quick output sample
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'early_warning_preview.csv')
    df[['pred_sithick', 'risk']].join(df[feature_columns + [target_column]]).head(1000).to_csv(out_path, index=False)
    print(f"Wrote preview with predictions to: {out_path}")