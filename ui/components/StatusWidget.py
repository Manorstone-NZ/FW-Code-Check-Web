# StatusWidget.py - Agent status indicators
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QHBoxLayout
from PySide6.QtGui import QColor, QPainter, QBrush
from PySide6.QtCore import QSize, Qt

class LedIndicator(QLabel):
    def __init__(self, color, parent=None):
        super().__init__(parent)
        self.color = color
        self.setFixedSize(QSize(24, 24))
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setBrush(QBrush(QColor(self.color)))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(0, 0, 24, 24)

class StatusWidget(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        for label, color in [("Windows Agent Status", "#5CB85C"), ("Network Agent Status", "#D9534F")]:
            row = QHBoxLayout()
            led = LedIndicator(color)
            row.addWidget(led)
            row.addWidget(QLabel(label))
            layout.addLayout(row)
        layout.addStretch()
        self.setMinimumWidth(200)
        self.setMaximumWidth(250)
