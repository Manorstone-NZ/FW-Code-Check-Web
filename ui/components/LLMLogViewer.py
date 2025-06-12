# LLMLogViewer.py - Detailed LLM/system log viewer for PySide6 dashboard
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QTableWidget, QTableWidgetItem, QPushButton, QHeaderView, QTextEdit
import json
import os

class LLMLogViewer(QWidget):
    def __init__(self, log_path=None):
        super().__init__()
        self.log_path = log_path or os.path.expanduser('~/Development Projects/PLC Code Check/first-watch-plc-code-checker-v2/llm-interactions.log.json')
        self.setMinimumWidth(800)
        self.setWindowTitle("LLM/System Log Viewer")
        layout = QVBoxLayout(self)
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["#", "Date/Time", "Status", "Summary", "Details"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        layout.addWidget(QLabel("LLM & System Actions Log"))
        layout.addWidget(self.table)
        self.detail_view = QTextEdit()
        self.detail_view.setReadOnly(True)
        layout.addWidget(self.detail_view)
        self.load_logs()
        self.table.cellClicked.connect(self.show_details)

    def load_logs(self):
        if not os.path.exists(self.log_path):
            self.table.setRowCount(0)
            return
        with open(self.log_path, 'r') as f:
            try:
                logs = json.load(f)
            except Exception:
                logs = []
        self.table.setRowCount(len(logs))
        for idx, log in enumerate(logs):
            self.table.setItem(idx, 0, QTableWidgetItem(str(log.get('id', idx+1))))
            self.table.setItem(idx, 1, QTableWidgetItem(log.get('timestamp', '')))
            self.table.setItem(idx, 2, QTableWidgetItem('Success' if log.get('success') else 'Fail'))
            summary = log.get('result', '')
            if isinstance(summary, str):
                summary = summary[:80].replace('\n', ' ')
            elif isinstance(summary, dict) and 'error' in summary:
                summary = summary['error']
            else:
                summary = ''
            self.table.setItem(idx, 3, QTableWidgetItem(summary))
            self.table.setItem(idx, 4, QTableWidgetItem("View"))
        self.logs = logs

    def show_details(self, row, col):
        if not hasattr(self, 'logs') or row >= len(self.logs):
            self.detail_view.setText("")
            return
        log = self.logs[row]
        details = f"Timestamp: {log.get('timestamp', '')}\nStatus: {'Success' if log.get('success') else 'Fail'}\n\nPrompt:\n{log.get('prompt', '')}\n\nResult:\n{log.get('result', '')}"
        self.detail_view.setText(details)
