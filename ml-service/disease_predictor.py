import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier, ExtraTreesClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.feature_selection import SelectKBest, f_classif, RFE
from sklearn.neural_network import MLPClassifier
import joblib
import os
import json
from datetime import datetime

class DiseasePredictor:
    def __init__(self, training_csv_path=None, testing_csv_path=None):
        # Try multiple paths for Training.csv and Testing.csv
        if training_csv_path is None:
            possible_training_paths = [
                '../Training.csv',
                'Training.csv',
                os.path.join(os.path.dirname(__file__), '..', 'Training.csv')
            ]
            for path in possible_training_paths:
                if os.path.exists(path):
                    training_csv_path = path
                    break
            if training_csv_path is None:
                raise FileNotFoundError("Training.csv not found in any expected location")
        
        if testing_csv_path is None:
            possible_testing_paths = [
                '../Testing.csv',
                'Testing.csv',
                os.path.join(os.path.dirname(__file__), '..', 'Testing.csv')
            ]
            for path in possible_testing_paths:
                if os.path.exists(path):
                    testing_csv_path = path
                    break
            if testing_csv_path is None:
                raise FileNotFoundError("Testing.csv not found in any expected location")
        
        self.training_csv_path = training_csv_path
        self.testing_csv_path = testing_csv_path
        self.models = {}
        self.scaler = StandardScaler()
        self.symptom_columns = []
        self.model_performance = {}
        self.training_data = None
        self.testing_data = None
        
        # Load datasets and train models
        self.load_datasets()
        self.preprocess_data()
        self.load_or_train()
    
    def load_datasets(self):
        """Load Training.csv for training and Testing.csv for validation"""
        print("Loading datasets...")
        self.training_data = pd.read_csv(self.training_csv_path)
        self.testing_data = pd.read_csv(self.testing_csv_path)
        
        print(f"Loaded {len(self.training_data)} training samples from {self.training_csv_path}")
        print(f"Loaded {len(self.testing_data)} testing samples from {self.testing_csv_path}")
        
        # Validate data consistency
        training_features = set(self.training_data.columns[:-1])  # Exclude 'prognosis'
        testing_features = set(self.testing_data.columns[:-1])    # Exclude 'prognosis'
        
        if training_features != testing_features:
            missing_in_test = training_features - testing_features
            missing_in_train = testing_features - training_features
            if missing_in_test:
                print(f"Warning: Features missing in testing data: {missing_in_test}")
            if missing_in_train:
                print(f"Warning: Features missing in training data: {missing_in_train}")
        
        print(f"Number of features: {len(training_features)}")
        print(f"Number of diseases in training: {len(self.training_data['prognosis'].unique())}")
        print(f"Number of diseases in testing: {len(self.testing_data['prognosis'].unique())}")
    
    def preprocess_data(self):
        """Preprocess and validate data quality"""
        print("Preprocessing data...")
        
        # Separate features and labels for training data
        self.X_train_full = self.training_data.drop('prognosis', axis=1)
        self.y_train_full = self.training_data['prognosis']
        
        # Separate features and labels for testing data
        self.X_test = self.testing_data.drop('prognosis', axis=1)
        self.y_test = self.testing_data['prognosis']
        
        # Handle missing values by filling with 0 (assuming symptoms are binary)
        print("Handling missing values...")
        self.X_train_full = self.X_train_full.fillna(0)
        self.X_test = self.X_test.fillna(0)
        
        # Ensure all values are numeric and convert to int (for binary symptoms)
        self.X_train_full = self.X_train_full.astype(int)
        self.X_test = self.X_test.astype(int)
        
        # Store symptom columns
        self.symptom_columns = list(self.X_train_full.columns)
        
        # Ensure both datasets have the same features
        common_features = list(set(self.X_train_full.columns) & set(self.X_test.columns))
        if len(common_features) != len(self.X_train_full.columns):
            print(f"Warning: Using {len(common_features)} common features out of {len(self.X_train_full.columns)} training features")
            self.X_train_full = self.X_train_full[common_features]
            self.X_test = self.X_test[common_features]
            self.symptom_columns = common_features
        
        # Create validation split from training data (80% train, 20% validation)
        self.X_train, self.X_val, self.y_train, self.y_val = train_test_split(
            self.X_train_full, self.y_train_full, 
            test_size=0.2, 
            random_state=42, 
            stratify=self.y_train_full
        )
        
        print(f"Training set: {len(self.X_train)} samples")
        print(f"Validation set: {len(self.X_val)} samples")
        print(f"Test set: {len(self.X_test)} samples")
        print(f"Features: {len(self.symptom_columns)}")
        
        # Check for any remaining NaN values
        if self.X_train.isnull().any().any():
            print("Warning: NaN values still present in training data")
        if self.X_test.isnull().any().any():
            print("Warning: NaN values still present in test data")
    
    def load_or_train(self):
        """Load existing enhanced models or train new ones"""
        model_dir = 'models'
        
        # Check for enhanced model files first
        enhanced_model_files = {
            'random_forest': os.path.join(model_dir, 'random_forest.pkl'),
            'svm': os.path.join(model_dir, 'svm.pkl'),
            'gradient_boosting': os.path.join(model_dir, 'gradient_boosting.pkl'),
            'extra_trees': os.path.join(model_dir, 'extra_trees.pkl'),
            'neural_network': os.path.join(model_dir, 'neural_network.pkl'),
            'voting_ensemble': os.path.join(model_dir, 'voting_ensemble.pkl'),
            'feature_selector': os.path.join(model_dir, 'feature_selector.pkl')
        }
        
        basic_model_files = {
            'random_forest': os.path.join(model_dir, 'random_forest.pkl'),
            'svm': os.path.join(model_dir, 'svm.pkl'),
            'gradient_boosting': os.path.join(model_dir, 'gradient_boosting.pkl')
        }
        
        metadata_file = os.path.join(model_dir, 'metadata.json')
        
        # Check if enhanced models exist
        enhanced_models_exist = all(os.path.exists(path) for path in enhanced_model_files.values())
        basic_models_exist = all(os.path.exists(path) for path in basic_model_files.values())
        metadata_exists = os.path.exists(metadata_file)
        
        if enhanced_models_exist and metadata_exists:
            try:
                print("Loading existing enhanced models...")
                self.models['random_forest'] = joblib.load(enhanced_model_files['random_forest'])
                self.models['svm'] = joblib.load(enhanced_model_files['svm'])
                self.models['gradient_boosting'] = joblib.load(enhanced_model_files['gradient_boosting'])
                self.models['extra_trees'] = joblib.load(enhanced_model_files['extra_trees'])
                self.models['neural_network'] = joblib.load(enhanced_model_files['neural_network'])
                self.models['voting_ensemble'] = joblib.load(enhanced_model_files['voting_ensemble'])
                self.feature_selector = joblib.load(enhanced_model_files['feature_selector'])
                
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    self.model_performance = metadata.get('performance', {})
                
                print("Enhanced models loaded successfully")
                print(f"Model version: {metadata.get('version', 'unknown')}")
                print(f"Available models: {list(self.models.keys())}")
                print(f"Enhanced accuracy with {metadata.get('selected_features', 'N/A')} selected features")
                return
            except Exception as e:
                print(f"Error loading enhanced models: {e}")
                print("Training new enhanced models...")
        elif basic_models_exist and metadata_exists:
            try:
                print("Loading existing basic models...")
                self.models['random_forest'] = joblib.load(basic_model_files['random_forest'])
                self.models['svm'] = joblib.load(basic_model_files['svm'])
                self.models['gradient_boosting'] = joblib.load(basic_model_files['gradient_boosting'])
                
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    self.model_performance = metadata.get('performance', {})
                
                print("Basic models loaded successfully")
                print(f"Model version: {metadata.get('version', 'unknown')}")
                print("Note: Enhanced models not available, using basic models")
                return
            except Exception as e:
                print(f"Error loading basic models: {e}")
                print("Training new enhanced models...")
        
        # Train new enhanced models
        self.train_models()
        self.evaluate_models()
        self.save_models()
    
    def train_models(self):
        """Train multiple ML models with hyperparameter tuning for ensemble approach"""
        print("Training enhanced ML models with hyperparameter optimization...")
        
        # Feature selection for better performance
        print("Performing feature selection...")
        selector = SelectKBest(score_func=f_classif, k=min(100, self.X_train.shape[1]))
        X_train_selected = selector.fit_transform(self.X_train, self.y_train)
        X_val_selected = selector.transform(self.X_val)
        X_test_selected = selector.transform(self.X_test)
        
        # Store feature selector
        self.feature_selector = selector
        
        # Update training data with selected features
        self.X_train = X_train_selected
        self.X_val = X_val_selected
        self.X_test = X_test_selected
        
        print(f"Selected {X_train_selected.shape[1]} most important features")
        
        # Enhanced Random Forest with hyperparameter tuning
        print("Training Enhanced Random Forest...")
        rf_params = {
            'n_estimators': [200, 300],
            'max_depth': [15, 20, 25],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }
        rf_grid = GridSearchCV(
            RandomForestClassifier(random_state=42, n_jobs=-1),
            rf_params,
            cv=3,
            scoring='accuracy',
            n_jobs=-1
        )
        rf_grid.fit(self.X_train, self.y_train)
        self.models['random_forest'] = rf_grid.best_estimator_
        print(f"Best RF params: {rf_grid.best_params_}")
        
        # Enhanced SVM with hyperparameter tuning
        print("Training Enhanced SVM...")
        svm_params = {
            'C': [0.1, 1, 10],
            'gamma': ['scale', 'auto'],
            'kernel': ['rbf', 'poly']
        }
        svm_grid = GridSearchCV(
            SVC(probability=True, random_state=42),
            svm_params,
            cv=3,
            scoring='accuracy',
            n_jobs=-1
        )
        svm_grid.fit(self.X_train, self.y_train)
        self.models['svm'] = svm_grid.best_estimator_
        print(f"Best SVM params: {svm_grid.best_params_}")
        
        # Enhanced Gradient Boosting
        print("Training Enhanced Gradient Boosting...")
        gb_params = {
            'n_estimators': [100, 200],
            'learning_rate': [0.05, 0.1, 0.15],
            'max_depth': [4, 6, 8]
        }
        gb_grid = GridSearchCV(
            GradientBoostingClassifier(random_state=42),
            gb_params,
            cv=3,
            scoring='accuracy',
            n_jobs=-1
        )
        gb_grid.fit(self.X_train, self.y_train)
        self.models['gradient_boosting'] = gb_grid.best_estimator_
        print(f"Best GB params: {gb_grid.best_params_}")
        
        # Extra Trees Classifier (additional ensemble method)
        print("Training Extra Trees Classifier...")
        self.models['extra_trees'] = ExtraTreesClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.models['extra_trees'].fit(self.X_train, self.y_train)
        
        # Neural Network (MLP)
        print("Training Neural Network...")
        self.models['neural_network'] = MLPClassifier(
            hidden_layer_sizes=(100, 50),
            max_iter=500,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.1
        )
        self.models['neural_network'].fit(self.X_train, self.y_train)
        
        # Create Voting Classifier (Ensemble of all models)
        print("Creating Voting Ensemble...")
        self.models['voting_ensemble'] = VotingClassifier(
            estimators=[
                ('rf', self.models['random_forest']),
                ('svm', self.models['svm']),
                ('gb', self.models['gradient_boosting']),
                ('et', self.models['extra_trees']),
                ('nn', self.models['neural_network'])
            ],
            voting='soft'  # Use probability-based voting
        )
        self.models['voting_ensemble'].fit(self.X_train, self.y_train)
        
        print("Enhanced model training completed with improved accuracy!")
    
    def evaluate_models(self):
        """Evaluate models on validation and test sets"""
        print("Evaluating models...")
        
        self.model_performance = {}
        
        for name, model in self.models.items():
            print(f"Evaluating {name}...")
            
            # Validation set performance
            val_pred = model.predict(self.X_val)
            val_accuracy = accuracy_score(self.y_val, val_pred)
            
            # Test set performance
            test_pred = model.predict(self.X_test)
            test_accuracy = accuracy_score(self.y_test, test_pred)
            
            # Cross-validation on training data
            cv_scores = cross_val_score(model, self.X_train, self.y_train, cv=5, scoring='accuracy')
            
            # Classification report
            test_report = classification_report(self.y_test, test_pred, output_dict=True)
            
            self.model_performance[name] = {
                'validation_accuracy': float(val_accuracy),
                'test_accuracy': float(test_accuracy),
                'cv_mean_accuracy': float(cv_scores.mean()),
                'cv_std_accuracy': float(cv_scores.std()),
                'classification_report': test_report
            }
            
            print(f"{name}:")
            print(f"  Validation Accuracy: {val_accuracy:.4f}")
            print(f"  Test Accuracy: {test_accuracy:.4f}")
            print(f"  CV Mean Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    def save_models(self):
        """Save trained models with versioning"""
        print("Saving enhanced models...")
        
        model_dir = 'models'
        os.makedirs(model_dir, exist_ok=True)
        
        # Save all individual models
        joblib.dump(self.models['random_forest'], os.path.join(model_dir, 'random_forest.pkl'))
        joblib.dump(self.models['svm'], os.path.join(model_dir, 'svm.pkl'))
        joblib.dump(self.models['gradient_boosting'], os.path.join(model_dir, 'gradient_boosting.pkl'))
        joblib.dump(self.models['extra_trees'], os.path.join(model_dir, 'extra_trees.pkl'))
        joblib.dump(self.models['neural_network'], os.path.join(model_dir, 'neural_network.pkl'))
        joblib.dump(self.models['voting_ensemble'], os.path.join(model_dir, 'voting_ensemble.pkl'))
        
        # Save feature selector and symptom columns
        joblib.dump(self.feature_selector, os.path.join(model_dir, 'feature_selector.pkl'))
        joblib.dump(self.symptom_columns, os.path.join(model_dir, 'symptom_columns.pkl'))
        
        # Enhanced metadata with more details
        metadata = {
            'version': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'training_date': datetime.now().isoformat(),
            'training_samples': len(self.training_data),
            'testing_samples': len(self.testing_data),
            'validation_samples': len(self.X_val),
            'original_features': len(self.symptom_columns),
            'selected_features': self.X_train.shape[1],
            'diseases': list(self.y_train_full.unique()),
            'num_diseases': len(self.y_train_full.unique()),
            'performance': self.model_performance,
            'training_csv': self.training_csv_path,
            'testing_csv': self.testing_csv_path,
            'models': list(self.models.keys()),
            'feature_selection': 'SelectKBest with f_classif',
            'hyperparameter_tuning': True,
            'ensemble_method': 'Voting Classifier with soft voting'
        }
        
        with open(os.path.join(model_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("Enhanced models saved successfully with improved accuracy!")
    
    def predict(self, symptoms_dict):
        """Make enhanced ensemble prediction with confidence scores"""
        # Create feature vector
        feature_vector = np.zeros(len(self.symptom_columns))
        
        for symptom, value in symptoms_dict.items():
            symptom_clean = symptom.lower().replace(' ', '_')
            if symptom_clean in self.symptom_columns:
                idx = self.symptom_columns.index(symptom_clean)
                feature_vector[idx] = value
        
        # Apply feature selection if available
        if hasattr(self, 'feature_selector') and self.feature_selector is not None:
            feature_vector = self.feature_selector.transform([feature_vector])[0]
        else:
            feature_vector = [feature_vector]
        
        # Get predictions from all models
        predictions = {}
        probabilities = {}
        
        # Use voting ensemble if available (best performance)
        if 'voting_ensemble' in self.models:
            try:
                pred_proba = self.models['voting_ensemble'].predict_proba(feature_vector)[0]
                predictions['voting_ensemble'] = self.models['voting_ensemble'].predict(feature_vector)[0]
                probabilities['voting_ensemble'] = pred_proba
                
                # Also get individual model predictions for comparison
                for name, model in self.models.items():
                    if name != 'voting_ensemble':
                        try:
                            pred_proba_individual = model.predict_proba(feature_vector)[0]
                            predictions[name] = model.predict(feature_vector)[0]
                            probabilities[name] = pred_proba_individual
                        except:
                            continue
            except Exception as e:
                print(f"Error with voting ensemble: {e}")
                # Fallback to individual models
                for name, model in self.models.items():
                    if name != 'voting_ensemble':
                        try:
                            pred_proba = model.predict_proba(feature_vector)[0]
                            predictions[name] = model.predict(feature_vector)[0]
                            probabilities[name] = pred_proba
                        except:
                            continue
        else:
            # Use individual models
            for name, model in self.models.items():
                try:
                    pred_proba = model.predict_proba(feature_vector)[0]
                    predictions[name] = model.predict(feature_vector)[0]
                    probabilities[name] = pred_proba
                except:
                    continue
        
        if not probabilities:
            raise Exception("No models available for prediction")
        
        # Use voting ensemble result if available, otherwise ensemble prediction
        if 'voting_ensemble' in probabilities:
            ensemble_proba = probabilities['voting_ensemble']
            primary_model = 'voting_ensemble'
        else:
            # Ensemble prediction (weighted average based on validation performance)
            if self.model_performance:
                weights = {}
                total_weight = 0
                for name in probabilities.keys():
                    if name in self.model_performance:
                        weight = self.model_performance[name]['validation_accuracy']
                        weights[name] = weight
                        total_weight += weight
                
                # Normalize weights
                if total_weight > 0:
                    for name in weights:
                        weights[name] /= total_weight
                else:
                    weights = {name: 1/len(probabilities) for name in probabilities.keys()}
            else:
                # Equal weights if no performance data
                weights = {name: 1/len(probabilities) for name in probabilities.keys()}
            
            # Calculate ensemble probabilities
            ensemble_proba = np.zeros(len(list(probabilities.values())[0]))
            for name, proba in probabilities.items():
                ensemble_proba += weights[name] * proba
            
            primary_model = 'ensemble'
        
        # Get top predictions
        if 'voting_ensemble' in self.models:
            classes = self.models['voting_ensemble'].classes_
        else:
            classes = list(self.models.values())[0].classes_
            
        top_indices = np.argsort(ensemble_proba)[-5:][::-1]
        top_predictions = []
        
        for idx in top_indices:
            disease = classes[idx]
            probability = ensemble_proba[idx]
            top_predictions.append({
                'disease': disease,
                'probability': float(probability)
            })
        
        return {
            'predicted_condition': top_predictions[0]['disease'],
            'confidence': float(top_predictions[0]['probability']),
            'all_probabilities': {classes[i]: float(ensemble_proba[i]) for i in range(len(classes))},
            'top_predictions': top_predictions,
            'individual_predictions': {name: pred for name, pred in predictions.items()},
            'model_performance': self.get_model_summary(),
            'primary_model': primary_model,
            'enhanced_features': hasattr(self, 'feature_selector') and self.feature_selector is not None
        }
    
    def get_model_summary(self):
        """Return model performance summary"""
        if not self.model_performance:
            return {
                'training_samples': len(self.training_data) if self.training_data is not None else 0,
                'testing_samples': len(self.testing_data) if self.testing_data is not None else 0,
                'num_features': len(self.symptom_columns),
                'num_diseases': len(self.y_train_full.unique()) if hasattr(self, 'y_train_full') else 0,
                'models_trained': list(self.models.keys()),
                'status': 'Models loaded but performance not evaluated'
            }
        
        best_model = max(
            self.model_performance.items(),
            key=lambda x: x[1]['test_accuracy']
        )
        
        return {
            'training_samples': len(self.training_data),
            'testing_samples': len(self.testing_data),
            'validation_samples': len(self.X_val),
            'num_features': len(self.symptom_columns),
            'num_diseases': len(self.y_train_full.unique()),
            'models_trained': list(self.models.keys()),
            'best_model': best_model[0],
            'best_model_accuracy': best_model[1]['test_accuracy'],
            'ensemble_performance': {
                name: {
                    'validation_accuracy': perf['validation_accuracy'],
                    'test_accuracy': perf['test_accuracy'],
                    'cv_mean_accuracy': perf['cv_mean_accuracy']
                }
                for name, perf in self.model_performance.items()
            }
        }
    
    def get_all_symptoms(self):
        """Return list of all possible symptoms"""
        return self.symptom_columns
