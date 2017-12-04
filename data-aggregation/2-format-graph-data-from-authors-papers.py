import json
from pprint import pprint

f = open("papers-by-title-SMALL.json", "r") # 123 articles (each which contain their own citations, refences)
papersDict = json.loads(f.read())
f.close()

nodeArray = [] # [ {"name": "Myriel", "group": 1}, ... ]
linkArray = [] # [ {"source": 1, "target": 0, "value": 1}, ... ]
existingPaperTitles = set()


def addNode(paper, groupNum):
	paperTitle = paper["title"]
	if paperTitle not in existingPaperTitles:
		nodeArray.append({"name": paperTitle, "group": groupNum})
		existingPaperTitles.add(paperTitle)

def addEdge(source, target, value):
	linkArray.append({"source": source["title"], "target": target["title"], "value": value})

for paperTitle in papersDict:
	paper = papersDict[paperTitle]
	# add to nodeArray
	addNode(paper, 1)
	# add all in going links (citations)
	for citedPaper in paper["citations"]:
		addNode(citedPaper, 1)
		addEdge(paper, citedPaper, 1)
	# add all out going links (references)
	for refPaper in paper["references"]:
		addNode(refPaper, 1)
		addEdge(paper, refPaper, 1)

pprint(len(nodeArray))
pprint(len(linkArray))

graphData = { "nodes": nodeArray, "links": linkArray }

with open("graph-data.json", "w") as gd:
	gd.write(json.dumps(graphData))
	gd.close()