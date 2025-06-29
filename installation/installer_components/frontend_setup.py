"""
Frontend Setup Component
Handles npm installation and frontend setup
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

class FrontendSetupWorker(QThread):
    """Worker thread for frontend setup"""
    update_progress = Signal(int, str)
    update_log = Signal(str)
    setup_complete = Signal(bool, str)
    
    def __init__(self, install_path):
        super().__init__()
        self.install_path = install_path
        
    def run(self):
        try:
            # Check if Docker is installed first
            self.update_progress.emit(5, "Verifying Docker installation...")
            if not self.check_docker():
                self.update_log.emit("ERROR: Docker is not installed or not running")
                self.setup_complete.emit(False, "Docker must be installed and running before setting up the frontend")
                return
            
            # Check if npm is installed
            self.update_progress.emit(10, "Checking npm installation...")
            
            if not self.check_npm():
                self.update_progress.emit(15, "npm not found, installing Node.js...")
                if not self.install_nodejs():
                    self.setup_complete.emit(False, "Failed to install Node.js")
                    return
            
            # Run npm install in frontend directory
            frontend_dir = os.path.join(self.install_path, "frontend")
            if not os.path.exists(frontend_dir):
                self.update_log.emit(f"Creating frontend directory: {frontend_dir}")
                os.makedirs(frontend_dir, exist_ok=True)
            
            self.update_progress.emit(40, "Installing frontend dependencies...")
            self.update_log.emit(f"Running npm install in {frontend_dir}")
            
            try:
                result = subprocess.run(["npm", "install"], 
                                      cwd=frontend_dir, 
                                      check=True,
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.PIPE,
                                      text=True)
                self.update_log.emit(result.stdout)
                if result.stderr:
                    self.update_log.emit("STDERR: " + result.stderr)
            except subprocess.CalledProcessError as e:
                self.update_log.emit("ERROR: npm install failed")
                if e.stdout:
                    self.update_log.emit(e.stdout)
                if e.stderr:
                    self.update_log.emit(e.stderr)
                self.setup_complete.emit(False, "Failed to install frontend dependencies")
                return
            
            # Setup complete
            self.update_progress.emit(100, "Frontend setup completed successfully")
            self.setup_complete.emit(True, "Frontend has been successfully set up")
            
        except Exception as e:
            self.update_log.emit(f"ERROR: {str(e)}")
            self.setup_complete.emit(False, f"Setup failed: {str(e)}")
    
    def check_docker(self):
        """Check if Docker is installed and running"""
        try:
            self.update_log.emit("Checking Docker installation...")
            if platform.system() == "Windows":
                # Check Docker Desktop on Windows
                result = subprocess.run(["docker", "info"], 
                                       stdout=subprocess.PIPE, 
                                       stderr=subprocess.PIPE,
                                       text=True,
                                       check=False)
            else:
                # Check Docker on Linux/macOS
                result = subprocess.run(["docker", "info"], 
                                       stdout=subprocess.PIPE, 
                                       stderr=subprocess.PIPE,
                                       text=True,
                                       check=False)
            
            if result.returncode == 0:
                self.update_log.emit("Docker is installed and running")
                return True
            else:
                self.update_log.emit("Docker is not running or not installed properly")
                return False
        except Exception as e:
            self.update_log.emit(f"Docker check error: {str(e)}")
            return False
    
    def check_npm(self):
        """Check if npm is installed"""
        try:
            result = subprocess.run(["npm", "--version"], 
                                   stdout=subprocess.PIPE, 
                                   stderr=subprocess.PIPE,
                                   text=True,
                                   check=False)
            return result.returncode == 0
        except:
            return False
    
    def install_nodejs(self):
        """Install Node.js and npm"""
        try:
            if platform.system() == "Windows":
                # Try using winget first
                try:
                    self.update_log.emit("Installing Node.js using winget...")
                    subprocess.run(["winget", "install", "-e", "--id", "OpenJS.NodeJS"], 
                                  check=True)
                    return True
                except:
                    # Download and install Node.js manually
                    self.update_log.emit("Winget installation failed, please install Node.js manually")
                    self.update_log.emit("Download from: https://nodejs.org/")
                    return False
            elif platform.system() == "Linux":
                # Install Node.js on Linux
                self.update_log.emit("Installing Node.js using apt...")
                subprocess.run(["sudo", "apt-get", "update"], check=True)
                subprocess.run(["sudo", "apt-get", "install", "-y", "nodejs", "npm"], check=True)
                return True
            else:
                self.update_log.emit("Please install Node.js manually")
                return False
        except Exception as e:
            self.update_log.emit(f"Node.js installation error: {str(e)}")
            return False


class FrontendSetupWidget(QWidget):
    """Frontend setup widget"""
    setup_finished = Signal(bool)
    
    def __init__(self, install_path, parent=None):
        super().__init__(parent)
        self.install_path = install_path
        self.init_ui()
        
    def init_ui(self):
        """Initialize the UI"""
        layout = QVBoxLayout()
        
        # Title and description
        title = create_title_label("Frontend Setup")
        description = create_description_label(
            f"This step will set up the frontend components for {APP_NAME}. "
            f"It will install npm dependencies and prepare the frontend for use. "
            f"Docker must be installed and running before proceeding with this step."
        )
        
        # Progress section
        progress_layout = QVBoxLayout()
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        style_progress_bar(self.progress_bar)
        
        self.status_label = QLabel("Ready to set up frontend")
        
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
        
        self.setup_button = QPushButton("Set Up Frontend")
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
        """Start the frontend setup process"""
        self.setup_button.setEnabled(False)
        self.skip_button.setEnabled(False)
        
        self.worker = FrontendSetupWorker(self.install_path)
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
            QMessageBox.information(self, "Frontend Setup", message)
            self.setup_finished.emit(True)
        else:
            QMessageBox.warning(self, "Frontend Setup", message)
            self.setup_button.setEnabled(True)
            self.skip_button.setEnabled(True)
            
    def skip_setup(self):
        """Skip the frontend setup"""
        reply = QMessageBox.question(self, "Skip Frontend Setup", 
                                    "Frontend setup is required for the application to work properly. Are you sure you want to skip this step?",
                                    QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        
        if reply == QMessageBox.Yes:
            self.setup_finished.emit(False)


# For testing the component independently
if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    window = FrontendSetupWidget(os.path.expanduser("~/ElithPharmacy"))
    window.show()
    
    sys.exit(app.exec_()) 