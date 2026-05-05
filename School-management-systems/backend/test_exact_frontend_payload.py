import requests

# Exactly what the frontend sends in `formData`
payload = {
    "full_name": "Frontend Test Staff",
    "email": "tinditechnologies+staff5@gmail.com",
    "password": "Securepassword123!",
    "confirm_password": "Securepassword123!",
    "role": "TEACHER"
}

print("Simulating frontend Registration form submission...")
try:
    response = requests.post("http://127.0.0.1:8000/api/auth/register/", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
