import requests
import json
import csv
from bs4 import BeautifulSoup
import grequests 
from selenium import webdriver

authorToS2Id = {}
authorList   = []

# FROM AUTHORS, GET url of authors json
def getAuthorURLs():
	with open('core-authors-list.csv', 'rb') as csvfile:
		authorReader = csv.reader(csvfile, delimiter='\n')
		for author in authorReader:
			authorList.append(author[0])

	browser=webdriver.Firefox()
	for author in authorList:
		authorSearchURL = "https://www.semanticscholar.org/search?q=%22" + author.replace(" ", "%20") + "%22&sort=relevance"
		print authorSearchURL
		browser.get(authorSearchURL)
		soup = BeautifulSoup(browser.page_source, 'html.parser')
		results = soup.find_all('a', class_="matched-author-list__author-name")
		print results

getAuthorURLs()

# ASYNCHRONOUSLY GET ALL PAPERS

urls = [
    'http://python-requests.org',
    'http://httpbin.org',
    'http://python-guide.org',
    'http://kennethreitz.com'
]

# A simple task to do to each response object
def do_something(response):
    print response.url

# A list to hold our things to do via async
async_list = []

for u in urls:
    # The "hooks = {..." part is where you define what you want to do
    # 
    # Note the lack of parentheses following do_something, this is
    # because the response will be used as the first argument automatically
    action_item = grequests.get(u, hooks = {'response' : do_something})

    # Add the task to our list of things to do via async
    async_list.append(action_item)

# Do our list of things to do via async
grequests.map(async_list)





sampleAuthorURL = "https://api.semanticscholar.org/v1/author/1741101"
samplePaperURL = "https://api.semanticscholar.org/v1/paper/0796f6cd7f0403a854d67d525e9b32af3b277331"
s2id = 9031716
authorURL = "https://api.semanticscholar.org/v1/author/" + str(s2id)



# dict: author --> id 
# for each author
	# get author JSON
	# for each paper
		# get paper JSON
		# save to a giant JSON of all papers