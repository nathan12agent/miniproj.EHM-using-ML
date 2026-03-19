# Implementation Plan: Payment (Razorpay Test Mode) + Insurance Fraud Detection

## Overview

Implement the full payment and insurance fraud detection system across all three tiers: Node.js/Express backend, Python Flask ML service, and React frontend. Tasks follow the dependency order — models → ML service → backend routes → frontend state → frontend UI → wiring.

## Tasks

- [-] 1. Configure environment and install dependencies
  - [ ] 1.1 Add Razorpay keys to backend/.env
    - Add `RAZORPAY_KEY_ID=rzp_test_SSyArkXPV68pQ1` and `RAZORPAY_KEY_SECRET=yCByKOOCgNlmVvbOYg7750gc` to `backend/.env`
    - _Requirements: 1.1, 1.5, 10.5_
  - [ ] 1.2 Install backend npm dependency
    - Run `npm install razorpay` inside `backend/`
    - _Requirements: 1.1_
  - [ ] 1.3 Install ML service Python dependencies
    - Run `pip install xgboost scikit-learn faker joblib` inside `ml-service/`
    - _Requirements: 6.1, 6.9_

- [-] 2. Create MongoDB models
  - [x] 2.1 Create backend/models/InsurancePolicy.js
    - Mongoose schema with fields: `policyId` (auto POL000001), `patientId`, `providerName`, `policyNumber`, `coverageType` enum, `coverageAmount`, `usedAmount`, `startDate`, `expiryDate`, `status` enum, `coveredDiagnoses`
    - Auto-increment `policyId` using pre-save hook matching the `BILL000001` pattern in `Bill.js`
    - Validate `coverageAmount > 0`, `expiryDate > startDate`, `usedAmount <= coverageAmount`
    - _Requirements: 4.3, 4.4_
  - [ ]* 2.2 Write property test for InsurancePolicy coverage invariant
    - **Property 3: Coverage Invariant** — `usedAmount` never exceeds `coverageAmount` after any approval sequence
    - **Validates: Requirements 4.2, 7.4**
  - [x] 2.3 Create backend/models/Claim.js
    - Mongoose schema with fields: `claimId` (auto CLM000001), `patientId`, `policyId`, `doctorId`, `diagnosisCode`, `diagnosisName`, `treatmentCode`, `claimAmount`, `approvedAmount`, `claimDate`, `status` enum (`pending|approved|rejected|flagged`), `fraudScore`, `fraudReasons`, `reviewedBy`, `reviewedAt`
    - Validate `claimAmount > 0`, `fraudScore` in [0,1] when set, `approvedAmount <= claimAmount`
    - _Requirements: 5.10_
  - [x] 2.4 Create backend/models/Payment.js
    - Mongoose schema with fields: `paymentId` (auto PAY000001), `patientId`, `claimId`, `billAmount`, `insuranceCovered`, `patientLiability`, `amountPaid`, `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `paymentMethod` enum, `status` enum (`pending|completed|failed|refunded`), `receiptNumber` (auto RCP000001)
    - Validate `patientLiability = billAmount - insuranceCovered` in pre-save hook
    - _Requirements: 3.3, 3.4_
  - [ ]* 2.5 Write property test for Payment liability calculation
    - **Property 8: Liability Calculation** — `patientLiability === billAmount - insuranceCovered` for every Payment document
    - **Validates: Requirements 3.4**

- [-] 3. Implement ML fraud detection service
  - [x] 3.1 Create ml-service/insurance_fraud_detector.py
    - Implement `InsuranceFraudDetector` class with `__init__`, `_generate_training_data`, `_train`, `predict`, `get_benchmarks`, `get_model_info` methods
    - `_generate_training_data`: use `faker` to generate 2000 synthetic records with the 9 feature fields; label fraud where `amountVsBenchmark > 2.0` or `claimsLast90Days > 3` or `isDuplicate` or `policyAgeDays < 30`
    - `_train`: fit `XGBClassifier` on synthetic data; store accuracy and fraud rate
    - `predict(features)`: encode features, call `predict_proba`, build `fraudReasons` list per threshold rules, return `{fraudScore, fraudReasons, isFraud}`
    - `get_benchmarks()`: return dict of `diagnosisCode → avgAmount`
    - `get_model_info()`: return `{accuracy, features, trainedOn, fraudRate}`
    - Load singleton via module-level `get_fraud_detector()` function (matching `get_staff_assigner()` pattern)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_
  - [ ]* 3.2 Write property test for fraud score bounds
    - **Property 1: Fraud Score Bounds** — `fraudScore ∈ [0.0, 1.0]` for any valid feature dict
    - **Validates: Requirements 6.2**
  - [ ]* 3.3 Write property test for fraud reasons completeness
    - **Property 9: Fraud Reasons Completeness** — each reason flag appears iff its threshold condition is met
    - **Validates: Requirements 6.4, 6.5, 6.6, 6.7, 6.8**
  - [x] 3.4 Add insurance Flask routes to ml-service/app-optimized.py
    - Import `get_fraud_detector` from `insurance_fraud_detector`
    - `POST /insurance/fraud_detect`: validate 9 required fields, call `detector.predict(features)`, return JSON result; return 400 on missing fields
    - `GET /insurance/benchmarks`: return `detector.get_benchmarks()`
    - `GET /insurance/model_info`: return `detector.get_model_info()`
    - _Requirements: 6.1, 6.10, 6.11_

- [ ] 4. Checkpoint — Ensure ML service starts and fraud_detect endpoint responds
  - Ensure all tests pass, ask the user if questions arise.

- [-] 5. Implement backend insurance routes
  - [x] 5.1 Create backend/routes/insurance.js
    - `GET /api/insurance/policy/:patientId` — return active policy for patient; return `status: 'expired'` if past expiry date; require JWT
    - `POST /api/insurance/claim/submit` — role guard `doctor`; validate policy active/not-expired/coverage-not-exceeded; build 9 ML features (compute `daysSinceLastClaim`, `claimsLast90Days`, `amountVsBenchmark`, `isDuplicate`, `policyAgeDays`, `patientAge`); call ML service with axios; persist Claim with `status = 'flagged'` if `fraudScore > 0.75` else `'pending'`; on ML unreachable set `fraudScore = -1, status = 'pending'`; return `{claim, fraudScore, fraudReasons}`
    - `GET /api/insurance/claims` — role guard `admin`; paginated (default page 20); populate patient/doctor/policy
    - `PATCH /api/insurance/claims/:claimId/review` — role guard `admin`; validate claim in `pending|flagged`; on approve increment `policy.usedAmount`; update `reviewedBy`, `reviewedAt`
    - `POST /api/insurance/seed` — create sample policies (one per coverage type) and claims (one per status)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2_
  - [ ]* 5.2 Write property test for auto-flag consistency
    - **Property 2: Auto-Flag Consistency** — `status = 'flagged'` iff `fraudScore > 0.75`, `status = 'pending'` iff `fraudScore <= 0.75`
    - **Validates: Requirements 5.6, 5.7, 6.3**
  - [ ]* 5.3 Write property test for coverage exceeded rejection
    - **Property 13: Coverage Exceeded Rejection** — claim submission returns HTTP 400 and no Claim persisted when `claimAmount + usedAmount > coverageAmount`
    - **Validates: Requirements 5.4**
  - [ ]* 5.4 Write property test for claim submission does not modify coverage
    - **Property 11: Claim Submission Does Not Modify Coverage** — `policy.usedAmount` unchanged immediately after submission
    - **Validates: Requirements 5.11**

- [-] 6. Implement backend payment routes
  - [x] 6.1 Create backend/routes/payment.js
    - Initialize `Razorpay` instance from env keys at module load
    - `POST /api/payment/create-order` — require JWT; validate `amount` is positive integer; call `razorpay.orders.create({amount, currency: 'INR', receipt: paymentId})`; persist Payment with `status = 'pending'`; return `{orderId, keyId, amount, currency}`; never include `KEY_SECRET` in response
    - `POST /api/payment/verify` — require JWT; check for existing completed payment (return 409 if found); compute `HMAC-SHA256("orderId|paymentId", KEY_SECRET)` using `crypto.timingSafeEqual`; on valid: update Payment to `completed`, generate `receiptNumber`, update linked Bill `paymentStatus = 'Paid'`; on invalid: update Payment to `failed`, return 400
    - `GET /api/payment/history` — require JWT; return patient's payments with receipt/amount/status/method
    - `GET /api/payment/receipt/:paymentId` — require JWT; return full Payment document
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 10.1, 10.5_
  - [ ]* 6.2 Write property test for payment idempotency
    - **Property 4: Payment Idempotency** — second verify call on completed order returns HTTP 409, no duplicate record
    - **Validates: Requirements 2.5**
  - [ ]* 6.3 Write property test for signature rejection
    - **Property 5: Signature Rejection** — invalid signature returns HTTP 400 and sets Payment status to `failed`
    - **Validates: Requirements 2.4**
  - [ ]* 6.4 Write property test for invalid amount rejection
    - **Property 12: Invalid Amount Rejection** — zero/negative/non-integer/missing amount returns HTTP 400, no Payment persisted
    - **Validates: Requirements 1.3**
  - [ ]* 6.5 Write property test for receipt uniqueness
    - **Property 7: Receipt Uniqueness** — all completed Payment `receiptNumber` values are distinct
    - **Validates: Requirements 3.3**

- [ ] 7. Register routes and create seed script
  - [x] 7.1 Register new routes in backend/server.js
    - Add `const insuranceRoutes = require('./routes/insurance')` and `const paymentRoutes = require('./routes/payment')`
    - Mount `app.use('/api/insurance', insuranceRoutes)` and `app.use('/api/payment', paymentRoutes)`
    - _Requirements: 10.1_
  - [ ] 7.2 Create backend/scripts/seedInsurance.js
    - Standalone script (run with `node scripts/seedInsurance.js`) that connects to MongoDB and calls the seed logic: one policy per coverage type, one claim per status, linked to existing patient/doctor documents
    - _Requirements: 11.1, 11.2_

- [ ] 8. Checkpoint — Ensure backend routes respond correctly with Postman or curl
  - Ensure all tests pass, ask the user if questions arise.

- [-] 9. Implement frontend services and Redux slices
  - [x] 9.1 Create frontend/src/services/insuranceService.js
    - Axios wrapper functions: `getPolicy(patientId)`, `submitClaim(data)`, `getClaims(page)`, `reviewClaim(claimId, data)`, `seedInsurance()`
    - Include JWT Authorization header from Redux auth state
    - _Requirements: 4.1, 5.1, 7.1, 7.3_
  - [x] 9.2 Create frontend/src/services/paymentService.js
    - Axios wrapper functions: `createOrder(data)`, `verifyPayment(data)`, `getHistory()`, `getReceipt(paymentId)`
    - _Requirements: 1.1, 2.1, 3.1, 3.2_
  - [x] 9.3 Create frontend/src/store/slices/insuranceSlice.js
    - Redux slice with async thunks for `fetchPolicy`, `submitClaim`, `fetchClaims`, `reviewClaim`
    - State shape: `{ policy, claims, loading, error, fraudPrecheck }`
    - _Requirements: 4.1, 5.1, 7.1_
  - [x] 9.4 Create frontend/src/store/slices/paymentSlice.js
    - Redux slice with async thunks for `createOrder`, `verifyPayment`, `fetchHistory`, `fetchReceipt`
    - State shape: `{ currentOrder, history, receipt, loading, error }`
    - _Requirements: 1.1, 2.1, 3.1_
  - [x] 9.5 Register new slices in frontend/src/store/store.js
    - Import `insuranceReducer` and `paymentReducer`; add to `combineReducers` (or `configureStore` reducers map)
    - _Requirements: 4.1, 5.1_

- [-] 10. Implement Insurance UI components
  - [x] 10.1 Create frontend/src/components/Insurance/PatientInsuranceCard.jsx
    - Display `providerName`, `policyNumber`, `coverageType`, `coverageAmount`, `usedAmount`, `expiryDate`, `status`
    - MUI LinearProgress bar showing `usedAmount / coverageAmount` percentage
    - Show expiry warning chip when `status = 'expired'`
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 10.2 Create frontend/src/components/Insurance/SubmitClaimForm.jsx
    - Doctor-facing MUI form with fields: `patientId`, `policyId`, `diagnosisCode`, `diagnosisName`, `treatmentCode`, `claimAmount`
    - On blur of `claimAmount` or `diagnosisCode`, call `POST /insurance/fraud_detect` directly on ML service (port 5001) and display live fraud score badge
    - Disable submit button and show warning when live `fraudScore > 0.75`
    - On submit, dispatch `submitClaim` thunk; display returned `fraudScore` and `fraudReasons`
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 10.3 Create frontend/src/components/Insurance/ClaimReviewModal.jsx
    - MUI Dialog showing claim details: `claimId`, `patientId`, `diagnosisName`, `claimAmount`, `fraudScore` (color-coded chip), `fraudReasons` list
    - Approve/Reject buttons; disable Approve when `fraudScore > 0.75`
    - `approvedAmount` input field shown when approving
    - On confirm, dispatch `reviewClaim` thunk and close modal
    - _Requirements: 7.3, 7.4, 7.5, 7.7, 7.8_
  - [x] 10.4 Create frontend/src/pages/Insurance/InsuranceDashboard.jsx
    - Admin page: MUI Table of all claims fetched via `fetchClaims` thunk with pagination
    - Color-code rows: green `fraudScore < 0.5`, amber `0.5–0.75`, red `> 0.75`
    - Click row to open `ClaimReviewModal`
    - _Requirements: 7.1, 7.2, 7.9_

- [-] 11. Implement Payment UI components
  - [x] 11.1 Create frontend/src/components/Payment/RazorpayCheckout.jsx
    - Load Razorpay checkout.js via `<script>` tag (CDN) on mount
    - Accept props: `orderId`, `keyId`, `amount`, `onSuccess`, `onFailure`
    - Open Razorpay modal with test config; on payment success callback call `onSuccess({razorpayPaymentId, razorpayOrderId, razorpaySignature})`
    - _Requirements: 1.1, 2.1_
  - [x] 11.2 Create frontend/src/pages/Payment/PaymentPortal.jsx
    - Display bill breakdown: `billAmount`, `insuranceCovered`, `patientLiability`
    - "Pay Now" button dispatches `createOrder` thunk then mounts `RazorpayCheckout`
    - On `RazorpayCheckout` success, dispatch `verifyPayment` thunk; on success navigate to receipt
    - _Requirements: 1.1, 1.2, 2.2, 2.3, 3.4_
  - [x] 11.3 Create frontend/src/components/Payment/PaymentReceipt.jsx
    - Display full receipt: `receiptNumber`, `billAmount`, `insuranceCovered`, `patientLiability`, `amountPaid`, `paymentMethod`, `status`, timestamp
    - Print button using `window.print()`
    - _Requirements: 3.2, 3.3_
  - [x] 11.4 Create frontend/src/pages/Payment/PaymentHistory.jsx
    - MUI Table of patient's payment history fetched via `fetchHistory` thunk
    - Each row shows `receiptNumber`, `amountPaid`, `status`, `paymentMethod`, date
    - Click row to navigate to receipt page
    - _Requirements: 3.1_

- [-] 12. Wire routes and navigation
  - [x] 12.1 Add Insurance and Payment routes to frontend/src/App.js
    - Under `/admin/*`: add `/admin/insurance` → `InsuranceDashboard`
    - Under `/doctor/*`: add `/doctor/submit-claim` → `SubmitClaimForm`
    - Add `/payment` → `PaymentPortal`, `/payment/history` → `PaymentHistory`, `/payment/receipt/:paymentId` → `PaymentReceipt` (accessible to authenticated users)
    - Import all new page components
    - _Requirements: 7.1, 8.1, 3.1, 3.2_
  - [x] 12.2 Add Insurance and Payment menu items to Layout.js admin sidebar
    - Add `{ text: 'Insurance Claims', icon: <HealthAndSafetyIcon />, path: '/admin/insurance' }` to the `menuItems` array
    - Add `{ text: 'Payments', icon: <PaymentIcon />, path: '/payment/history' }` to the `menuItems` array
    - Import MUI icons `HealthAndSafetyIcon` and `PaymentIcon`
    - _Requirements: 7.1_
  - [x] 12.3 Add Submit Claim tab to DoctorLayout.js
    - Add `{ label: 'Submit Claim', path: '/doctor/submit-claim' }` to the `tabs` array
    - _Requirements: 8.1_

- [ ] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (JS) and `hypothesis` (Python)
- Each task references specific requirements for traceability
- The Razorpay frontend integration uses the CDN script — no npm package needed
- ML service singleton pattern mirrors `get_staff_assigner()` in `staff_assignment.py`
- Role guards reuse the existing `auth.js` middleware pattern
