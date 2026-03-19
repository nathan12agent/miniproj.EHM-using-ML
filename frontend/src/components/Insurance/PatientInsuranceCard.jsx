import React from 'react';
import {
  Card, CardContent, Typography, LinearProgress, Chip, Box, Grid
} from '@mui/material';
import { HealthAndSafety as InsuranceIcon } from '@mui/icons-material';

const PatientInsuranceCard = ({ policy }) => {
  if (!policy) return null;

  const usedPct = Math.min((policy.usedAmount / policy.coverageAmount) * 100, 100);
  const remaining = policy.coverageAmount - policy.usedAmount;
  const isExpired = policy.status === 'expired' || new Date() > new Date(policy.expiryDate);

  const progressColor = usedPct > 80 ? 'error' : usedPct > 50 ? 'warning' : 'success';

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsuranceIcon color="primary" />
            <Typography variant="h6">{policy.providerName}</Typography>
          </Box>
          <Chip
            label={isExpired ? 'Expired' : policy.status}
            color={isExpired ? 'error' : policy.status === 'active' ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Policy Number</Typography>
            <Typography variant="body2" fontWeight={600}>{policy.policyNumber}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Coverage Type</Typography>
            <Typography variant="body2" fontWeight={600}>{policy.coverageType}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Total Coverage</Typography>
            <Typography variant="body2" fontWeight={600}>₹{policy.coverageAmount?.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Remaining</Typography>
            <Typography variant="body2" fontWeight={600} color={remaining < 10000 ? 'error.main' : 'success.main'}>
              ₹{remaining?.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Expiry Date</Typography>
            <Typography variant="body2" fontWeight={600}>
              {new Date(policy.expiryDate).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Coverage Used</Typography>
            <Typography variant="caption" fontWeight={600}>{usedPct.toFixed(1)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={usedPct}
            color={progressColor}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Used: ₹{policy.usedAmount?.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total: ₹{policy.coverageAmount?.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PatientInsuranceCard;
