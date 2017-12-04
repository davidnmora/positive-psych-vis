import json
import csv
import time
import grequests 
from threading import Thread, RLock
mutex = RLock()

# GLOBABLS
authorJSONs = []
authorToAutherURLMap = {}
authorToS2IdMap			 = {}

# PART 1: GET AUTHOR JSON INFO
def getAuthorJSON(response, *args, **kwargs):
	mutex.acquire()
	try:
		authorJSONs.append(response.content)
		print (json.loads(response.content)["name"])
		print "DONE: " +  response.url
	finally:
		mutex.release()

def exception_handler(request, exception):
	print "ERROR: request failed: " + request.url + "<<<<<<<"
	print ("Request error: {0}".format(exception))


with open('core-authors-with-s2ids-FINAL.csv', 'r') as csvfile:
	authorReader = csv.reader(csvfile)
	for authorS2Pair in authorReader:
		name = authorS2Pair[0]
		s2Id = int(authorS2Pair[1])
		authorToS2IdMap     [name]  = s2Id
		authorToAutherURLMap[name]  = "https://api.semanticscholar.org/v1/author/" + str(s2Id)
		# print name, s2Id


unsentAuthorRequests = []
for author in authorToAutherURLMap:
	unsentAuthorRequests.append(grequests.get(authorToAutherURLMap[author], hooks={'response': getAuthorJSON}))


grequests.map(unsentAuthorRequests, exception_handler=exception_handler) # actually make requests

# PART 2: COMPILE ALL PAPERS, INDEXED BY PAPER NAME
paperJSONDict = {}
def getPaperJSON(response, *args, **kwargs):
	mutex.acquire()
	try:
		paper = json.loads(response.content)
		paperJSONDict[paper["title"]] = paper
		print "PAPER " + " DONE: " +  paper["title"]
	finally:
		mutex.release()

def getPaperURL(url):
	return "https://api.semanticscholar.org/v1/paper/" + url[(url.find("paper/") + len("paper/")):]



for authorJSON in authorJSONs:
	unsentPaperRequests = []
	author = json.loads(authorJSON)
	for paper in author["papers"]:
		print paper["title"]
		unsentPaperRequests.append(grequests.get(getPaperURL(paper["url"]), hooks={'response': getPaperJSON}))
	grequests.map(unsentPaperRequests, exception_handler=exception_handler) # actually make requests
	print author["name"] + " scheduled."
	print "MAIN THREAD SLEEPING FOR 7 SEC before spawning new author requests..."
	time.sleep(7)


print "FINISHED grequests.map ..................."

paperJSONFile = open("papers-by-title.json", "w")
paperJSONFile.write(json.dumps(paperJSONDict))
paperJSONFile.close()
print "COMPLETE: json saved to disk"