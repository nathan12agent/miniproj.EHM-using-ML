import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Card, CardContent,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Chip, Avatar,
  Tabs, Tab, TextField, InputAdornment, CircularProgress,
  Alert, IconButton, Divider, Tooltip, LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, LocalHospital as DoctorIcon,
  PersonPin as NurseIcon, AccessTime as AttendanceIcon,
  Refresh as RefreshIcon, BedOutlined as BedIcon,
  CheckCircle as OkIcon, Warning as WarnIcon,
  HealingOutlined as HealingIcon,
} from '@mui/icons-material';
import { doctorsAPI, nursesAPI, attendanceAPI } from '../../services/api';

// ─── Severity helpers ────────────────────────────────────────────────────────
const SEVERITIES = ['Minor', 'Moderate', 'Severe', 'Critical'];
const WARDS = ['ICU', 'General', 'Emergency', 'Pediatric', 'Maternity'];
const SHIFTS = ['Morning', 'Evening', 'Night'];

const severityColor = (s) => {
  const map = { Minor: 'success', Moderate: 'warning', Severe: 'error', Critical: 'error' };
  return map[s] || 'default';
};

// ─── Smart Assign Panel ───────────────────────────────────────────────────────
function SmartAssignPanel() {
  const [patientId, setPatientId] = useState('');
  const [severity, setSeverity] = useState('Minor');
  const [ward, setWard] = useState('General');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const handleAssign = async () => {
    setLoading(true); setErr(null); setResult(null);
    try {
      const res = await nursesAPI.smartAssign({ patientId, injurySeverity: severity, ward });
      setResult(res.data);
    } catch (e) {
          setErr(e.response?.data?.message ||
            e.response?.data?.error ||
            e.message ||
            'Assignment failed. Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.light' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HealingIcon color="primary" /> Smart Staff Assign — Injury Triage
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Automatically determines whether a bed is required based on injury severity.
          <strong> Minor injuries</strong> are handled as outpatient — no bed assigned, saving resources.
        </Typography>

        {/* Severity preview */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Current Selection Preview
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {SEVERITIES.map(s => (
              <Chip
                key={s}
                label={s}
                color={s === severity ? severityColor(s) : 'default'}
                variant={s === severity ? 'filled' : 'outlined'}
                onClick={() => setSeverity(s)}
                sx={{ cursor: 'pointer', fontWeight: s === severity ? 700 : 400 }}
              />
            ))}
          </Box>
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            {SEVERITIES.indexOf(severity) === 0
              ? <OkIcon color="success" />
              : <WarnIcon color={severity === 'Moderate' ? 'warning' : 'error'} />}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {SEVERITIES.indexOf(severity) === 0
                ? 'No bed will be assigned — outpatient care only'
                : `Bed assignment required — ${severity.toLowerCase()} case`}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth label="Patient ID" value={patientId}
              onChange={e => setPatientId(e.target.value)}
              size="small"
              helperText="Enter patientId like P00001001 or MongoDB _id"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Injury Severity</InputLabel>
              <Select value={severity} label="Injury Severity" onChange={e => setSeverity(e.target.value)}>
                {SEVERITIES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Ward</InputLabel>
              <Select value={ward} label="Ward" onChange={e => setWard(e.target.value)}>
                {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained" onClick={handleAssign} disabled={!patientId || loading}
          sx={{ mt: 2 }} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <NurseIcon />}>
          Smart Assign
        </Button>

        {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

        {result && (
          <Alert
            severity={result.bedRequired ? 'warning' : 'success'}
            sx={{ mt: 2 }}
            icon={result.bedRequired ? <WarnIcon /> : <OkIcon />}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{result.message}</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={result.wardInfo?.careType} color={result.bedRequired ? 'warning' : 'success'} />
              <Chip size="small" label={result.bedRequired ? '🛏 Bed Required' : '✓ No Bed Needed'} variant="outlined" color={result.bedRequired ? 'error' : 'success'} />
              {result.assignedNurse ? (
                <Chip size="small" label={`Nurse: ${result.assignedNurse.firstName} ${result.assignedNurse.lastName}`} color="info" />
              ) : (
                <Chip size="small" label="No available nurse in ward" color="default" />
              )}
              {result.assignedDoctor ? (
                <Chip size="small" label={`Dr. ${result.assignedDoctor.firstName} ${result.assignedDoctor.lastName} (${result.assignedDoctor.specialization})`} color="secondary" />
              ) : (
                <Chip size="small" label="No available doctor" color="default" />
              )}
              {result.assignedBed ? (
                <Chip size="small" label={`Bed: ${result.assignedBed.bedNumber} — ${result.assignedBed.ward}`} color="primary" />
              ) : result.bedRequired ? (
                <Chip size="small" label="No bed available" color="default" />
              ) : null}
            </Box>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Nurses Tab ──────────────────────────────────────────────────────────────
function NursesTab() {
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [wardFilter, setWardFilter] = useState('All');
  const [addOpen, setAddOpen] = useState(false);
  const [newNurse, setNewNurse] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    ward: 'General', shift: 'Morning', specialization: '', experience: 0,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNurses = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params = wardFilter !== 'All' ? { ward: wardFilter } : {};
      const res = await nursesAPI.getAll(params);
      setNurses(res.data.nurses || res.data || []);
    } catch (e) {
      setErr('Failed to load nurses.');
    } finally {
      setLoading(false);
    }
  }, [wardFilter]);

  useEffect(() => { fetchNurses(); }, [fetchNurses]);

  const handleAdd = async () => {
    setActionLoading(true);
    try {
      await nursesAPI.create(newNurse);
      setAddOpen(false);
      setNewNurse({ firstName: '', lastName: '', email: '', phone: '', ward: 'General', shift: 'Morning', specialization: '', experience: 0 });
      fetchNurses();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to add nurse.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await nursesAPI.delete(id);
      fetchNurses();
    } catch (e) {
      setErr(e.response?.data?.message || 'Cannot delete nurse with assigned patients.');
    }
  };

  return (
    <Box>
      <SmartAssignPanel />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter by Ward</InputLabel>
          <Select value={wardFilter} label="Filter by Ward" onChange={e => setWardFilter(e.target.value)}>
            <MenuItem value="All">All Wards</MenuItem>
            {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchNurses}>Refresh</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add Nurse</Button>
      </Box>

      {err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr(null)}>{err}</Alert>}

      {loading ? (
        <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Nurse</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ward</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Patient Load</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nurses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No nurses found.
                  </TableCell>
                </TableRow>
              ) : nurses.map(n => {
                const load = (n.assignedPatients?.length || 0);
                const max = n.maxPatientLoad || 5;
                const pct = Math.min((load / max) * 100, 100);
                return (
                  <TableRow key={n._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#0891b2', width: 36, height: 36, fontSize: '0.8rem' }}>
                          {n.firstName?.[0]}{n.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {n.firstName} {n.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{n.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={n.ward} size="small" /></TableCell>
                    <TableCell>{n.shift}</TableCell>
                    <TableCell>
                      <Chip
                        label={n.status}
                        color={n.status === 'On Duty' ? 'success' : n.status === 'On Break' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Box>
                        <Typography variant="caption">{load}/{max} patients</Typography>
                        <LinearProgress
                          variant="determinate" value={pct}
                          color={pct >= 80 ? 'error' : pct >= 50 ? 'warning' : 'success'}
                          sx={{ mt: 0.5, borderRadius: 1, height: 6 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Remove nurse">
                        <IconButton size="small" color="error" onClick={() => handleDelete(n._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Nurse Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Nurse</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[['First Name', 'firstName'], ['Last Name', 'lastName'], ['Email', 'email'], ['Phone', 'phone'], ['Specialization', 'specialization']].map(([label, key]) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField fullWidth label={label} value={newNurse[key]}
                  onChange={e => setNewNurse({ ...newNurse, [key]: e.target.value })} />
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ward</InputLabel>
                <Select value={newNurse.ward} label="Ward" onChange={e => setNewNurse({ ...newNurse, ward: e.target.value })}>
                  {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Shift</InputLabel>
                <Select value={newNurse.shift} label="Shift" onChange={e => setNewNurse({ ...newNurse, shift: e.target.value })}>
                  {SHIFTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Experience (years)" type="number" value={newNurse.experience}
                onChange={e => setNewNurse({ ...newNurse, experience: Number(e.target.value) })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={actionLoading || !newNurse.firstName || !newNurse.email}>
            {actionLoading ? <CircularProgress size={18} /> : 'Add Nurse'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Attendance Tab ──────────────────────────────────────────────────────────
function AttendanceTab() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [attRes, statsRes] = await Promise.all([
        attendanceAPI.getAll({ limit: 20 }),
        attendanceAPI.getStats(),
      ]);
      setRecords(attRes.data.attendances || []);
      setStats(statsRes.data);
    } catch (e) {
      setErr('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtTime = (t) => t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <Box>
      {err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr(null)}>{err}</Alert>}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {(stats.stats || []).map(s => (
            <Grid item xs={6} md={3} key={s._id}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{s.count}</Typography>
                <Typography variant="caption" color="text.secondary">{s._id}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>Refresh</Button>
      </Box>

      {loading ? (
        <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Clock In</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Clock Out</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hours</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : records.map(r => (
                <TableRow key={r._id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.staff?.name || r.staff?.email || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{fmtDate(r.date)}</TableCell>
                  <TableCell>{r.shift || '—'}</TableCell>
                  <TableCell>{fmtTime(r.clockIn?.time)}</TableCell>
                  <TableCell>{fmtTime(r.clockOut?.time)}</TableCell>
                  <TableCell>{r.totalHours ? `${r.totalHours.toFixed(1)}h` : '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.status || 'Present'}
                      color={r.status === 'Absent' ? 'error' : r.status === 'Late' ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ─── Doctors Summary Tab ─────────────────────────────────────────────────────
function DoctorsSummaryTab() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState('');

  const fetchDoctors = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const res = await doctorsAPI.getAll(search ? { search } : {});
      setDoctors(res.data.doctors || res.data || []);
    } catch (e) { setErr('Failed to load doctors.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  return (
    <Box>
      {err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr(null)}>{err}</Alert>}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search doctors..."
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDoctors}>Refresh</Button>
      </Box>
      {loading ? (
        <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          {doctors.map(d => (
            <Grid item xs={12} sm={6} md={4} key={d._id}>
              <Card variant="outlined">
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#dc2626', width: 48, height: 48 }}>
                    {d.firstName?.[0]}{d.lastName?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      Dr. {d.firstName} {d.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{d.specialization}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={d.status}
                        color={d.status === 'Active' ? 'success' : d.status === 'On Leave' ? 'warning' : 'error'}
                        size="small"
                      />
                      {d.mlAccess && <Chip label="ML" color="info" size="small" />}
                      {d.chatAccess && <Chip label="Chat" color="secondary" size="small" />}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {doctors.length === 0 && (
            <Grid item xs={12}>
              <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No doctors found.</Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}

// ─── Main StaffManagement Component ────────────────────────────────────────
function StaffManagement() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626', mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Staff Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Unified management for doctors, nurses, and attendance — with injury-aware smart assignment
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
            <Tab icon={<DoctorIcon />} iconPosition="start" label="Doctors" />
            <Tab icon={<NurseIcon />} iconPosition="start" label="Nurses & Triage" />
            <Tab icon={<AttendanceIcon />} iconPosition="start" label="Attendance" />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          {tab === 0 && <DoctorsSummaryTab />}
          {tab === 1 && <NursesTab />}
          {tab === 2 && <AttendanceTab />}
        </Box>
      </Card>
    </Box>
  );
}

export default StaffManagement;
