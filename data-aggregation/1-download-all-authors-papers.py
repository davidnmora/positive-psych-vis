import json
import csv
import grequests 
from pprint import pprint
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
		print "DONE: " +  response.url
	finally:
		mutex.release()

def exception_handler(request, exception):
	print "ERROR: request failed: " + request.url


with open('core-authors-with-s2ids-FINAL.csv', 'r') as csvfile:
	authorReader = csv.reader(csvfile)
	for authorS2Pair in authorReader:
		name = authorS2Pair[0]
		s2Id = int(authorS2Pair[1])
		authorToS2IdMap     [name]  = s2Id
		authorToAutherURLMap[name]  = "https://api.semanticscholar.org/v1/author/" + str(s2Id)
		print name, s2Id


unsentAuthorRequests = []
for author in authorToAutherURLMap:
	unsentAuthorRequests.append(grequests.get(authorToAutherURLMap[author], hooks={'response': getAuthorJSON}))


grequests.map(unsentAuthorRequests, exception_handler=exception_handler) # actually make requests

# pprint(authorJSONs)

# PART 2: COMPILE ALL PAPERS, INDEXED BY PAPER NAME
def getPaperJSON(response, *args, **kwargs):
	mutex.acquire()
	try:
		authorJSONs.append(response.content)
		print "DONE: " +  response.url
	finally:
		mutex.release()

unsentPaperRequests = []
for authorJSON in authorJSONs:
	author = json.loads(authorJSON)
	for paper in author["papers"]:
		print paper["title"]
		unsentPaperRequests.append(grequests.get(paper["url"], hooks={'response': getPaperJSON}))

grequests.map(unsentPaperRequests, exception_handler=exception_handler) # actually make requests



# sampleAuthorURL = "https://api.semanticscholar.org/v1/author/1741101"
# samplePaperURL = "https://api.semanticscholar.org/v1/paper/0796f6cd7f0403a854d67d525e9b32af3b277331"

# dict: author --> id 
# for each author
	# for each paper
		# get paper JSON
		# save to a giant JSON of all papers