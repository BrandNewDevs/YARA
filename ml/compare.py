"""Compare scored reports: python ml/compare.py laptop.json phone.json."""
import argparse
import json

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('laptop')
parser.add_argument('phone')
args = parser.parse_args()
with open(args.laptop) as file:
    laptop = json.load(file)
with open(args.phone) as file:
    phone = json.load(file)
print(f"Laptop: {laptop['passed']}/{laptop['total']}; phone: {phone['passed']}/{phone['total']}")
rows = {row['id']: row for row in phone['results']}
for reference in laptop['results']:
    actual = rows.pop(reference['id'], None)
    if actual is None:
        print(reference['id'], 'MISSING on phone')
    elif reference['passed'] != actual['passed'] or reference['problems'] != actual['problems']:
        print(reference['id'], 'laptop:', reference['problems'], 'phone:', actual['problems'])
for case_id in rows:
    print(case_id, 'EXTRA on phone')
