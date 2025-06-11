# DonutChart.py - Donut chart for assets
from PySide6.QtWidgets import QWidget, QVBoxLayout
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
import matplotlib.pyplot as plt

class DonutChart(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        fig, ax = plt.subplots(figsize=(2.5,2.5))
        data = [40, 30, 20, 10]
        labels = ['Physical', 'Printer', 'Switch', 'Software']
        colors = ['#5CB85C', '#D9534F', '#6F42C1', '#0275D8']
        wedges, texts = ax.pie(data, colors=colors, startangle=90, wedgeprops=dict(width=0.4))
        ax.legend(wedges, labels, loc='center left', bbox_to_anchor=(1, 0.5))
        ax.set(aspect="equal")
        plt.tight_layout()
        canvas = FigureCanvas(fig)
        layout.addWidget(canvas)
        self.setMinimumWidth(250)
        self.setMaximumWidth(300)
