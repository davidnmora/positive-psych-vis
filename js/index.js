console.clear();

// 1. GLOBAL VARIALBES -------------------------------------------------------------------------

const graphDataJSON = "data/graph-data.json";
const width = 600,
      height = 600,
      minRadius = 7, // in pixles
      transitionTime = 750, // milliseconds
      centeringForce = 0.09,
      minYear = 1950, // TO DO: WHAT'S THE VERY EARLIEST PAPER?
      maxYear = 2017,
      linkColor      = "white",
      paperColor     = "orange",
      keyPhraseColor = "grey"
      nodeOpacity = 0.9;

let graph, links, link, nodes, node, simulation; // globals set within json request response

// let color = d3.scaleOrdinal(d3.schemeCategory20); 

const getNodeColor = (d) => {
  return d.keyPhrase ? keyPhraseColor : paperColor;
}

let filterParams = {
  activeKPPapersOnly: true,
  yearRange: { "min": minYear, "max": maxYear },
  authorIsActive: {}, // NOTE: using hash maps for fast lookup (values are arbitrary)
  activeKPs: new Set()
}

let yearToPix = d3.scaleLinear()
  .domain([minYear, maxYear])
  .range([0, width]);

let svg = d3
  .select("#canvas")
  .append("svg")
  .attr("width", width)
  .attr("height", height);


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


// MOUSE AND CLICK EVENTS

const displayNodeTooltip = function(d) {
  console.log(d)
  tooltip.transition()
    .duration(200)
    .style("opacity", .9);
  tooltip.html(getTooltipHTML(d))
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY - 28) + "px");
}

const getTooltipHTML = (d) => {
  return d.keyPhrase
    ? "<tag class='key-phrase'>" + d.keyPhrase + "</tag>"
    : d.title + "<br><strong>" + (d.coreAuthor? coreAuthorsById[d.coreAuthor] : "") + "</strong>"
}

const removeNodeTooltip = function(d) {
  tooltip.transition()
    .duration(500)
    .style("opacity", 0);
}

const openNodeSSPage = function(d) {
  window.open(d.linkToPaper, '_blank')
}

d3.select("#active-KP-papers-only-toggle")
  .html((filterParams.activeKPPapersOnly ? "Show" : "Hide") + " papers without selected keyword(s)")
  .on("click", () => {
    filterParams.activeKPPapersOnly = !filterParams.activeKPPapersOnly;
    d3.select("#active-KP-papers-only-toggle").html((filterParams.activeKPPapersOnly ? "Show" : "Hide") + " papers without selected keyword(s)")
    filterGraph();
  })


// 3. GET DATA AND SETUP INITIAL VIS DEPENDANT ON DATA -------------------------------------------------------------------------

Promise.all([
  new Promise((res,rej) => d3.json(graphDataJSON, function(error, JSONdata) { if(error) { rej(error) } else { res(JSONdata) } }))  
]).then(([_graph]) => {
  graph = _graph
  graph.nodesById = {}
  for (const node of graph.nodes) {
    graph.nodesById[node.id] = node
  }
  for (const link of graph.links) {
    link.sourceId = link.source
    link.targetId = link.target
  }
  console.log(graph);

  // Add core authors buttons
  // d3.select("#core-authors-list-container")
  //   .selectAll("div")
  //   .data(Object.keys(coreAuthorsById))
  //   .enter()
  //   .append("button")
  //   .html(authorId => coreAuthorsById[authorId])
  //   .attr("class", "core-author-button")
  //   .attr("id"   ,  authorId => "button-" + authorId)
  //   .attr("class",  authorId => { makeAuthorActive(authorId, false); return "active"; })
  //   .attr("border", authorId => "2px solid " + authorColor[authorId])
  //   .on("click"   , authorId => {
  //     filterParams.authorIsActive[authorId] 
  //       ? makeAuthorInactive(authorId) 
  //       : makeAuthorActive(authorId);
  //   })

  const KPs = [ // DEFAULT VALUES FOR TESTING PURPOSES
    "burnout",
    "adversity",
    "caucasian",
    "cell wall" 
  ];
  KPs.forEach(KP => filterParams.activeKPs.add(KP))

  filterGraph()
}); // closes graph data Primise.then(...)

function ticked() {
  link
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  node
    .attr("cx", d => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)))
    .attr("cy", d => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y)));
}

// 3. HANDLE FILTERING INTERACTIONS -------------------------------------------------------------------------

const filterGraph = () => {
  nodes = graph.nodes.filter(node => shouldKeepNode(node));
  links = graph.links.filter(link => shouldKeepLink(graph.nodesById, link));
  updateVis();
}

