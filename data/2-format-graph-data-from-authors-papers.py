import json
from pprint import pprint

# IMPORT JSON FILE
f = open("papers-by-title-SMALL.json", "r") # 123 articles (each which contain their own citations, refences)
papersDict = json.loads(f.read())
f.close()

# FOR SIMPLE TESTING PURPOSES:
# papersDict = { "A-node": {
# 	"title": "A-node",
# 	"year" :  1999,
# 	"citations":  [{ "title": "A", "year" :  2017, "isInfluential": True}],
# 	"references": [{ "title": "REF", "year" :  2017, "isInfluential": True}],
# 	"influentialCitationCount": 123,
# 	"authors": [{"name": "authorA1"}, {"name": "authorA2"}]
# 	}, "B-node-NOT-INFLUENTIAL": {
# 	"title": "B-node-NOT-INFLUENTIAL",
# 	"year" :  1999,
# 	"citations":  [{"title": "A-node", "year" : 1999, "isInfluential": True}],
# 	"references": [],
# 	"influentialCitationCount": 123,
# 	"authors": [{"name": "authorB1"}]
# 	}
# }

nodeTitleToIndex = {} # # paper title -> index
nodeDict  = {} # paper index -> node object
linkArray = [] 
existingPaperTitles = set() # avoids adding the same paper twice


def generateGraphData():
	glob = {"updatingIndex": 0, "parsingCoreAuthors": True } # keeps track of what index in the array you're adding to (used as "node descriptor" for links)
	def nodeAdded(paper):
		paperTitle = paper["title"]
		# FILTER: for citations/refs, keep only if isInfluential
		influential = paper.get('isInfluential', True)
		if influential and paperTitle not in existingPaperTitles:
			nodeTitleToIndex[paperTitle] = glob["updatingIndex"]
			newNode = {
				"title": paperTitle, 
				"year" : paper["year"],
				"keyPhrases": [],
				"index": glob["updatingIndex"],
				"id": glob["updatingIndex"]
				}
			if glob["parsingCoreAuthors"]:
				newNode["influentialCitationCount"] = paper["influentialCitationCount"]
				authorsDict = {}
				for authorObj in paper["authors"]:
					authorsDict[authorObj["name"]] = authorObj["name"] # redundant hash map for fast access when filtering
				newNode["authors"] = authorsDict
			nodeDict[glob["updatingIndex"]] = newNode
			existingPaperTitles.add(paperTitle)
			glob["updatingIndex"] += 1
			return True
		return influential

	def addEdge(source, target):
		linkArray.append({"source": source, "target": target})

	# first add all papers authored by the core authors
	# which contain the highest resolution info
	for paperTitle in papersDict:
		paper = papersDict[paperTitle]
		# add to node
		nodeAdded(paper)

	# then add all the core authors ref/citations (overlap won't overwrite)
	glob["parsingCoreAuthors"] = False
	for paperTitle in papersDict:
		paper = papersDict[paperTitle]
		# add to node
		hubPaperIndex = nodeTitleToIndex[paperTitle]
		# add all in going links (citations)
		for citedPaper in paper["citations"]:
			if nodeAdded(citedPaper):
				addEdge(nodeTitleToIndex[citedPaper["title"]], hubPaperIndex)
		# add all out going links (references)
		for refPaper in paper["references"]:
			if nodeAdded(refPaper):
				addEdge(hubPaperIndex, nodeTitleToIndex[refPaper["title"]])

	pprint(len(nodeDict))
	pprint(len(linkArray))

	# convert Dict to List
	nodeList = [None] * len(nodeDict)
	for index in nodeDict.keys():
		nodeList[index] = nodeDict[index]

	# JSON FORMAT:
	graphData = { "nodes": nodeList, "links": linkArray }
	with open("graph-data.json", "w") as gd:
		gd.write(json.dumps(graphData))
		gd.close()

	# CSV FORMAT: 
	# with open("graph-data.csv", "w") as gd:
	# 	for link in linkArray:
	# 		gd.write("'" + str(link["source"]) + "','" + str(link["target"]) + "'\n")
	# 	gd.close()

generateGraphData()