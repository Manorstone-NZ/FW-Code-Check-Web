# RecentAlarmsTable.py - Table for recent alarms
from PySide6.QtWidgets import QWidget, QVBoxLayout, QTableWidget, QTableWidgetItem, QLabel
from PySide6.QtGui import QColor

class RecentAlarmsTable(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        table = QTableWidget(3, 5)
        table.setHorizontalHeaderLabels(["Status", "Time", "Severity", "Type", "Description"])
        data = [
            ("🔴", "2025-06-05 12:44:00", "High", "Asset DTC matched new vulnerabilities", "Firmware - 0584..."),
            ("🟠", "2025-06-04 09:20:00", "Medium", "System Time Changed", "System time on computer changed"),
            ("🔴", "2025-06-03 21:28:00", "High", "Network Share Connected", "User connected to share 'Samba'"),
        ]
        for row, (status, time, severity, typ, desc) in enumerate(data):
            table.setItem(row, 0, QTableWidgetItem(status))
            table.setItem(row, 1, QTableWidgetItem(time))
            sev_item = QTableWidgetItem(severity)
            if severity == "High":
                sev_item.setBackground(QColor("#D9534F"))
                sev_item.setForeground(QColor("white"))
            elif severity == "Medium":
                sev_item.setBackground(QColor("#F0AD4E"))
            table.setItem(row, 2, sev_item)
            table.setItem(row, 3, QTableWidgetItem(typ))
            table.setItem(row, 4, QTableWidgetItem(desc))
        table.setAlternatingRowColors(True)
        table.setEditTriggers(QTableWidget.NoEditTriggers)
        layout.addWidget(QLabel("Most Recent Alarms"))
        layout.addWidget(table)
        self.setMinimumHeight(200)
