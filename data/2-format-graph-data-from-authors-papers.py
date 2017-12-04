import json
from pprint import pprint

f = open("papers-by-title-SMALL.json", "r") # 123 articles (each which contain their own citations, refences)
papersDict = json.loads(f.read())
f.close()

nodeArray = [] # [ {"name": "Myriel", "group": 1}, ... ]
linkArray = [] # [ {"source": 1, "target": 0, "value": 1}, ... ]
existingPaperTitles = set()





def generateGraphData():
	currNodeArrayIndex = -1
	def addNode(paper, groupNum, currNodeArrayIndex):
		paperTitle = paper["title"]
		if paperTitle not in existingPaperTitles:
			nodeArray.append({"label": paperTitle, "group": groupNum})
			existingPaperTitles.add(paperTitle)
			return currNodeArrayIndex + 1
		else:
			return currNodeArrayIndex

	def addEdge(source, target, value):
		linkArray.append({"source": source, "target": target, "value": value})

	for paperTitle in papersDict:
		paper = papersDict[paperTitle]
		# add to nodeArray
		currNodeArrayIndex = addNode(paper, 1, currNodeArrayIndex)
		currPaperIndex = currNodeArrayIndex
		# add all in going links (citations)
		for citedPaper in paper["citations"]:
			currNodeArrayIndex = addNode(citedPaper, 1, currNodeArrayIndex)
			addEdge(currNodeArrayIndex, currPaperIndex, 1)
		# add all out going links (references)
		for refPaper in paper["references"]:
			currNodeArrayIndex = addNode(refPaper, 1, currNodeArrayIndex)
			addEdge(currPaperIndex, currNodeArrayIndex, 1)

	pprint(len(nodeArray))
	pprint(len(linkArray))

	graphData = { "nodes": nodeArray, "links": linkArray }

	with open("graph-data.json", "w") as gd:
		gd.write(json.dumps(graphData))
		gd.close()


generateGraphData()