# Requirements Document

## Introduction

This document defines the requirements for the Payment (Razorpay Test Mode) + Insurance Fraud Detection feature of the Hospital Management System. The feature adds Razorpay test-mode payment processing, insurance policy and claim management, XGBoost-based ML fraud detection, and role-guarded admin/doctor workflows across the React frontend, Node.js/Express backend, and Python Flask ML service.

## Glossary

- **System**: The Hospital Management System spanning all three tiers (React, Express, Flask)
- **Backend**: The Node.js/Express API server running on port 5000
- **ML_Service**: The Python Flask service running on port 5001
- **Frontend**: The React + Material UI + Redux application running on port 3000
- **FraudDetector**: The `InsuranceFraudDetector` XGBoost classifier in the ML_Service
- **PaymentService**: The Razorpay-integrated payment module in the Backend
- **InsuranceService**: The insurance policy and claim management module in the Backend
- **Claim**: An insurance claim document stored in MongoDB with fraud score and status
- **InsurancePolicy**: A patient insurance policy document with coverage limits and usage tracking
- **Payment**: A payment transaction document linked to a Razorpay order lifecycle
- **Receipt**: A printable payment confirmation with a unique receipt number
- **Admin**: A user with JWT role `admin`
- **Doctor**: A user with JWT role `doctor`
- **FraudScore**: A float in [0.0, 1.0] produced by the FraudDetector representing fraud probability
- **AuthMiddleware**: The JWT verification middleware applied to all protected routes

---

## Requirements

### Requirement 1: Razorpay Order Creation

**User Story:** As a patient, I want to initiate a payment for my bill, so that I can pay my hospital liability online using Razorpay test mode.

#### Acceptance Criteria

1. WHEN a request is made to `POST /api/payment/create-order` with a valid JWT and a positive `amount` in paise, THE PaymentService SHALL create a Razorpay order via the Razorpay SDK and return `{ orderId, keyId, amount, currency }`.
2. WHEN a Razorpay order is successfully created, THE PaymentService SHALL persist a Payment document with `status = 'pending'` and the `razorpayOrderId` before responding.
3. IF `req.body.amount` is missing or not a positive integer, THEN THE PaymentService SHALL return HTTP 400 with a validation error message.
4. IF the Razorpay API call fails, THEN THE PaymentService SHALL return HTTP 500 with an error message and SHALL NOT persist a Payment document.
5. THE PaymentService SHALL never include `RAZORPAY_KEY_SECRET` in any response sent to the Frontend.

---

### Requirement 2: Razorpay Payment Verification

**User Story:** As a patient, I want my payment to be verified and my bill marked as paid, so that I have a confirmed receipt after completing the Razorpay checkout.

#### Acceptance Criteria

1. WHEN a request is made to `POST /api/payment/verify` with `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`, THE PaymentService SHALL compute an HMAC-SHA256 signature over `"razorpayOrderId|razorpayPaymentId"` using `RAZORPAY_KEY_SECRET` and compare it to `razorpaySignature` using a timing-safe comparison.
2. WHEN the signature is valid, THE PaymentService SHALL update the Payment document to `status = 'completed'`, store `razorpayPaymentId`, generate a unique `receiptNumber`, and return `{ success: true, receiptNumber }`.
3. WHEN the signature is valid, THE PaymentService SHALL update the linked Bill document's `paymentStatus` to `'Paid'`.
4. IF the signature is invalid, THEN THE PaymentService SHALL update the Payment document to `status = 'failed'` and return HTTP 400 with `{ message: 'Payment verification failed' }`.
5. IF `POST /api/payment/verify` is called with a `razorpayOrderId` whose Payment document already has `status = 'completed'`, THEN THE PaymentService SHALL return HTTP 409 with `{ message: 'Payment already processed' }` and SHALL NOT create a duplicate payment record.
6. THE PaymentService SHALL use `crypto.timingSafeEqual` for signature comparison to prevent timing attacks.

---

### Requirement 3: Payment History and Receipt

**User Story:** As a patient, I want to view my payment history and print receipts, so that I have a record of all transactions.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/payment/history` with a valid JWT, THE PaymentService SHALL return all Payment documents associated with the authenticated patient, including `receiptNumber`, `amountPaid`, `status`, and `paymentMethod`.
2. WHEN a request is made to `GET /api/payment/receipt/:paymentId` with a valid JWT, THE PaymentService SHALL return the full Payment document including `billAmount`, `insuranceCovered`, `patientLiability`, `amountPaid`, and `receiptNumber`.
3. THE PaymentService SHALL ensure every completed Payment has a unique `receiptNumber` following the `RCP000001` auto-increment pattern.
4. THE PaymentService SHALL calculate `patientLiability = billAmount - insuranceCovered` for every Payment document.

---

### Requirement 4: Insurance Policy Management

**User Story:** As a doctor, I want to look up a patient's active insurance policy before submitting a claim, so that I can verify coverage before proceeding.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/insurance/policy/:patientId` with a valid JWT, THE InsuranceService SHALL return the active InsurancePolicy for that patient including `coverageAmount`, `usedAmount`, `expiryDate`, `coverageType`, and `coveredDiagnoses`.
2. THE InsuranceService SHALL enforce that `usedAmount <= coverageAmount` at all times across any sequence of claim approvals.
3. THE InsuranceService SHALL store InsurancePolicy documents with auto-generated `policyId` following the `POL000001` pattern.
4. IF an InsurancePolicy's `expiryDate` is in the past, THEN THE InsuranceService SHALL return `status = 'expired'` for that policy.

