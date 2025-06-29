from qtpy.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QLabel, QPushButton, QApplication
from qtpy.QtCore import Qt, QTimer, QRect, QRectF, QThread, Signal
from qtpy.QtGui import QPainter, QPainterPath, QBrush, QColor, QFont

class LoadingOverlay(QMainWindow):
    """
    A loading overlay window with spinner animation
    """
    def __init__(self, parent=None, loading_text="Busy"):
        super().__init__(parent)
        
        # Set up overlay window properties
        self.setObjectName("loadingOverlay")
        
        # Remove window controls and make it stay on top
        self.setWindowFlags(Qt.Window | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint)
        
        # Enable transparency for the window
        # self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Set stylesheet for overlay
        self.setStyleSheet("""
            #loadingOverlay {
                background-color: rgba(30, 39, 46, 0.75);
                border-radius: 5px;
            }
            QLabel#titleLabel {
                color: white;
                font-size: 18px;
                font-weight: bold;
            }
            QLabel#statusLabel {
                color: #cccccc;
                font-size: 13px;
                font-style: italic;
            }
        """)
        
        # Create central widget and its layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Make overlay fill parent widget or use default size
        if parent:
            self.setGeometry(parent.rect())
        else:
            self.setGeometry(QRect(0, 0, 400, 400))
        
        # Create layout
        layout = QVBoxLayout(central_widget)
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(15)
        
        # Add spinner animation widget
        self.spinner = SpinnerWidget(self)
        layout.addWidget(self.spinner, 0, Qt.AlignCenter)
        
        # Add loading text
        self.loading_text = QLabel(loading_text, self)
        self.loading_text.setObjectName("titleLabel")
        self.loading_text.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.loading_text)
        
        # Add status text
        self.status_text = QLabel("Loading ...", self)
        self.status_text.setObjectName("statusLabel")
        self.status_text.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.status_text)
        
        # Create animation timer
        self.animation_timer = QTimer(self)
        self.animation_timer.timeout.connect(self.spinner.update_animation)
        self.animation_timer.start(50)  # Update every 50ms
        
        # Create a secondary timer for the loading text animation
        self.text_timer = QTimer(self)
        self.text_timer.timeout.connect(self.update_loading_text)
        self.text_timer.start(800)  # Update every 800ms
        
        self.dot_count = 0

    def start(self):
        self.show() 

    def stop(self):
        self.hide()

    def is_running(self):
        return self.isVisible()

    def update_loading_text(self):
        """Animate the loading text with dots"""
        self.dot_count = (self.dot_count + 1) % 4
        dots = "." * self.dot_count
        self.loading_text.setText(f"Initializing {dots}")
        
    def set_status(self, status):
        """Update the status message"""
        self.status_text.setText(status)
        
    def set_loading_text(self, text: str):
        self.loading_text.setText(text)

    def show(self):
        """Show the overlay and start animation"""
        super().show()
        self.animation_timer.start()
        self.text_timer.start()
        
    def hide(self):
        """Hide the overlay and stop animation"""
        self.animation_timer.stop()
        self.text_timer.stop()
        super().hide()
        
    def paintEvent(self, event):
        """Custom paint event to handle the semi-transparent background"""
        super().paintEvent(event)
        
class SpinnerWidget(QWidget):
    """
    A custom spinner widget for loading animations
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedSize(80, 80)
        self.angle = 0
        self.highlight_segment = 0
        
        # Color definitions for a more vibrant gradient
        self.colors = [
            QColor(41, 128, 185),  # Blue
            QColor(52, 152, 219),  # Light Blue
            QColor(155, 89, 182),  # Purple
            QColor(142, 68, 173),  # Dark Purple
            QColor(52, 73, 94),    # Dark Blue-Gray
            QColor(26, 188, 156),  # Turquoise
            QColor(22, 160, 133),  # Dark Turquoise
            QColor(39, 174, 96),   # Green
        ]
        
    def update_animation(self):
        """Update spinner animation state"""
        self.angle = (self.angle + 6) % 360  # Slower rotation for smoother effect
        self.highlight_segment = (self.highlight_segment + 1) % 12
        self.update()
        
    def paintEvent(self, event):
        """Paint the spinner animation"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Define center and radius
        center = self.rect().center()
        outer_radius = min(self.width(), self.height()) / 2 - 5
        inner_radius = outer_radius * 0.6  # Inner circle size
        
        # Number of segments
        num_segments = 12  # More segments for smoother appearance
        
        # Draw segments
        for i in range(num_segments):
            # Calculate angle for this segment
            start_angle = i * (360 / num_segments)
            span_angle = 24  # Width of each segment in degrees
            
            # Determine opacity based on position relative to highlight segment
            distance = (i - self.highlight_segment) % num_segments
            opacity = 0.15 + (0.85 * (1 - min(distance / 6.0, 1.0)))
            
            # Set color with opacity
            color = self.colors[i % len(self.colors)]
            color.setAlphaF(opacity)
            painter.setBrush(QBrush(color))
            painter.setPen(Qt.NoPen)
            
            # Draw arc segment
            path = QPainterPath()
            # Convert QPoint to x,y coordinates for moveTo
            path.moveTo(center.x(), center.y())
            # Convert angles to Qt's coordinate system
            qt_start_angle = (start_angle - 90 + self.angle)
            qt_span_angle = span_angle
            
            # Create a rounded segment
            outer_rect = QRectF(center.x() - outer_radius, center.y() - outer_radius, 
                               outer_radius * 2, outer_radius * 2)
            inner_rect = QRectF(center.x() - inner_radius, center.y() - inner_radius, 
                               inner_radius * 2, inner_radius * 2)
            
            path.arcTo(outer_rect, qt_start_angle, qt_span_angle)
            path.arcTo(inner_rect, qt_start_angle + qt_span_angle, -qt_span_angle)
            path.closeSubpath()
            
            painter.drawPath(path)
        
        # Draw "Elith-Pharmacy" text in the center
        font = QFont("Arial", 12, QFont.Bold)
        painter.setFont(font)
        painter.setPen(QColor(255, 255, 255))
        text_rect = QRectF(center.x() - inner_radius, center.y() - inner_radius, 
                          inner_radius * 2, inner_radius * 2)
        painter.drawText(text_rect, Qt.AlignCenter, "Elith-Pharmacy")

