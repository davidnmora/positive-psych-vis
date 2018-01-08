import json
from pprint import pprint

# open all papers as JSON
papersByTitle = {}
with open("papers-by-title.json", "r") as f:
	papersByTitle = json.loads(f.read())

# open abstract-KPs as JSON
keyPhrasesAndAbstractsByTitle = {}
with open("key-phrases-and-abstracts-by-title.json", "r") as f:
	keyPhrasesAndAbstractsByTitle = json.loads(f.read())

# integrate abstract and key phrases
for title in keyPhrasesAndAbstractsByTitle.keys():
	pprint(papersByTitle[title])
	papersByTitle[title]["keyPhrases"]    = keyPhrasesAndAbstractsByTitle[title]["keyPhrases"]
	papersByTitle[title]["paperAbstract"] = keyPhrasesAndAbstractsByTitle[title]["paperAbstract"]

with open("papers-by-title-with-abstracts-and-KPs.json", "w") as f:
	f.write(json.dumps(papersByTitle))