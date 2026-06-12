import csv
import urllib.request
import io

url = "https://docs.google.com/spreadsheets/d/19XKkxjrQjs7zoeGMQFPyRhAORW5tD14FhvQP-Oj8Scw/export?format=csv&gid=1757451089"
response = urllib.request.urlopen(url)
content = response.read().decode('utf-8')
reader = csv.reader(io.StringIO(content))
next(reader)

for row in reader:
    if not row or len(row) < 10:
        continue
    date_str = row[0].strip()
    if date_str.endswith('/06/2026'):
        day = int(date_str.split('/')[0])
        if 10 <= day <= 16:
            print(f"Name: '{row[3]}'")
