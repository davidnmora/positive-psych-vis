import json
from pprint import pprint

# IMPORT JSON FILE AS DICT
f = open("papers-by-title.json", "r") 
mySubsetOfPapersDict = json.loads(f.read())
f.close()

keyPhrasesAndAbstractsDict = {}
mySubsetOfPapersTitles = mySubsetOfPapersDict.keys()

with open("all-papers-on-s2.json", "r") as allPapersFile:
	for line in allPapersFile:
		# make json
		paper = json.loads(line)
		paperTitle = paper["title"]
		if paperTitle in mySubsetOfPapersTitles:
			print "MATCH: " + paperTitle
			keyPhrasesAndAbstractsDict[paperTitle] = {
				"keyPhrases": paper["keyPhrases"],
				"paperAbstract":   paper["paperAbstract"]
			}


keyPhrasesAndAbstractsFile = open("key-phrases-and-abstracts-by-title.json", "w")
keyPhrasesAndAbstractsFile.write(json.dumps(keyPhrasesAndAbstractsDict))
keyPhrasesAndAbstractsFile.close()