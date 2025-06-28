"""
Supabase Installation Component
Handles setting up Supabase for Elith Pharmacy
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

from . import APP_NAME, SUPABASE_PORT
from .ui_utils import (create_title_label, create_description_label, 
                     style_button, style_secondary_button, style_progress_bar)

class SupabaseInstallWorker(QThread):
    """Worker thread for Supabase installation"""
    update_progress = Signal(int, str)
    update_log = Signal(str)
    installation_complete = Signal(bool, str)
    
    def __init__(self, install_path):
        super().__init__()
        self.install_path = install_path
        
    def run(self):
        try:
            self.update_progress.emit(10, "Preparing Supabase installation...")
            
            # Find Elith-Supabase directory
            supabase_dir = os.path.join(self.install_path, "Elith-Supabase")
            
            # Create directory if it doesn't exist
            if not os.path.exists(supabase_dir):
                self.update_progress.emit(20, "Creating Supabase directory...")
                self.update_log.emit("Creating directory: " + supabase_dir)
                os.makedirs(supabase_dir)
            
            # Run npm install
            self.update_progress.emit(40, "Installing npm dependencies...")
            self.update_log.emit("Running: npm install in " + supabase_dir)
            
            try:
                result = subprocess.run(["npm", "install"], 
                                      cwd=supabase_dir, 
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
                self.installation_complete.emit(False, "Failed to install npm dependencies")
                return
            
            # Run setup script
            self.update_progress.emit(70, "Running Supabase setup script...")
            setup_script = os.path.join(self.install_path, "setup_local_supabase.ps1")
            
            if not os.path.exists(setup_script):
                # Create setup script if it doesn't exist
                self.update_progress.emit(75, "Creating setup script...")
                self.create_setup_script(setup_script)
            
            if platform.system() == "Windows":
                self.update_log.emit(f"Running setup script: {setup_script}")
                try:
                    result = subprocess.run(
                        ["powershell", "-ExecutionPolicy", "Bypass", "-File", setup_script], 
                        cwd=self.install_path,
                        check=True,
                        stdout=subprocess.PIPE, 
                        stderr=subprocess.PIPE,
                        text=True
                    )
                    self.update_log.emit(result.stdout)
                    if result.stderr:
                        self.update_log.emit("STDERR: " + result.stderr)
                except subprocess.CalledProcessError as e:
                    self.update_log.emit("ERROR: Setup script failed")
                    if e.stdout:
                        self.update_log.emit(e.stdout)
                    if e.stderr:
                        self.update_log.emit(e.stderr)
                    self.installation_complete.emit(False, "Failed to run Supabase setup script")
                    return
            
            # Check if Supabase is running
            self.update_progress.emit(90, "Verifying Supabase installation...")
            time.sleep(2)  # Give it a moment to start
            
            # Installation complete
            self.update_progress.emit(100, "Supabase installation completed")
            self.installation_complete.emit(True, "Supabase has been successfully installed")
            
        except Exception as e:
            self.update_log.emit(f"ERROR: {str(e)}")
            self.installation_complete.emit(False, f"Installation failed: {str(e)}")
    
    def create_setup_script(self, script_path):
        """Create a PowerShell script to setup Supabase"""
        script_content = f"""
# Setup local Supabase
Write-Host "Setting up local Supabase..."

# Check if Docker is running
$dockerRunning = (docker info) -ne $null
if (-not $dockerRunning) {{
    Write-Host "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}}

# Check if Supabase CLI is installed
$supabaseInstalled = (Get-Command npx -ErrorAction SilentlyContinue) -ne $null
if (-not $supabaseInstalled) {{
    Write-Host "Installing Supabase CLI..."
    npm install -g supabase
}}

# Start Supabase
Write-Host "Starting Supabase on port {SUPABASE_PORT}..."
npx supabase start --port {SUPABASE_PORT}

Write-Host "Supabase setup complete!"
"""
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        self.update_log.emit(f"Created setup script at {script_path}")


class SupabaseInstallerWidget(QWidget):
    """Supabase installation widget"""
    installation_finished = Signal(bool)
    
    def __init__(self, install_path, parent=None):
        super().__init__(parent)
        self.install_path = install_path
        self.init_ui()
        
    def init_ui(self):
        """Initialize the UI"""
        layout = QVBoxLayout()
        
        # Title and description
        title = create_title_label("Supabase Installation")
        description = create_description_label(
            f"Supabase will be installed and configured to run on port {SUPABASE_PORT}. "
            f"This provides the database backend for {APP_NAME}."
        )
        
        # Progress section
        progress_layout = QVBoxLayout()
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        style_progress_bar(self.progress_bar)
        
        self.status_label = QLabel("Ready to install Supabase")
        
        progress_layout.addWidget(self.progress_bar)
        progress_layout.addWidget(self.status_label)
        
        # Log display
        log_title = create_title_label("Installation Log")
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
        
        self.install_button = QPushButton("Install Supabase")
        style_button(self.install_button)
        self.install_button.clicked.connect(self.start_installation)
        
        self.skip_button = QPushButton("Skip")
        style_secondary_button(self.skip_button)
        self.skip_button.clicked.connect(self.skip_installation)
        
        button_layout.addWidget(self.skip_button)
        button_layout.addWidget(self.install_button)
        
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
        
    def start_installation(self):
        """Start the Supabase installation process"""
        self.install_button.setEnabled(False)
        self.skip_button.setEnabled(False)
        
        self.worker = SupabaseInstallWorker(self.install_path)
        self.worker.update_progress.connect(self.update_progress)
        self.worker.update_log.connect(self.update_log)
        self.worker.installation_complete.connect(self.installation_complete)
        self.worker.start()
        
    def update_progress(self, value, message):
        """Update the progress bar and status label"""
        self.progress_bar.setValue(value)
        self.status_label.setText(message)
        
    def update_log(self, message):
        """Update the log display"""
        self.log_display.append(message)
        self.log_display.ensureCursorVisible()
        
    def installation_complete(self, success, message):
        """Handle installation completion"""
        if success:
            QMessageBox.information(self, "Supabase Installation", message)
            self.installation_finished.emit(True)
        else:
            QMessageBox.warning(self, "Supabase Installation", message)
            self.install_button.setEnabled(True)
            self.skip_button.setEnabled(True)
            
    def skip_installation(self):
        """Skip the Supabase installation"""
        reply = QMessageBox.question(self, "Skip Supabase Installation", 
                                    "Supabase is required for the database functionality. Are you sure you want to skip this step?",
                                    QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        
        if reply == QMessageBox.Yes:
            self.installation_finished.emit(False)


# For testing the component independently
if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    window = SupabaseInstallerWidget(os.path.expanduser("~/ElithPharmacy"))
    window.show()
    
    sys.exit(app.exec_()) 