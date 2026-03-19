#!/usr/bin/env python3
"""
Insurance Fraud Detection — Rule-based in-memory detector.
Benchmarks are keyed by diagnosisName (string), not code.
"""

from datetime import datetime, timedelta
from collections import defaultdict

_detector = None

def get_fraud_detector():
    global _detector
    if _detector is None:
        _detector = InsuranceFraudDetector()
    return _detector


class InsuranceFraudDetector:
    BENCHMARKS = {
        'Hypertension': 15000,
        'Migraine': 8000,
        'Diabetes Type 2': 12000,
        'Appendicitis': 45000,
        'Fracture - Left Tibia': 35000,
        'Chest Pain': 25000,
        'Fever and Cough': 5000,
        'Arthritis': 10000,
    }
    DEFAULT_BENCHMARK = 20000

    def __init__(self):
        # in-memory store: patientId -> list of {timestamp, policyNumber}
        self._claims_store = defaultdict(list)

    def predict(self, claimAmount, diagnosisCode, patientId, policyNumber):
        """
        diagnosisCode here is actually the diagnosisName string from the request.
        Returns {fraudScore, isFraud, reasons}
        """
        fraud_score = 0.0
        reasons = []
        now = datetime.utcnow()

        # Rule 1: amount vs benchmark
        benchmark = self.BENCHMARKS.get(diagnosisCode, self.DEFAULT_BENCHMARK)
        ratio = claimAmount / benchmark
        if ratio > 3.0:
            fraud_score += 0.5
            reasons.append('Claim is 3x above average for this diagnosis')
        elif ratio > 2.0:
            fraud_score += 0.3
            reasons.append('Claim is significantly above average')

        # Rule 2: recent claims by this patient
        patient_claims = self._claims_store[patientId]
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        recent_7 = [c for c in patient_claims if c['ts'] >= seven_days_ago]
        recent_30 = [c for c in patient_claims if c['ts'] >= thirty_days_ago]
        if recent_7:
            fraud_score += 0.35
            reasons.append('Multiple claims within 7 days')
        elif recent_30:
            fraud_score += 0.15
            reasons.append('Recent claim already submitted')

        # Rule 3: policy frequency
        all_policy_claims = []
        for claims in self._claims_store.values():
            all_policy_claims.extend([c for c in claims if c['policy'] == policyNumber])
        if len(all_policy_claims) > 3:
            fraud_score += 0.2
            reasons.append('Unusually high claim frequency on this policy')

        fraud_score = min(round(fraud_score, 2), 1.0)

        # Store this attempt
        self._claims_store[patientId].append({'ts': now, 'policy': policyNumber})

        return {
            'fraudScore': fraud_score,
            'isFraud': fraud_score > 0.75,
            'reasons': reasons
        }

    def get_benchmarks(self):
        return self.BENCHMARKS
