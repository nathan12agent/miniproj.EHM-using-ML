import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Tooltip, CircularProgress,
  Alert, Pagination, Card, CardContent, Grid,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PersonOutline as NurseIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNurses, deleteNurse } from '../../store/slices/nurseSlice';
import AddNurseModal from '../../components/Nurses/AddNurseModal';
import EditNurseModal from '../../components/Nurses/EditNurseModal';

const SHIFT_COLORS = { Morning: 'success', Evening: 'warning', Night: 'secondary' };

export default function NurseManagement() {
  const dispatch = useDispatch();
  const { nurses, total, loading, error } = useSelector(s => s.nurses);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editNurse, setEditNurse] = useState(null);
  const limit = 10;

  useEffect(() => { dispatch(fetchNurses({ page, limit })); }, [dispatch, page]);

  const handleDelete = async (nurse) => {
    if (!window.confirm(`Delete ${nurse.firstName} ${nurse.lastName}?`)) return;
    dispatch(deleteNurse(nurse._id));
  };

  const shiftCount = (shift) => nurses.filter(n => n.shift === shift).length;

  const stats = [
    { label: 'Total Nurses', value: total, color: '#0891b2' },
    { label: 'Morning Shift', value: shiftCount('Morning'), color: '#059669' },
    { label: 'Evening Shift', value: shiftCount('Evening'), color: '#d97706' },
    { label: 'Night Shift', value: shiftCount('Night'), color: '#7c3aed' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Nurse Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add Nurse
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Ward</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={32} /></TableCell></TableRow>
            ) : nurses.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No nurses found</TableCell></TableRow>
            ) : nurses.map(nurse => (
              <TableRow key={nurse._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NurseIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {nurse.firstName} {nurse.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{nurse.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{nurse.ward}</TableCell>
                <TableCell>
                  <Chip label={nurse.shift} color={SHIFT_COLORS[nurse.shift] || 'default'} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={nurse.status} color={nurse.status === 'On Duty' ? 'success' : 'default'} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{nurse.phone}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => setEditNurse(nurse)} color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {nurse.isSeeded ? (
                    <Tooltip title="Demo record — cannot delete">
                      <span>
                        <IconButton size="small" disabled>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <IconButton size="small" onClick={() => handleDelete(nurse)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {total > limit && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={Math.ceil(total / limit)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <AddNurseModal open={addOpen} onClose={() => setAddOpen(false)} onSuccess={() => dispatch(fetchNurses({ page, limit }))} />
      {editNurse && (
        <EditNurseModal
          open={!!editNurse}
          nurse={editNurse}
          onClose={() => setEditNurse(null)}
          onSuccess={() => { setEditNurse(null); dispatch(fetchNurses({ page, limit })); }}
        />
      )}
    </Box>
  );
}
