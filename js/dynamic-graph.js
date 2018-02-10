const DynamicGraph = (d3SelectedDiv, graph) => {
  // 1. GLOBAL VARIALBES -------------------------------------------------------------------------
  
  const width = 600,
        height = 600,
        minRadius = 7, // in pixles
        transitionTime = 750, // milliseconds
        centeringForce = 0.09,
        linkColor      = "white",
        keyPhraseColor = "grey"
        nodeOpacity = 0.9

  let links, link, nodes, node, simulation; // globals set within json request response

  const getNodeColor = (d) => {
    return "skyblue"
  }


  let svg = d3SelectedDiv
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  // 2. SETUP DATA-INDEPENDANT INTERFACE -------------------------------------------------------------------------

  // tooltip for node title and author on hover
  let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)

  // MOUSE AND CLICK EVENTS

  const displayNodeTooltip = function(d) {
    console.log(d)
    tooltip.transition()
      .duration(200)
      .style("opacity", .9)
    tooltip.html("DEFAULT TEXT")
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px")
  }

  const removeNodeTooltip = function(d) {
    tooltip.transition()
      .duration(500)
      .style("opacity", 0)
  }

  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)

    node
      .attr("cx", d => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)))
      .attr("cy", d => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y)))
  }

 

  // 5. GRAPH VIS HELPER FUNCTIONS -------------------------------------------------------------------------

  const radiusFromNode = d => {    
    if(d.radius === undefined) d.radius = minRadius 
    return d.radius
  }

  // 5. UPDATE GRAPH AFTER FILTERING DATA -------------------------------------------------------------------------
  function updateVis() {
    nodes = graph.nodes.filter(node => true || shouldKeepNode(node))
    links = graph.links.filter(link => true || shouldKeepLink(graph.nodesById, link))

    // Initialize layout simulation at startup
    if(!simulation) { 
      simulation = d3
        .forceSimulation()
        .force("link", d3.forceLink().id(node => node.id))
        .force("charge", d3.forceManyBody().strength(-20))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width  / 2).strength(centeringForce))
        .force("y", d3.forceY(height / 2).strength(centeringForce))
        .velocityDecay(0.8)
      simulation.nodes(nodes).on("tick", ticked)
      simulation.force("link").links(links)
    }

    simulation.stop()

    if(!link) {
      link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
    }
    link = link.data(links)

    if(!node) {
      node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")

      nodes.forEach(d => { d.x = d.cx = d.y = d.cy = 100})
    }

    // Apply the general update pattern to the nodes.
    node = node.data(nodes, d => d.id) 

    node
      .exit()
      .transition().duration(transitionTime)
      .attr("r", 0)
      .remove()

    node = node
      .enter()
      .append("circle")
      .attr("fill", d => getNodeColor(d))
      .style("opacity", nodeOpacity)
      .on("mouseover", displayNodeTooltip)
      .on("mouseout",  removeNodeTooltip)
      .call(node => { node.transition().duration(transitionTime).attr("r", radiusFromNode); })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .merge(node)

    // Apply the general update pattern to the links.

    // Keep the exiting links connected to the moving remaining nodes.
    link.exit().transition().duration(transitionTime)
      .attr("stroke-opacity", 0)
      .attrTween("x1", function(d) { return function() { return d.source.x; }; })
      .attrTween("x2", function(d) { return function() { return d.target.x; }; })
      .attrTween("y1", function(d) { return function() { return d.source.y; }; })
      .attrTween("y2", function(d) { return function() { return d.target.y; }; })
      .remove()

    link = link.enter().append("line")
      .call(function(link) { link.transition().attr("stroke-opacity", 1); })
      .attr("stroke", linkColor)
      .attr("stroke-width", 4)
      .merge(link)

    // Update and restart the simulation.
    simulation.nodes(nodes)
    simulation.force("link").links(links)
    simulation.alpha(1).restart()
  }

  // DRAG EVENTS ______________________________
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }
  
  function _DynamicGraph() {};

  _DynamicGraph.updateVis = () => {
    updateVis()
    return _DynamicGraph
  }
  console.log(_DynamicGraph)


  return _DynamicGraph

}
