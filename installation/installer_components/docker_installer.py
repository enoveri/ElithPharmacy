"""
Docker Installation Component
Handles checking and installing Docker
"""

import os
import sys
import subprocess
import platform
import time
from pathlib import Path

from qtpy.QtWidgets import (QWidget, QLabel, QVBoxLayout, QHBoxLayout, QPushButton,
                           QProgressBar, QApplication, QMessageBox, QCheckBox)
from qtpy.QtCore import Qt, QThread, Signal

from . import APP_NAME
from .ui_utils import (create_title_label, create_description_label, 
                     style_button, style_secondary_button, style_progress_bar)

class DockerInstallWorker(QThread):
    """Worker thread for Docker installation"""
    update_progress = Signal(int, str)
    installation_complete = Signal(bool, str)
    
    def __init__(self, install_wsl=False):
        super().__init__()
        self.install_wsl = install_wsl
        
    def run(self):
        try:
            # Check if Docker is installed
            self.update_progress.emit(10, "Checking Docker installation...")
            
            if self.check_docker():
                self.update_progress.emit(100, "Docker is already installed")
                self.installation_complete.emit(True, "Docker is already installed")
                return
            
            # If on Windows and WSL installation is requested
            if platform.system() == "Windows" and self.install_wsl:
                # Check if WSL is installed
                self.update_progress.emit(20, "Checking WSL installation...")
                wsl_installed = self.check_wsl()
                
                if not wsl_installed:
                    self.update_progress.emit(30, "Installing WSL...")
                    if not self.install_wsl_component():
                        self.installation_complete.emit(False, "Failed to install WSL")
                        return
                
                # Check if a Linux distribution is installed
                self.update_progress.emit(40, "Checking for Linux distribution...")
                if not self.check_linux_distro():
                    self.update_progress.emit(50, "Installing Ubuntu for WSL...")
                    if not self.install_ubuntu():
                        self.installation_complete.emit(False, "Failed to install Ubuntu for WSL")
                        return
                
                self.update_progress.emit(60, "WSL setup completed")
                
            # Docker not installed, attempt to install
            self.update_progress.emit(70, "Installing Docker...")
            
            if platform.system() == "Windows":
                # Try using winget first
                try:
                    self.update_progress.emit(75, "Installing Docker Desktop using winget...")
                    subprocess.run(["winget", "install", "-e", "--id", "Docker.DockerDesktop"], 
                                  check=True)
                    self.update_progress.emit(90, "Docker Desktop installed successfully")
                    self.installation_complete.emit(True, "Docker Desktop installed successfully")
                    return
                except Exception as e:
                    self.update_progress.emit(80, "Winget installation failed, trying alternative method...")
                    
                    # Download Docker Desktop installer
                    url = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
                    self.update_progress.emit(85, f"Downloading Docker Desktop installer from: {url}")
                    
                    try:
                        # Create a temporary directory for the download
                        import tempfile
                        temp_dir = tempfile.gettempdir()
                        installer_path = os.path.join(temp_dir, "DockerDesktopInstaller.exe")
                        
                        # Download the installer
                        import urllib.request
                        self.update_progress.emit(87, "Downloading installer...")
                        urllib.request.urlretrieve(url, installer_path)
                        
                        # Execute the installer
                        self.update_progress.emit(90, "Running Docker Desktop installer...")
                        subprocess.run([installer_path, "install", "--quiet"], check=True)
                        
                        # Inform user that they need to complete the installation
                        self.update_progress.emit(95, "Docker Desktop installer has been launched")
                        self.installation_complete.emit(False, "Docker Desktop installer has been launched. Please complete the installation process, then click 'Check Installation' to continue.")
                        return
                        
                    except Exception as download_error:
                        self.update_progress.emit(85, f"Failed to download/install Docker Desktop: {str(download_error)}")
                        self.update_progress.emit(86, f"Please download and install Docker Desktop manually from: {url}")
                        self.installation_complete.emit(False, "Manual installation required")
                        return
                    
            elif platform.system() == "Darwin":  # macOS
                self.update_progress.emit(50, "Please install Docker Desktop manually on macOS")
                self.installation_complete.emit(False, "Manual installation required")
                return
                
            elif platform.system() == "Linux":
                # Install Docker on Linux
                try:
                    self.update_progress.emit(40, "Updating package lists...")
                    subprocess.run(["sudo", "apt-get", "update"], check=True)
                    
                    self.update_progress.emit(60, "Installing Docker...")
                    subprocess.run(["sudo", "apt-get", "install", "-y", "docker.io"], check=True)
                    
                    self.update_progress.emit(80, "Starting Docker service...")
                    subprocess.run(["sudo", "systemctl", "start", "docker"], check=True)
                    subprocess.run(["sudo", "systemctl", "enable", "docker"], check=True)
                    
                    self.update_progress.emit(100, "Docker installed successfully")
                    self.installation_complete.emit(True, "Docker installed successfully")
                    return
                except Exception as e:
                    self.installation_complete.emit(False, f"Failed to install Docker: {str(e)}")
                    return
            
            # Unsupported OS
            self.installation_complete.emit(False, f"Unsupported operating system: {platform.system()}")
            
        except Exception as e:
            self.installation_complete.emit(False, f"Installation failed: {str(e)}")
    
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
            
    def check_wsl(self):
        """Check if WSL is installed"""
        try:
            result = subprocess.run(["wsl", "--status"], 
                                   stdout=subprocess.PIPE, 
                                   stderr=subprocess.PIPE,
                                   text=True,
                                   check=False)
            return result.returncode == 0
        except:
            return False
            
    def check_linux_distro(self):
        """Check if a Linux distribution is installed in WSL"""
        try:
            result = subprocess.run(["wsl", "-l"], 
                                   stdout=subprocess.PIPE, 
                                   stderr=subprocess.PIPE,
                                   text=True,
                                   check=False)
            # Check if any distribution is listed (other than just the header line)
            return len(result.stdout.strip().split('\n')) > 1
        except:
            return False
            
    def install_wsl_component(self):
        """Install WSL component"""
        try:
            # Enable WSL feature
            self.update_progress.emit(32, "Enabling WSL feature...")
            subprocess.run(["dism.exe", "/online", "/enable-feature", "/featurename:Microsoft-Windows-Subsystem-Linux", "/all", "/norestart"], 
                          check=True)
            
            # Enable Virtual Machine Platform
            self.update_progress.emit(35, "Enabling Virtual Machine Platform...")
            subprocess.run(["dism.exe", "/online", "/enable-feature", "/featurename:VirtualMachinePlatform", "/all", "/norestart"], 
                          check=True)
            
            # Set WSL 2 as default
            self.update_progress.emit(38, "Setting WSL 2 as default...")
            subprocess.run(["wsl", "--set-default-version", "2"], 
                          check=True)
            
            return True
        except Exception as e:
            self.update_progress.emit(39, f"WSL installation error: {str(e)}")
            return False
            
    def install_ubuntu(self):
        """Install Ubuntu distribution for WSL"""
        try:
            # Install Ubuntu using winget
            self.update_progress.emit(52, "Installing Ubuntu using winget...")
            subprocess.run(["winget", "install", "-e", "--id", "Canonical.Ubuntu"], 
                          check=True)
            
            # Alternative: Use wsl --install -d Ubuntu command
            # subprocess.run(["wsl", "--install", "-d", "Ubuntu"], check=True)
            
            return True
        except Exception as e:
            self.update_progress.emit(55, f"Ubuntu installation error: {str(e)}")
            
            # Provide manual installation instructions
            self.update_progress.emit(56, "Please install Ubuntu from Microsoft Store manually")
            return False


