import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Pagination, Button, CircularProgress, Alert
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClaims } from '../../store/slices/insuranceSlice';
import ClaimReviewModal from '../../components/Insurance/ClaimReviewModal';

const getFraudColor = (score) => {
  if (score < 0) return 'default';
  if (score < 0.5) return 'success';
  if (score < 0.75) return 'warning';
  return 'error';
};

const getRowBg = (score) => {
  if (score < 0) return 'inherit';
  if (score < 0.5) return '#f0fdf4';
  if (score < 0.75) return '#fffbeb';
  return '#fef2f2';
};

const InsuranceDashboard = () => {
  const dispatch = useDispatch();
  const { claims, totalClaims, currentPage, loading, error } = useSelector(s => s.insurance);
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => { dispatch(fetchClaims(1)); }, [dispatch]);

  const handlePageChange = (_, page) => dispatch(fetchClaims(page));

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Insurance Claims</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review and manage insurance claims with AI fraud detection
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Claim ID</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Diagnosis</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Fraud Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim._id} sx={{ backgroundColor: getRowBg(claim.fraudScore) }}>
                    <TableCell>{claim.claimId}</TableCell>
                    <TableCell>{claim.patientId?.name || '—'}</TableCell>
                    <TableCell>{claim.diagnosisName}</TableCell>
                    <TableCell>₹{claim.claimAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={claim.fraudScore < 0 ? 'N/A' : `${(claim.fraudScore * 100).toFixed(0)}%`}
                        color={getFraudColor(claim.fraudScore)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={claim.status} size="small"
                        color={claim.status === 'approved' ? 'success' : claim.status === 'rejected' ? 'error' : claim.status === 'flagged' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{new Date(claim.claimDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {['pending', 'flagged'].includes(claim.status) && (
                        <Button size="small" variant="outlined" onClick={() => setSelectedClaim(claim)}>
                          Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {claims.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No claims found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalClaims > 20 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(totalClaims / 20)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <ClaimReviewModal
        claim={selectedClaim}
        open={!!selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />
    </Box>
  );
};

export default InsuranceDashboard;
