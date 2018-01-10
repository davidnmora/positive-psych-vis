import json
from pprint import pprint

# ---Globals---

paperIdToIndex   = {} # paper title -> index
nodeArray        = [] # {id: ...} [two types: paper and KeyPhrase]
linkArray        = [] # {source: node1Id, target: node2Id }
KPtoPaperIdsDict = {} # KP -> [nodeId1, nodeId2, ... nodeIdn]
KPtoKPIdMap			 = {} # KP -> KPid

TEMP_encountered_paper_ids = {}
# ---Main function---

def generateGraphData():
	with open("all-papers-on-s2-SMALL.json", "r") as allPapersFile:
		numPapers = 0
		for paperLine in allPapersFile:
			paper = json.loads(paperLine)
			addNode(paper) # add current node
			hubPaperId = paper["id"]
			addCitations (paper, hubPaperId);
			addReferences(paper, hubPaperId)
			numPapers += 1
			if numPapers > 500: # TEMPORARY LIMITER
				break
		print("Node count: " + str(len(nodeArray)))
		print("Link count: " + str(len(linkArray)))
		addKPsToGraph()
		exportNodesAndLinks()
	return 

# ---Helper functions---

def addCitations(paper, hubPaperId):
	for citedPaperS2Id in paper["inCitations"]:
		addEdge(citedPaperS2Id, hubPaperId)
	return

def addReferences(paper, hubPaperId):
	for refPaperS2Id in paper["outCitations"]:
		addEdge(hubPaperId, refPaperS2Id)
	return

def addNode(paper):
	addNewKPs(paper["keyPhrases"], paper["id"])
	nodeArray.append(paper)
	TEMP_encountered_paper_ids[paper["id"]] = paper["id"]
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
	KPid = 0
	for KP, paperIds in KPtoPaperIdsDict.items():
		newKPNode = {
			"id": KPid,
			"keyPhrase": KP,
			"papers": paperIds
		}
		nodeArray.append(newKPNode)
		TEMP_encountered_paper_ids[KPid] = KPid
		KPtoKPIdMap[KP] = KPid
		for paperId in paperIds:
			addEdge(newKPNode["id"], paperId)
		KPid += 1		
	return
	
def exportNodesAndLinks():
	# TEMPORARY FOR all-papers-on-s2-SMALL.json
	TEMP_filtered_linkArray = []
	for link in linkArray:
		if link["source"] in TEMP_encountered_paper_ids and link["target"] in TEMP_encountered_paper_ids:
			TEMP_filtered_linkArray.append(link)
	graphData = { 
		"nodes": nodeArray, 
		"links": TEMP_filtered_linkArray, # linkArray,
		"KPtoKPIdMap": KPtoKPIdMap
	}
	with open("graph-data.json", "w") as gd:
		gd.write(json.dumps(graphData))
	return

generateGraphData()