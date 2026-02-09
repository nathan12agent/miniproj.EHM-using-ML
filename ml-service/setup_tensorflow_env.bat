@echo off
echo ========================================
echo Skin Disease Model - TensorFlow Setup
echo ========================================
echo.

echo Checking Python version...
python --version
echo.

echo IMPORTANT: TensorFlow requires Python 3.9-3.11
echo Current Python version is 3.14 (not compatible)
echo.
echo Please install Python 3.11 from:
echo https://www.python.org/downloads/release/python-3110/
echo.
echo Then run this script with Python 3.11:
echo py -3.11 setup_tensorflow_env.bat
echo.

pause

echo.
echo Creating virtual environment with Python 3.11...
py -3.11 -m venv venv_tf

echo.
echo Activating virtual environment...
call venv_tf\Scripts\activate.bat

echo.
echo Installing TensorFlow and dependencies...
pip install --upgrade pip
pip install tensorflow==2.13.0
pip install pillow numpy scikit-learn matplotlib
pip install flask flask-cors pandas

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To activate the environment:
echo   venv_tf\Scripts\activate
echo.
echo To train the model:
echo   python train_skin_disease_tensorflow.py
echo.
echo To run the ML service:
echo   python app.py
echo.
pause
