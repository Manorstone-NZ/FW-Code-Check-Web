# BarChart.py - Bar chart for alarms
from PySide6.QtWidgets import QWidget, QVBoxLayout
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
import matplotlib.pyplot as plt

class BarChart(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        fig, ax = plt.subplots(figsize=(2.5,2.5))
        data = [6, 4, 2]
        labels = ['High', 'Medium', 'Low']
        colors = ['#D9534F', '#F0AD4E', '#FFD600']
        bars = ax.bar(labels, data, color=colors)
        ax.set_ylabel('Alarms')
        ax.set_title('Alarms by Severity')
        plt.tight_layout()
        canvas = FigureCanvas(fig)
        layout.addWidget(canvas)
        self.setMinimumWidth(250)
        self.setMaximumWidth(300)
