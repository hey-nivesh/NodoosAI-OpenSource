import os
import sys

# Add the backend root directory to the python path so that app, api, db, etc. can be imported.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
