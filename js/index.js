console.clear();

// 1. GLOBAL VARIALBES -------------------------------------------------------------------------

const graphDataJSON = "data/graph-data.json";

const width = 900,
      height = 900,
      minRadius = 10, // in pixles
      transitionTime = 750, // milliseconds
      centeringForce = 0.09,
      minYear = 1950, 
      maxYear = 2017;

let graph, links, link, nodes, node; // globals set within json request response

let filterParams = {
  coreAuthorsOnly: false,
  yearRange: { "min": minYear, "max": maxYear }
}

var yearToPix = d3.scaleLinear()
  .domain([minYear, maxYear])
  .range([0, width]);

let svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

let color = d3.scaleOrdinal(d3.schemeCategory20); // TO DO: USE OR DELETE

// 2. SETUP SIMULATION AND SLIDER -------------------------------------------------------------------------

let simulation = d3
  .forceSimulation()
  .force("link", d3.forceLink().id(node => node.id))
  .force("charge", d3.forceManyBody().strength(-20))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("x", d3.forceX(width  / 2).strength(centeringForce))
  .force("y", d3.forceY(height / 2).strength(centeringForce))
  .velocityDecay(0.8);


// create slider
let DBHrange = [minYear, maxYear];
d3.select('#DBH-range-slider').call(d3.slider().value([minYear, maxYear]).orientation("horizontal")
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
    d3.select('#DBH-range-slider-min').text(minMax[0]);
    d3.select('#DBH-range-slider-max').text(minMax[1]);
  }));
// add initial values
d3.select('#DBH-range-slider-min').text(minYear);
d3.select('#DBH-range-slider-max').text(maxYear);

// 3. GET DATA AND SETUP INITIAL VIS -------------------------------------------------------------------------

d3.json(graphDataJSON, function(error, JSONdata) {
  if (error) throw error;
  graph = JSONdata
  console.log(graph);

  links = graph.links;
  nodes = graph.nodes;
  nodes.forEach(d => { d.x = d.cx = d.y = d.cy = yearToPix(d.year) });
  

  link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links, d => d.id)
    .enter()
    .append("line")
    .attr("stroke", "black")
    .attr("stroke-width", 4);

  node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes, d => d.id)
    .enter()
    .append("circle")
    .attr("cx", d => d.cx)
    .attr("cy", d => d.cy)
    .attr("r",  d => {      
     d.degree = links.filter(l => {
       return l.source == d.index || l.target == d.index;
     }).length;
     d.radius = minRadius + (d.degree/2);
     return d.radius;
    })
    .attr("fill", d => color(1))
    .on("mousedown", d => console.log(d))
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

  simulation.nodes(nodes).on("tick", ticked);

  simulation.force("link").links(links);

// ____________

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
}); // closes JSON call

// 3. HANDLE FILTERING INTERACTIONS -------------------------------------------------------------------------

// setTimeout(function() {
//   nodes = nodes.filter(node => node.authors);
//   links = links.filter(link => link.source.authors && link.target.authors); # coreAuthors have the author property, non-coreAuthors don't
//   restart();
// }, 2500);

const filterGraph = (filterName = false) => {
  if (filterName == "toggleCoreAuthors") filterParams.coreAuthorsOnly = !filterParams.coreAuthorsOnly;
  nodes = graph.nodes.filter(node => shouldKeepNode(node));
  links = graph.links.filter(link => shouldKeepLink(link));
  restart();
}

const coreAuthor = (node) => !filterParams.coreAuthorsOnly || node.authors;
const yearInRange   = (node) => (node.year >= filterParams.yearRange.min) && 
                                (node.year <= filterParams.yearRange.max);

const shouldKeepNode = (node) => {
  return coreAuthor(node) && yearInRange(node);
}

const shouldKeepLink = (link) => {
  return coreAuthor(link.source) && yearInRange(link.source) && 
         coreAuthor(link.target) && yearInRange(link.target);
}

// 3. UPDATE GRAPH AFTER FILTERING DATA -------------------------------------------------------------------------

function restart() {
  simulation.stop();
  // Apply the general update pattern to the nodes.
  node = node.data(nodes, d => d.id); 

  node.exit().transition().duration(transitionTime)
  .attr("r", 0)
  .remove();

  node = node.enter().append("circle")
    .attr("fill", function(d) { return color(1); })
    .call(function(node) { node.transition().duration(transitionTime).attr("r", d => d.radius); })
    .merge(node);

  // Apply the general update pattern to the links.
  link = link.data(links, d => d.id);

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
    .attr("stroke", "black")
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