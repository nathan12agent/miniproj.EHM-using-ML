import React from 'react';
import { Box, Typography } from '@mui/material';
import BedManagementWidget from '../../components/BedManagementWidget';

function BedManagement() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#dc2626',
            mb: 1,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Bed Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
          Monitor bed occupancy, patient assignments, and nurse workload
        </Typography>
      </Box>
      
      <BedManagementWidget />
    </Box>
  );
}

export default BedManagement;
