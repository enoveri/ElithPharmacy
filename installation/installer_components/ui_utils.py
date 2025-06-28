"""
UI Utilities for Elith Pharmacy Installer
Contains helper functions for styling and creating UI elements
"""

from qtpy.QtWidgets import QLabel, QPushButton, QProgressBar
from qtpy.QtCore import Qt
from . import (PRIMARY_COLOR, SECONDARY_COLOR, BACKGROUND_COLOR, TEXT_COLOR, 
              ACCENT_COLOR, SURFACE_COLOR, ERROR_COLOR, SUCCESS_COLOR)

def create_title_label(text):
    """Create a styled title label"""
    label = QLabel(text)
    font = label.font()
    font.setPointSize(12)
    font.setBold(True)
    label.setFont(font)
    label.setStyleSheet(f"color: {TEXT_COLOR};")
    return label

def create_description_label(text):
    """Create a styled description label"""
    label = QLabel(text)
    label.setWordWrap(True)
    font = label.font()
    font.setPointSize(10)
    label.setFont(font)
    label.setStyleSheet(f"color: {TEXT_COLOR};")
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

def style_secondary_button(button):
    """Apply styling to a secondary button"""
    button.setMinimumHeight(30)
    button.setCursor(Qt.PointingHandCursor)
    button.setStyleSheet(f"""
        QPushButton {{
            background-color: {SURFACE_COLOR};
            color: {TEXT_COLOR};
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
        }}
        QPushButton:hover {{
            background-color: #45475A;
        }}
        QPushButton:pressed {{
            background-color: #383850;
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

def get_global_stylesheet():
    """Return the global stylesheet for the application"""
    return f"""
        QWidget {{
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
        QTextEdit {{
            background-color: #181825;
            color: {TEXT_COLOR};
            border: 1px solid {SURFACE_COLOR};
            border-radius: 4px;
            padding: 8px;
            font-family: 'Consolas', 'Courier New', monospace;
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
    """ 