print "\n"
target = "https://api.semanticscholar.org/v1/paper/f17311030dc49c450b3a48a1d93a196638dc6923"
url    = "https://www.semanticscholar.org/paper/f17311030dc49c450b3a48a1d93a196638dc6923"
newURL = "https://api.semanticscholar.org/v1/paper/" + url[(url.find("paper/") + len("paper/")):]
print newURL
print target