console.clear();

// 1. GLOBAL VARIALBES -------------------------------------------------------------------------

const graphDataJSON = "data/graph-data.json"
      coreAuthorsJSON = "data/core-authors-list.json";

const width = 600,
      height = 900,
      minRadius = 7, // in pixles
      minYear = 1950, 
      maxYear = 2017,
      nonCoreAuthorColor = "grey";

let graph, links, nodes, coreAuthorsById, citationVis; // globals set within json request response

let color = d3.scaleOrdinal(d3.schemeCategory20); 
    authorColor = {};

let filterParams = {
  coreAuthorsOnly: true,
  yearRange: { "min": minYear, "max": maxYear },
  authorIsActive: {}
}

let yearToPix = d3.scaleLinear()
  .domain([minYear, maxYear])
  .range([0, width]);



// 2. SETUP SLIDER -------------------------------------------------------------------------


// create slider
let DBHrange = [minYear, maxYear];
d3.select('#timeline-range-slider').call(d3.slider().value([minYear, maxYear]).orientation("horizontal")
  .min(minYear)
  .max(maxYear)
  .on("slideend", minMax => { 
    filterParams.yearRange.min = minMax[0];
    filterParams.yearRange.max = minMax[1]; 
    filterGraph();
  })
  .on("slide", minMax => {
    filterParams.yearRange.min = minMax[0];
    filterParams.yearRange.max = minMax[1]; 
    filterGraph();
    d3.select('#timeline-range-slider-min').text(Math.round(minMax[0]));
    d3.select('#timeline-range-slider-max').text(Math.round(minMax[1]));
  }));
// add initial values
d3.select('#timeline-range-slider-min').text(minYear);
d3.select('#timeline-range-slider-max').text(maxYear);

// tooltip for node title and author on hover
let tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


const radiusFromNode = d => {    
  if(d.radius !== undefined) return d.radius  
  d.degree = graph.links.filter(l => {
    return l.source == d.id || l.target == d.id;
  }).length;
  d.radius = minRadius + (d.degree/12);
  return d.radius;
}

// NODE MOUSE EVENTS

const tooltipInnerHTML = (d) => d.title + "<br><strong>" + (d.coreAuthor? coreAuthorsById[d.coreAuthor] : "") + "</strong>"

const openNodeSSPage = function(d) {
  window.open(d.linkToPaper, '_blank')
}


// 3. GET DATA AND SETUP INITIAL VIS DEPENDANT ON DATA -------------------------------------------------------------------------

Promise.all([
  new Promise((res,rej) => d3.json(graphDataJSON, function(error, JSONdata) { if(error) { rej(error) } else { res(JSONdata) } })),
  new Promise((res,rej) => d3.json(coreAuthorsJSON, function(error, JSONdata) { if(error) { rej(error) } else { res(JSONdata) } }))  
]).then(([ _graph, _coreAuthorsById ]) => {
  graph = _graph
  graph.nodesById = {}
  for (const node of graph.nodes) {
    graph.nodesById[node.id] = node
  }
  for (const link of graph.links) {
    link.sourceId = link.source
    link.targetId = link.target
  }
  coreAuthorsById = _coreAuthorsById
  console.log(graph);

  // create core-authors list buttons
  Object.keys(coreAuthorsById).forEach((authorId, i) => {
    authorColor[authorId] = color(i);
    filterParams.authorIsActive[authorId] = true;
  })

  d3.select("#core-authors-list-container")
    .selectAll("div")
    .data(Object.keys(coreAuthorsById))
    .enter()
    .append("button")
    .html(authorId => coreAuthorsById[authorId])
    .attr("class", "core-author-button")
    .attr("id"   ,  authorId => "button-" + authorId)
    .attr("class",  authorId => { makeAuthorActive(authorId, false); return "active"; })
    .attr("border", authorId => "2px solid " + authorColor[authorId])
    .on("click"   , authorId => {
      filterParams.authorIsActive[authorId]
        ? makeAuthorInactive(authorId)
        : makeAuthorActive(authorId);
    })
  
  // Core authors toggle button
	d3.select("#toggle-all-authors").on("click", () => {
	  console.log('before:', filterParams.authorIsActive)
   
		let coreAuthorIds = Object.keys(coreAuthorsById)
	  // If an author exists, turn em all off
    if (Object.values(filterParams.authorIsActive).some(isActive => isActive)) {
			coreAuthorIds.forEach(authorId => makeAuthorInactive(authorId, false))
    } else { // If no author exists, turn em all on
			coreAuthorIds.forEach(authorId => makeAuthorActive(authorId, false))
    }
		console.log('after:', filterParams.authorIsActive)
		filterGraph()
	})
	
	citationVis = DynamicGraph(d3.select("#canvas"), {
	  width: 1000,
		nodeStartPos: yearToPix,
		tooltipInnerHTML: tooltipInnerHTML,
	})
		.nodeColor(getCoreAuthorColor)
		.nodeRadius(radiusFromNode)
		// .tooltipInnerHTML(tooltipInnerHTML)
  
  filterGraph()
  

  
  
}); // closes graph data JSON call


// 3. HANDLE FILTERING INTERACTIONS -------------------------------------------------------------------------

const getCoreAuthorColor = (d) => d.coreAuthor ? authorColor[d.coreAuthor] : nonCoreAuthorColor;

const filterGraph = () => {
  nodes = graph.nodes.filter(node => shouldKeepNode(node));
  links = graph.links.filter(link => shouldKeepLink(graph.nodesById, link));
  console.log(nodes, links)
  citationVis.updateVis(nodes, links);
}

// Filter predicates
const coreAuthor     = (node) => !filterParams.coreAuthorsOnly || node.coreAuthor; 
const yearInRange    = (node) => (node.year >= filterParams.yearRange.min) && 
                                 (node.year <= filterParams.yearRange.max);
const authorSelected = (node) => !node.coreAuthor ||filterParams.authorIsActive[node.coreAuthor];

// High-level filters
const shouldKeepNode = (node) => coreAuthor(node) && yearInRange(node) && authorSelected(node);
const shouldKeepLink = (nodesById, link) => {
  const sourceNode = nodesById[link.sourceId]
  const targetNode = nodesById[link.targetId]
  return shouldKeepNode(sourceNode) && shouldKeepNode(targetNode);
}

const makeAuthorActive = (authorId, shouldFilterGraphAfter=true) => {
  d3.select("#button-" + authorId)
    .style("color",  "white")
    .style("background", authorColor[authorId])
    .classed("active", true)
  filterParams.authorIsActive[authorId] = true;
  if (shouldFilterGraphAfter) filterGraph();
}

const makeAuthorInactive = (authorId, shouldFilterGraphAfter=true) => {
  d3.select("#button-" + authorId)
    .style("color",  authorColor[authorId])
    .style("background", "none")
    .classed("active", false)
  filterParams.authorIsActive[authorId] = false;
	if (shouldFilterGraphAfter) filterGraph();
}
