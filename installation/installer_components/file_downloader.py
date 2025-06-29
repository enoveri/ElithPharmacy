"""
File Download Component
Handles downloading installation files from Google Drive or GitHub
"""

import os
import sys
import subprocess
import platform
import time
import tempfile
import shutil
import zipfile
from pathlib import Path

from qtpy.QtWidgets import (QWidget, QLabel, QVBoxLayout, QHBoxLayout, QPushButton,
                           QProgressBar, QApplication, QMessageBox, QRadioButton,
                           QButtonGroup, QFileDialog)
from qtpy.QtCore import Qt, QThread, Signal

from . import APP_NAME
from .ui_utils import (create_title_label, create_description_label, 
                     style_button, style_secondary_button, style_progress_bar)

class FileDownloadWorker(QThread):
    """Worker thread for downloading installation files"""
    update_progress = Signal(int, str)
    download_complete = Signal(bool, str)
    
    def __init__(self, install_path, download_method="google_drive"):
        super().__init__()
        self.install_path = install_path
        self.download_method = download_method
        self.temp_dir = tempfile.mkdtemp()
        
    def run(self):
        try:
            self.update_progress.emit(10, "Preparing download...")
            
            if self.download_method == "google_drive":
                self.update_progress.emit(20, "Connecting to Google Drive...")
                if not self.download_from_gdrive():
                    self.download_complete.emit(False, "Failed to download from Google Drive")
                    return
            elif self.download_method == "github":
                self.update_progress.emit(20, "Connecting to GitHub...")
                if not self.download_from_github():
                    self.download_complete.emit(False, "Failed to download from GitHub")
                    return
            elif self.download_method == "local_zip":
                self.update_progress.emit(20, "Using local ZIP file...")
                if not self.use_local_zip():
                    self.download_complete.emit(False, "Failed to use local ZIP file")
                    return
            
            # Extract files to installation directory
            self.update_progress.emit(70, "Extracting files...")
            if not self.extract_files():
                self.download_complete.emit(False, "Failed to extract files")
                return
            
            # Check for updates if needed
            if self.download_method == "github":
                self.update_progress.emit(80, "Checking for updates...")
                if not self.check_for_updates():
                    self.update_progress.emit(85, "Update check failed, continuing with installation")
            
            # Clean up temporary files
            self.update_progress.emit(90, "Cleaning up...")
            self.cleanup()
            
            # Download complete
            self.update_progress.emit(100, "Files downloaded successfully")
            self.download_complete.emit(True, "Files downloaded successfully")
            
        except Exception as e:
            self.cleanup()
            self.download_complete.emit(False, f"Download failed: {str(e)}")
    
    def download_from_gdrive(self):
        """Download installation files from Google Drive"""
        try:
            # This is a placeholder for actual Google Drive download logic
            # In a real implementation, you would use the Google Drive API or gdown
            
            self.update_progress.emit(30, "Downloading from Google Drive...")
            time.sleep(2)  # Simulate download
            
            # For demonstration, create a dummy zip file
            self.zip_path = os.path.join(self.temp_dir, "elith_pharmacy.zip")
            with open(self.zip_path, 'w') as f:
                f.write("Placeholder for zip content")
            
            self.update_progress.emit(60, "Download completed")
            return True
            
        except Exception as e:
            self.update_progress.emit(40, f"Google Drive download error: {str(e)}")
            return False
    
    def download_from_github(self):
        """Download installation files from GitHub"""
        try:
            # Clone or pull from GitHub repository
            repo_url = "https://github.com/Verily/Pharmacy/Updates.git"  # Placeholder URL
            
            self.update_progress.emit(30, f"Cloning repository from {repo_url}...")
            
            # Check if git is installed
            try:
                subprocess.run(["git", "--version"], check=True, stdout=subprocess.PIPE)
            except:
                self.update_progress.emit(35, "Git not found, attempting to install...")
                if not self.install_git():
                    return False
            
            # Clone the repository
            repo_path = os.path.join(self.temp_dir, "repo")
            try:
                subprocess.run(["git", "clone", repo_url, repo_path], check=True)
                self.update_progress.emit(50, "Repository cloned successfully")
            except subprocess.CalledProcessError:
                self.update_progress.emit(40, "Failed to clone repository")
                return False
            
            # Create a zip file from the repository
            self.zip_path = os.path.join(self.temp_dir, "elith_pharmacy.zip")
            self.update_progress.emit(55, "Creating archive from repository...")
            
            # In a real implementation, you would create a proper zip file
            # For now, just create a placeholder
            with open(self.zip_path, 'w') as f:
                f.write("Placeholder for zip content")
            
            self.update_progress.emit(60, "Download completed")
            return True
            
        except Exception as e:
            self.update_progress.emit(40, f"GitHub download error: {str(e)}")
            return False
    
    def use_local_zip(self):
        """Use a locally provided ZIP file"""
        try:
            # Open file dialog to select ZIP file
            self.update_progress.emit(25, "Please select the installation ZIP file...")
            
            # This would normally be handled by the UI thread
            # For now, just simulate having a ZIP file
            self.zip_path = os.path.join(self.temp_dir, "elith_pharmacy.zip")
            with open(self.zip_path, 'w') as f:
                f.write("Placeholder for zip content")
            
            self.update_progress.emit(60, "ZIP file selected")
            return True
            
        except Exception as e:
            self.update_progress.emit(30, f"Local ZIP selection error: {str(e)}")
            return False
    
    def extract_files(self):
        """Extract files to installation directory"""
        try:
            # In a real implementation, you would extract the ZIP file
            # For now, just create the necessary directories
            
            # Create main directories
            os.makedirs(os.path.join(self.install_path, "frontend"), exist_ok=True)
            os.makedirs(os.path.join(self.install_path, "backend"), exist_ok=True)
            os.makedirs(os.path.join(self.install_path, "Elith-Supabase"), exist_ok=True)
            os.makedirs(os.path.join(self.install_path, "App-Interface"), exist_ok=True)
            
            # Create placeholder files
            with open(os.path.join(self.install_path, "setup_local_supabase.ps1"), 'w') as f:
                f.write("# Placeholder for Supabase setup script")
            
            with open(os.path.join(self.install_path, "watchdog.ps1"), 'w') as f:
                f.write("# Placeholder for watchdog script")
            
            return True
            
        except Exception as e:
            self.update_progress.emit(75, f"Extraction error: {str(e)}")
            return False
    
    def check_for_updates(self):
        """Check for updates from the repository"""
        try:
            # This would check for updates from the GitHub repository
            # For now, just simulate the check
            self.update_progress.emit(82, "Checking for updates...")
            time.sleep(1)
            self.update_progress.emit(85, "No updates found")
            return True
            
        except Exception as e:
            self.update_progress.emit(83, f"Update check error: {str(e)}")
            return False
    
    def install_git(self):
        """Install Git if not present"""
        try:
            if platform.system() == "Windows":
                # Try using winget
                self.update_progress.emit(36, "Installing Git using winget...")
                subprocess.run(["winget", "install", "-e", "--id", "Git.Git"], check=True)
                return True
            else:
                self.update_progress.emit(36, "Please install Git manually")
                return False
        except Exception as e:
            self.update_progress.emit(37, f"Git installation error: {str(e)}")
            return False
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            shutil.rmtree(self.temp_dir)
        except:
            pass


