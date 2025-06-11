# MainWindow.py - Main entry point for the PySide6 dashboard app
from PySide6.QtWidgets import QApplication, QMainWindow, QWidget, QHBoxLayout, QVBoxLayout
from PySide6.QtCore import Qt
from components.Sidebar import Sidebar
from components.HeaderMetrics import HeaderMetrics
from components.DonutChart import DonutChart
from components.BarChart import BarChart
from components.StatusWidget import StatusWidget
from components.RecentAlarmsTable import RecentAlarmsTable
import sys

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("First Watch PLC Dashboard")
        self.setMinimumSize(1200, 800)
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)
        # Sidebar
        self.sidebar = Sidebar()
        main_layout.addWidget(self.sidebar)
        # Main content area
        content = QWidget()
        content_layout = QVBoxLayout(content)
        content_layout.setContentsMargins(20, 20, 20, 20)
        # Header metrics
        self.header = HeaderMetrics()
        content_layout.addWidget(self.header)
        # Grid of widgets
        grid = QHBoxLayout()
        grid.addWidget(DonutChart())
        grid.addWidget(BarChart())
        grid.addWidget(StatusWidget())
        content_layout.addLayout(grid)
        # Recent alarms table
        self.table = RecentAlarmsTable()
        content_layout.addWidget(self.table)
        main_layout.addWidget(content, 1)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())