---

### Requirement 5: Insurance Claim Submission with Fraud Detection

**User Story:** As a doctor, I want to submit an insurance claim that is automatically scored for fraud, so that suspicious claims are flagged before admin review.

#### Acceptance Criteria

1. WHEN a Doctor sends `POST /api/insurance/claim/submit` with a valid JWT and claim data, THE InsuranceService SHALL look up the referenced InsurancePolicy and validate it is active and not expired before proceeding.
2. IF the referenced InsurancePolicy does not exist or has `status != 'active'`, THEN THE InsuranceService SHALL return HTTP 400 with `{ message: 'Policy not found or inactive' }`.
3. IF `policy.expiryDate < Date.now()` at submission time, THEN THE InsuranceService SHALL return HTTP 400 with `{ message: 'Insurance policy has expired' }`.
4. IF `claimAmount + policy.usedAmount > policy.coverageAmount`, THEN THE InsuranceService SHALL return HTTP 400 with `{ message: 'Claim amount exceeds remaining coverage' }`.
5. WHEN policy validation passes, THE InsuranceService SHALL call `POST /insurance/fraud_detect` on the ML_Service with the 9 required feature fields and receive `{ fraudScore, fraudReasons }`.
6. WHEN the ML_Service returns a `fraudScore > 0.75`, THE InsuranceService SHALL persist the Claim with `status = 'flagged'`.
7. WHEN the ML_Service returns a `fraudScore <= 0.75`, THE InsuranceService SHALL persist the Claim with `status = 'pending'`.
8. IF the ML_Service is unreachable, THEN THE InsuranceService SHALL persist the Claim with `fraudScore = -1` and `status = 'pending'` and SHALL NOT block claim submission.
9. WHEN a Claim is persisted, THE InsuranceService SHALL return `{ claim, fraudScore, fraudReasons }` to the caller.
10. THE InsuranceService SHALL store Claim documents with auto-generated `claimId` following the `CLM000001` pattern.
11. THE InsuranceService SHALL NOT update `policy.usedAmount` at claim submission time; it SHALL only be updated on admin approval.

---

### Requirement 6: ML Fraud Detection Service

**User Story:** As the system, I want an ML service to score insurance claims for fraud probability, so that suspicious claims can be automatically identified.

#### Acceptance Criteria

1. WHEN `POST /insurance/fraud_detect` is called with a feature dict containing `claimAmount`, `diagnosisCode`, `daysSinceLastClaim`, `claimsLast90Days`, `amountVsBenchmark`, `isDuplicate`, `policyAgeDays`, `providerClaimRate`, and `patientAge`, THE FraudDetector SHALL return `{ fraudScore, fraudReasons, isFraud }`.
2. THE FraudDetector SHALL return a `fraudScore` that is always in the range [0.0, 1.0] for any valid numeric feature input.
3. THE FraudDetector SHALL set `isFraud = true` if and only if `fraudScore > 0.75`.
4. WHEN `amountVsBenchmark > 2.0`, THE FraudDetector SHALL include `"high_amount"` in `fraudReasons`.
5. WHEN `claimsLast90Days > 3`, THE FraudDetector SHALL include `"frequent_claims"` in `fraudReasons`.
6. WHEN `isDuplicate = true`, THE FraudDetector SHALL include `"duplicate_claim"` in `fraudReasons`.
7. WHEN `policyAgeDays < 30`, THE FraudDetector SHALL include `"new_policy"` in `fraudReasons`.
8. WHEN `providerClaimRate > 0.8`, THE FraudDetector SHALL include `"high_provider_frequency"` in `fraudReasons`.
9. THE FraudDetector SHALL load the XGBoost model once at Flask startup as a singleton and SHALL NOT reload it on each request.
10. WHEN `GET /insurance/model_info` is called, THE ML_Service SHALL return `{ accuracy, features, trainedOn, fraudRate }`.
11. WHEN `GET /insurance/benchmarks` is called, THE ML_Service SHALL return a dict mapping `diagnosisCode` to average benchmark amount.

