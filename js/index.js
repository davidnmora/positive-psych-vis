  // 3. GET DATA AND SETUP INITIAL VIS DEPENDANT ON DATA -------------------------------------------------------------------------
  const graphDataJSONPath = "data/graph-data.json"

  Promise.all([
    new Promise((res,rej) => d3.json(graphDataJSONPath, function(error, JSONdata) { if(error) { rej(error) } else { res(JSONdata) } }))  
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
      console.log(graph)
      
      let vis = DynamicGraph(d3.select("#canvas"), graph)
        .updateVis()
  }); // closes graphData Primise.then(...)