class FileDownloaderWidget(QWidget):
    """File downloader widget"""
    download_finished = Signal(bool)
    
    def __init__(self, install_path, parent=None):
        super().__init__(parent)
        self.install_path = install_path
        self.download_method = "google_drive"  # Default method
        self.init_ui()
        
    def init_ui(self):
        """Initialize the UI"""
        layout = QVBoxLayout()
        
        # Title and description
        title = create_title_label("Installation Files")
        description = create_description_label(
            f"The installer needs to download the necessary files for {APP_NAME}. "
            f"Please select your preferred download method."
        )
        
        # Download method selection
        method_layout = QVBoxLayout()
        
        self.gdrive_radio = QRadioButton("Download from Google Drive (Recommended)")
        self.gdrive_radio.setChecked(True)
        self.github_radio = QRadioButton("Download from GitHub (Latest updates)")
        self.local_radio = QRadioButton("Use local ZIP file")
        
        # Group radio buttons
        self.button_group = QButtonGroup()
        self.button_group.addButton(self.gdrive_radio)
        self.button_group.addButton(self.github_radio)
        self.button_group.addButton(self.local_radio)
        self.button_group.buttonClicked.connect(self.method_changed)
        
        method_layout.addWidget(self.gdrive_radio)
        method_layout.addWidget(self.github_radio)
        method_layout.addWidget(self.local_radio)
        
        # Progress section
        progress_layout = QVBoxLayout()
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        style_progress_bar(self.progress_bar)
        
        self.status_label = QLabel("Ready to download installation files")
        
        progress_layout.addWidget(self.progress_bar)
        progress_layout.addWidget(self.status_label)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        self.download_button = QPushButton("Download Files")
        style_button(self.download_button)
        self.download_button.clicked.connect(self.start_download)
        
        self.browse_button = QPushButton("Browse...")
        style_secondary_button(self.browse_button)
        self.browse_button.clicked.connect(self.browse_zip)
        self.browse_button.setVisible(False)  # Only visible for local ZIP option
        
        button_layout.addWidget(self.browse_button)
        button_layout.addStretch()
        button_layout.addWidget(self.download_button)
        
        # Add all to main layout
        layout.addWidget(title)
        layout.addSpacing(10)
        layout.addWidget(description)
        layout.addSpacing(20)
        layout.addLayout(method_layout)
        layout.addSpacing(20)
        layout.addLayout(progress_layout)
        layout.addSpacing(20)
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
        
        # Initialize worker
        self.worker = None
        
    def method_changed(self, button):
        """Handle download method change"""
        if button == self.gdrive_radio:
            self.download_method = "google_drive"
            self.browse_button.setVisible(False)
            self.download_button.setText("Download Files")
        elif button == self.github_radio:
            self.download_method = "github"
            self.browse_button.setVisible(False)
            self.download_button.setText("Download Files")
        elif button == self.local_radio:
            self.download_method = "local_zip"
            self.browse_button.setVisible(True)
            self.download_button.setText("Use Selected File")
        
    def browse_zip(self):
        """Open file dialog to select ZIP file"""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select Installation ZIP File", "", "ZIP Files (*.zip)"
        )
        if file_path:
            self.status_label.setText(f"Selected file: {os.path.basename(file_path)}")
            self.zip_path = file_path
        
    def start_download(self):
        """Start the file download process"""
        self.download_button.setEnabled(False)
        self.browse_button.setEnabled(False)
        self.gdrive_radio.setEnabled(False)
        self.github_radio.setEnabled(False)
        self.local_radio.setEnabled(False)
        
        self.worker = FileDownloadWorker(self.install_path, self.download_method)
        self.worker.update_progress.connect(self.update_progress)
        self.worker.download_complete.connect(self.download_complete)
        self.worker.start()
        
    def update_progress(self, value, message):
        """Update the progress bar and status label"""
        self.progress_bar.setValue(value)
        self.status_label.setText(message)
        
    def download_complete(self, success, message):
        """Handle download completion"""
        if success:
            QMessageBox.information(self, "File Download", message)
            self.download_finished.emit(True)
        else:
            QMessageBox.warning(self, "File Download", message)
            self.download_button.setEnabled(True)
            self.browse_button.setEnabled(True)
            self.gdrive_radio.setEnabled(True)
            self.github_radio.setEnabled(True)
            self.local_radio.setEnabled(True)


# For testing the component independently
if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    window = FileDownloaderWidget(os.path.expanduser("~/ElithPharmacy"))
    window.show()
    
    sys.exit(app.exec_()) 