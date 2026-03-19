import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, TextField, InputAdornment,
  CircularProgress, Alert, Grid, Card, CardContent, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Tooltip, Snackbar, Divider,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Payment as PaymentIcon,
  Receipt as ReceiptIcon, LocalHospital as InsuranceIcon,
  CheckCircle as CheckCircleIcon, Close as CloseIcon,
} from '@mui/icons-material';
import { billingAPI, insuranceAPI } from '../../services/api';
import BillForm from '../../components/BillForm';
import api from '../../services/api';

const DIAGNOSIS_OPTIONS = [
  { code: 'D001', name: 'Hypertension' },
  { code: 'D002', name: 'Diabetes' },
  { code: 'D003', name: 'Fracture' },
  { code: 'D004', name: 'Common Cold' },
  { code: 'D005', name: 'Cancer Treatment' },
  { code: 'D006', name: 'Asthma' },
  { code: 'D007', name: 'Cardiac Procedure' },
  { code: 'D008', name: 'Minor Surgery' },
  { code: 'D009', name: 'Major Surgery' },
  { code: 'D010', name: 'Physiotherapy' },
];

const TREATMENT_OPTIONS = [
  { code: 'T001', name: 'Medication' },
  { code: 'T002', name: 'Surgery' },
  { code: 'T003', name: 'Physiotherapy' },
  { code: 'T004', name: 'Consultation' },
  { code: 'T005', name: 'Chemotherapy' },
  { code: 'T006', name: 'Radiology' },
  { code: 'T007', name: 'Lab Tests' },
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'NetBanking', 'Wallet'];

const statusColor = (s) => ({ Paid: 'success', 'Partially Paid': 'info', Pending: 'warning', Cancelled: 'error' }[s] || 'default');