class DockerInstallerWidget(QWidget):
    """Docker installation widget"""
    installation_finished = Signal(bool)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
        self.installation_in_progress = False
        
    def init_ui(self):
        """Initialize the UI"""
        layout = QVBoxLayout()
        
        # Title and description
        title = create_title_label("Docker Installation")
        description = create_description_label(
            "Docker is required to run the Elith Pharmacy containers. "
            "This step will check if Docker is installed and install it if necessary."
        )
        
        # WSL option (Windows only)
        self.wsl_checkbox = QCheckBox("Install WSL (Windows Subsystem for Linux) if needed")
        self.wsl_checkbox.setChecked(True)
        
        # Only show WSL option on Windows
        if platform.system() == "Windows":
            wsl_description = create_description_label(
                "WSL allows Docker to run Linux containers on Windows. "
                "It's recommended for better performance and compatibility."
            )
            wsl_description.setStyleSheet("font-size: 9pt; color: #A6ADC8;")
        else:
            self.wsl_checkbox.setVisible(False)
            wsl_description = QLabel("")
        
        # Progress section
        progress_layout = QVBoxLayout()
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        style_progress_bar(self.progress_bar)
        
        self.status_label = QLabel("Ready to install Docker")
        
        progress_layout.addWidget(self.progress_bar)
        progress_layout.addWidget(self.status_label)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        self.install_button = QPushButton("Install Docker")
        style_button(self.install_button)
        self.install_button.clicked.connect(self.start_installation)
        
        self.check_button = QPushButton("Check Installation")
        style_button(self.check_button)
        self.check_button.clicked.connect(self.check_installation)
        self.check_button.setVisible(False)  # Initially hidden
        
        self.skip_button = QPushButton("Skip")
        style_secondary_button(self.skip_button)
        self.skip_button.clicked.connect(self.skip_installation)
        
        button_layout.addWidget(self.skip_button)
        button_layout.addStretch()
        button_layout.addWidget(self.check_button)
        button_layout.addWidget(self.install_button)
        
        # Add all to main layout
        layout.addWidget(title)
        layout.addSpacing(10)
        layout.addWidget(description)
        layout.addSpacing(20)
        
        if platform.system() == "Windows":
            layout.addWidget(self.wsl_checkbox)
            layout.addWidget(wsl_description)
            layout.addSpacing(15)
        
        layout.addLayout(progress_layout)
        layout.addSpacing(20)
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
        
        # Initialize worker
        self.worker = None
        
    def start_installation(self):
        """Start the Docker installation process"""
        self.install_button.setEnabled(False)
        self.skip_button.setEnabled(False)
        self.check_button.setVisible(False)
        self.installation_in_progress = True
        
        install_wsl = self.wsl_checkbox.isChecked() if platform.system() == "Windows" else False
        
        self.worker = DockerInstallWorker(install_wsl)
        self.worker.update_progress.connect(self.update_progress)
        self.worker.installation_complete.connect(self.installation_complete)
        self.worker.start()
    
    def check_installation(self):
        """Check if Docker has been installed successfully"""
        self.check_button.setEnabled(False)
        self.status_label.setText("Checking Docker installation...")
        
        # Create a simple worker to check Docker
        class CheckWorker(QThread):
            check_complete = Signal(bool)
            
            def run(self):
                try:
                    result = subprocess.run(["docker", "info"], 
                                          stdout=subprocess.PIPE, 
                                          stderr=subprocess.PIPE,
                                          text=True,
                                          check=False)
                    self.check_complete.emit(result.returncode == 0)
                except:
                    self.check_complete.emit(False)
        
        # Create and start the worker
        self.check_worker = CheckWorker()
        self.check_worker.check_complete.connect(self.on_check_complete)
        self.check_worker.start()
    
    def on_check_complete(self, success):
        """Handle Docker installation check completion"""
        if success:
            self.progress_bar.setValue(100)
            self.status_label.setText("Docker is installed and running")
            QMessageBox.information(self, "Docker Installation", "Docker has been successfully installed!")
            self.installation_finished.emit(True)
        else:
            self.check_button.setEnabled(True)
            self.status_label.setText("Docker is not yet installed or not running")
            QMessageBox.warning(self, "Docker Installation", 
                              "Docker doesn't appear to be installed or running yet. Please complete the Docker Desktop installation, start Docker, and try again.")
        
    def update_progress(self, value, message):
        """Update the progress bar and status label"""
        self.progress_bar.setValue(value)
        self.status_label.setText(message)
        
    def installation_complete(self, success, message):
        """Handle installation completion"""
        if success:
            QMessageBox.information(self, "Docker Installation", message)
            self.installation_finished.emit(True)
        else:
            QMessageBox.warning(self, "Docker Installation", message)
            
            if "installer has been launched" in message:
                # Show the check button if the installer was launched
                self.check_button.setVisible(True)
                self.check_button.setEnabled(True)
                self.install_button.setVisible(False)
            else:
                # For other failures, allow retry
                self.install_button.setEnabled(True)
            
            self.skip_button.setEnabled(True)
            
    def skip_installation(self):
        """Skip the Docker installation"""
        reply = QMessageBox.question(self, "Skip Docker Installation", 
                                    "Docker is required for Elith Pharmacy. Are you sure you want to skip this step?",
                                    QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        
        if reply == QMessageBox.Yes:
            self.installation_finished.emit(False)


# For testing the component independently
if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    window = DockerInstallerWidget()
    window.show()
    
    sys.exit(app.exec_()) 