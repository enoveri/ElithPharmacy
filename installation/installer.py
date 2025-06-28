#!/usr/bin/env python3
"""
Elith Pharmacy Installer
A Qt GUI application for installing and setting up Elith Pharmacy
"""

import os
import sys
import subprocess
import platform
import shutil
import threading
import time
from pathlib import Path

from qtpy.QtWidgets import (QApplication, QMainWindow, QWizard, QWizardPage,
                            QLabel, QVBoxLayout, QHBoxLayout, QPushButton,
                            QProgressBar, QCheckBox, QRadioButton, QButtonGroup,
                            QFileDialog, QMessageBox, QTextEdit, QLineEdit)
from qtpy.QtCore import Qt, QThread, Signal, QUrl
from qtpy.QtGui import QFont, QPixmap, QDesktopServices, QColor, QPalette

# Define application settings
APP_NAME = "Elith Pharmacy"
APP_VERSION = "1.0.0"
SUPABASE_PORT = 54321
FRONTEND_PORT = 5173
PRIMARY_COLOR = "#00C853"  # Brighter green
SECONDARY_COLOR = "#448AFF"  # Brighter blue
BACKGROUND_COLOR = "#1E1E2E"  # Dark background (Catppuccin Mocha)
TEXT_COLOR = "#CDD6F4"  # Light text
ACCENT_COLOR = "#CBA6F7"  # Purple accent
SURFACE_COLOR = "#313244"  # Slightly lighter surface
ERROR_COLOR = "#F38BA8"  # Error color
SUCCESS_COLOR = "#A6E3A1"  # Success color

