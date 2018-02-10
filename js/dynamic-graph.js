const DynamicGraph = (d3SelectedVisContainer, optionalPubVars) => {
  // 1. GLOBAL VARIALBES -------------------------------------------------------------------------
  
  // Public variables width default settings
  let pubVar = {
    width     : 600, // pixles
    height    : 600, // pixles
    minRadius : 7,   // pixles
    transitionTime : 750, // milliseconds
    centeringForce : 0.09,
    linkIdsAreNodeIndex: true,
    // Link and Node functions ("dummy" unless replaced by API call)
    linkColor      : link => "white",
    nodeOpacity    : node => 0.9,
    nodeColor      : node => "skyblue",
    nodeStartPos   : node => 100
  }

  // Merge any specififed publiv variables
  pubVar = Object.assign({}, pubVar, optionalPubVars)

  // Private global variables
  let link, node, simulation; // globals set within json request response
  
  // Create vis svg canvas
  let svg = d3SelectedVisContainer
    .append("svg")
    .attr("width",  pubVar.width)
    .attr("height", pubVar.height)

  // TOOLTIP -------------------------------------------------------------------------
  let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)

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
      .attr("cx", d => d.x = Math.max(d.radius, Math.min(pubVar.width - d.radius, d.x)))
      .attr("cy", d => d.y = Math.max(d.radius, Math.min(pubVar.height - d.radius, d.y)))
  }

  // 5. GRAPH VIS HELPER FUNCTIONS -------------------------------------------------------------------------

  const radiusFromNode = d => {    
    if(d.radius === undefined) d.radius = pubVar.minRadius 
    return d.radius
  }

  // 5. UPDATE GRAPH AFTER FILTERING DATA -------------------------------------------------------------------------
  function updateVis(nodes, links) {
    // Initialize layout simulation at startup
    if(!simulation) { 
      simulation = d3
        .forceSimulation()
        .force("link", d3.forceLink().id(node => node.id))
        .force("charge", d3.forceManyBody().strength(-20))
        .force("center", d3.forceCenter(pubVar.width / 2, pubVar.height / 2))
        .force("x", d3.forceX(pubVar.width  / 2).strength(pubVar.centeringForce))
        .force("y", d3.forceY(pubVar.height / 2).strength(pubVar.centeringForce))
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

      nodes.forEach(d => { d.x = d.cx = d.y = d.cy = pubVar.nodeStartPos(d)})
    }

    // Apply the general update pattern to the nodes.
    node = node.data(nodes, d => d.id) 

    node
      .exit()
      .transition().duration(pubVar.transitionTime)
      .attr("r", 0)
      .remove()

    node = node
      .enter()
      .append("circle")
      .attr("fill", pubVar.nodeColor)
      .style("opacity", pubVar.nodeOpacity)
      .on("mouseover", displayNodeTooltip)
      .on("mouseout",  removeNodeTooltip)
      .call(node => { node.transition().duration(pubVar.transitionTime).attr("r", radiusFromNode); })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag",  dragged)
          .on("end",   dragended)
      )
      .merge(node)

    // Apply the general update pattern to the links.
    // Keep the exiting links connected to the moving remaining nodes.
    link.exit().transition().duration(pubVar.transitionTime)
      .attr("stroke-opacity", 0)
      .attrTween("x1", function(d) { return function() { return d.source.x; }; })
      .attrTween("x2", function(d) { return function() { return d.target.x; }; })
      .attrTween("y1", function(d) { return function() { return d.source.y; }; })
      .attrTween("y2", function(d) { return function() { return d.target.y; }; })
      .remove()

    link = link.enter().append("line")
      .call(function(link) { link.transition().attr("stroke-opacity", 1); })
      .attr("stroke", pubVar.linkColor)
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
  
  // CREATE API ______________________________
  function _DynamicGraph() {};

  // (Re)starts graph layout with given nodes and links
  _DynamicGraph.updateVis = (nodes, links) => {
    nodes && links ? updateVis(nodes, links) : console.error("Error: paramters should be: DyanmicGraph.udpateVis(nodes, links)")
    return _DynamicGraph
  }

  // Optional settable values

  // 
  _DynamicGraph.nodeColor = (colorSetter) => {
    if (colorSetter) pubVar.nodeColor = colorSetter
    return _DynamicGraph
  }

  return _DynamicGraph // for future api calls
}
