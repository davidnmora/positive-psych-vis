
const graphDataJSONPath = "data/graph-data.json"

// PROJECT SPECIFIC FILTERING, SETUP, ETC

let filterParams = {
  sampleParam: true,
}

 // 3. HANDLE FILTERING INTERACTIONS -------------------------------------------------------------------------
  const radiusFromNode = d => {    
    if(d.radius !== undefined) return d.radius
    d.degree = graph.links.filter(l => {
      return l.source == d.id || l.target == d.id
    }).length
    d.radius = minRadius + (d.degree/12)
    return d.keyPhrase ? 30 : d.radius 
  }
  
  // High-level filters
  const shouldKeepNode = (node) => (node.index % 2) === 0
  const shouldKeepLink = (nodesById, link) => {
    const sourceNode = nodesById[link.sourceId]
    const targetNode = nodesById[link.targetId]
    return shouldKeepNode(sourceNode) && shouldKeepNode(targetNode)
  }


// 3. GET DATA, LUANCH VIS -------------------------------------------------------------------------
Promise.all([
  new Promise((res,rej) => d3.json(graphDataJSONPath, function(error, JSONdata) { if(error) { rej(error) } else { res(JSONdata) } }))  
  ])
  .then(([_graph]) => {
    graph = _graph
    graph.nodesById = {}
    for (const node of graph.nodes) {
      graph.nodesById[node.id] = node
    }
    for (const link of graph.links) {
      link.sourceId = link.source
      link.targetId = link.target
    }
    
    // Launch vis
    let nodes = graph.nodes
    let links = graph.links

    let vis = DynamicGraph(d3.select("#canvas"), { width: 1000 })
                .nodeColor("darkred")
                .updateVis(nodes, links)

    // Update vis
    nodes = graph.nodes.filter(node => shouldKeepNode(node))
    links = graph.links.filter(link => shouldKeepLink(graph.nodesById, link))
    setTimeout(() => vis.updateVis(nodes, links), 2000)

  }); // Primise.then(...)
