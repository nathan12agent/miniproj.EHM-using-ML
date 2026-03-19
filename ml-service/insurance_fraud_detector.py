#!/usr/bin/env python3
"""
Insurance Fraud Detection Module
Uses XGBoost classifier to detect fraudulent insurance claims
Singleton pattern mirrors get_staff_assigner() in staff_assignment.py
"""

import numpy as np
import os
import pickle
from datetime import datetime

# Global singleton
_fraud_detector = None

def get_fraud_detector():
    """Get or create fraud detector instance"""
    global _fraud_detector
    if _fraud_detector is None:
        _fraud_detector = InsuranceFraudDetector()
    return _fraud_detector


class InsuranceFraudDetector:
    FEATURES = [
        'claimAmount',
        'amountVsBenchmark',
        'claimsLast90Days',
        'daysSinceLastClaim',
        'isDuplicate',
        'policyAgeDays',
        'patientAge',
        'coverageUsedPct',
        'diagnosisRiskScore'
    ]

    DIAGNOSIS_BENCHMARKS = {
        'D001': 5000,  'D002': 8000,  'D003': 12000, 'D004': 3000,
        'D005': 15000, 'D006': 6000,  'D007': 9000,  'D008': 4000,
        'D009': 20000, 'D010': 7000,  'DEFAULT': 6000
    }

    DIAGNOSIS_RISK = {
        'D001': 0.2, 'D002': 0.3, 'D003': 0.5, 'D004': 0.1,
        'D005': 0.7, 'D006': 0.2, 'D007': 0.4, 'D008': 0.1,
        'D009': 0.8, 'D010': 0.3, 'DEFAULT': 0.3
    }

    def __init__(self):
        self.model = None
        self.accuracy = 0.0
        self.fraud_rate = 0.0
        self.trained_on = 0
        self._load_or_train()

    def _load_or_train(self):
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'fraud_detector.pkl')
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        if os.path.exists(model_path):
            try:
                with open(model_path, 'rb') as f:
                    data = pickle.load(f)
                self.model = data['model']
                self.accuracy = data['accuracy']
                self.fraud_rate = data['fraud_rate']
                self.trained_on = data['trained_on']
                print("✅ Fraud detector model loaded from disk")
                return
            except Exception as e:
                print(f"⚠️  Could not load fraud model: {e}")
        self._train(model_path)

    def _generate_training_data(self, n=2000):
        try:
            from faker import Faker
        except ImportError:
            Faker = None

        rng = np.random.default_rng(42)
        n_diag = len(self.DIAGNOSIS_BENCHMARKS) - 1  # exclude DEFAULT

        claim_amounts = rng.exponential(scale=8000, size=n).clip(500, 100000)
        benchmarks = rng.choice(list(self.DIAGNOSIS_BENCHMARKS.values())[:-1], size=n)
        amount_vs_benchmark = claim_amounts / benchmarks
        claims_last_90 = rng.integers(0, 8, size=n)
        days_since_last = rng.integers(0, 365, size=n).astype(float)
        days_since_last[claims_last_90 == 0] = 999
        is_duplicate = rng.binomial(1, 0.05, size=n)
        policy_age_days = rng.integers(0, 1825, size=n)
        patient_age = rng.integers(18, 85, size=n).astype(float)
        coverage_used_pct = rng.uniform(0, 1, size=n)
        diag_risk = rng.choice(list(self.DIAGNOSIS_RISK.values())[:-1], size=n)

        # Label: fraud if any strong indicator
        labels = (
            (amount_vs_benchmark > 2.0) |
            (claims_last_90 > 3) |
            (is_duplicate == 1) |
            (policy_age_days < 30)
        ).astype(int)

        X = np.column_stack([
            claim_amounts, amount_vs_benchmark, claims_last_90,
            days_since_last, is_duplicate, policy_age_days,
            patient_age, coverage_used_pct, diag_risk
        ])
        return X, labels

    def _train(self, model_path=None):
        try:
            from xgboost import XGBClassifier
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import accuracy_score
        except ImportError as e:
            print(f"❌ Cannot train fraud detector: {e}")
            return

        print("🔄 Training insurance fraud detector...")
        X, y = self._generate_training_data(2000)
        self.trained_on = len(X)
        self.fraud_rate = float(y.mean())

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            use_label_encoder=False,
            eval_metric='logloss',
            random_state=42
        )
        self.model.fit(X_train, y_train)
        preds = self.model.predict(X_test)
        self.accuracy = float(accuracy_score(y_test, preds))
        print(f"✅ Fraud detector trained — accuracy: {self.accuracy:.2%}, fraud rate: {self.fraud_rate:.2%}")

        if model_path:
            try:
                with open(model_path, 'wb') as f:
                    pickle.dump({
                        'model': self.model,
                        'accuracy': self.accuracy,
                        'fraud_rate': self.fraud_rate,
                        'trained_on': self.trained_on
                    }, f)
            except Exception as e:
                print(f"⚠️  Could not save fraud model: {e}")

    def predict(self, features: dict) -> dict:
        """
        Predict fraud for a claim.
        features keys: claimAmount, amountVsBenchmark, claimsLast90Days,
                       daysSinceLastClaim, isDuplicate, policyAgeDays,
                       patientAge, coverageUsedPct, diagnosisRiskScore
        Returns: {fraudScore, isFraud, fraudReasons}
        """
        try:
            x = np.array([[
                float(features.get('claimAmount', 0)),
                float(features.get('amountVsBenchmark', 1.0)),
                float(features.get('claimsLast90Days', 0)),
                float(features.get('daysSinceLastClaim', 999)),
                float(features.get('isDuplicate', 0)),
                float(features.get('policyAgeDays', 365)),
                float(features.get('patientAge', 35)),
                float(features.get('coverageUsedPct', 0)),
                float(features.get('diagnosisRiskScore', 0.3))
            ]])

            if self.model is not None:
                proba = self.model.predict_proba(x)[0]
                fraud_score = float(proba[1])
            else:
                # Rule-based fallback
                fraud_score = self._rule_based_score(features)

            fraud_score = max(0.0, min(1.0, fraud_score))
            reasons = self._build_reasons(features, fraud_score)

            return {
                'fraudScore': round(fraud_score, 4),
                'isFraud': fraud_score > 0.75,
                'fraudReasons': reasons
            }
        except Exception as e:
            return {'fraudScore': 0.0, 'isFraud': False, 'fraudReasons': [f'Prediction error: {str(e)}']}

    def _rule_based_score(self, features) -> float:
        score = 0.0
        if float(features.get('amountVsBenchmark', 1)) > 2.0:
            score += 0.4
        if float(features.get('claimsLast90Days', 0)) > 3:
            score += 0.3
        if features.get('isDuplicate', 0):
            score += 0.5
        if float(features.get('policyAgeDays', 365)) < 30:
            score += 0.3
        return min(score, 1.0)

    def _build_reasons(self, features, fraud_score) -> list:
        reasons = []
        if float(features.get('amountVsBenchmark', 1)) > 2.0:
            reasons.append('Claim amount significantly exceeds diagnosis benchmark')
        if float(features.get('claimsLast90Days', 0)) > 3:
            reasons.append('Unusually high claim frequency in last 90 days')
        if features.get('isDuplicate', 0):
            reasons.append('Possible duplicate claim detected')
        if float(features.get('policyAgeDays', 365)) < 30:
            reasons.append('Policy is very new (less than 30 days old)')
        if float(features.get('coverageUsedPct', 0)) > 0.9:
            reasons.append('Coverage nearly exhausted')
        if float(features.get('diagnosisRiskScore', 0)) > 0.6:
            reasons.append('High-risk diagnosis code')
        return reasons

    def get_benchmarks(self) -> dict:
        return self.DIAGNOSIS_BENCHMARKS

    def get_model_info(self) -> dict:
        return {
            'accuracy': round(self.accuracy, 4),
            'features': self.FEATURES,
            'trainedOn': self.trained_on,
            'fraudRate': round(self.fraud_rate, 4),
            'modelType': 'XGBoost Classifier',
            'version': '1.0.0'
        }
