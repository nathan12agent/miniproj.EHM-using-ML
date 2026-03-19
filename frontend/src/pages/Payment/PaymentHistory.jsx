import React, { useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchHistory } from '../../store/slices/paymentSlice';

const PaymentHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, loading, error } = useSelector(s => s.payment);

  useEffect(() => { dispatch(fetchHistory()); }, [dispatch]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Payment History</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt No.</TableCell>
                <TableCell>Amount Paid</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((p) => (
                <TableRow
                  key={p._id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => p.paymentId && navigate(`/payment/receipt/${p.paymentId}`)}
                >
                  <TableCell>{p.receiptNumber || '—'}</TableCell>
                  <TableCell>₹{p.amountPaid?.toLocaleString()}</TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.status}
                      size="small"
                      color={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No payment history found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PaymentHistory;
