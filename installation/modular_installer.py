#!/usr/bin/env python3
"""
Elith Pharmacy Modular Installer
A Qt GUI application for installing and setting up Elith Pharmacy using separate installation steps
"""

import os
import sys
import platform
import subprocess
from pathlib import Path

from qtpy.QtWidgets import (QApplication, QMainWindow, QStackedWidget, QWidget,
                           QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
                           QFileDialog, QMessageBox, QLineEdit, QCheckBox)
from qtpy.QtCore import Qt, QSize
from qtpy.QtGui import QFont, QPixmap

# Import installer components
from installer_components import APP_NAME, APP_VERSION, BACKGROUND_COLOR, TEXT_COLOR, ACCENT_COLOR
from installer_components.ui_utils import (create_title_label, create_description_label, 
                                         style_button, style_secondary_button, get_global_stylesheet)
from installer_components.docker_installer import DockerInstallerWidget
from installer_components.supabase_installer import SupabaseInstallerWidget
from installer_components.file_downloader import FileDownloaderWidget
from installer_components.frontend_setup import FrontendSetupWidget
from installer_components.backend_setup import BackendSetupWidget

class WelcomeWidget(QWidget):
    """Welcome screen widget"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
        
    def init_ui(self):
        """Initialize the UI"""
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
            logo_label.setStyleSheet(f"color: {ACCENT_COLOR};")
        
        logo_layout.addStretch()
        logo_layout.addWidget(logo_label)
        logo_layout.addStretch()
        
        # Welcome message
        title = create_title_label(f"Welcome to {APP_NAME} {APP_VERSION}")
        description = create_description_label(
            f"This installer will guide you through the step-by-step installation of {APP_NAME}. "
            f"Each component will be installed separately, allowing you to customize your installation."
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
        layout.addWidget(title)
        layout.addSpacing(10)
        layout.addWidget(description)
        layout.addSpacing(30)
        layout.addWidget(req_title)
        layout.addSpacing(10)
        layout.addWidget(req_list)
        layout.addStretch()
        
        self.setLayout(layout)


class InstallLocationWidget(QWidget):
    """Installation location selection widget"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.install_path = os.path.join(os.path.expanduser("~"), "ElithPharmacy")
        self.init_ui()
        
    def init_ui(self):
        """Initialize the UI"""
        layout = QVBoxLayout()
        
        # Title and description
        title = create_title_label("Installation Location")
        description = create_description_label(
            "Choose the folder where Elith Pharmacy will be installed. "
            "Make sure you have write permissions to this location."
        )
        
        # Directory selection
        dir_layout = QHBoxLayout()
        self.dir_edit = QLineEdit(self.install_path)
        self.dir_edit.setMinimumHeight(30)
        self.dir_edit.setStyleSheet(f"""
            QLineEdit {{
                background-color: #181825;
                color: {TEXT_COLOR};
                border: 1px solid #313244;
                border-radius: 4px;
                padding: 4px 8px;
                selection-background-color: {ACCENT_COLOR};
            }}
            QLineEdit:focus {{
                border: 1px solid {ACCENT_COLOR};
            }}
        """)
        
        browse_button = QPushButton("Browse...")
        style_secondary_button(browse_button)
        browse_button.clicked.connect(self.browse_directory)
        
        dir_layout.addWidget(self.dir_edit)
        dir_layout.addWidget(browse_button)
        
        # Add widgets to layout
        layout.addWidget(title)
        layout.addSpacing(10)
        layout.addWidget(description)
        layout.addSpacing(20)
        layout.addLayout(dir_layout)
        layout.addStretch()
        
        self.setLayout(layout)
        
    def browse_directory(self):
        """Open directory browser dialog"""
        directory = QFileDialog.getExistingDirectory(self, "Select Installation Directory")
        if directory:
            self.dir_edit.setText(directory)
            self.install_path = directory
    
    def get_install_path(self):
        """Return the selected installation path"""
        return self.dir_edit.text()


