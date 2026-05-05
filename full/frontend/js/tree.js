// D3.js Interactive Family Tree
let svg, g, zoom, simulation;

async function renderTree() {
  const wrap = document.getElementById("tree-canvas-wrap");
  const svgEl = document.getElementById("tree-canvas");
  svgEl.innerHTML = "";

  let data;
  try {
    data = await fetch("/api/members/tree/data").then(r => r.json());
  } catch (e) { return; }

  const W = wrap.clientWidth || 900;
  const H = wrap.clientHeight || 550;

  svg = d3.select("#tree-canvas").attr("width", W).attr("height", H);
  g = svg.append("g");

  zoom = d3.zoom().scaleExtent([0.2, 3]).on("zoom", e => g.attr("transform", e.transform));
  svg.call(zoom);

  // Generation colors (High-tech palette)
  const genColors = ["#FFD700", "#00F2FF", "#ADFF2F", "#FF00FF", "#00FF7F", "#FFA500"];

  // Add glow filter to SVG
  const defs = svg.append("defs");
  const filter = defs.append("filter").attr("id", "glow");
  filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  // Force simulation - High-Tech & High-Readability
  simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id).distance(180).strength(1))
    .force("charge", d3.forceManyBody().strength(-800))
    .force("center", d3.forceCenter(W / 2, H / 2))
    .force("y", d3.forceY(d => 100 + d.generation * 180).strength(1))
    .force("x", d3.forceX(W / 2).strength(0.1))
    .force("collision", d3.forceCollide(90));

  // Links
  const link = g.append("g").selectAll("line")
    .data(data.links).join("line")
    .attr("stroke", "rgba(201,168,76,0.25)")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4,3");

  // Node groups
  const node = g.append("g").selectAll("g")
    .data(data.nodes).join("g")
    .attr("class", "tree-node")
    .style("cursor", "pointer")
    .call(d3.drag()
      .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end",   (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    )
    .on("click", (e, d) => { e.stopPropagation(); openMember(d.id); });

  // Circle bg
  node.append("circle")
    .attr("r", 30)
    .attr("fill", d => d.is_deceased ? "rgba(100,100,100,0.3)" : "rgba(15,22,35,0.9)")
    .attr("stroke", d => genColors[d.generation % genColors.length])
    .attr("stroke-width", 2.5)
    .attr("filter", "url(#glow)");

  // Initial letter
  node.append("text")
    .attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("font-size", "1.1rem").attr("font-weight", "700")
    .attr("fill", d => genColors[d.generation % genColors.length])
    .attr("font-family", "Noto Kufi Arabic, Cairo, sans-serif")
    .text(d => d.name ? d.name[0] : "؟");

  // Name label below
  node.append("text")
    .attr("text-anchor", "middle").attr("y", 44)
    .attr("font-size", "0.7rem").attr("fill", "#f0ead8")
    .attr("font-family", "Noto Kufi Arabic, Cairo, sans-serif")
    .text(d => d.name.length > 12 ? d.name.substring(0, 12) + "…" : d.name);

  // Gender indicator
  node.append("circle")
    .attr("cx", 22).attr("cy", -22).attr("r", 7)
    .attr("fill", d => d.gender === "female" ? "rgba(231,76,60,0.7)" : "rgba(52,152,219,0.7)")
    .attr("stroke", "var(--bg)").attr("stroke-width", 1.5);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // Gen legend
  const genNames = ["الجد الأكبر","الجيل الأول","الجيل الثاني","الجيل الثالث","الجيل الرابع"];
  const legend = svg.append("g").attr("transform", "translate(16,16)");
  genNames.forEach((name, i) => {
    legend.append("circle").attr("cx", 8).attr("cy", i * 22 + 8).attr("r", 6)
      .attr("fill", genColors[i % genColors.length]);
    legend.append("text").attr("x", 20).attr("y", i * 22 + 12)
      .attr("font-size", "0.7rem").attr("fill", "#b8a98a")
      .attr("font-family", "Noto Kufi Arabic, Cairo, sans-serif")
      .text(name);
  });
}

// Highlight search & Focus
function highlightNode(query) {
  if (!g || !query) {
    resetTree();
    return;
  }
  
  const matches = g.selectAll(".tree-node").filter(d => d.name && d.name.includes(query));
  
  g.selectAll(".tree-node circle:first-child")
    .transition().duration(300)
    .attr("stroke-width", d => (d.name && d.name.includes(query)) ? 6 : 1.5)
    .attr("stroke", d => (d.name && d.name.includes(query)) ? "#fff" : "rgba(212,175,55,0.3)");

  if (!matches.empty()) {
    const d = matches.datum();
    focusNode(d.x, d.y, 1.5);
  }
}

function focusNode(x, y, scale = 1.2) {
  const W = document.getElementById("tree-canvas-wrap").clientWidth;
  const H = document.getElementById("tree-canvas-wrap").clientHeight;
  svg.transition().duration(1000).call(
    zoom.transform,
    d3.zoomIdentity.translate(W / 2 - x * scale, H / 2 - y * scale).scale(scale)
  );
}

function resetTree() {
  if (svg && zoom) svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
  document.getElementById("tree-search").value = "";
  g.selectAll(".tree-node circle:first-child")
    .transition().duration(300)
    .attr("stroke-width", 2.5)
    .attr("stroke", d => ["#FFD700", "#00F2FF", "#ADFF2F", "#FF00FF", "#00FF7F", "#FFA500"][d.generation % 6]);
}

function zoomIn()  { if (svg && zoom) svg.transition().duration(400).call(zoom.scaleBy, 1.4); }
function zoomOut() { if (svg && zoom) svg.transition().duration(400).call(zoom.scaleBy, 0.7); }

// Auto render on load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(renderTree, 600);
  // Mobile hint
  const wrap = document.getElementById("tree-canvas-wrap");
  const hint = document.createElement("div");
  hint.className = "tree-hint";
  hint.innerHTML = "💡 اسحب للتحرك · قرّب للتكبير";
  wrap.appendChild(hint);
  setTimeout(() => hint.style.opacity = "0", 4000);
});
