import os

# Create directories
os.makedirs('backend', exist_ok=True)
os.makedirs('spark', exist_ok=True)
os.makedirs('frontend/src', exist_ok=True)
os.makedirs('frontend/public', exist_ok=True)

print("Directories created successfully!")
