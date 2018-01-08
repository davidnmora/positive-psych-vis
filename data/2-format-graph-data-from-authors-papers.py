import json
from pprint import pprint

# ---Globals---

papersDict = {}
coreAuthors = {}
glob = {"updatingIndex": 0, "parsingCoreAuthors": True } # keeps track of what index in the array you're adding to (used as "node descriptor" for links)

# ---Load files---

# IMPORT JSON FILE
with open("papers-by-title-with-abstracts-and-KPs.json", "r") as f: # articles (each which contain their own citations, refences)
	papersDict = json.loads(f.read())

# RETRIEVE CORE AUTHORS
with open("core-authors-list.json", "r") as f: 
	coreAuthors = json.loads(f.read())

paperIdToIndex = {} # paper title -> index
nodeDict       = {} # paper index -> node object
linkArray      = [] # {source: node1Id, target: node2Id }
KPtoPaperIdsDict = {} # KP -> [nodeId1, nodeId2... nodeIdn]
KPtoKPIdMap			 = {} # KP -> KPid

# ---Main function---

def generateGraphData():
	# first add all papers authored by the core authors, which contain the highest resolution info
	for paperTitle in papersDict:
		paper = papersDict[paperTitle]
		addNode(paper)
	# then add all the core authors ref/citations (overlap won't overwrite)
	glob["parsingCoreAuthors"] = False
	for paperTitle in papersDict:
		paper = papersDict[paperTitle]
		hubPaperIndex = paperIdToIndex[paper["paperId"]]
		addCitations (paper, hubPaperIndex);
		addReferences(paper, hubPaperIndex)
	print("Node count: " + str(len(nodeDict)))
	print("Link count: " + str(len(linkArray)))
	addKPsToGraph()
	exportNodesAndLinks()
	return 

# ---Helper functions---

def addCitations(paper, hubPaperIndex):
	for citedPaper in paper["citations"]:
		addNode(citedPaper)
		paperId = citedPaper["paperId"]
		if paperId in paperIdToIndex and citedPaper.get("isInfluential", True):
			addEdge(paperIdToIndex[paperId], hubPaperIndex)
	return

def addReferences(paper, hubPaperIndex):
	for refPaper in paper["references"]:
		addNode(refPaper)
		paperId = refPaper["paperId"]
		if paperId in paperIdToIndex and refPaper.get("isInfluential", True):
			addEdge(hubPaperIndex, paperIdToIndex[paperId])
	return

def addNode(paper):
	paperId = paper["paperId"]
	# FILTER: for citations/refs, keep only if isInfluential
	influential = paper.get('isInfluential', True) # core authors don't have "isInfluential" property
	if influential and paperId not in paperIdToIndex:
		paperIdToIndex[paperId] = glob["updatingIndex"]
		newNode = {
			"title": paper["title"], 
			"year" : paper["year"],
			"id":    glob["updatingIndex"],
			"paperId":     paper["paperId"],
			"linkToPaper": paper["url"]
		}
		if paper.get("keyPhrases", False):
			newNode["keyPhrases"] = paper["keyPhrases"]
			addNewKPs(paper["keyPhrases"], newNode["id"])
		newNode["paperAbstract"] = paper.get("paperAbstract", "")
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

def addNewKPs(KPList, nodeId):
	for KP in KPList:
		if KP not in KPtoPaperIdsDict:
			KPtoPaperIdsDict[KP] = []
		KPtoPaperIdsDict[KP].append(nodeId)

def addEdge(source, target):
	linkArray.append({"source": source, "target": target})
	return

def addKPsToGraph():
	for KP, paperIds in KPtoPaperIdsDict.items():
		newKPNode = {
			"id": glob["updatingIndex"],
			"keyPhrase": KP,
			"papers": paperIds
		}
		nodeDict[glob["updatingIndex"]] = newKPNode
		KPtoKPIdMap[KP] = glob["updatingIndex"]
		for paperId in paperIds:
			linkArray.append({"source": glob["updatingIndex"], "target": paperId})
		glob["updatingIndex"] += 1		
	return
	
def exportNodesAndLinks():
	graphData = { 
		"nodes": nodeDict.values(), 
		"links": linkArray,
		"KPtoKPIdMap": KPtoKPIdMap
	}
	with open("graph-data.json", "w") as gd:
		gd.write(json.dumps(graphData))
	return

generateGraphData()

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

# CSV FORMAT: 
# with open("graph-data.csv", "w") as gd:
# 	for link in linkArray:
# 		gd.write("'" + str(link["source"]) + "','" + str(link["target"]) + "'\n")
# 	gd.close()