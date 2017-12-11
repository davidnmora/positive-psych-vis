import json
from pprint import pprint

# IMPORT JSON FILE
f = open("papers-by-title.json", "r") # 123 articles (each which contain their own citations, refences)
papersDict = json.loads(f.read())
f.close()

# RETRIEVE CORE AUTHORS
f = open("core-authors-list.json", "r") # 123 articles (each which contain their own citations, refences)
coreAuthors = json.loads(f.read())
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

paperIdToIndex = {} # # paper title -> index
nodeDict  = {} # paper index -> node object
linkArray = [] 

def generateGraphData():
	glob = {"updatingIndex": 0, "parsingCoreAuthors": True } # keeps track of what index in the array you're adding to (used as "node descriptor" for links)
	def nodeAdded(paper):
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
				"id": glob["updatingIndex"],
				"paperId": paper["paperId"]
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
		hubPaperIndex = paperIdToIndex[paper["paperId"]]
		# add all in going links (citations)
		for citedPaper in paper["citations"]:
			nodeAdded(citedPaper)
			paperId = citedPaper["paperId"]
			if paperId in paperIdToIndex:
				addEdge(paperIdToIndex[paperId], hubPaperIndex)
		# add all out going links (references)
		for refPaper in paper["references"]:
			nodeAdded(refPaper)
			paperId = refPaper["paperId"]
			if paperId in paperIdToIndex:
				addEdge(hubPaperIndex, paperIdToIndex[paperId])

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