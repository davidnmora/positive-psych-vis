import json
import csv
# IMPORT JSON FILE
authorsDict = {}
with open('core-authors-with-s2ids.csv', 'r') as csvfile:
	authorReader = csv.reader(csvfile)
	for authorS2Pair in authorReader:
		name = authorS2Pair[0]
		s2Id = int(authorS2Pair[1])
		authorsDict[s2Id] = name


with open("core-authors-list.json", "w") as gd:
	gd.write(json.dumps(authorsDict))
	gd.close()