# Sidebar.py - Sidebar navigation for dashboard
from PySide6.QtWidgets import QWidget, QVBoxLayout, QPushButton, QLabel
from PySide6.QtGui import QIcon
from PySide6.QtCore import Qt

class Sidebar(QWidget):
    def __init__(self):
        super().__init__()
        self.setFixedWidth(80)
        self.setStyleSheet("background-color: #2C3E50;")
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        # Add navigation buttons (icons only for now)
        for icon, tooltip in [
            ("🏠", "Dashboard"),
            ("⬆️", "Upload"),
            ("📊", "Baselines"),
            ("🕑", "History")
        ]:
            btn = QPushButton(icon)
            btn.setToolTip(tooltip)
            btn.setFixedSize(56, 56)
            btn.setStyleSheet("color: white; font-size: 24px; border: none; background: transparent;")
            layout.addWidget(btn)
        layout.addStretch()