# Worker thread for background tasks
class InstallWorker(QThread):
    update_progress = Signal(int, str)
    installation_complete = Signal(bool, str)
    
    def __init__(self, install_path, install_type):
        super().__init__()
        self.install_path = install_path
        self.install_type = install_type
        
    def run(self):
        try:
            # Create installation directory if it doesn't exist
            if not os.path.exists(self.install_path):
                os.makedirs(self.install_path)
            
            # Step 1: Check system requirements
            self.update_progress.emit(5, "Checking system requirements...")
            if not self.check_system_requirements():
                self.installation_complete.emit(False, "System requirements not met")
                return
                
            # Step 2: Check/Install Docker
            self.update_progress.emit(10, "Checking Docker installation...")
            if not self.check_docker():
                self.update_progress.emit(15, "Installing Docker...")
                if not self.install_docker():
                    self.installation_complete.emit(False, "Failed to install Docker")
                    return
            
            # Step 3: Download/Extract necessary files
            self.update_progress.emit(25, "Downloading required files...")
            if not self.download_files():
                self.installation_complete.emit(False, "Failed to download required files")
                return
            
            # Step 4: Setup Supabase
            self.update_progress.emit(40, "Setting up Supabase...")
            if not self.setup_supabase():
                self.installation_complete.emit(False, "Failed to setup Supabase")
                return
            
            # Step 5: Setup Docker containers
            self.update_progress.emit(60, "Setting up Docker containers...")
            if not self.setup_docker_containers():
                self.installation_complete.emit(False, "Failed to setup Docker containers")
                return
            
            # Step 6: Setup Python environment
            self.update_progress.emit(75, "Setting up Python environment...")
            if not self.setup_python_env():
                self.installation_complete.emit(False, "Failed to setup Python environment")
                return
            
            # Step 7: Configure watchdog and startup
            self.update_progress.emit(90, "Configuring startup services...")
            if not self.configure_startup():
                self.installation_complete.emit(False, "Failed to configure startup services")
                return
            
            # Installation complete
            self.update_progress.emit(100, "Installation completed successfully!")
            self.installation_complete.emit(True, "Installation completed successfully!")
            
        except Exception as e:
            self.installation_complete.emit(False, f"Installation failed: {str(e)}")
    
    def check_system_requirements(self):
        """Check if system meets minimum requirements"""
        try:
            # Check RAM (minimum 4GB)
            import psutil
            ram_gb = psutil.virtual_memory().total / (1024**3)
            if ram_gb < 4:
                return False
                
            # Check disk space (minimum 5GB free)
            disk_gb = psutil.disk_usage('/').free / (1024**3)
            if disk_gb < 5:
                return False
                
            return True
        except:
            # If psutil not available, assume requirements are met
            return True
    
    def check_docker(self):
        """Check if Docker is installed and running"""
        try:
            result = subprocess.run(["docker", "info"], 
                                   stdout=subprocess.PIPE, 
                                   stderr=subprocess.PIPE,
                                   text=True,
                                   check=False)
            return result.returncode == 0
        except:
            return False
    
    def install_docker(self):
        """Install Docker Desktop"""
        try:
            if platform.system() == "Windows":
                # Try using winget first
                try:
                    subprocess.run(["winget", "install", "-e", "--id", "Docker.DockerDesktop"], 
                                  check=True)
                    return True
                except:
                    # Download and install Docker Desktop manually
                    url = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
                    self.update_progress.emit(12, "Downloading Docker Desktop...")
                    # Download logic here
                    # For now, just instruct the user
                    return False
            elif platform.system() == "Darwin":  # macOS
                self.update_progress.emit(12, "Please install Docker Desktop manually on macOS")
                return False
            elif platform.system() == "Linux":
                # Install Docker on Linux
                subprocess.run(["sudo", "apt-get", "update"], check=True)
                subprocess.run(["sudo", "apt-get", "install", "-y", "docker.io"], check=True)
                subprocess.run(["sudo", "systemctl", "start", "docker"], check=True)
                subprocess.run(["sudo", "systemctl", "enable", "docker"], check=True)
                return True
        except:
            return False
    
    def download_files(self):
        """Download or extract necessary files"""
        # This would connect to Google Drive or other source to download files
        # For now, just simulate success
        time.sleep(2)
        return True
    
    def setup_supabase(self):
        """Setup Supabase"""
        try:
            # Find Elith-Supabase directory
            supabase_dir = os.path.join(self.install_path, "Elith-Supabase")
            
            # Create directory if it doesn't exist
            if not os.path.exists(supabase_dir):
                os.makedirs(supabase_dir)
            
            # Run npm install
            subprocess.run(["npm", "install"], cwd=supabase_dir, check=True)
            
            # Run setup script
            setup_script = os.path.join(supabase_dir, "setup_local_supabase.ps1")
            if platform.system() == "Windows":
                subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", setup_script], 
                              cwd=supabase_dir, check=True)
            
            return True
        except:
            return False
    
    def setup_docker_containers(self):
        """Setup Docker containers"""
        try:
            # Pull containers or build from docker-compose
            if self.install_type == "easy":
                # Pull pre-built containers
                subprocess.run(["docker", "pull", "elithpharmacy/frontend:latest"], check=True)
                subprocess.run(["docker", "pull", "elithpharmacy/backend:latest"], check=True)
            else:
                # Build containers from source
                subprocess.run(["docker-compose", "up", "--build", "-d"], 
                              cwd=self.install_path, check=True)
            
            return True
        except:
            return False
    
    def setup_python_env(self):
        """Setup Python environment"""
        try:
            # Check if Python is installed
            python_cmd = "python" if platform.system() == "Windows" else "python3"
            
            try:
                subprocess.run([python_cmd, "--version"], check=True)
            except:
                # Python not installed
                if platform.system() == "Windows":
                    # Download and install Python
                    self.update_progress.emit(76, "Downloading Python...")
                    # Download logic here
                    return False
            
            # Create virtual environment
            venv_dir = os.path.join(self.install_path, "venv")
            subprocess.run([python_cmd, "-m", "venv", venv_dir], check=True)
            
            # Install requirements
            if platform.system() == "Windows":
                pip_cmd = os.path.join(venv_dir, "Scripts", "pip")
            else:
                pip_cmd = os.path.join(venv_dir, "bin", "pip")
                
            # Install App-Interface requirements
            app_interface_dir = os.path.join(self.install_path, "App-Interface")
            requirements_file = os.path.join(app_interface_dir, "requirements.txt")
            if os.path.exists(requirements_file):
                subprocess.run([pip_cmd, "install", "-r", requirements_file], check=True)
            
            return True
        except:
            return False
    
    def configure_startup(self):
        """Configure watchdog and startup services"""
        try:
            if platform.system() == "Windows":
                # Register watchdog as startup task
                watchdog_script = os.path.join(self.install_path, "watchdog.ps1")
                subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", watchdog_script, "-register"], 
                              check=True)
            
            return True
        except:
            return False


