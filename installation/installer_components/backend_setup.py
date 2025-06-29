"""
Backend Setup Component
Handles Python environment setup and requirements installation
"""

import os
import sys
import subprocess
import platform
import time
from pathlib import Path

from qtpy.QtWidgets import (QWidget, QLabel, QVBoxLayout, QHBoxLayout, QPushButton,
                           QProgressBar, QApplication, QMessageBox, QTextEdit)
from qtpy.QtCore import Qt, QThread, Signal

from . import APP_NAME
from .ui_utils import (create_title_label, create_description_label, 
                     style_button, style_secondary_button, style_progress_bar)

class BackendSetupWorker(QThread):
    """Worker thread for backend setup"""
    update_progress = Signal(int, str)
    update_log = Signal(str)
    setup_complete = Signal(bool, str)
    
    def __init__(self, install_path):
        super().__init__()
        self.install_path = install_path
        
    def run(self):
        try:
            # Check if Python is installed
            self.update_progress.emit(10, "Checking Python installation...")
            python_cmd = self.check_python()
            
            if not python_cmd:
                self.update_progress.emit(15, "Python not found, installing Python...")
                if not self.install_python():
                    self.setup_complete.emit(False, "Failed to install Python")
                    return
                python_cmd = "python" if platform.system() == "Windows" else "python3"
            
            # Create virtual environment
            self.update_progress.emit(30, "Creating virtual environment...")
            venv_dir = os.path.join(self.install_path, "venv")
            self.update_log.emit(f"Creating virtual environment at: {venv_dir}")
            
            try:
                subprocess.run([python_cmd, "-m", "venv", venv_dir], check=True)
            except subprocess.CalledProcessError as e:
                self.update_log.emit(f"ERROR: Failed to create virtual environment: {str(e)}")
                self.setup_complete.emit(False, "Failed to create virtual environment")
                return
            
            # Get pip path
            if platform.system() == "Windows":
                pip_cmd = os.path.join(venv_dir, "Scripts", "pip")
            else:
                pip_cmd = os.path.join(venv_dir, "bin", "pip")
            
            # Install backend requirements
            self.update_progress.emit(50, "Installing backend requirements...")
            backend_dir = os.path.join(self.install_path, "backend")
            requirements_file = os.path.join(backend_dir, "requirements.txt")
            
            if not os.path.exists(backend_dir):
                self.update_log.emit(f"Creating backend directory: {backend_dir}")
                os.makedirs(backend_dir, exist_ok=True)
            
            if not os.path.exists(requirements_file):
                self.update_log.emit("requirements.txt not found, creating placeholder...")
                with open(requirements_file, 'w') as f:
                    f.write("# Backend requirements\n")
                    f.write("supabase==0.7.1\n")
                    f.write("psycopg2-binary==2.9.5\n")
                    f.write("python-dotenv==0.21.0\n")
            
            self.update_log.emit(f"Installing requirements from: {requirements_file}")
            try:
                result = subprocess.run([pip_cmd, "install", "-r", requirements_file], 
                                      check=True,
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.PIPE,
                                      text=True)
                self.update_log.emit(result.stdout)
                if result.stderr:
                    self.update_log.emit("STDERR: " + result.stderr)
            except subprocess.CalledProcessError as e:
                self.update_log.emit("ERROR: pip install failed")
                if e.stdout:
                    self.update_log.emit(e.stdout)
                if e.stderr:
                    self.update_log.emit(e.stderr)
                self.setup_complete.emit(False, "Failed to install backend requirements")
                return
            
            # Install App-Interface requirements
            self.update_progress.emit(80, "Installing App-Interface requirements...")
            app_interface_dir = os.path.join(self.install_path, "App-Interface")
            app_requirements_file = os.path.join(app_interface_dir, "requirements.txt")
            
            if not os.path.exists(app_interface_dir):
                self.update_log.emit(f"Creating App-Interface directory: {app_interface_dir}")
                os.makedirs(app_interface_dir, exist_ok=True)
            
            if not os.path.exists(app_requirements_file):
                self.update_log.emit("App-Interface requirements.txt not found, creating placeholder...")
                with open(app_requirements_file, 'w') as f:
                    f.write("# App-Interface requirements\n")
                    f.write("qtpy==2.3.0\n")
                    f.write("PySide6==6.4.0\n")
            
            self.update_log.emit(f"Installing requirements from: {app_requirements_file}")
            try:
                result = subprocess.run([pip_cmd, "install", "-r", app_requirements_file], 
                                      check=True,
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.PIPE,
                                      text=True)
                self.update_log.emit(result.stdout)
                if result.stderr:
                    self.update_log.emit("STDERR: " + result.stderr)
            except subprocess.CalledProcessError as e:
                self.update_log.emit("ERROR: pip install failed for App-Interface")
                if e.stdout:
                    self.update_log.emit(e.stdout)
                if e.stderr:
                    self.update_log.emit(e.stderr)
                self.setup_complete.emit(False, "Failed to install App-Interface requirements")
                return
            
            # Setup complete
            self.update_progress.emit(100, "Backend setup completed successfully")
            self.setup_complete.emit(True, "Backend has been successfully set up")
            
        except Exception as e:
            self.update_log.emit(f"ERROR: {str(e)}")
            self.setup_complete.emit(False, f"Setup failed: {str(e)}")
    
    def check_python(self):
        """Check if Python is installed and return the command"""
        try:
            # Try python3 first (Linux/macOS)
            try:
                result = subprocess.run(["python3", "--version"], 
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.PIPE,
                                      text=True,
                                      check=False)
                if result.returncode == 0:
                    self.update_log.emit(f"Found Python: {result.stdout.strip()}")
                    return "python3"
            except:
                pass
            
            # Try python (Windows)
            try:
                result = subprocess.run(["python", "--version"], 
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.PIPE,
                                      text=True,
                                      check=False)
                if result.returncode == 0:
                    self.update_log.emit(f"Found Python: {result.stdout.strip()}")
                    return "python"
            except:
                pass
            
            self.update_log.emit("Python not found")
            return None
        except:
            return None
    
    def install_python(self):
        """Install Python"""
        try:
            if platform.system() == "Windows":
                # Try using winget first
                try:
                    self.update_log.emit("Installing Python using winget...")
                    subprocess.run(["winget", "install", "-e", "--id", "Python.Python.3.10"], 
                                  check=True)
                    return True
                except:
                    # Download and install Python manually
                    python_url = "https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe"
                    self.update_log.emit(f"Winget installation failed, please install Python manually from: {python_url}")
                    return False
            elif platform.system() == "Linux":
                # Install Python on Linux
                self.update_log.emit("Installing Python using apt...")
                subprocess.run(["sudo", "apt-get", "update"], check=True)
                subprocess.run(["sudo", "apt-get", "install", "-y", "python3", "python3-venv", "python3-pip"], check=True)
                return True
            else:
                self.update_log.emit("Please install Python manually")
                return False
        except Exception as e:
            self.update_log.emit(f"Python installation error: {str(e)}")
            return False