---

### Requirement 7: Admin Claim Review Dashboard

**User Story:** As an admin, I want to review all insurance claims with their fraud scores and approve or reject them, so that I can manage insurance payouts with full visibility into fraud risk.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/insurance/claims` with a valid Admin JWT, THE InsuranceService SHALL return all Claim documents populated with patient, doctor, and policy references, including `fraudScore` and `fraudReasons`.
2. WHEN a request is made to `GET /api/insurance/claims` with a non-Admin JWT, THE AuthMiddleware SHALL return HTTP 403.
3. WHEN an Admin sends `PATCH /api/insurance/claims/:claimId/review` with `{ status: 'approved', approvedAmount }`, THE InsuranceService SHALL update the Claim's `status`, `approvedAmount`, `reviewedBy`, and `reviewedAt` fields.
4. WHEN a Claim is approved, THE InsuranceService SHALL increment `InsurancePolicy.usedAmount` by `approvedAmount`.
5. WHEN an Admin sends `PATCH /api/insurance/claims/:claimId/review` with `{ status: 'rejected' }`, THE InsuranceService SHALL update the Claim's `status` to `'rejected'` and SHALL NOT modify `InsurancePolicy.usedAmount`.
6. IF the requesting user's JWT role is not `'admin'`, THEN THE AuthMiddleware SHALL return HTTP 403 for `PATCH /api/insurance/claims/:claimId/review`.
7. IF the Claim does not exist or is not in `'pending'` or `'flagged'` state, THEN THE InsuranceService SHALL return HTTP 400.
8. IF `status = 'approved'` and `approvedAmount` is missing or not positive, THEN THE InsuranceService SHALL return HTTP 400.
9. THE InsuranceService SHALL support paginated results for `GET /api/insurance/claims` with a default page size of 20.

---

### Requirement 8: Doctor Real-Time Fraud Pre-Check

**User Story:** As a doctor, I want to see a live fraud score while filling out a claim form, so that I can adjust the claim before submitting it.

#### Acceptance Criteria

1. WHEN a Doctor changes `claimAmount` or `diagnosisCode` in the SubmitClaimForm, THE Frontend SHALL call `POST /insurance/fraud_detect` on the ML_Service and display the returned `fraudScore` as a badge.
2. WHILE `fraudScore > 0.75` in the SubmitClaimForm, THE Frontend SHALL disable the submit button and display a warning to the Doctor.
3. THE Frontend SHALL treat the pre-check result as UX-only and SHALL NOT use it as the authoritative fraud determination; the Backend SHALL perform the authoritative fraud check on submission.

---

### Requirement 9: Patient Insurance Card

**User Story:** As a patient, I want to see my insurance coverage progress, so that I know how much of my policy I have used.

#### Acceptance Criteria

1. WHEN a patient views the PatientInsuranceCard component, THE Frontend SHALL display `providerName`, `policyNumber`, `coverageType`, `coverageAmount`, `usedAmount`, `expiryDate`, and `status`.
2. THE Frontend SHALL display a coverage progress indicator showing `usedAmount / coverageAmount` as a percentage.
3. WHILE `policy.status = 'expired'`, THE Frontend SHALL display an expiry warning on the PatientInsuranceCard.

---

### Requirement 10: JWT Role-Based Access Control

**User Story:** As a system administrator, I want all insurance and payment routes to be protected by JWT with role enforcement, so that only authorized users can access sensitive operations.

#### Acceptance Criteria

1. THE AuthMiddleware SHALL protect every route under `/api/insurance` and `/api/payment` and SHALL return HTTP 401 for requests without a valid JWT.
2. WHEN a request with a valid JWT but incorrect role is made to a role-guarded endpoint, THE AuthMiddleware SHALL return HTTP 403.
3. THE Backend SHALL accept only `POST /api/insurance/claim/submit` from tokens with `role = 'doctor'` and SHALL return HTTP 403 for all other roles.
4. THE Backend SHALL accept only `PATCH /api/insurance/claims/:claimId/review` and `GET /api/insurance/claims` from tokens with `role = 'admin'` and SHALL return HTTP 403 for all other roles.
5. THE Backend SHALL never expose `RAZORPAY_KEY_SECRET` in any API response or log output.

---

### Requirement 11: Seed and Demo Data

**User Story:** As a developer, I want to seed demo insurance policies and claims, so that I can test the full workflow without manual data entry.

#### Acceptance Criteria

1. WHEN a request is made to `POST /api/insurance/seed`, THE InsuranceService SHALL create sample InsurancePolicy and Claim documents in MongoDB for testing purposes.
2. THE InsuranceService SHALL generate seed data that includes at least one policy per coverage type (`basic`, `comprehensive`, `premium`) and at least one claim in each status (`pending`, `flagged`, `approved`, `rejected`).
