import logging
from logging.handlers import RotatingFileHandler
import os

LOG_DIR = os.path.expanduser('~/.firstwatch/logs')
LOG_PATH = os.path.join(LOG_DIR, 'firstwatch.log')

os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger('firstwatch')
logger.setLevel(logging.INFO)
handler = RotatingFileHandler(LOG_PATH, maxBytes=5*1024*1024, backupCount=5)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Usage example:
def log_info(msg):
    logger.info(msg)
    for h in logger.handlers:
        h.flush()

def log_error(msg):
    logger.error(msg)
    for h in logger.handlers:
        h.flush()
