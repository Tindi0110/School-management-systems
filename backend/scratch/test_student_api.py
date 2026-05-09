import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"
TOKEN = "68c9f5664be0841ec43015a6b0521ca49e6f9872" # I need to find a valid token or skip auth if possible

def test_students():
    try:
        headers = {"Authorization": f"Token {TOKEN}"}
        r = requests.get(f"{BASE_URL}/students/?page=1&page_size=20", headers=headers)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Count: {r.json().get('count')}")
            print(f"Results len: {len(r.json().get('results', []))}")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_students()
