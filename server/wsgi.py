import sys
import os

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import the Flask app factory from __init__.py
import importlib.util
spec = importlib.util.spec_from_file_location("server", os.path.join(current_dir, "__init__.py"))
server_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)

create_app = server_module.create_app
app = create_app()

if __name__ == "__main__":
    app.run()