function StatCard({ label, value, color }) {
  return (
    <Card sx={{ borderLeft: `4px solid ${color}`, borderRadius: 2 }}>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" fontWeight="bold" color={color}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

// Step 1: Insurance claim submission dialog
function InsuranceClaimDialog({ open, bill, onClose, onClaimSubmitted }) {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [diagnosisCode, setDiagnosisCode] = useState('D001');
  const [treatmentCode, setTreatmentCode] = useState('T001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  useEffect(() => {
    if (open && bill?.patient?._id) {
      setLoadingPolicies(true);
      setError('');
      insuranceAPI.getPolicyByPatient(bill.patient._id)
        .then(r => {
          setPolicies([r.data]);
          setSelectedPolicy(r.data._id);
        })
        .catch(() => {
          setPolicies([]);
          setError('No active insurance policy found for this patient.');
        })
        .finally(() => setLoadingPolicies(false));
    }
  }, [open, bill]);

  const handleSubmit = async () => {
    if (!selectedPolicy) { setError('Select an insurance policy'); return; }
    setLoading(true);
    setError('');
    try {
      const diag = DIAGNOSIS_OPTIONS.find(d => d.code === diagnosisCode);
      const payload = {
        paidAmount: bill.totalAmount,
        paymentMethod: 'Insurance',
        insuranceData: {
          policyId: selectedPolicy,
          diagnosisCode,
          diagnosisName: diag?.name || diagnosisCode,
          treatmentCode,
        }
      };
      const res = await billingAPI.pay(bill._id, payload);
      onClaimSubmitted(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit insurance claim');
    } finally {
      setLoading(false);
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#0891b2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <InsuranceIcon />
          Submit Insurance Claim — {bill.billId}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loadingPolicies ? (
          <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Bill Amount" value={`₹${bill.totalAmount?.toLocaleString()}`} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Insurance Policy" value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)}>
                {policies.length === 0
                  ? <MenuItem value="" disabled>No active policy found</MenuItem>
                  : policies.map(p => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.providerName} — {p.policyNumber} ({p.coverageType}) | Coverage: ₹{p.coverageAmount?.toLocaleString()}
                    </MenuItem>
                  ))
                }
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Diagnosis" value={diagnosisCode} onChange={e => setDiagnosisCode(e.target.value)}>
                {DIAGNOSIS_OPTIONS.map(d => <MenuItem key={d.code} value={d.code}>{d.code} — {d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Treatment" value={treatmentCode} onChange={e => setTreatmentCode(e.target.value)}>
                {TREATMENT_OPTIONS.map(t => <MenuItem key={t.code} value={t.code}>{t.code} — {t.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                The claim will be submitted for fraud analysis. Once approved by admin, the insurance amount will be deducted from the patient's liability.
              </Alert>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || policies.length === 0}
          sx={{ bgcolor: '#0891b2', '&:hover': { bgcolor: '#0e7490' } }}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <InsuranceIcon />}>
          Submit Claim
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Step 2: Real Razorpay payment dialog
function MockPaymentDialog({ open, bill, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [insuranceCovered, setInsuranceCovered] = useState(0);
  const [patientLiability, setPatientLiability] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (open && bill) {
      setError('');
      setPaymentSuccess(false);
      setSuccessData(null);
      if (bill.insuranceClaimId) {
        api.get(`/insurance/patient/${bill.patient?._id}/active-claim`)
          .then(r => {
            const claim = r.data;
            if (claim && claim.status === 'approved') {
              setInsuranceCovered(claim.approvedAmount || 0);
              setPatientLiability(Math.max(0, (bill.totalAmount || 0) - (claim.approvedAmount || 0)));
            } else {
              setInsuranceCovered(0);
              setPatientLiability(bill.totalAmount || 0);
            }
          })
          .catch(() => {
            setInsuranceCovered(0);
            setPatientLiability(bill.totalAmount || 0);
          });
      } else {
        setInsuranceCovered(0);
        setPatientLiability(bill.totalAmount || 0);
      }
    }
  }, [open, bill]);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payment/create-order', { billId: bill._id });
      const { orderId, amount, currency, keyId, patientName, billDisplayId } = res.data;

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency,
        name: 'City General Hospital',
        description: `Payment for Bill ${billDisplayId}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: bill._id,
            });
            setSuccessData(verifyRes.data);
            setPaymentSuccess(true);
            onSuccess(verifyRes.data);
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: patientName,
        },
        theme: {
          color: '#dc2626',
        },
        modal: {
          ondismiss: function () {
            setError('Payment was cancelled.');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentSuccess(false);
    setSuccessData(null);
    setError('');
    onClose();
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onClose={!loading ? handleClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: paymentSuccess ? '#16a34a' : '#dc2626', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          {paymentSuccess ? <CheckCircleIcon /> : <PaymentIcon />}
          {paymentSuccess ? 'Payment Successful' : `Collect Payment — ${bill.billId}`}
        </Box>
        {!loading && <IconButton onClick={handleClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {paymentSuccess && successData ? (
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" justifyContent="center" mb={1}>
              <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 56 }} />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Razorpay Payment ID</Typography>
              <Typography variant="body2" fontWeight={700} color="#dc2626">{successData.payment?.razorpayPaymentId}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Receipt No.</Typography>
              <Typography variant="body2" fontWeight={600}>{successData.receiptNumber}</Typography>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Bill Amount</Typography>
              <Typography variant="body2">₹{bill.totalAmount?.toLocaleString()}</Typography>
            </Box>
            {insuranceCovered > 0 && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Insurance Covered</Typography>
                <Typography variant="body2" color="teal">₹{insuranceCovered.toLocaleString()}</Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body1" fontWeight={700}>Amount Paid</Typography>
              <Typography variant="body1" fontWeight={700} color="#16a34a">₹{patientLiability.toLocaleString()}</Typography>
            </Box>
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Payment Summary</Typography>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">Total Bill</Typography>
                  <Typography variant="body2" fontWeight={600}>₹{bill.totalAmount?.toLocaleString()}</Typography>
                </Box>
                {insuranceCovered > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="teal">Insurance Covers</Typography>
                    <Typography variant="body2" color="teal" fontWeight={600}>- ₹{insuranceCovered.toLocaleString()}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1" fontWeight={700}>Patient Pays</Typography>
                  <Typography variant="body1" fontWeight={700} color="#dc2626">₹{patientLiability.toLocaleString()}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                You will be redirected to Razorpay's secure payment page. Use test card 4111 1111 1111 1111 with any future date and CVV 123.
              </Alert>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        {paymentSuccess ? (
          <Button variant="contained" onClick={handleClose} sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button variant="contained" onClick={handlePay} disabled={loading}
              sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}>
              Pay ₹{patientLiability.toLocaleString()}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// Receipt dialog shown after successful payment (standalone view from receipt icon)
function ReceiptDialog({ open, data, onClose }) {
  if (!data) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ bgcolor: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleIcon /> Payment Receipt
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Razorpay Payment ID</Typography>
            <Typography variant="body2" fontWeight={700} color="#dc2626">{data.razorpayPaymentId || data.payment?.razorpayPaymentId || '—'}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Receipt No.</Typography>
            <Typography variant="body2" fontWeight={600}>{data.receiptNumber}</Typography>
          </Box>
          <Divider />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Bill Amount</Typography>
            <Typography variant="body2">₹{data.billAmount?.toLocaleString()}</Typography>
          </Box>
          {data.insuranceCovered > 0 && (
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Insurance Covered</Typography>
              <Typography variant="body2" color="teal">₹{data.insuranceCovered?.toLocaleString()}</Typography>
            </Box>
          )}
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body1" fontWeight={700}>Amount Paid</Typography>
            <Typography variant="body1" fontWeight={700} color="#16a34a">₹{data.amountPaid?.toLocaleString()}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [insuranceDialog, setInsuranceDialog] = useState({ open: false, bill: null });
  const [payDialog, setPayDialog] = useState({ open: false, bill: null });
  const [receiptDialog, setReceiptDialog] = useState({ open: false, data: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await billingAPI.getAll({ limit: 100 });
      setBills(res.data.bills || []);
    } catch (err) {
      setError('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    try {
      await billingAPI.delete(id);
      fetchBills();
    } catch {
      alert('Failed to delete bill');
    }
  };

  const handleClaimSubmitted = (data) => {
    setInsuranceDialog({ open: false, bill: null });
    fetchBills();
    const msg = data.claim
      ? `Insurance claim ${data.claim.claimId} submitted (${data.claim.status}${data.claim.fraudScore > 0.75 ? ' — FLAGGED for review' : ''}).`
      : 'Claim submitted.';
    setSnackbar({ open: true, message: msg, severity: data.claim?.fraudScore > 0.75 ? 'warning' : 'info' });
  };

  const handlePaySuccess = (data) => {
    fetchBills();
    // Success is shown inline in MockPaymentDialog; no separate receipt dialog needed
  };

  const filtered = bills.filter(b => {
    const name = `${b.patient?.firstName || ''} ${b.patient?.lastName || ''}`.toLowerCase();
    const id = (b.billId || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: bills.length,
    paid: bills.filter(b => b.paymentStatus === 'Paid').length,
    pending: bills.filter(b => b.paymentStatus === 'Pending').length,
    revenue: bills.reduce((s, b) => s + (b.paidAmount || 0), 0),
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <ReceiptIcon sx={{ color: '#dc2626', fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">Billing</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}
          sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
          onClick={() => { setSelectedBill(null); setFormOpen(true); }}>
          Create Bill
        </Button>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="Total Bills" value={stats.total} color="#dc2626" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Paid" value={stats.paid} color="#16a34a" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Pending" value={stats.pending} color="#d97706" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} color="#2563eb" /></Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Search */}
      <TextField fullWidth placeholder="Search by patient name or bill ID..." value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)} sx={{ mb: 2 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#dc2626' }} /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#fef2f2' }}>
              <TableRow>
                {['Bill ID', 'Patient', 'Date', 'Total', 'Paid', 'Method', 'Status', 'Claim', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 'bold', color: '#dc2626' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" py={3}>No bills found</Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map(bill => (
                <TableRow key={bill._id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{bill.billId}</TableCell>
                  <TableCell>{bill.patient?.firstName} {bill.patient?.lastName}</TableCell>
                  <TableCell>{new Date(bill.createdAt).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>₹{bill.totalAmount?.toLocaleString()}</TableCell>
                  <TableCell>₹{(bill.paidAmount || 0).toLocaleString()}</TableCell>
                  <TableCell>{bill.paymentMethod || '—'}</TableCell>
                  <TableCell>
                    <Chip label={bill.paymentStatus} color={statusColor(bill.paymentStatus)} size="small" />
                  </TableCell>
                  <TableCell>
                    {bill.insuranceClaimId
                      ? <Chip icon={<InsuranceIcon />} label="Claim Filed" color="info" size="small" />
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {bill.paymentStatus !== 'Paid' && bill.paymentStatus !== 'Cancelled' && (
                      <>
                        {!bill.insuranceClaimId && (
                          <Tooltip title="Submit Insurance Claim">
                            <IconButton size="small" sx={{ color: '#0891b2' }}
                              onClick={() => setInsuranceDialog({ open: true, bill })}>
                              <InsuranceIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Collect Payment">
                          <IconButton size="small" sx={{ color: '#dc2626' }}
                            onClick={() => setPayDialog({ open: true, bill })}>
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary"
                        onClick={() => { setSelectedBill(bill); setFormOpen(true); }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(bill._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <BillForm open={formOpen} onClose={() => { setFormOpen(false); setSelectedBill(null); }}
        onSuccess={fetchBills} bill={selectedBill} />

      <InsuranceClaimDialog
        open={insuranceDialog.open}
        bill={insuranceDialog.bill}
        onClose={() => setInsuranceDialog({ open: false, bill: null })}
        onClaimSubmitted={handleClaimSubmitted}
      />

      <MockPaymentDialog
        open={payDialog.open}
        bill={payDialog.bill}
        onClose={() => setPayDialog({ open: false, bill: null })}
        onSuccess={handlePaySuccess}
      />

      <ReceiptDialog
        open={receiptDialog.open}
        data={receiptDialog.data}
        onClose={() => { setReceiptDialog({ open: false, data: null }); }}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