class LoadingOverlayThread(QThread):
    """
    A thread class to manage the LoadingOverlay window
    """
    status_changed = Signal(str)
    loading_text_changed = Signal(str)
    finished = Signal()

    def __init__(self, parent=None, loading_text="Busy"):
        super().__init__(parent)
        self.loading_text = loading_text
        self.overlay = None
        self.is_running = False
        
        # Connect signals
        self.status_changed.connect(self._update_status)
        self.loading_text_changed.connect(self._update_loading_text)

    def run(self):
        """
        Show the loading overlay in a separate thread
        """
        self.is_running = True
        
        # Create the overlay in the thread
        self.overlay = LoadingOverlay(parent=self.parent(), loading_text=self.loading_text)
        
        # Position the overlay relative to parent if it exists
        if self.parent():
            parent_geometry = self.parent().geometry()
            self.overlay.move(parent_geometry.center() - self.overlay.rect().center())
        
        self.overlay.show()
        
        # Keep the thread running until stop is called
        while self.is_running:
            QApplication.processEvents()
            self.msleep(10)  # Small sleep to prevent high CPU usage
            
        # Cleanup
        if self.overlay:
            self.overlay.hide()
            self.overlay.deleteLater()
            self.overlay = None
        
        self.finished.emit()
    
    def stop(self):
        """
        Stop the loading overlay thread
        """
        self.is_running = False
        self.wait()
    
    def set_status(self, status: str):
        """
        Update the status text
        """
        self.status_changed.emit(status)
    
    def set_loading_text(self, text: str):
        """
        Update the loading text
        """
        self.loading_text_changed.emit(text)
    
    def _update_status(self, status: str):
        """
        Internal slot to update overlay status
        """
        if self.overlay:
            self.overlay.set_status(status)
    
    def _update_loading_text(self, text: str):
        """
        Internal slot to update overlay loading text
        """
        if self.overlay:
            self.overlay.set_loading_text(text)

# Update the test function to demonstrate thread usage
def test_loading_overlay():
    """
    Simple test function to demonstrate the LoadingOverlay with thread support
    """
    import sys
    import time
    
    app = QApplication(sys.argv)
    
    # Create a parent widget
    main_window = QWidget()
    main_window.setWindowTitle("LoadingOverlay Test")
    main_window.setGeometry(100, 100, 500, 400)
    main_window.setStyleSheet("background-color: #2c3e50;")
    
    main_layout = QVBoxLayout()
    main_window.setLayout(main_layout)

    # Create buttons for testing
    start_button = QPushButton("Start Loading")
    stop_button = QPushButton("Stop Loading")
    main_layout.addWidget(start_button)
    main_layout.addWidget(stop_button)
    
    # Create the loading overlay thread
    overlay_thread = LoadingOverlayThread(main_window, "Processing")
    
    # Status messages for demonstration
    status_messages = [
        "Loading market data...",
        "Initializing strategy...",
        "Processing historical prices...",
        "Running optimization...",
        "Finalizing results..."
    ]
    
    def simulate_work():
        """Simulate some work being done"""
        for status in status_messages:
            if not overlay_thread.is_running:
                break
            overlay_thread.set_status(status)
            # Simulate some work
            time.sleep(2)
        overlay_thread.stop()
    
    def start_loading():
        """Start the loading overlay"""
        overlay_thread.start()
        # Create a separate thread for the work simulation
        work_thread = QThread()
        work_thread.run = simulate_work
        work_thread.start()
    
    def stop_loading():
        """Stop the loading overlay"""
        overlay_thread.stop()
    
    # Connect buttons
    start_button.clicked.connect(start_loading)
    stop_button.clicked.connect(stop_loading)
    
    main_window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    test_loading_overlay()
