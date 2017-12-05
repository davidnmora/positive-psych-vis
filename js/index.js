console.clear();
// const graphDataJSON = 'https://raw.githubusercontent.com/DealPete/forceDirected/master/countries.json'
const graphDataJSON = "data/graph-data.json";

let width = 900,
height = 900,
minRadius = 10; // in pixles

let transitionTime = 500; // milliseconds

let svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

let color = d3.scaleOrdinal(d3.schemeCategory20);

let simulation = d3
  .forceSimulation()
  .force("link", d3.forceLink())
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2))
  .velocityDecay(0.8);

d3.json(graphDataJSON, function(error, graph) {
  if (error) throw error;
  console.log(graph);

  let nodes = graph.nodes;
  let links = graph.links

  let link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "black")
    .attr("stroke-width", 4);

  let node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", d => {      
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

  setTimeout(function() {
    nodes = nodes.filter(node => node.authors);
    links = links.filter(link => link.source.authors && link.target.authors);
    restart();
  }, 2500);


  function restart() {
    // Apply the general update pattern to the nodes.
    node = node.data(nodes); 

    node.exit().transition().duration(transitionTime)
    .attr("r", 0)
    .remove();

    node = node.enter().append("circle")
      // .attr("fill", function(d) { return color(d.id); })
      .call(function(node) { node.transition().duration(transitionTime).attr("r", d => d.radius); })
      .merge(node);

    // Apply the general update pattern to the links.
    link = link.data(links);

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
    .merge(link);

    // Update and restart the simulation.
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
  }

// ____________

function ticked() {
  link
  .attr("x1", function(d) {
    return d.source.x;
  })
  .attr("y1", function(d) {
    return d.source.y;
  })
  .attr("x2", function(d) {
    return d.target.x;
  })
  .attr("y2", function(d) {
    return d.target.y;
  });

  node
  .attr("cx", function(d) {
    return (d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)));
  })
  .attr("cy", function(d) {
    return (d.y = Math.max(d.radius, Math.min(height - d.radius, d.y)));
  });
}
});


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