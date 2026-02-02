import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

const BillDetailDialog = ({ open, onClose, bill }) => {
  if (!bill) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Partially Paid':
        return 'info';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const InfoRow = ({ label, value, highlight = false }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          fontWeight: highlight ? 700 : 500,
          fontSize: highlight ? '1.2rem' : '1rem',
          color: highlight ? 'primary.main' : 'inherit'
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Bill Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bill ID: {bill.billId}
            </Typography>
          </Box>
          <Chip 
            label={bill.paymentStatus} 
            color={getStatusColor(bill.paymentStatus)}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Patient Information */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Patient Information
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {bill.patient?.firstName?.[0]}{bill.patient?.lastName?.[0]}
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {bill.patient?.firstName} {bill.patient?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Patient ID: {bill.patient?.patientId}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Bill Items */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon sx={{ mr: 1 }} />
                Bill Items
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bill.items && bill.items.length > 0 ? (
                      bill.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">${item.unitPrice?.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            ${item.total?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No items
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Bill Summary */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'primary.lighter' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <MoneyIcon sx={{ mr: 1 }} />
                Bill Summary
              </Typography>
              <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                <InfoRow label="Subtotal" value={`$${bill.subtotal?.toFixed(2)}`} />
                <InfoRow label={`Tax (${bill.tax || 0}%)`} value={`$${((bill.subtotal * (bill.tax / 100)) || 0).toFixed(2)}`} />
                <InfoRow label="Discount" value={`-$${bill.discount?.toFixed(2)}`} />
                <Divider sx={{ my: 2 }} />
                <InfoRow label="Total Amount" value={`$${bill.totalAmount?.toFixed(2)}`} highlight />
              </Box>
            </Paper>
          </Grid>

          {/* Payment Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <PaymentIcon sx={{ mr: 1 }} />
                Payment Information
              </Typography>
              <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                <InfoRow label="Payment Status" value={bill.paymentStatus} />
                <InfoRow label="Payment Method" value={bill.paymentMethod || 'N/A'} />
                <InfoRow label="Paid Amount" value={`$${bill.paidAmount?.toFixed(2)}`} />
                <InfoRow 
                  label="Balance Due" 
                  value={`$${((bill.totalAmount || 0) - (bill.paidAmount || 0)).toFixed(2)}`}
                  highlight
                />
                {bill.dueDate && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <InfoRow 
                      label="Due Date" 
                      value={new Date(bill.dueDate).toLocaleDateString()}
                    />
                  </>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Notes */}
          {bill.notes && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                  {bill.notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Record Information */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Record Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {bill.createdAt ? new Date(bill.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {bill.updatedAt ? new Date(bill.updatedAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button variant="contained" startIcon={<ReceiptIcon />}>
          Print Bill
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BillDetailDialog;
