# HeaderMetrics.py - Top metrics bar
from PySide6.QtWidgets import QWidget, QHBoxLayout, QLabel, QVBoxLayout
from PySide6.QtGui import QFont
import subprocess, json

def get_total_analyses():
    try:
        out = subprocess.check_output(['python3', '../../src/python/db.py', '--list-analyses'])
        return len(json.loads(out))
    except Exception:
        return 0

def get_total_baselines():
    try:
        out = subprocess.check_output(['python3', '../../src/python/db.py', '--list-baselines'])
        return len(json.loads(out))
    except Exception:
        return 0

class HeaderMetrics(QWidget):
    def __init__(self):
        super().__init__()
        layout = QHBoxLayout(self)
        layout.setSpacing(30)
        # Use live data
        for label, value in [("Total Analyses", get_total_analyses()), ("Baselines", get_total_baselines())]:
            card = QWidget()
            card.setStyleSheet("background: white; border-radius: 10px; padding: 20px 40px; box-shadow: 0 2px 8px #0001;")
            card_layout = QVBoxLayout(card)
            num = QLabel(str(value))
            num.setFont(QFont("Segoe UI", 28, QFont.Weight.Bold))
            num.setStyleSheet("color: #0275D8;")
            card_layout.addWidget(num)
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 12))
            card_layout.addWidget(lbl)
            layout.addWidget(card)
        layout.addStretch()
