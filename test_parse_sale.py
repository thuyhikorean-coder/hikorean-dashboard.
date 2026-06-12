import csv
import urllib.request
import io

url = "https://docs.google.com/spreadsheets/d/19XKkxjrQjs7zoeGMQFPyRhAORW5tD14FhvQP-Oj8Scw/export?format=csv&gid=1757451089"
response = urllib.request.urlopen(url)
content = response.read().decode('utf-8')

reader = csv.reader(io.StringIO(content))
header = next(reader)

sales = {'Hồng Thơm': 0, 'Khánh Linh': 0, 'Thu Thủy': 0}

for row in reader:
    if not row or len(row) < 10:
        continue
    
    date_str = row[0].strip()
    # Check if date is in June 2026 and between 10 and 16
    if date_str.endswith('/06/2026'):
        day = int(date_str.split('/')[0])
        if 10 <= day <= 16:
            sale_name = row[3].strip()
            status = row[9].upper()
            if status in ['DONE', 'DEPOSIT']:
                amt_str = row[8].replace('.', '').replace(',', '')
                try:
                    amt = float(amt_str)
                except ValueError:
                    amt = 0
                
                # Normalize name
                if 'Thơm' in sale_name: sale_name = 'Hồng Thơm'
                elif 'Linh' in sale_name: sale_name = 'Khánh Linh'
                elif 'Thủy' in sale_name: sale_name = 'Thu Thủy'
                
                if sale_name in sales:
                    sales[sale_name] += amt

print(sales)
