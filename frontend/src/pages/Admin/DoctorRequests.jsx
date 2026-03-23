import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, TextField,
  Tabs, Tab, CircularProgress, Alert, Badge
} from '@mui/material';
import api from '../../services/api';

const STATUS_COLOR = { pending: 'warning', seen: 'info', resolved: 'success' };
const PRIORITY_COLOR = { low: 'default', medium: 'primary', high: 'warning', urgent: 'error' };

export default function DoctorRequests() {
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/requests', { params: { status: tab === 'all' ? undefined : tab } });
      setRequests(data.requests);
      setPendingCount(data.pendingCount);
    } catch {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const updateRequest = async (requestId, status, adminNote) => {
    try {
      await api.patch(`/admin/requests/${requestId}`, { status, adminNote: adminNote || notes[requestId] || '' });
      fetchRequests();
    } catch {
      setError('Failed to update request');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Doctor Requests</Typography>
        {pendingCount > 0 && (
          <Chip label={`${pendingCount} pending`} color="error" size="small" />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={<Badge badgeContent={pendingCount} color="error" max={99}>All</Badge>} value="all" />
        <Tab label="Pending" value="pending" />
        <Tab label="Seen" value="seen" />
        <Tab label="Resolved" value="resolved" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="error" />
        </Box>
      ) : requests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography>No requests found</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {requests.map(req => (
            <Card key={req._id} sx={{ border: req.status === 'pending' ? '1px solid #fca5a5' : '1px solid #e5e7eb' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography fontWeight={600} fontSize={14}>{req.fromDoctorName}</Typography>
                    <Typography variant="caption" color="text.secondary">{req.requestId} · {formatDate(req.createdAt)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={req.priority} color={PRIORITY_COLOR[req.priority]} size="small" />
                    <Chip label={req.status} color={STATUS_COLOR[req.status]} size="small" />
                  </Box>
                </Box>

                <Typography fontSize={14} sx={{ mb: 1.5, color: '#374151' }}>{req.message}</Typography>

                {req.adminNote && (
                  <Box sx={{ background: '#f0fdf4', borderRadius: 1, p: 1, mb: 1.5 }}>
                    <Typography variant="caption" color="success.main" fontWeight={600}>Admin Note: </Typography>
                    <Typography variant="caption">{req.adminNote}</Typography>
                  </Box>
                )}

                {req.status !== 'resolved' && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      placeholder="Add a note (optional)"
                      value={notes[req.requestId] || ''}
                      onChange={e => setNotes(n => ({ ...n, [req.requestId]: e.target.value }))}
                      sx={{ flex: 1, minWidth: 200 }}
                    />
                    {req.status === 'pending' && (
                      <Button size="small" variant="outlined" onClick={() => updateRequest(req.requestId, 'seen')}>
                        Mark Seen
                      </Button>
                    )}
                    <Button size="small" variant="contained" color="success" onClick={() => updateRequest(req.requestId, 'resolved')}>
                      Resolve
                    </Button>
                  </Box>
                )}

                {req.resolvedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Resolved: {formatDate(req.resolvedAt)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
