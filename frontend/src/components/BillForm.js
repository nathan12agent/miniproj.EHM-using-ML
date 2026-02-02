import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { billingAPI, patientsAPI } from '../services/api';

const BillForm = ({ open, onClose, onSuccess, bill = null }) => {
  const isEdit = !!bill;
  
  const [formData, setFormData] = useState({
    patient: bill?.patient?._id || '',
    items: bill?.items || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: bill?.subtotal || 0,
    tax: bill?.tax || 0,
    discount: bill?.discount || 0,
    totalAmount: bill?.totalAmount || 0,
    paymentStatus: bill?.paymentStatus || 'Pending',
    paymentMethod: bill?.paymentMethod || '',
    paidAmount: bill?.paidAmount || 0,
    dueDate: bill?.dueDate?.split('T')[0] || '',
    notes: bill?.notes || '',
  });

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax, formData.discount]);

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.getAll({ limit: 1000 });
      setPatients(response.data.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = (subtotal * (formData.tax / 100));
    const totalAmount = subtotal + taxAmount - formData.discount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      totalAmount: Math.max(0, totalAmount)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await billingAPI.update(bill._id, formData);
      } else {
        await billingAPI.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving bill:', err);
      setError(err.response?.data?.message || 'Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Bill' : 'Create New Bill'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.patientId})`}
                value={patients.find(p => p._id === formData.patient) || null}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, patient: newValue?._id || '' }));
                }}
                renderInput={(params) => (
                  <TextField {...params} required label="Patient" />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Bill Items</Typography>
                <Button startIcon={<AddIcon />} onClick={addItem}>
                  Add Item
                </Button>
              </Box>
              
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 1 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={10} sm={3}>
                    <TextField
                      fullWidth
                      label="Total"
                      value={item.total.toFixed(2)}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={2} sm={1}>
                    <IconButton 
                      color="error" 
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Tax (%)"
                name="tax"
                value={formData.tax}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Discount ($)"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Subtotal"
                value={`$${formData.subtotal.toFixed(2)}`}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Amount"
                value={`$${formData.totalAmount.toFixed(2)}`}
                InputProps={{ readOnly: true }}
                sx={{ '& input': { fontWeight: 'bold', fontSize: '1.2rem' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Status"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                required
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Credit Card">Credit Card</MenuItem>
                <MenuItem value="Debit Card">Debit Card</MenuItem>
                <MenuItem value="Insurance">Insurance</MenuItem>
                <MenuItem value="Online">Online</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Paid Amount"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {isEdit ? 'Update' : 'Create'} Bill
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BillForm;
