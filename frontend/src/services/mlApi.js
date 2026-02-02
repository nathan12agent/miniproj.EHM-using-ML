const ML_API_BASE_URL = 'http://localhost:5001';

class MLApiService {
  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${ML_API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ML API Error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }

  // Get all available symptoms
  async getSymptoms() {
    return this.makeRequest('/symptoms');
  }

  // Predict disease based on symptoms
  async predictDisease(symptoms, patientInfo = {}) {
    return this.makeRequest('/predict', {
      method: 'POST',
      body: JSON.stringify({
        symptoms,
        patient_info: patientInfo,
      }),
    });
  }

  // Batch prediction for multiple patients
  async batchPredict(patients) {
    return this.makeRequest('/batch_predict', {
      method: 'POST',
      body: JSON.stringify({
        patients,
      }),
    });
  }

  // Get model information
  async getModelInfo() {
    return this.makeRequest('/model_info');
  }

  // Mock prediction for when ML service is not available
  mockPredict(symptoms, patientInfo = {}) {
    const selectedSymptoms = Object.keys(symptoms).filter(s => symptoms[s] === 1);
    
    if (selectedSymptoms.length === 0) {
      throw new Error('No symptoms selected');
    }

    // Mock prediction logic
    let mockPrediction;
    if (selectedSymptoms.includes('fever') && selectedSymptoms.includes('cough')) {
      mockPrediction = {
        predicted_condition: 'Common Cold',
        confidence: 0.85,
        top_predictions: [
          { disease: 'Common Cold', probability: 0.85 },
          { disease: 'Flu', probability: 0.12 },
          { disease: 'Bronchitis', probability: 0.03 },
        ]
      };
    } else if (selectedSymptoms.includes('chest_pain') && selectedSymptoms.includes('shortness_of_breath')) {
      mockPrediction = {
        predicted_condition: 'Heart Disease',
        confidence: 0.78,
        top_predictions: [
          { disease: 'Heart Disease', probability: 0.78 },
          { disease: 'Anxiety', probability: 0.15 },
          { disease: 'Asthma', probability: 0.07 },
        ]
      };
    } else if (selectedSymptoms.includes('headache') && selectedSymptoms.includes('nausea')) {
      mockPrediction = {
        predicted_condition: 'Migraine',
        confidence: 0.72,
        top_predictions: [
          { disease: 'Migraine', probability: 0.72 },
          { disease: 'Tension Headache', probability: 0.20 },
          { disease: 'Sinusitis', probability: 0.08 },
        ]
      };
    } else {
      mockPrediction = {
        predicted_condition: 'General Malaise',
        confidence: 0.45,
        top_predictions: [
          { disease: 'General Malaise', probability: 0.45 },
          { disease: 'Viral Infection', probability: 0.30 },
          { disease: 'Stress', probability: 0.25 },
        ]
      };
    }

    return Promise.resolve({
      patient_info: patientInfo,
      symptoms_analyzed: selectedSymptoms,
      prediction: mockPrediction,
      timestamp: new Date().toISOString(),
      model_info: {
        type: 'Mock Random Forest Classifier',
        features_count: 24
      },
      mock: true
    });
  }

  // Predict with fallback to mock
  async predictWithFallback(symptoms, patientInfo = {}) {
    try {
      // Try real ML service first
      return await this.predictDisease(symptoms, patientInfo);
    } catch (error) {
      console.warn('ML service unavailable, using mock prediction:', error);
      // Fallback to mock prediction
      return this.mockPredict(symptoms, patientInfo);
    }
  }

  // Get symptoms with fallback
  async getSymptomsWithFallback() {
    try {
      return await this.getSymptoms();
    } catch (error) {
      console.warn('ML service unavailable, using mock symptoms:', error);
      // Return mock symptoms
      const mockSymptoms = [
        'fever', 'cough', 'headache', 'fatigue', 'nausea', 'vomiting',
        'diarrhea', 'abdominal_pain', 'chest_pain', 'shortness_of_breath',
        'dizziness', 'muscle_pain', 'joint_pain', 'sore_throat', 'runny_nose',
        'loss_of_appetite', 'weight_loss', 'night_sweats', 'skin_rash',
        'blurred_vision', 'confusion', 'seizures', 'numbness', 'weakness'
      ];

      return {
        symptoms: mockSymptoms.map(symptom => ({
          id: symptom,
          name: symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: symptom
        })),
        total_count: mockSymptoms.length,
        mock: true
      };
    }
  }
}

export const mlApi = new MLApiService();
export default mlApi;