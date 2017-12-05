import json
from pprint import pprint

# IMPORT JSON FILE
f = open("all-papes-on-s2-with-key-phrases.json", "r") # 123 articles (each which contain their own citations, refences)
papersDict = json.loads(f.read())
f.close()