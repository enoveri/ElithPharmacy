#!/usr/bin/env python3
"""
Elith Pharmacy Application Launcher
A Qt-based GUI launcher for the Elith Pharmacy application
"""

import os
import sys
import time
import socket
import subprocess
import threading
from pathlib import Path

# Import Qt libraries
from qtpy.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QMessageBox, QProgressBar, QSplashScreen,
    QMenuBar, QMenu, QAction, QStatusBar
)
from qtpy.QtCore import Qt, QUrl, QSize, QTimer, Signal, QObject, Slot, QEvent
from qtpy.QtGui import QIcon, QPixmap, QFont
from qtpy.QtWebEngineWidgets import QWebEngineView, QWebEngineSettings

# Import our loading overlay
from loading_overlay import LoadingOverlay, LoadingOverlayThread

# Application constants
APP_NAME = "Elith Pharmacy"
APP_URL = "http://localhost:5173"
SUPABASE_STUDIO_URL = "http://localhost:54322"
SUPABASE_PORT = 54321
FRONTEND_PORT = 5173

class PharmacyAppLauncher(QMainWindow):
    """Main application launcher window with integrated browser"""
    
    status_update = Signal(str)
    
    def __init__(self):
        super().__init__()
        
        # Set up the main window
        self.setWindowTitle(f"{APP_NAME} Launcher")
        self.setMinimumSize(1200, 800)
        
        # Create central widget and layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        
        # Create menu bar
        self.create_menu_bar()
        
        # Add status bar
        self.statusBar = QStatusBar()
        self.setStatusBar(self.statusBar)
        
        # Create progress bar (hidden by default)
        self.progress_bar = QProgressBar()
        self.progress_bar.setTextVisible(True)
        self.progress_bar.setFormat("%v%")
        self.progress_bar.setValue(0)
        self.progress_bar.setStyleSheet("""
            QProgressBar {
                border: 1px solid #2ecc71;
                border-radius: 5px;
                text-align: center;
                height: 20px;
                margin: 0px 10px;
            }
            QProgressBar::chunk {
                background-color: #2ecc71;
                border-radius: 5px;
            }
        """)
        self.progress_bar.setVisible(False)
        main_layout.addWidget(self.progress_bar)
        
        # Add embedded web browser
        self.browser = QWebEngineView()
        self.browser.setUrl(QUrl("about:blank"))
        
        # Enable developer tools and other settings
        settings = self.browser.settings()
        
        # Handle different versions of Qt/PyQt with different attribute names
        try:
            # PyQt5/PySide2 style
            settings.setAttribute(QWebEngineSettings.JavascriptEnabled, True)
            settings.setAttribute(QWebEngineSettings.LocalStorageEnabled, True)
            settings.setAttribute(QWebEngineSettings.WebGLEnabled, True)
        except AttributeError:
            try:
                # PyQt6/PySide6 style
                settings.setAttribute(QWebEngineSettings.JavaScript, True)
                settings.setAttribute(QWebEngineSettings.LocalStorage, True)
                settings.setAttribute(QWebEngineSettings.WebGL, True)
            except AttributeError:
                # Fallback for other versions
                print("Warning: Could not set web engine settings. Some features may not work properly.")
        
        main_layout.addWidget(self.browser)
        
        # Create loading overlay
        self.loading_thread = None
        
        # Connect signals
        self.status_update.connect(self.update_status)
        
        # Check if services are already running on startup
        QTimer.singleShot(500, self.check_services_status)
    
    def create_menu_bar(self):
        """Create application menu bar"""
        menu_bar = self.menuBar()
        
        # Services menu
        services_menu = menu_bar.addMenu("&Services")
        
        # Start services action
        self.start_action = QAction("&Start Services", self)
        self.start_action.setStatusTip("Start Supabase and application services")
        self.start_action.triggered.connect(self.start_services)
        services_menu.addAction(self.start_action)
        
        # Stop services action
        self.stop_action = QAction("S&top Services", self)
        self.stop_action.setStatusTip("Stop all running services")
        self.stop_action.triggered.connect(self.stop_services)
        self.stop_action.setEnabled(False)
        services_menu.addAction(self.stop_action)
        
        services_menu.addSeparator()
        
        # Exit action
        exit_action = QAction("E&xit", self)
        exit_action.setStatusTip("Exit the application")
        exit_action.triggered.connect(self.close)
        services_menu.addAction(exit_action)
        
        # View menu
        view_menu = menu_bar.addMenu("&View")
        
        # Refresh action
        self.refresh_action = QAction("&Refresh", self)
        self.refresh_action.setStatusTip("Refresh the browser view")
        self.refresh_action.triggered.connect(self.refresh_browser)
        view_menu.addAction(self.refresh_action)
        
        # Help menu
        help_menu = menu_bar.addMenu("&Help")
        
        # About action
        about_action = QAction("&About", self)
        about_action.setStatusTip("Show information about the application")
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def show_about(self):
        """Show about dialog"""
        QMessageBox.about(
            self,
            f"About {APP_NAME}",
            f"<h2>{APP_NAME} Launcher</h2>"
            "<p>A unified interface for launching and managing the Elith Pharmacy application.</p>"
            "<p>© 2023 Elith Pharmacy</p>"
        )
    
    def check_services_status(self):
        """Check if services are already running on startup"""
        if self.is_supabase_running() and self.is_frontend_running():
            self.status_update.emit("Services already running")
            self.update_ui_for_running_services()
            self.browser.setUrl(QUrl(APP_URL))
        else:
            self.status_update.emit("Services not running, starting automatically...")
            # Automatically start services on launch
            QTimer.singleShot(500, self.start_services)
    
    def get_welcome_html(self):
        """Return welcome HTML to display when services aren't running"""
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{APP_NAME}</title>
            <style>
                :root {{
                    --primary: #2ecc71;
                    --primary-dark: #27ae60;
                    --secondary: #3498db;
                    --dark: #2c3e50;
                    --light: #ecf0f1;
                    --danger: #e74c3c;
                    --warning: #f39c12;
                    --success: #2ecc71;
                    --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
                }}
                
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8f9fa;
                    color: var(--dark);
                    line-height: 1.6;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    overflow-x: hidden;
                }}
                
                .welcome-container {{
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }}
                
                .logo-container {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                
                .logo {{
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--primary);
                    letter-spacing: -1px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                
                .logo-icon {{
                    margin-right: 10px;
                    font-size: 3rem;
                }}
                
                .tagline {{
                    font-size: 1.2rem;
                    color: var(--dark);
                    opacity: 0.8;
                    margin-bottom: 30px;
                }}
                
                .main-content {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    width: 100%;
                }}
                
                .card {{
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: var(--box-shadow);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }}
                
                .card:hover {{
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
                }}
                
                .card-title {{
                    font-size: 1.5rem;
                    margin-bottom: 20px;
                    color: var(--primary);
                    display: flex;
                    align-items: center;
                }}
                
                .card-title i {{
                    margin-right: 10px;
                    font-size: 1.8rem;
                }}
                
                .card-content {{
                    margin-bottom: 20px;
                }}
                
                .steps {{
                    margin: 20px 0;
                }}
                
                .step {{
                    display: flex;
                    margin-bottom: 15px;
                    align-items: flex-start;
                }}
                
                .step-number {{
                    background-color: var(--primary);
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin-right: 15px;
                    flex-shrink: 0;
                }}
                
                .step-content {{
                    flex: 1;
                }}
                
                .features {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }}
                
                .feature {{
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                }}
                
                .feature i {{
                    color: var(--primary);
                    margin-right: 10px;
                    font-size: 1.2rem;
                }}
                
                .status-indicator {{
                    display: flex;
                    align-items: center;
                    margin-top: 20px;
                    padding: 10px 15px;
                    border-radius: 8px;
                    background-color: #fff3cd;
                    border-left: 4px solid var(--warning);
                }}
                
                .status-indicator i {{
                    color: var(--warning);
                    margin-right: 10px;
                    font-size: 1.5rem;
                }}
                
                .footer {{
                    text-align: center;
                    margin-top: 40px;
                    padding: 20px;
                    color: var(--dark);
                    opacity: 0.7;
                    font-size: 0.9rem;
                }}
                
                @media (max-width: 768px) {{
                    .main-content {{
                        grid-template-columns: 1fr;
                    }}
                    
                    .features {{
                        grid-template-columns: 1fr;
                    }}
                }}
                
                /* Animations */
                @keyframes fadeIn {{
                    from {{ opacity: 0; transform: translateY(20px); }}
                    to {{ opacity: 1; transform: translateY(0); }}
                }}
                
                .logo, .tagline, .card {{
                    animation: fadeIn 0.8s ease forwards;
                }}
                
                .card:nth-child(2) {{
                    animation-delay: 0.2s;
                }}
                
                /* Icons using CSS */
                .icon {{
                    display: inline-block;
                    width: 24px;
                    height: 24px;
                    margin-right: 8px;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-size: contain;
                }}
                
                .icon-pharmacy {{
                    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232ecc71"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-4H7V8h4v8zm6-4h-2v4h-2V8h4v4z"/></svg>');
                }}
                
                .icon-check {{
                    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232ecc71"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>');
                }}
                
                .icon-warning {{
                    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f39c12"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.83 0-1.5-.67-1.5-1.5S11.17 14 12 14s1.5.67 1.5 1.5S12.83 17 12 17zm1-4h-2V7h2v6z"/></svg>');
                }}
                
                .icon-play {{
                    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232ecc71"><path d="M8 5v14l11-7L8 5z"/></svg>');
                }}
                
                .icon-info {{
                    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233498db"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>');
                }}
            </style>
        </head>
        <body>
            <div class="welcome-container">
                <div class="logo-container">
                    <div class="logo">
                        <span class="icon icon-pharmacy"></span>
                        {APP_NAME}
                    </div>
                    <p class="tagline">Complete Pharmacy Management Solution</p>
                </div>
                
                <div class="main-content">
                    <div class="card">
                        <h2 class="card-title">
                            <span class="icon icon-info"></span>
                            About {APP_NAME}
                        </h2>
                        <div class="card-content">
                            <p>{APP_NAME} is a comprehensive pharmacy management system designed to streamline your operations, manage inventory, process sales, and provide valuable insights through reports.</p>
                            <br>
                            <p>This launcher provides a unified interface to manage all the services required by the application.</p>
                        </div>
                        
                        <h3>Key Features</h3>
                        <div class="features">
                            <div class="feature">
                                <span class="icon icon-check"></span>
                                <span>Inventory Management</span>
                            </div>
                            <div class="feature">
                                <span class="icon icon-check"></span>
                                <span>Point of Sale</span>
                            </div>
                            <div class="feature">
                                <span class="icon icon-check"></span>
                                <span>Customer Management</span>
                            </div>
                            <div class="feature">
                                <span class="icon icon-check"></span>
                                <span>Sales Reports</span>
                            </div>
                            <div class="feature">
                                <span class="icon icon-check"></span>
                                <span>User Management</span>
                            </div>
                            <div class="feature">
                                <span class="icon icon-check"></span>
                                <span>Data Synchronization</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h2 class="card-title">
                            <span class="icon icon-play"></span>
                            Getting Started
                        </h2>
                        <div class="card-content">
                            <p>Follow these simple steps to launch the application:</p>
                            
                            <div class="steps">
                                <div class="step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <strong>Start Services</strong>
                                        <p>Click on "Services" in the menu bar, then select "Start Services"</p>
                                    </div>
                                </div>
                                
                                <div class="step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <strong>Wait for Initialization</strong>
                                        <p>The system will initialize Docker, Supabase, and application services</p>
                                    </div>
                                </div>
                                
                                <div class="step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <strong>Access the Application</strong>
                                        <p>Once services are running, the application will load automatically</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="status-indicator">
                            <span class="icon icon-warning"></span>
                            <div>
                                <strong>Services Status:</strong> Not Running
                                <p>Use the Services menu to start the application</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>&copy; 2023 Elith Pharmacy. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def is_supabase_running(self):
        """Check if Supabase is running"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', SUPABASE_PORT))
            sock.close()
            return result == 0
        except:
            return False
    
    def is_frontend_running(self):
        """Check if frontend is running"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', FRONTEND_PORT))
            sock.close()
            return result == 0
        except:
            return False
    
    @Slot(str)
    def update_status(self, message):
        """Update status bar with message"""
        self.statusBar.showMessage(message)
    
    def start_services(self):
        """Start the pharmacy application services"""
        self.start_action.setEnabled(False)
        self.refresh_action.setEnabled(False)
        
        # Show progress bar
        self.progress_bar.setValue(0)
        self.progress_bar.setVisible(True)
        
        # Show loading overlay
        self.loading_thread = LoadingOverlayThread(self, "Starting Services")
        self.loading_thread.status_changed.connect(self.update_loading_status)
        self.loading_thread.start()
        
        # Start services in a separate thread
        threading.Thread(target=self._start_services_thread, daemon=True).start()
    
    def _start_services_thread(self):
        """Thread function to start services"""
        try:
            # Update progress
            self.status_update.emit("Checking system resources...")
            self.update_progress(10)
            self.loading_thread.set_status("Checking system resources...")
            time.sleep(1)  # Give UI time to update
            
            # Start Docker if needed
            self.status_update.emit("Ensuring Docker is running...")
            self.update_progress(20)
            self.loading_thread.set_status("Starting Docker...")
            try:
                self._ensure_docker_running()
            except Exception as e:
                self.status_update.emit(f"Docker error: {str(e)}")
                self._show_error_and_cleanup(f"Error starting Docker: {str(e)}")
                return
            
            # Start Supabase if needed
            self.status_update.emit("Starting Supabase...")
            self.update_progress(40)
            self.loading_thread.set_status("Starting Supabase...")
            
            try:
                supabase_success = self._start_supabase()
                if not supabase_success:
                    self.status_update.emit("Failed to start Supabase")
                    self.loading_thread.set_status("Failed to start Supabase")
                    self._show_error_and_cleanup("Failed to start Supabase. Please check logs.")
                    return
            except Exception as e:
                self.status_update.emit(f"Supabase error: {str(e)}")
                self._show_error_and_cleanup(f"Error starting Supabase: {str(e)}")
                return
            
            # Start application containers
            self.status_update.emit("Starting application services...")
            self.update_progress(60)
            self.loading_thread.set_status("Starting application containers...")
            
            try:
                app_success = self._start_app_containers()
                if not app_success:
                    self.status_update.emit("Failed to start application containers")
                    self.loading_thread.set_status("Failed to start application containers")
                    self._show_error_and_cleanup("Failed to start application containers. Please check logs.")
                    return
            except Exception as e:
                self.status_update.emit(f"Container error: {str(e)}")
                self._show_error_and_cleanup(f"Error starting application containers: {str(e)}")
                return
            
            # Wait for frontend to be available
            self.status_update.emit("Waiting for frontend to be ready...")
            self.update_progress(80)
            self.loading_thread.set_status("Waiting for frontend...")
            
            max_wait = 45  # Increased maximum wait time in seconds
            frontend_running = False
            
            try:
                for i in range(max_wait):
                    if self.is_frontend_running():
                        frontend_running = True
                        # Wait additional time for app to fully initialize
                        self.update_progress(90)
                        self.status_update.emit("Frontend detected, waiting for full initialization...")
                        self.loading_thread.set_status("Waiting for app to initialize...")
                        time.sleep(10)  # Give extra time for the app to fully load
                        break
                    time.sleep(1)
            except Exception as e:
                self.status_update.emit(f"Frontend check error: {str(e)}")
                # Not critical, continue
            
            if not frontend_running:
                self.status_update.emit("Warning: Frontend may not be fully ready")
            
            # Final steps
            self.update_progress(100)
            self.status_update.emit("Application started successfully")
            
            # Update UI on main thread
            QApplication.instance().postEvent(
                self,
                ServiceStatusEvent(True, "Application started successfully")
            )
            
        except Exception as e:
            self.status_update.emit(f"Error: {str(e)}")
            self._show_error_and_cleanup(f"Error starting services: {str(e)}")
        finally:
            # Stop the loading overlay
            if self.loading_thread and self.loading_thread.is_running:
                try:
                    self.loading_thread.stop()
                except Exception as e:
                    print(f"Error stopping loading thread: {str(e)}")
            
            # Hide progress bar after completion
            QApplication.instance().postEvent(
                self,
                ProgressBarVisibilityEvent(False)
            )
    
    def _ensure_docker_running(self):
        """Ensure Docker is running"""
        # Check if Docker is running
        result = subprocess.run(
            "docker info",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode != 0:
            # Docker is not running
            raise Exception("Docker is not running. Please start Docker Desktop first.")
    
    def _start_supabase(self):
        """Start Supabase if not running"""
        if self.is_supabase_running():
            return True
        
        # Find Supabase directory
        possible_locations = [
            "./Elith-Supabase",
            "../Elith-Supabase",
            os.path.join(str(Path.home()), "Documents", "Elith-Supabase"),
            os.path.join(str(Path.home()), "Elith-Supabase")
        ]
        
        supabase_dir = None
        for location in possible_locations:
            if os.path.exists(location):
                supabase_dir = location
                break
        
        if not supabase_dir:
            return False
        
        # Save current directory
        current_dir = os.getcwd()
        
        try:
            # Navigate to Supabase directory
            os.chdir(supabase_dir)
            
            # Try to start Supabase with retry logic
            max_retries = 50
            port_binding_error_detected = False
            
            for attempt in range(max_retries):
                self.loading_thread.set_status(f"Starting Supabase (Attempt {attempt+1}/{max_retries})...")
                
                # First stop any existing Supabase instance
                self.status_update.emit(f"Stopping any existing Supabase instances...")
                stop_result = subprocess.run(
                    "npx supabase stop",
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                # Give it a moment to fully stop
                time.sleep(3)
                
                # If we detected a port binding error in a previous attempt and we're on Windows,
                # try to restart the HNS service
                if port_binding_error_detected and os.name == 'nt' and attempt > 0:
                    self.status_update.emit("Port binding error detected. Attempting to restart HNS service...")
                    self.loading_thread.set_status("Restarting HNS service...")
                    
                    try:
                        hns_result = self._restart_hns_service()
                        if hns_result:
                            self.status_update.emit("HNS service restarted successfully. Retrying Supabase start...")
                            time.sleep(3)  # Give additional time after HNS restart
                        else:
                            self.status_update.emit("Could not restart HNS service. Continuing with Supabase start attempt...")
                    except Exception as e:
                        self.status_update.emit(f"Error restarting HNS service: {str(e)}")
                
                # Now try to start Supabase
                self.status_update.emit(f"Attempting to start Supabase (Attempt {attempt+1}/{max_retries})...")
                result = subprocess.run(
                    "npx supabase start",
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                # Check for success
                if "Started supabase local development setup" in result.stdout or "Started supabase local development setup" in result.stderr:
                    return True
                
                # Check for port binding error
                error_output = result.stderr + result.stdout
                if "Ports are not available" in error_output or "bind: An attempt was made to access a socket in a way forbidden by its access permissions" in error_output:
                    port_binding_error_detected = True
                    self.status_update.emit("Port binding error detected. Will try to resolve before next attempt.")
                
                if attempt < max_retries - 1:
                    self.status_update.emit("Supabase start failed, will retry after delay...")
                    time.sleep(5)
            
            return False
            
        finally:
            # Return to original directory
            os.chdir(current_dir)
    
    def _start_app_containers(self):
        """Start application containers using docker-compose"""
        result = subprocess.run(
            "docker-compose up -d",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        return result.returncode == 0
    
    def stop_services(self):
        """Stop the pharmacy application services"""
        self.stop_action.setEnabled(False)
        
        # Show progress bar
        self.progress_bar.setValue(0)
        self.progress_bar.setVisible(True)
        
        # Show loading overlay
        self.loading_thread = LoadingOverlayThread(self, "Stopping Services")
        self.loading_thread.status_changed.connect(self.update_loading_status)
        self.loading_thread.start()
        
        # Stop services in a separate thread
        threading.Thread(target=self._stop_services_thread, daemon=True).start()
    
    def _stop_services_thread(self):
        """Thread function to stop services"""
        try:
            # Stop Docker containers
            self.status_update.emit("Stopping application containers...")
            self.update_progress(20)
            self.loading_thread.set_status("Stopping containers...")
            
            result = subprocess.run(
                "docker-compose stop",
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Stop Supabase
            self.status_update.emit("Stopping Supabase...")
            self.update_progress(60)
            self.loading_thread.set_status("Stopping Supabase...")
            
            self._stop_supabase()
            
            # Final steps
            self.update_progress(100)
            self.status_update.emit("Services stopped successfully")
            
            # Update UI on main thread
            QApplication.instance().postEvent(
                self,
                ServiceStatusEvent(False, "Services stopped successfully")
            )
            
        except Exception as e:
            self.status_update.emit(f"Error: {str(e)}")
            QMessageBox.critical(self, "Error", f"Error stopping services: {str(e)}")
        finally:
            # Stop the loading overlay
            if self.loading_thread and self.loading_thread.is_running:
                self.loading_thread.stop()
            
            # Hide progress bar after completion
            QApplication.instance().postEvent(
                self,
                ProgressBarVisibilityEvent(False)
            )
    
    def _stop_supabase(self):
        """Stop Supabase if running"""
        if not self.is_supabase_running():
            return True
        
        # Find Supabase directory
        possible_locations = [
            "./Elith-Supabase",
            "../Elith-Supabase",
            os.path.join(str(Path.home()), "Documents", "Elith-Supabase"),
            os.path.join(str(Path.home()), "Elith-Supabase")
        ]
        
        supabase_dir = None
        for location in possible_locations:
            if os.path.exists(location):
                supabase_dir = location
                break
        
        if not supabase_dir:
            return False
        
        # Save current directory
        current_dir = os.getcwd()
        
        try:
            # Navigate to Supabase directory
            os.chdir(supabase_dir)
            
            # Try to stop Supabase with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                self.loading_thread.set_status(f"Stopping Supabase (Attempt {attempt+1}/{max_retries})...")
                
                result = subprocess.run(
                    "npx supabase stop",
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                if "Stopped supabase local development setup" in result.stdout or "Stopped supabase local development setup" in result.stderr:
                    return True
                
                if attempt < max_retries - 1:
                    time.sleep(5)
            
            return False
            
        finally:
            # Return to original directory
            os.chdir(current_dir)
    
    def update_progress(self, value):
        """Update progress bar value"""
        self.progress_bar.setValue(value)
    
    def update_loading_status(self, status):
        """Update loading overlay status"""
        self.status_update.emit(status)
    
    def update_ui_for_running_services(self):
        """Update UI elements when services are running"""
        self.start_action.setEnabled(False)
        self.stop_action.setEnabled(True)
        self.refresh_action.setEnabled(True)
        self.progress_bar.setValue(100)
        self.progress_bar.setVisible(False)
    
    def update_ui_for_stopped_services(self):
        """Update UI elements when services are stopped"""
        self.start_action.setEnabled(True)
        self.stop_action.setEnabled(False)
        self.refresh_action.setEnabled(False)
        self.progress_bar.setValue(0)
        self.progress_bar.setVisible(False)
        self.browser.setUrl(QUrl("about:blank"))
        self.browser.setHtml(self.get_welcome_html())
    
    def refresh_browser(self):
        """Refresh the browser content"""
        self.browser.reload()
    
    def _show_error_and_cleanup(self, message):
        """Show error message and clean up UI"""
        # Post events to the main thread to update UI safely
        QApplication.instance().postEvent(
            self,
            ErrorCleanupEvent(message)
        )
    
    def _handle_error_cleanup(self, message):
        """Handle error cleanup on the main thread"""
        # Make sure loading overlay is stopped
        if self.loading_thread and self.loading_thread.is_running:
            self.loading_thread.stop()
            
        # Hide progress bar
        self.progress_bar.setVisible(False)
        
        # Show error message
        QMessageBox.critical(self, "Error", message)
        
        # Update UI state
        self.update_ui_for_stopped_services()
        
        # Re-enable start action
        self.start_action.setEnabled(True)
    
    def closeEvent(self, event):
        """Handle window close event"""
        # Check if services are running and automatically stop them
        if self.is_supabase_running() or self.is_frontend_running():
            # Launch the stop_pharmacy_app.py script as a detached process
            self._launch_shutdown_process()
        
        # Clean up
        if self.loading_thread and self.loading_thread.is_running:
            self.loading_thread.stop()
        
        # Accept the close event
        event.accept()
    
    def _launch_shutdown_process(self):
        """Launch the stop_pharmacy_app.py script as an independent process"""
        try:
            # Find the script path
            script_path = self._find_shutdown_script()
            if not script_path:
                QMessageBox.warning(
                    self,
                    "Warning",
                    "Could not find stop_pharmacy_app.py script. Services will continue running."
                )
                return
            
            # Launch the script as a detached process
            if os.name == 'nt':  # Windows
                # Use pythonw.exe to avoid console window
                python_exe = os.path.join(os.path.dirname(sys.executable), 'pythonw.exe')
                if not os.path.exists(python_exe):
                    python_exe = sys.executable
                
                # Use subprocess.Popen with DETACHED_PROCESS flag
                subprocess.Popen(
                    [python_exe, script_path],
                    creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
                    close_fds=True
                )
            else:  # Unix/Linux/Mac
                # Use nohup to detach the process
                subprocess.Popen(
                    ["nohup", sys.executable, script_path, "&"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    preexec_fn=os.setpgrp,
                    close_fds=True
                )
            
            self.status_update.emit("Shutdown process started in background")
        except Exception as e:
            QMessageBox.critical(
                self,
                "Error",
                f"Failed to start shutdown process: {str(e)}"
            )
    
    def _find_shutdown_script(self):
        """Find the stop_pharmacy_app.py script"""
        # Check common locations
        possible_locations = [
            "./stop_pharmacy_app.py",
            "../stop_pharmacy_app.py",
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "../stop_pharmacy_app.py"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "stop_pharmacy_app.py")
        ]
        
        for location in possible_locations:
            if os.path.exists(location):
                return os.path.abspath(location)
        
        return None
    
    def _check_admin_privileges(self):
        """Check if the application is running with administrator privileges"""
        try:
            if os.name == 'nt':  # Windows
                import ctypes
                return ctypes.windll.shell32.IsUserAnAdmin() != 0
            else:  # Unix-based systems
                return os.geteuid() == 0
        except:
            return False
            
    def _restart_hns_service(self):
        """Restart the Windows Host Network Service (HNS) to fix port binding issues"""
        if os.name != 'nt':  # Not Windows
            self.status_update.emit("HNS service restart only applicable on Windows")
            return True
            
        if not self._check_admin_privileges():
            self.status_update.emit("Administrator privileges required to restart HNS service")
            QMessageBox.warning(
                self,
                "Administrator Privileges Required",
                "Port binding issues detected. Please restart the application as administrator to fix this issue.\n\n"
                "Right-click the application icon and select 'Run as administrator'."
            )
            return False
            
        try:
            self.status_update.emit("Restarting Windows Host Network Service (HNS)...")
            self.loading_thread.set_status("Restarting HNS service...")
            
            # Stop HNS service
            stop_result = subprocess.run(
                "net stop hns",
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            if stop_result.returncode != 0:
                self.status_update.emit(f"Failed to stop HNS service: {stop_result.stderr}")
                return False
                
            # Give it a moment
            time.sleep(2)
            
            # Start HNS service
            start_result = subprocess.run(
                "net start hns",
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            if start_result.returncode != 0:
                self.status_update.emit(f"Failed to start HNS service: {start_result.stderr}")
                return False
                
            self.status_update.emit("Successfully restarted HNS service")
            return True
            
        except Exception as e:
            self.status_update.emit(f"Error restarting HNS service: {str(e)}")
            return False

# Custom event for service status updates
class ServiceStatusEvent(QEvent):
    """Custom event for service status updates"""
    
    EVENT_TYPE = QEvent.Type(QEvent.registerEventType())
    
    def __init__(self, is_running, message):
        super().__init__(ServiceStatusEvent.EVENT_TYPE)
        self.is_running = is_running
        self.message = message

# Custom event for progress bar visibility
class ProgressBarVisibilityEvent(QEvent):
    """Custom event for progress bar visibility"""
    
    EVENT_TYPE = QEvent.Type(QEvent.registerEventType())
    
    def __init__(self, is_visible):
        super().__init__(ProgressBarVisibilityEvent.EVENT_TYPE)
        self.is_visible = is_visible

# Custom event for error cleanup
class ErrorCleanupEvent(QEvent):
    """Custom event for error cleanup"""
    
    EVENT_TYPE = QEvent.Type(QEvent.registerEventType())
    
    def __init__(self, message):
        super().__init__(ErrorCleanupEvent.EVENT_TYPE)
        self.message = message

# Override event handling to handle custom events
def event(self, event):
    if event.type() == ServiceStatusEvent.EVENT_TYPE:
        if event.is_running:
            self.update_ui_for_running_services()
            self.browser.setUrl(QUrl(APP_URL))
        else:
            self.update_ui_for_stopped_services()
        return True
    elif event.type() == ProgressBarVisibilityEvent.EVENT_TYPE:
        self.progress_bar.setVisible(event.is_visible)
        return True
    elif event.type() == ErrorCleanupEvent.EVENT_TYPE:
        self._handle_error_cleanup(event.message)
        return True
    return super(PharmacyAppLauncher, self).event(event)

# Add the event method to the class
PharmacyAppLauncher.event = event

def main():
    """Main application entry point"""
    # Create Qt application
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setStyle("Fusion")  # Use Fusion style for consistent look across platforms
    
    # Create and show the main window
    main_window = PharmacyAppLauncher()
    main_window.show()
    
    # Start the application event loop
    sys.exit(app.exec_())

if __name__ == "__main__":
    main() 