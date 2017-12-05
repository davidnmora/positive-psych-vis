console.clear();
// const api = 'https://raw.githubusercontent.com/DealPete/forceDirected/master/countries.json'
const api = "https://raw.githubusercontent.com/davidnmora/positive-psych-vis/master/data/graph-data.json";

var width = 900,
  height = 900,
  radius = 5;

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

d3.json(api, function(error, graph) {
  if (error) throw error;
  console.log(graph);
  let link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line")
    .attr("stroke", "black")
    .attr("stroke-width", 4);

  let node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter()
    .append("circle")
    .attr("r", d => {      
     d.degree = graph.links.filter(l => {
       return l.source == d.index || l.target == d.index;
     }).length;
     return 10 + (d.degree/2);
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

  simulation.nodes(graph.nodes).on("tick", ticked);

  simulation.force("link").links(graph.links);

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
        return (d.x = Math.max(radius, Math.min(width - radius, d.x)));
      })
      .attr("cy", function(d) {
        return (d.y = Math.max(radius, Math.min(height - radius, d.y)));
      });
  }
});

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