// Filter predicates
const isActiveKP     = (node) => filterParams.activeKPs.has(node.keyPhrase ? node.keyPhrase.toLowerCase() : undefined);
const hasActiveKP    = (node) => {
  if (!filterParams.activeKPPapersOnly || filterParams.activeKPs.has(node.keyPhrase ? node.keyPhrase.toLowerCase() : "")) return true;
  if (!node.keyPhrases) return false;
  for (let i = 0; i < node.keyPhrases.length; i++) {
    if (filterParams.activeKPs.has(node.keyPhrases[i].toLowerCase())) return true;
  }
  return false;
}  
const yearInRange    = (node) => (node.year >= filterParams.yearRange.min) && 
                                 (node.year <= filterParams.yearRange.max);

// High-level filters
const shouldKeepNode = (node) => isActiveKP    (node) ||
                                 hasActiveKP    (node) && 
                                 yearInRange   (node); 
const shouldKeepLink = (nodesById, link) => {
  const sourceNode = nodesById[link.sourceId]
  const targetNode = nodesById[link.targetId]
  return shouldKeepNode(sourceNode) && shouldKeepNode(targetNode);
}

const makeAuthorActive = (authorId, shouldFilterGraphAfter = true) => {
  d3.select("#button-" + authorId)
    .style("color",  "white")
    .style("background", authorColor[authorId])
    .classed("active", true)
  filterParams.authorIsActive[authorId] = true;
  if (shouldFilterGraphAfter) filterGraph();
}

const makeAuthorInactive = (authorId) => {
  d3.select("#button-" + authorId)
    .style("color",  authorColor[authorId])
    .style("background", "none")
    .classed("active", false)
  filterParams.authorIsActive[authorId] = false;
  filterGraph();
}

// 5. GRAPH VIS HELPER FUNCTIONS -------------------------------------------------------------------------

const radiusFromNode = d => {    
  if(d.radius !== undefined) return d.radius;
  d.degree = graph.links.filter(l => {
    return l.source == d.id || l.target == d.id;
  }).length;
  d.radius = minRadius + (d.degree/12);
  return d.keyPhrase ? 30 : d.radius; 
}

// 5. UPDATE GRAPH AFTER FILTERING DATA -------------------------------------------------------------------------
function updateVis() {
  // Initialize layout simulation at startup
  if(!simulation) { 
    simulation = d3
      .forceSimulation()
      .force("link", d3.forceLink().id(node => node.id))
      .force("charge", d3.forceManyBody().strength(-20))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width  / 2).strength(centeringForce))
      .force("y", d3.forceY(height / 2).strength(centeringForce))
      .velocityDecay(0.8);
    simulation.nodes(nodes).on("tick", ticked);
    simulation.force("link").links(links);
  }

  simulation.stop();

  if(!link) {
    link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
  }
  link = link.data(links);

  if(!node) {
    node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")

    nodes.forEach(d => { d.x = d.cx = d.y = d.cy = (d.keyPhrase ? d.id / 100 : yearToPix(d.year)) });
  }

  // Apply the general update pattern to the nodes.
  node = node.data(nodes, d => d.id); 

  node
    .exit()
    .transition().duration(transitionTime)
    .attr("r", 0)
    .remove();

  node = node
    .enter()
    .append("circle")
    .attr("fill", d => getNodeColor(d))
    .style("opacity", nodeOpacity)
    .on("mouseover", displayNodeTooltip)
    .on("mouseout",  removeNodeTooltip)
    .on("dblclick",  openNodeSSPage)
    .call(node => { node.transition().duration(transitionTime).attr("r", radiusFromNode); })
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    )
    .merge(node);

  // Apply the general update pattern to the links.

  // Keep the exiting links connected to the moving remaining nodes.
  link.exit().transition().duration(transitionTime)
    .attr("stroke-opacity", 0)
    .attrTween("x1", function(d) { return function() { return d.source.x; }; })
    .attrTween("x2", function(d) { return function() { return d.target.x; }; })
    .attrTween("y1", function(d) { return function() { return d.source.y; }; })
    .attrTween("y2", function(d) { return function() { return d.target.y; }; })
    .remove();

  link = link.enter().append("line")
    .call(function(link) { link.transition().attr("stroke-opacity", 1); })
    .attr("stroke", linkColor)
    .attr("stroke-width", 4)
    .merge(link);

  // Update and restart the simulation.
  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();
}

// DRAG EVENTS ______________________________
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}