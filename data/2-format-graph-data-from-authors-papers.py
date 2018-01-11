import json
from pprint import pprint


papersDict = {}
coreAuthors = {}
glob = {"updatingIndex": 0, "parsingCoreAuthors": True } # keeps track of what index in the array you're adding to (used as "node descriptor" for links)


# IMPORT JSON FILE
with open("papers-by-title.json", "r") as f: # articles (each which contain their own citations, refences)
	papersDict = json.loads(f.read())

# RETRIEVE CORE AUTHORS
with open("core-authors-list.json", "r") as f: 
	coreAuthors = json.loads(f.read())

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

paperIdToIndex = {} # paper title -> index
nodeDict  = {} # paper index -> node object
linkArray = [] 

def generateGraphData():
	# first add all papers authored by the core authors
	# which contain the highest resolution info
	for paperTitle in papersDict:
		paper = papersDict[paperTitle]
		addNode(paper)

	# then add all the core authors ref/citations (overlap won't overwrite)
	glob["parsingCoreAuthors"] = False
	for paperTitle in papersDict:
		paper = papersDict[paperTitle]
		# add to node
		hubPaperIndex = paperIdToIndex[paper["paperId"]]
		# add all in going links (citations)
		for citedPaper in paper["citations"]:
			addNode(citedPaper)
			paperId = citedPaper["paperId"]
			if paperId in paperIdToIndex and citedPaper.get("isInfluential", True):
				addEdge(paperIdToIndex[paperId], hubPaperIndex)
		# add all out going links (references)
		for refPaper in paper["references"]:
			addNode(refPaper)
			paperId = refPaper["paperId"]
			if paperId in paperIdToIndex and refPaper.get("isInfluential", True):
				addEdge(hubPaperIndex, paperIdToIndex[paperId])

	print("Node count: " + str(len(nodeDict)))
	print("Link count: " + str(len(linkArray)))

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
	return 

# ---Helper functions---

def addNode(paper):
	paperId = paper["paperId"]
	# FILTER: for citations/refs, keep only if isInfluential
	influential = paper.get('isInfluential', True)
	if influential and paperId not in paperIdToIndex:
		paperIdToIndex[paperId] = glob["updatingIndex"]
		newNode = {
			"title": paper["title"], 
			"year" : paper["year"],
			"keyPhrases": [],
			"index": glob["updatingIndex"],
			"id":    glob["updatingIndex"],
			"paperId":     paper["paperId"],
			"linkToPaper": paper["url"]
		}
		if glob["parsingCoreAuthors"]:
			newNode["influentialCitationCount"] = paper["influentialCitationCount"]
			authorsDict = {}
			for authorObj in paper["authors"]:
				authorsDict[authorObj["authorId"]] = authorObj["name"] # hash map for fast access when filtering
				if authorObj["authorId"] in coreAuthors:
					newNode["coreAuthor"] = authorObj["authorId"] # ISSUE: if two core authors on same paper, only list first as singular coreAuthor
			newNode["authors"] = authorsDict
		nodeDict[glob["updatingIndex"]] = newNode
		glob["updatingIndex"] += 1 
	return 

def addEdge(source, target):
	linkArray.append({"source": source, "target": target})

generateGraphData()