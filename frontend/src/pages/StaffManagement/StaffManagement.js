import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Badge, 
  Form, Modal, Alert, Spinner 
} from 'react-bootstrap';
import { 
  FaUserPlus, FaBrain, FaChartBar, FaCog, 
  FaExclamationTriangle, FaCheckCircle 
} from 'react-icons/fa';
import axios from 'axios';
import './StaffManagement.css';

const StaffManagement = () => {
  // State management
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(false);
  const [kpis, setKpis] = useState({
    totalStaff: 0,
    onDuty: 0,
    shortageAlert: 0,
    avgAbsenteeismRisk: 0,
    highBurnoutCount: 0
  });
  
  const [filters, setFilters] = useState({
    role: 'all',
    department: 'all',
    searchTerm: ''
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [alert, setAlert] = useState(null);

  // Fetch staff data on component mount
  useEffect(() => {
    fetchStaffData();
    fetchKPIs();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/staff', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStaff(response.data.staff);
    } catch (error) {
      showAlert('error', 'Failed to fetch staff data');
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIs = async () => {
    try {
      const response = await axios.get('/api/admin/staff/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setKpis(response.data);
    } catch (error) {
      console.error('Failed to fetch KPIs', error);
    }
  };

  const runMLPredictions = async () => {
    try {
      setMlLoading(true);
      showAlert('info', 'Running ML predictions... This may take a moment.');
      
      // Run all ML predictions
      await Promise.all([
        axios.post('http://localhost:5001/ml/staff/predict_absenteeism'),
        axios.post('http://localhost:5001/ml/staff/predict_burnout'),
        axios.post('http://localhost:5001/ml/staff/cluster_staff')
      ]);
      
      // Refresh data
      await fetchStaffData();
      await fetchKPIs();
      
      showAlert('success', 'ML predictions completed successfully!');
    } catch (error) {
      showAlert('error', 'ML predictions failed. Service may be unavailable.');
    } finally {
      setMlLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getRiskBadge = (risk, value) => {
    if (!value && value !== 0) return <Badge bg="secondary">N/A</Badge>;
    
    if (risk === 'Low' || value < 30) {
      return <Badge bg="success">{value}% 🟢</Badge>;
    } else if (risk === 'Medium' || value < 60) {
      return <Badge bg="warning">{value}% 🟡</Badge>;
    } else {
      return <Badge bg="danger">{value}% 🔴</Badge>;
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesRole = filters.role === 'all' || s.role === filters.role;
    const matchesDept = filters.department === 'all' || s.department === filters.department;
    const matchesSearch = s.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         s.staffId.toLowerCase().includes(filters.searchTerm.toLowerCase());
    return matchesRole && matchesDept && matchesSearch;
  });

  return (
    <Container fluid className="staff-management-dashboard">
      {/* Alert */}
      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="dashboard-title">
            <FaChartBar className="me-2" />
            Staff Management Dashboard
          </h2>
          <p className="text-muted">ML-Powered Staff Optimization & Predictive Analytics</p>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="kpi-card">
            <Card.Body>
              <h6 className="text-muted">Total Staff</h6>
              <h3>{kpis.totalStaff}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="kpi-card">
            <Card.Body>
              <h6 className="text-muted">On-Duty</h6>
              <h3 className="text-success">{kpis.onDuty}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className={`kpi-card ${kpis.shortageAlert > 0 ? 'border-danger' : 'border-success'}`}>
            <Card.Body>
              <h6 className="text-muted">Shortage Alert</h6>
              <h3 className={kpis.shortageAlert > 0 ? 'text-danger' : 'text-success'}>
                {kpis.shortageAlert > 0 ? (
                  <><FaExclamationTriangle /> {kpis.shortageAlert} Depts</>
                ) : (
                  <><FaCheckCircle /> All Good</>
                )}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="kpi-card">
            <Card.Body>
              <h6 className="text-muted">Avg Absenteeism Risk</h6>
              <h3>{kpis.avgAbsenteeismRisk.toFixed(1)}%</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="kpi-card border-warning">
            <Card.Body>
              <h6 className="text-muted">High Burnout</h6>
              <h3 className="text-warning">{kpis.highBurnoutCount}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Main Content - Staff Table */}
        <Col md={9}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Staff Directory</h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <FaUserPlus className="me-1" /> Add Staff
                </Button>
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={runMLPredictions}
                  disabled={mlLoading}
                >
                  {mlLoading ? (
                    <><Spinner size="sm" className="me-1" /> Running...</>
                  ) : (
                    <><FaBrain className="me-1" /> Run ML Predictions</>
                  )}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Filters */}
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or ID..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filters.role}
                    onChange={(e) => setFilters({...filters, role: e.target.value})}
                  >
                    <option value="all">All Roles</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Technician">Technician</option>
                    <option value="Receptionist">Receptionist</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filters.department}
                    onChange={(e) => setFilters({...filters, department: e.target.value})}
                  >
                    <option value="all">All Departments</option>
                    <option value="ICU">ICU</option>
                    <option value="ER">Emergency</option>
                    <option value="General Ward">General Ward</option>
                    <option value="Lab">Laboratory</option>
                    <option value="Admin">Administration</option>
                  </Form.Select>
                </Col>
              </Row>

              {/* Staff Table */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading staff data...</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Experience</th>
                      <th>Status</th>
                      <th>Absence Risk</th>
                      <th>Burnout Risk</th>
                      <th>Cluster</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center">No staff found</td>
                      </tr>
                    ) : (
                      filteredStaff.map(s => (
                        <tr key={s._id}>
                          <td>{s.staffId}</td>
                          <td>{s.name}</td>
                          <td>{s.role}</td>
                          <td>{s.department}</td>
                          <td>{s.experienceYears}y</td>
                          <td>
                            <Badge bg={
                              s.currentStatus === 'On-Duty' ? 'success' :
                              s.currentStatus === 'Off-Duty' ? 'secondary' :
                              s.currentStatus === 'On-Leave' ? 'info' : 'danger'
                            }>
                              {s.currentStatus}
                            </Badge>
                          </td>
                          <td>
                            {getRiskBadge(
                              s.absenteeismRisk?.riskLevel, 
                              s.absenteeismRisk?.probability
                            )}
                          </td>
                          <td>
                            <Badge bg={
                              s.burnoutRisk?.level === 'Low' ? 'success' :
                              s.burnoutRisk?.level === 'Medium' ? 'warning' : 'danger'
                            }>
                              {s.burnoutRisk?.level || 'N/A'}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg="info">
                              {s.cluster?.label || 'Unassigned'}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-primary"
                              onClick={() => setSelectedStaff(s)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar - Quick Actions & Charts */}
        <Col md={3}>
          <Card className="mb-3">
            <Card.Header>
              <h6><FaCog className="me-2" />Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                  <FaUserPlus className="me-2" />Add New Staff
                </Button>
                <Button variant="success" onClick={runMLPredictions} disabled={mlLoading}>
                  <FaBrain className="me-2" />Run Predictions
                </Button>
                <Button variant="info">
                  <FaChartBar className="me-2" />Generate Roster
                </Button>
                <Button variant="secondary">
                  <FaChartBar className="me-2" />View Analytics
                </Button>
                <Button variant="outline-secondary">
                  <FaCog className="me-2" />ML Settings
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h6>ML Model Status</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <small className="text-muted">Absenteeism Model</small>
                <div className="d-flex justify-content-between">
                  <span>Random Forest</span>
                  <Badge bg="success">Active</Badge>
                </div>
              </div>
              <div className="mb-2">
                <small className="text-muted">Staffing Predictor</small>
                <div className="d-flex justify-content-between">
                  <span>RF Regressor</span>
                  <Badge bg="success">Active</Badge>
                </div>
              </div>
              <div className="mb-2">
                <small className="text-muted">Clustering</small>
                <div className="d-flex justify-content-between">
                  <span>K-Means (k=5)</span>
                  <Badge bg="success">Active</Badge>
                </div>
              </div>
              <div>
                <small className="text-muted">Burnout Predictor</small>
                <div className="d-flex justify-content-between">
                  <span>Random Forest</span>
                  <Badge bg="success">Active</Badge>
                </div>
              </div>
              <hr />
              <small className="text-muted">
                Last Updated: {new Date().toLocaleDateString()}
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StaffManagement;