# Helper functions for styling
def create_title_label(text):
    """Create a styled title label"""
    label = QLabel(text)
    font = label.font()
    font.setPointSize(12)
    font.setBold(True)
    label.setFont(font)
    return label

def create_description_label(text):
    """Create a styled description label"""
    label = QLabel(text)
    label.setWordWrap(True)
    font = label.font()
    font.setPointSize(10)
    label.setFont(font)
    return label

def style_button(button):
    """Apply styling to a button"""
    button.setMinimumHeight(30)
    button.setCursor(Qt.PointingHandCursor)
    button.setStyleSheet(f"""
        QPushButton {{
            background-color: {ACCENT_COLOR};
            color: #1A1826;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            font-weight: bold;
        }}
        QPushButton:hover {{
            background-color: #B4BEFE;
        }}
        QPushButton:pressed {{
            background-color: #9399B2;
        }}
    """)
    return button

def style_progress_bar(progress_bar):
    """Apply styling to progress bar"""
    progress_bar.setStyleSheet(f"""
        QProgressBar {{
            border: 1px solid {SURFACE_COLOR};
            border-radius: 5px;
            text-align: center;
            height: 20px;
            color: {TEXT_COLOR};
            background-color: #181825;
        }}
        QProgressBar::chunk {{
            background-color: {ACCENT_COLOR};
            width: 10px;
            margin: 0px;
            border-radius: 4px;
        }}
    """)
    return progress_bar

