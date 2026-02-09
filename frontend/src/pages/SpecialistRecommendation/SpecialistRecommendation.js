import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Badge,
  Alert, Spinner, ListGroup, ButtonGroup
} from 'react-bootstrap';
import { FaUserMd, FaSearch, FaStethoscope, FaHeartbeat } from 'react-icons/fa';
import axios from 'axios';
import './SpecialistRecommendation.css';

const SpecialistRecommendation = () => {
  const [inputMethod, setInputMethod] = useState('symptoms');
  const [diseaseName, setDiseaseName] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const [specialists, setSpecialists] = useState([]);

  // Common symptoms for quick selection
  const commonSymptoms = [
    'fever', 'cough', 'fatigue', 'headache', 'chest_pain',
    'nausea', 'vomiting', 'dizziness', 'skin_rash', 'itching',
    'breathing_difficulty', 'abdominal_pain', 'joint_pain', 'muscle_pain',
    'sore_throat', 'runny_nose', 'loss_of_appetite', 'weight_loss'
  ];

  useEffect(() => {
    fetchSymptoms();
    fetchSpecialists();
  }, []);

  const fetchSymptoms = async () => {
    try {
      const response = await axios.get('http://localhost:5001/symptoms');
      setAllSymptoms(response.data.symptoms || []);
    } catch (error) {
      console.error('Failed to fetch symptoms', error);
    }
  };

  const fetchSpecialists = async () => {
    try {
      const response = await axios.get('http://localhost:5001/specialists');
      setSpecialists(response.data.specialists || []);
    } catch (error) {
      console.error('Failed to fetch specialists', error);
    }
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => ({
      ...prev,
      [symptom]: prev[symptom] ? 0 : 1
    }));
  };

  const getRecommendation = async () => {
    if (inputMethod === 'disease' && !diseaseName.trim()) {
      showAlert('warning', 'Please enter a disease name');
      return;
    }

    if (inputMethod === 'symptoms' && Object.values(selectedSymptoms).every(v => v === 0)) {
      showAlert('warning', 'Please select at least one symptom');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const requestData = inputMethod === 'disease'
        ? { disease: diseaseName }
        : { symptoms: selectedSymptoms };

      const response = await axios.post(
        'http://localhost:5001/recommend_specialist',
        requestData
      );

      setResult(response.data);
      showAlert('success', 'Specialist recommendation generated successfully!');
    } catch (error) {
      showAlert('error', error.response?.data?.error || 'Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.75) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'danger';
  };

  const resetForm = () => {
    setDiseaseName('');
    setSelectedSymptoms({});
    setResult(null);
  };

  return (
    <Container fluid className="specialist-recommendation-page">
      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <h2 className="page-title">
            <FaUserMd className="me-2" />
            Specialist Recommendation System
          </h2>
          <p className="text-muted">
            AI-powered specialist recommendation based on symptoms or disease diagnosis
          </p>
        </Col>
      </Row>

      <Row>
        {/* Input Form */}
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FaStethoscope className="me-2" />
                Patient Information
              </h5>
            </Card.Header>
            <Card.Body>
              {/* Input Method Toggle */}
              <Form.Group className="mb-4">
                <Form.Label><strong>Input Method:</strong></Form.Label>
                <ButtonGroup className="w-100">
                  <Button
                    variant={inputMethod === 'symptoms' ? 'primary' : 'outline-primary'}
                    onClick={() => setInputMethod('symptoms')}
                  >
                    <FaHeartbeat className="me-2" />
                    Symptoms
                  </Button>
                  <Button
                    variant={inputMethod === 'disease' ? 'primary' : 'outline-primary'}
                    onClick={() => setInputMethod('disease')}
                  >
                    <FaStethoscope className="me-2" />
                    Disease Name
                  </Button>
                </ButtonGroup>
              </Form.Group>

              <hr />

              {/* Symptoms Input */}
              {inputMethod === 'symptoms' && (
                <div>
                  <h6 className="mb-3">Select Patient Symptoms:</h6>
                  <Row>
                    {commonSymptoms.map(symptom => (
                      <Col md={6} lg={4} key={symptom} className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id={`symptom-${symptom}`}
                          label={symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          checked={selectedSymptoms[symptom] === 1}
                          onChange={() => toggleSymptom(symptom)}
                        />
                      </Col>
                    ))}
                  </Row>
                  <small className="text-muted">
                    Selected: {Object.values(selectedSymptoms).filter(v => v === 1).length} symptoms
                  </small>
                </div>
              )}

              {/* Disease Input */}
              {inputMethod === 'disease' && (
                <Form.Group>
                  <Form.Label><strong>Disease Name:</strong></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Heart Disease, Diabetes, Migraine"
                    value={diseaseName}
                    onChange={(e) => setDiseaseName(e.target.value)}
                    size="lg"
                  />
                  <Form.Text className="text-muted">
                    Enter the diagnosed disease name
                  </Form.Text>
                </Form.Group>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2 mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={getRecommendation}
                  disabled={loading}
                  className="flex-grow-1"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FaSearch className="me-2" />
                      Get Specialist Recommendation
                    </>
                  )}
                </Button>
                <Button variant="outline-secondary" size="lg" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Results Card */}
          {result && (
            <Card className="shadow-sm mt-4 border-success">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  <FaUserMd className="me-2" />
                  Recommendation Result
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <div className="text-center mb-4">
                      <h3 className="text-primary mb-3">
                        <FaUserMd size={40} className="me-2" />
                        {result.specialist}
                      </h3>
                      <Badge
                        bg={getConfidenceBadge(result.confidence)}
                        className="fs-6 px-3 py-2"
                      >
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <Col md={6}>
                    <Card className="bg-light">
                      <Card.Body>
                        <h6 className="text-muted mb-2">Disease</h6>
                        <p className="mb-0 fw-bold">{result.disease || 'N/A'}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="bg-light">
                      <Card.Body>
                        <h6 className="text-muted mb-2">Method</h6>
                        <p className="mb-0 fw-bold">
                          {result.method?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Alert variant="info" className="mt-3">
                  <strong>Reasoning:</strong><br />
                  {result.reasoning}
                </Alert>

                {/* Alternative Predictions */}
                {result.top_predictions && result.top_predictions.length > 0 && (
                  <div className="mt-3">
                    <h6>Alternative Diagnoses:</h6>
                    <ListGroup>
                      {result.top_predictions.slice(0, 3).map((pred, idx) => (
                        <ListGroup.Item
                          key={idx}
                          className="d-flex justify-content-between align-items-center"
                        >
                          {pred.disease}
                          <Badge bg="primary" pill>
                            {(pred.probability * 100).toFixed(1)}%
                          </Badge>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Sidebar - Specialists List */}
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">Available Specialists</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {specialists.length === 0 ? (
                <p className="text-muted">Loading specialists...</p>
              ) : (
                <ListGroup variant="flush">
                  {specialists.map((specialist, idx) => (
                    <ListGroup.Item key={idx} className="px-0">
                      <FaUserMd className="me-2 text-primary" />
                      {specialist}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm mt-3">
            <Card.Header>
              <h6 className="mb-0">How It Works</h6>
            </Card.Header>
            <Card.Body>
              <ol className="small">
                <li className="mb-2">
                  <strong>Select Input Method:</strong> Choose between entering symptoms or a disease name
                </li>
                <li className="mb-2">
                  <strong>Provide Information:</strong> Select symptoms or enter disease name
                </li>
                <li className="mb-2">
                  <strong>AI Analysis:</strong> Our ML model analyzes the input
                </li>
                <li className="mb-2">
                  <strong>Get Recommendation:</strong> Receive specialist recommendation with confidence score
                </li>
              </ol>
              <Alert variant="warning" className="small mb-0">
                <strong>Note:</strong> Low confidence recommendations will default to General Practitioner for proper diagnosis.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SpecialistRecommendation;