class CompletionWidget(QWidget):
    """Installation completion widget"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.launch_app = True
        self.init_ui()
        
    def init_ui(self):
        """Initialize the UI"""
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
            success_label.setStyleSheet(f"color: {ACCENT_COLOR};")
        
        success_layout.addStretch()
        success_layout.addWidget(success_label)
        success_layout.addStretch()
        
        # Completion message
        title = create_title_label("Installation Complete!")
        description = create_description_label(
            f"{APP_NAME} {APP_VERSION} has been successfully installed on your computer. "
            f"You can now launch the application and start using it."
        )
        
        # Launch option
        self.launch_checkbox = QCheckBox("Launch Elith Pharmacy when finished")
        self.launch_checkbox.setChecked(True)
        self.launch_checkbox.toggled.connect(self.toggle_launch)
        font = self.launch_checkbox.font()
        font.setPointSize(10)
        self.launch_checkbox.setFont(font)
        
        # Add widgets to layout
        layout.addLayout(success_layout)
        layout.addSpacing(20)
        layout.addWidget(title)
        layout.addSpacing(10)
        layout.addWidget(description)
        layout.addSpacing(30)
        layout.addWidget(self.launch_checkbox)
        layout.addStretch()
        
        self.setLayout(layout)
        
    def toggle_launch(self, checked):
        """Toggle whether to launch the app after installation"""
        self.launch_app = checked


class InstallerMainWindow(QMainWindow):
    """Main installer window"""
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle(f"{APP_NAME} Installer")
        self.setMinimumSize(600, 500)
        
        # Apply global stylesheet
        self.setStyleSheet(get_global_stylesheet())
        
        # Track completed stages
        self.stage_completed = {
            "docker": False,
            "files": False,
            "supabase": False,
            "frontend": False,
            "backend": False
        }
        
        # Initialize components
        self.init_ui()
        
    def init_ui(self):
        """Initialize the UI"""
        # Central widget and main layout
        central_widget = QWidget()
        main_layout = QVBoxLayout(central_widget)
        
        # Create stacked widget for pages
        self.stacked_widget = QStackedWidget()
        
        # Create pages
        self.welcome_widget = WelcomeWidget()
        self.location_widget = InstallLocationWidget()
        self.docker_widget = DockerInstallerWidget()
        self.file_downloader_widget = None  # Will be created after install path is known
        self.supabase_widget = None  # Will be created after install path is known
        self.frontend_widget = None  # Will be created after install path is known
        self.backend_widget = None  # Will be created after install path is known
        self.completion_widget = CompletionWidget()
        
        # Add pages to stacked widget
        self.stacked_widget.addWidget(self.welcome_widget)
        self.stacked_widget.addWidget(self.location_widget)
        self.stacked_widget.addWidget(self.docker_widget)
        # Other widgets will be added later
        self.stacked_widget.addWidget(self.completion_widget)
        
        # Connect signals
        self.docker_widget.installation_finished.connect(self.on_docker_installed)
        
        # Navigation buttons
        nav_layout = QHBoxLayout()
        
        self.back_button = QPushButton("< Back")
        style_secondary_button(self.back_button)
        self.back_button.clicked.connect(self.go_back)
        
        self.next_button = QPushButton("Next >")
        style_button(self.next_button)
        self.next_button.clicked.connect(self.go_next)
        
        self.finish_button = QPushButton("Finish")
        style_button(self.finish_button)
        self.finish_button.clicked.connect(self.finish_installation)
        self.finish_button.hide()
        
        nav_layout.addWidget(self.back_button)
        nav_layout.addStretch()
        nav_layout.addWidget(self.next_button)
        nav_layout.addWidget(self.finish_button)
        
        # Add widgets to main layout
        main_layout.addWidget(self.stacked_widget)
        main_layout.addLayout(nav_layout)
        
        # Set central widget
        self.setCentralWidget(central_widget)
        
        # Start at the first page
        self.stacked_widget.setCurrentIndex(0)
        self.update_buttons()
        
    def go_next(self):
        """Go to the next page"""
        current_index = self.stacked_widget.currentIndex()
        
        # Validate current stage completion before proceeding
        if current_index == 2:  # Docker installation page
            if not self.stage_completed["docker"]:
                QMessageBox.warning(self, "Incomplete Step", 
                                   "Please complete the Docker installation before proceeding.",
                                   QMessageBox.Ok)
                return
        elif current_index == 3:  # File download page
            if not self.stage_completed["files"]:
                QMessageBox.warning(self, "Incomplete Step", 
                                   "Please complete the file download before proceeding.",
                                   QMessageBox.Ok)
                return
        elif current_index == 4:  # Supabase installation page
            if not self.stage_completed["supabase"]:
                QMessageBox.warning(self, "Incomplete Step", 
                                   "Please complete the Supabase installation before proceeding.",
                                   QMessageBox.Ok)
                return
        elif current_index == 5:  # Frontend setup page
            if not self.stage_completed["frontend"]:
                QMessageBox.warning(self, "Incomplete Step", 
                                   "Please complete the frontend setup before proceeding.",
                                   QMessageBox.Ok)
                return
        elif current_index == 6:  # Backend setup page
            if not self.stage_completed["backend"]:
                QMessageBox.warning(self, "Incomplete Step", 
                                   "Please complete the backend setup before proceeding.",
                                   QMessageBox.Ok)
                return
        
        # Handle special cases
        if current_index == 1:  # Location page
            install_path = self.location_widget.get_install_path()
            
            # Create remaining widgets with selected install path
            if not self.file_downloader_widget:
                self.file_downloader_widget = FileDownloaderWidget(install_path)
                self.file_downloader_widget.download_finished.connect(self.on_files_downloaded)
                self.stacked_widget.insertWidget(3, self.file_downloader_widget)
                
            if not self.supabase_widget:
                self.supabase_widget = SupabaseInstallerWidget(install_path)
                self.supabase_widget.installation_finished.connect(self.on_supabase_installed)
                self.stacked_widget.insertWidget(4, self.supabase_widget)
                
            if not self.frontend_widget:
                self.frontend_widget = FrontendSetupWidget(install_path)
                self.frontend_widget.setup_finished.connect(self.on_frontend_setup)
                self.stacked_widget.insertWidget(5, self.frontend_widget)
                
            if not self.backend_widget:
                self.backend_widget = BackendSetupWidget(install_path)
                self.backend_widget.setup_finished.connect(self.on_backend_setup)
                self.stacked_widget.insertWidget(6, self.backend_widget)
        
        # Go to next page
        self.stacked_widget.setCurrentIndex(current_index + 1)
        self.update_buttons()
        
    def go_back(self):
        """Go to the previous page"""
        current_index = self.stacked_widget.currentIndex()
        
        # If going back from a completed stage, mark it as incomplete
        if current_index == 3:  # Going back from file download to Docker
            self.stage_completed["docker"] = False
        elif current_index == 4:  # Going back from Supabase to file download
            self.stage_completed["files"] = False
        elif current_index == 5:  # Going back from frontend to Supabase
            self.stage_completed["supabase"] = False
        elif current_index == 6:  # Going back from backend to frontend
            self.stage_completed["frontend"] = False
        elif current_index == 7:  # Going back from completion to backend
            self.stage_completed["backend"] = False
        
        self.stacked_widget.setCurrentIndex(current_index - 1)
        self.update_buttons()
        
    def update_buttons(self):
        """Update button visibility based on current page"""
        current_index = self.stacked_widget.currentIndex()
        total_pages = self.stacked_widget.count()
        
        # Back button visible except on first page
        self.back_button.setVisible(current_index > 0)
        
        # Next button visible except on last page
        self.next_button.setVisible(current_index < total_pages - 1)
        
        # Finish button only visible on last page
        self.finish_button.setVisible(current_index == total_pages - 1)
        
    def on_docker_installed(self, success):
        """Handle Docker installation completion"""
        if success:
            self.stage_completed["docker"] = True
            self.go_next()
        else:
            reply = QMessageBox.critical(self, "Docker Installation Failed", 
                                       "Docker installation failed or was skipped. Docker is required for Elith Pharmacy to function properly.\n\n"
                                       "Would you like to return to the Docker installation page and try again?",
                                       QMessageBox.Yes | QMessageBox.No, QMessageBox.Yes)
            
            if reply == QMessageBox.No:
                # Close the installer if user doesn't want to retry
                self.close()
    
    def on_files_downloaded(self, success):
        """Handle file download completion"""
        if success:
            self.stage_completed["files"] = True
            self.go_next()
        else:
            reply = QMessageBox.critical(self, "File Download Failed", 
                                       "Required files could not be downloaded. These files are necessary for Elith Pharmacy to function properly.\n\n"
                                       "Would you like to return to the file download page and try again?",
                                       QMessageBox.Yes | QMessageBox.No, QMessageBox.Yes)
            
            if reply == QMessageBox.No:
                # Close the installer if user doesn't want to retry
                self.close()
    
    def on_supabase_installed(self, success):
        """Handle Supabase installation completion"""
        if success:
            self.stage_completed["supabase"] = True
            self.go_next()
        else:
            reply = QMessageBox.critical(self, "Supabase Installation Failed", 
                                       "Supabase installation failed or was skipped. Supabase is required for the database functionality.\n\n"
                                       "Would you like to return to the Supabase installation page and try again?",
                                       QMessageBox.Yes | QMessageBox.No, QMessageBox.Yes)
            
            if reply == QMessageBox.No:
                # Close the installer if user doesn't want to retry
                self.close()
    
    def on_frontend_setup(self, success):
        """Handle frontend setup completion"""
        if success:
            self.stage_completed["frontend"] = True
            self.go_next()
        else:
            reply = QMessageBox.critical(self, "Frontend Setup Failed", 
                                       "Frontend setup failed or was skipped. The frontend is required for the user interface.\n\n"
                                       "Would you like to return to the frontend setup page and try again?",
                                       QMessageBox.Yes | QMessageBox.No, QMessageBox.Yes)
            
            if reply == QMessageBox.No:
                # Close the installer if user doesn't want to retry
                self.close()
    
    def on_backend_setup(self, success):
        """Handle backend setup completion"""
        if success:
            self.stage_completed["backend"] = True
            self.go_next()
        else:
            reply = QMessageBox.critical(self, "Backend Setup Failed", 
                                       "Backend setup failed or was skipped. The backend is required for the application logic.\n\n"
                                       "Would you like to return to the backend setup page and try again?",
                                       QMessageBox.Yes | QMessageBox.No, QMessageBox.Yes)
            
            if reply == QMessageBox.No:
                # Close the installer if user doesn't want to retry
                self.close()
    
    def finish_installation(self):
        """Complete the installation"""
        # Configure startup services and watchdog
        install_path = self.location_widget.get_install_path()
        self.configure_startup(install_path)
        
        if self.completion_widget.launch_app:
            # Launch the application
            app_launcher = os.path.join(install_path, "App-Interface", "main.py")
            
            if os.path.exists(app_launcher):
                if platform.system() == "Windows":
                    subprocess.Popen(["pythonw", app_launcher])
                else:
                    subprocess.Popen(["python3", app_launcher])
        
        # Close the installer
        self.close()
    
    def configure_startup(self, install_path):
        """Configure startup services and watchdog"""
        try:
            if platform.system() == "Windows":
                # Register watchdog as startup task
                watchdog_script = os.path.join(install_path, "watchdog.ps1")
                if os.path.exists(watchdog_script):
                    subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", watchdog_script, "-register"], 
                                  check=True)
        except Exception as e:
            QMessageBox.warning(self, "Startup Configuration", 
                               f"Failed to configure startup services: {str(e)}")


# Main application
def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    window = InstallerMainWindow()
    window.show()
    
    sys.exit(app.exec_())


if __name__ == "__main__":
    main() 