class BackendSetupWidget(QWidget):
    """Backend setup widget"""
    setup_finished = Signal(bool)
    
    def __init__(self, install_path, parent=None):
        super().__init__(parent)
        self.install_path = install_path
        self.init_ui()
        
    def init_ui(self):
        """Initialize the UI"""
        layout = QVBoxLayout()
        
        # Title and description
        title = create_title_label("Backend Setup")
        description = create_description_label(
            f"This step will set up the Python environment and install required packages for {APP_NAME}. "
            f"It will create a virtual environment and install dependencies for both backend and App-Interface."
        )
        
        # Progress section
        progress_layout = QVBoxLayout()
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        style_progress_bar(self.progress_bar)
        
        self.status_label = QLabel("Ready to set up backend")
        
        progress_layout.addWidget(self.progress_bar)
        progress_layout.addWidget(self.status_label)
        
        # Log display
        log_title = create_title_label("Setup Log")
        self.log_display = QTextEdit()
        self.log_display.setReadOnly(True)
        self.log_display.setMinimumHeight(150)
        self.log_display.setStyleSheet(f"""
            QTextEdit {{
                background-color: #181825;
                color: #CDD6F4;
                border: 1px solid #313244;
                border-radius: 4px;
                padding: 8px;
                font-family: 'Consolas', 'Courier New', monospace;
            }}
        """)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        self.setup_button = QPushButton("Set Up Backend")
        style_button(self.setup_button)
        self.setup_button.clicked.connect(self.start_setup)
        
        self.skip_button = QPushButton("Skip")
        style_secondary_button(self.skip_button)
        self.skip_button.clicked.connect(self.skip_setup)
        
        button_layout.addWidget(self.skip_button)
        button_layout.addWidget(self.setup_button)
        
        # Add all to main layout
        layout.addWidget(title)
        layout.addSpacing(10)
        layout.addWidget(description)
        layout.addSpacing(20)
        layout.addLayout(progress_layout)
        layout.addSpacing(10)
        layout.addWidget(log_title)
        layout.addWidget(self.log_display)
        layout.addSpacing(20)
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
        
        # Initialize worker
        self.worker = None
        
    def start_setup(self):
        """Start the backend setup process"""
        self.setup_button.setEnabled(False)
        self.skip_button.setEnabled(False)
        
        self.worker = BackendSetupWorker(self.install_path)
        self.worker.update_progress.connect(self.update_progress)
        self.worker.update_log.connect(self.update_log)
        self.worker.setup_complete.connect(self.setup_complete)
        self.worker.start()
        
    def update_progress(self, value, message):
        """Update the progress bar and status label"""
        self.progress_bar.setValue(value)
        self.status_label.setText(message)
        
    def update_log(self, message):
        """Update the log display"""
        self.log_display.append(message)
        self.log_display.ensureCursorVisible()
        
    def setup_complete(self, success, message):
        """Handle setup completion"""
        if success:
            QMessageBox.information(self, "Backend Setup", message)
            self.setup_finished.emit(True)
        else:
            QMessageBox.warning(self, "Backend Setup", message)
            self.setup_button.setEnabled(True)
            self.skip_button.setEnabled(True)
            
    def skip_setup(self):
        """Skip the backend setup"""
        reply = QMessageBox.question(self, "Skip Backend Setup", 
                                    "Backend setup is required for the application to work properly. Are you sure you want to skip this step?",
                                    QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        
        if reply == QMessageBox.Yes:
            self.setup_finished.emit(False)


# For testing the component independently
if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    window = BackendSetupWidget(os.path.expanduser("~/ElithPharmacy"))
    window.show()
    
    sys.exit(app.exec_()) 