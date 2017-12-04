import requests
import json
import csv
from bs4 import BeautifulSoup
import grequests 
from selenium import webdriver
from contextlib import contextmanager
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support.ui import WebDriverWait
import time

@contextmanager
def wait_for_page_load(driver, timeout=30.0):
    source = driver.page_source
    yield
    WebDriverWait(driver, timeout, ignored_exceptions=(WebDriverException,)).until(lambda d: source != d.page_source)



# Given a list of authors, retrieves the Semantic Scholar (s2) ids, which are used for API calls
def getAuthorURLs():
	authorIdFile = open("core-authors-with-s2ids.csv", "w")
	authorList = []
	with open('core-authors-list.csv', 'rb') as csvfile:
		authorReader = csv.reader(csvfile, delimiter='\n')
		for author in authorReader:
			authorList.append(author[0])

	browser = webdriver.Firefox()
	for author in authorList:
		browser.get('about:blank')
		authorSearchURL = "https://www.semanticscholar.org/search?q=%22" + author.replace(" ", "%20") + "%22&sort=relevance"
		print authorSearchURL
		with wait_for_page_load(browser):
			browser.get(authorSearchURL)
			time.sleep(3) # ensures all content has loaded (might be too long)
			soup = BeautifulSoup(browser.page_source, 'html.parser')
			print author
			tag = soup.find_all('a', class_="matched-author-list__author-name")
			print tag
			if len(tag) == 1:
				authorS2Id = tag[0]["href"][-7:] # assumes author is first on list (best match)
				print author + "," + authorS2Id + "\n"
				authorIdFile.write(author + "," + authorS2Id + "\n")

	authorIdFile.close()
	browser.quit()

getAuthorURLs()


