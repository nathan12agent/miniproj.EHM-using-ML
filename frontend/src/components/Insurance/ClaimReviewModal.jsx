import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Chip, Box, TextField, List, ListItem, ListItemText, Divider, Alert
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { reviewClaim } from '../../store/slices/insuranceSlice';

const getFraudColor = (score) => {
  if (score < 0) return 'default';
  if (score < 0.5) return 'success';
  if (score < 0.75) return 'warning';
  return 'error';
};

const ClaimReviewModal = ({ claim, open, onClose }) => {
  const dispatch = useDispatch();
  const [approvedAmount, setApprovedAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!claim) return null;

  const isHighRisk = claim.fraudScore > 0.75;

  const handleReview = async (status) => {
    setLoading(true);
    await dispatch(reviewClaim({
      claimId: claim.claimId,
      data: { status, approvedAmount: status === 'approved' ? Number(approvedAmount) || claim.claimAmount : 0 }
    }));
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Review Claim — {claim.claimId}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Fraud Score</Typography>
          <Chip
            label={claim.fraudScore < 0 ? 'N/A' : `${(claim.fraudScore * 100).toFixed(0)}%`}
            color={getFraudColor(claim.fraudScore)}
            size="small"
          />
        </Box>

        {isHighRisk && (
          <Alert severity="error" sx={{ mb: 2 }}>
            High fraud risk detected. Approval is disabled.
          </Alert>
        )}

        {claim.fraudReasons?.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Fraud Indicators</Typography>
            <List dense>
              {claim.fraudReasons.map((r, i) => (
                <ListItem key={i} sx={{ py: 0 }}>
                  <ListItemText primary={`• ${r}`} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
          {[
            ['Patient', claim.patientId?.name || claim.patientId],
            ['Doctor', claim.doctorId?.name || claim.doctorId],
            ['Diagnosis', claim.diagnosisName],
            ['Diagnosis Code', claim.diagnosisCode],
            ['Treatment Code', claim.treatmentCode],
            ['Claim Amount', `₹${claim.claimAmount?.toLocaleString()}`],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={500}>{value}</Typography>
            </Box>
          ))}
        </Box>

        {!isHighRisk && (
          <TextField
            label="Approved Amount (₹)"
            type="number"
            fullWidth
            size="small"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
            placeholder={String(claim.claimAmount)}
            helperText="Leave blank to approve full claim amount"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={() => handleReview('rejected')}
          color="error"
          variant="outlined"
          disabled={loading}
        >
          Reject
        </Button>
        <Button
          onClick={() => handleReview('approved')}
          color="success"
          variant="contained"
          disabled={loading || isHighRisk}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClaimReviewModal;
