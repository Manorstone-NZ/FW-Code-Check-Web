import os
import yaml

def load_config():
    config_path = os.path.expanduser('~/.firstwatch/config.yaml')
    if os.path.exists(config_path):
        with open(config_path) as f:
            return yaml.safe_load(f)
    return {}

def save_config(config):
    config_path = os.path.expanduser('~/.firstwatch/config.yaml')
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, 'w') as f:
        yaml.safe_dump(config, f)