# Welcome page
class WelcomePage(QWizardPage):
    def __init__(self):
        super().__init__()
        self.setTitle(f"Welcome to {APP_NAME} Installer")
        
        layout = QVBoxLayout()
        
        # Logo
        logo_layout = QHBoxLayout()
        logo_label = QLabel()
        
        # Try to load logo from resources
        logo_path = os.path.join(os.path.dirname(__file__), "logo.png")
        if os.path.exists(logo_path):
            pixmap = QPixmap(logo_path)
            logo_label.setPixmap(pixmap.scaled(128, 128, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        else:
            # Placeholder text if logo not found
            logo_label.setText("ELITH PHARMACY")
            font = logo_label.font()
            font.setPointSize(24)
            font.setBold(True)
            logo_label.setFont(font)
            logo_label.setStyleSheet(f"color: {PRIMARY_COLOR};")
        
        logo_layout.addStretch()
        logo_layout.addWidget(logo_label)
        logo_layout.addStretch()
        
        # Welcome message
        welcome_label = create_description_label(
            f"Welcome to the {APP_NAME} {APP_VERSION} installation wizard. "
            f"This wizard will guide you through the installation process."
        )
        
        # Requirements section
        req_title = create_title_label("System Requirements")
        
        req_list = QLabel(
            "• Windows 10/11 or Linux\n"
            "• 4GB RAM minimum (8GB recommended)\n"
            "• 5GB free disk space\n"
            "• Docker Desktop\n"
            "• Internet connection"
        )
        font = req_list.font()
        font.setPointSize(10)
        req_list.setFont(font)
        
        # Add widgets to layout
        layout.addLayout(logo_layout)
        layout.addSpacing(20)
        layout.addWidget(welcome_label)
        layout.addSpacing(30)
        layout.addWidget(req_title)
        layout.addSpacing(10)
        layout.addWidget(req_list)
        layout.addStretch()
        
        self.setLayout(layout)


# Installation type selection page
class InstallTypePage(QWizardPage):
    def __init__(self):
        super().__init__()
        self.setTitle("Installation Type")
        
        layout = QVBoxLayout()
        
        # Installation type options
        type_label = create_title_label("Select Installation Type")
        
        # Easy installation option
        self.easy_radio = QRadioButton("Easy Installation (Recommended)")
        self.easy_radio.setChecked(True)
        font = self.easy_radio.font()
        font.setPointSize(10)
        font.setBold(True)
        self.easy_radio.setFont(font)
        
        easy_desc = create_description_label(
            "Downloads pre-built containers and sets up the necessary components automatically. "
            "This is the recommended option for most users."
        )
        
        # Advanced installation option
        self.advanced_radio = QRadioButton("Advanced Installation")
        font = self.advanced_radio.font()
        font.setPointSize(10)
        font.setBold(True)
        self.advanced_radio.setFont(font)
        
        advanced_desc = create_description_label(
            "Builds containers from source and allows for more customization. "
            "Choose this option if you need specific configurations."
        )
        
        # Group radio buttons
        self.button_group = QButtonGroup()
        self.button_group.addButton(self.easy_radio)
        self.button_group.addButton(self.advanced_radio)
        
        # Register field for next pages
        self.registerField("easy_install", self.easy_radio)
        self.registerField("advanced_install", self.advanced_radio)
        
        # Add widgets to layout with proper spacing
        layout.addWidget(type_label)
        layout.addSpacing(20)
        
        easy_layout = QVBoxLayout()
        easy_layout.addWidget(self.easy_radio)
        easy_layout.addSpacing(5)
        easy_layout.addWidget(easy_desc)
        
        advanced_layout = QVBoxLayout()
        advanced_layout.addWidget(self.advanced_radio)
        advanced_layout.addSpacing(5)
        advanced_layout.addWidget(advanced_desc)
        
        layout.addLayout(easy_layout)
        layout.addSpacing(15)
        layout.addLayout(advanced_layout)
        layout.addStretch()
        
        self.setLayout(layout)


# Installation directory selection page
class InstallDirPage(QWizardPage):
    def __init__(self):
        super().__init__()
        self.setTitle("Installation Directory")
        
        layout = QVBoxLayout()
        
        # Default installation directory
        default_dir = os.path.join(os.path.expanduser("~"), "ElithPharmacy")
        
        dir_title = create_title_label("Select Installation Location")
        dir_desc = create_description_label(
            "Choose the folder where Elith Pharmacy will be installed. "
            "Make sure you have write permissions to this location."
        )
        
        dir_layout = QHBoxLayout()
        self.dir_edit = QLineEdit(default_dir)
        self.dir_edit.setMinimumHeight(30)
        self.dir_edit.setStyleSheet(f"""
            QLineEdit {{
                background-color: #181825;
                color: {TEXT_COLOR};
                border: 1px solid {SURFACE_COLOR};
                border-radius: 4px;
                padding: 4px 8px;
                selection-background-color: {ACCENT_COLOR};
            }}
            QLineEdit:focus {{
                border: 1px solid {ACCENT_COLOR};
            }}
        """)
        
        browse_button = QPushButton("Browse...")
        style_button(browse_button)
        browse_button.clicked.connect(self.browse_directory)
        
        dir_layout.addWidget(self.dir_edit)
        dir_layout.addWidget(browse_button)
        
        # Register field for next pages
        self.registerField("install_dir*", self.dir_edit)
        
        # Add widgets to layout
        layout.addWidget(dir_title)
        layout.addSpacing(10)
        layout.addWidget(dir_desc)
        layout.addSpacing(20)
        layout.addLayout(dir_layout)
        layout.addStretch()
        
        self.setLayout(layout)
    
    def browse_directory(self):
        directory = QFileDialog.getExistingDirectory(self, "Select Installation Directory")
        if directory:
            self.dir_edit.setText(directory)


# Installation progress page
class InstallProgressPage(QWizardPage):
    def __init__(self):
        super().__init__()
        self.setTitle("Installing Elith Pharmacy")
        
        layout = QVBoxLayout()
        
        # Installation status
        status_title = create_title_label("Installation Progress")
        
        # Progress bar and status label
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        style_progress_bar(self.progress_bar)
        
        self.status_label = QLabel("Preparing installation...")
        font = self.status_label.font()
        font.setPointSize(10)
        self.status_label.setFont(font)
        
        # Log display
        log_title = create_title_label("Installation Log")
        self.log_display = QTextEdit()
        self.log_display.setReadOnly(True)
        self.log_display.setMinimumHeight(200)
        self.log_display.setStyleSheet(f"""
            QTextEdit {{
                background-color: #181825;
                color: {TEXT_COLOR};
                border: 1px solid {SURFACE_COLOR};
                border-radius: 4px;
                padding: 8px;
                font-family: 'Consolas', 'Courier New', monospace;
            }}
        """)
        
        # Add widgets to layout
        layout.addWidget(status_title)
        layout.addSpacing(10)
        layout.addWidget(self.progress_bar)
        layout.addSpacing(5)
        layout.addWidget(self.status_label)
        layout.addSpacing(20)
        layout.addWidget(log_title)
        layout.addSpacing(5)
        layout.addWidget(self.log_display)
        
        self.setLayout(layout)
        
        # Initialize worker thread
        self.worker = None
    
    def initializePage(self):
        # Get installation options
        install_dir = self.field("install_dir")
        install_type = "easy" if self.field("easy_install") else "advanced"
        
        # Start installation process
        self.worker = InstallWorker(install_dir, install_type)
        self.worker.update_progress.connect(self.update_progress)
        self.worker.installation_complete.connect(self.installation_complete)
        self.worker.start()
    
    def update_progress(self, value, message):
        self.progress_bar.setValue(value)
        self.status_label.setText(message)
        
        # Format log message with timestamp
        timestamp = time.strftime("%H:%M:%S")
        log_message = f"[{timestamp}] [{value}%] {message}"
        
        # Add color based on message type
        if "error" in message.lower() or "failed" in message.lower():
            log_message = f"<span style='color: {ERROR_COLOR};'>{log_message}</span>"
        elif "success" in message.lower() or "complete" in message.lower():
            log_message = f"<span style='color: {SUCCESS_COLOR};'>{log_message}</span>"
        
        self.log_display.append(log_message)
        self.log_display.ensureCursorVisible()
    
    def installation_complete(self, success, message):
        if success:
            self.wizard().next()
        else:
            QMessageBox.critical(self, "Installation Failed", message)
            self.log_display.append(f"<span style='color: {ERROR_COLOR};'>[ERROR] {message}</span>")
            self.log_display.ensureCursorVisible()
    
    def isComplete(self):
        # Only allow proceeding when installation is complete
        return False


# Completion page
class CompletionPage(QWizardPage):
    def __init__(self):
        super().__init__()
        self.setTitle("Installation Complete")
        
        layout = QVBoxLayout()
        
        # Success icon/image
        success_layout = QHBoxLayout()
        success_label = QLabel()
        
        # Try to load success icon
        icon_path = os.path.join(os.path.dirname(__file__), "success.png")
        if os.path.exists(icon_path):
            pixmap = QPixmap(icon_path)
            success_label.setPixmap(pixmap.scaled(64, 64, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        else:
            # Text alternative if icon not found
            success_label.setText("✓")
            font = success_label.font()
            font.setPointSize(48)
            font.setBold(True)
            success_label.setFont(font)
            success_label.setStyleSheet(f"color: {PRIMARY_COLOR};")
        
        success_layout.addStretch()
        success_layout.addWidget(success_label)
        success_layout.addStretch()
        
        # Completion message
        complete_title = create_title_label("Installation Successful!")
        complete_desc = create_description_label(
            f"{APP_NAME} {APP_VERSION} has been successfully installed on your computer. "
            f"You can now launch the application and start using it."
        )
        
        # Launch options
        self.launch_check = QCheckBox("Launch Elith Pharmacy when finished")
        self.launch_check.setChecked(True)
        font = self.launch_check.font()
        font.setPointSize(10)
        self.launch_check.setFont(font)
        
        # Add widgets to layout
        layout.addLayout(success_layout)
        layout.addSpacing(20)
        layout.addWidget(complete_title)
        layout.addSpacing(10)
        layout.addWidget(complete_desc)
        layout.addSpacing(30)
        layout.addWidget(self.launch_check)
        layout.addStretch()
        
        self.setLayout(layout)
        
        # Register field for wizard's finished method
        self.registerField("launch_after_install", self.launch_check)


# Main installer wizard
class InstallerWizard(QWizard):
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle(f"{APP_NAME} Installer")
        self.setWizardStyle(QWizard.ModernStyle)
        
        # Set window size
        self.setMinimumSize(700, 550)
        
        # Set stylesheet for the entire wizard
        self.setStyleSheet(f"""
            QWizard {{
                background-color: {BACKGROUND_COLOR};
                color: {TEXT_COLOR};
                border: none;
            }}
            QWizardPage {{
                background-color: {BACKGROUND_COLOR};
                color: {TEXT_COLOR};
            }}
            QLabel {{
                color: {TEXT_COLOR};
            }}
            QCheckBox {{
                spacing: 8px;
                color: {TEXT_COLOR};
            }}
            QCheckBox::indicator {{
                width: 16px;
                height: 16px;
                border-radius: 3px;
                border: 1px solid {SURFACE_COLOR};
            }}
            QCheckBox::indicator:checked {{
                background-color: {ACCENT_COLOR};
                border: 1px solid {ACCENT_COLOR};
                image: url(check.png);
            }}
            QRadioButton {{
                spacing: 8px;
                color: {TEXT_COLOR};
            }}
            QRadioButton::indicator {{
                width: 16px;
                height: 16px;
                border-radius: 8px;
                border: 1px solid {SURFACE_COLOR};
            }}
            QRadioButton::indicator:checked {{
                background-color: {ACCENT_COLOR};
                border: 1px solid {ACCENT_COLOR};
            }}
            QPushButton#qt_wizard_cancel {{
                background-color: {SURFACE_COLOR};
                color: {TEXT_COLOR};
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
            }}
            QPushButton#qt_wizard_cancel:hover {{
                background-color: #45475A;
            }}
            QPushButton#qt_wizard_next, QPushButton#qt_wizard_finish {{
                background-color: {ACCENT_COLOR};
                color: #1A1826;
                font-weight: bold;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
            }}
            QPushButton#qt_wizard_next:hover, QPushButton#qt_wizard_finish:hover {{
                background-color: #B4BEFE;
            }}
            QPushButton#qt_wizard_back {{
                background-color: {SURFACE_COLOR};
                color: {TEXT_COLOR};
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
            }}
            QPushButton#qt_wizard_back:hover {{
                background-color: #45475A;
            }}
            QHeaderView::section {{
                background-color: {SURFACE_COLOR};
                color: {TEXT_COLOR};
                padding: 4px;
                border: 1px solid {BACKGROUND_COLOR};
            }}
            QScrollBar:vertical {{
                background-color: {BACKGROUND_COLOR};
                width: 14px;
                margin: 0px;
            }}
            QScrollBar::handle:vertical {{
                background-color: {SURFACE_COLOR};
                min-height: 20px;
                border-radius: 7px;
                margin: 2px;
            }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
                height: 0px;
            }}
        """)
        
        # Customize button text
        self.setButtonText(QWizard.NextButton, "Next >")
        self.setButtonText(QWizard.BackButton, "< Back")
        self.setButtonText(QWizard.FinishButton, "Finish")
        self.setButtonText(QWizard.CancelButton, "Cancel")
        
        # Add pages
        self.addPage(WelcomePage())
        self.addPage(InstallTypePage())
        self.addPage(InstallDirPage())
        self.addPage(InstallProgressPage())
        self.addPage(CompletionPage())
        
        # Connect finished signal
        self.finished.connect(self.on_finished)
    
    def on_finished(self, result):
        if result == QWizard.Accepted and self.field("launch_after_install"):
            # Launch the application
            install_dir = self.field("install_dir")
            app_launcher = os.path.join(install_dir, "App-Interface", "main.py")
            
            if os.path.exists(app_launcher):
                if platform.system() == "Windows":
                    subprocess.Popen(["pythonw", app_launcher])
                else:
                    subprocess.Popen(["python3", app_launcher])


# Main application
def main():
    app = QApplication(sys.argv)
    
    # Set application style
    app.setStyle("Fusion")
    
    # Create and show the wizard
    wizard = InstallerWizard()
    wizard.show()
    
    sys.exit(app.exec_())


if __name__ == "__main__":
    main() 