// get the data
//links = [{'source': 'acaryochloris', 'target': 'acaryochloris', 'pair': "['acaryochloris', 'acaryochloris']", 'IPR014059': {'ice': 9, 'cargo': 6}, 'IPR014862': {'ice': 9, 'cargo': 10}, 'IPR005094': {'ice': 0, 'cargo': 0}}, {'source': 'acaryochloris', 'target': 'acetoanaerobium', 'pair': "['acaryochloris', 'acetoanaerobium']", 'IPR014059': {'ice': 0, 'cargo': 0}, 'IPR014862': {'ice': 0, 'cargo': 0}, 'IPR005094': {'ice': 1, 'cargo': 8000}}];
links = data;
var nodes = {};
var threshold = 3;

// Compute the distinct nodes from the links.
links.forEach(function (link) {
  link.source = nodes[link.source] ||
    (nodes[link.source] = { name: link.source });
  link.target = nodes[link.target] ||
    (nodes[link.target] = { name: link.target });
});


var width = 1000,
  height = 800;

var edge_type = 'ice';
var edges_radio = ['IPR005094'];

drawGraph();
edgeTypeChange({ 'value': 'ice' });

function edgeTypeChange(elem) {
  if (elem.value == 'ice') {
    edge_type = 'ice';
  }
  if (elem.value == 'cargo') {
    edge_type = 'cargo';
  }
  if (elem.value == 'amr') {
    edge_type = 'amr';
  }

  d3.select('svg').remove();
  drawGraph();
}


function edgesChange(elem) {
  edges_radio = [];
  var items = document.getElementsByName('edges');
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item['checked'] == true) {
      edges_radio.push(item.value);
    }
  }

  console.log(edges_radio);
  d3.select('svg').remove();
  drawGraph();
}


function drawGraph() {

  var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(function (d) {
      if (d.weight >= 50) {
        return 200;
      } else {
        return 100;
      }
    })
    .linkStrength(0.1)
    .charge(function (d) {
      return -100;
    })
    .on("tick", tick)
    .start();

  // Set the range
  var v = d3.scale.linear().range([0, 100]);
  //scale for naive and weighted edges
  var radius_scale = d3.scale.linear().domain([1, 100]).range([4, 15]);
  var link_scale = d3.scale.log().domain([1, 100000]).range([1, 10]);
  //var link_scale_gamma = d3.scale.linear().domain([1,2637]).range([1,10]);
  //var link_scale_cargo_name = d3.scale.linear().domain([1,1320]).range([1,10]);
  //var link_scale_cargo_uid = d3.scale.linear().domain([1,2579]).range([1,10]);
  //var link_scale_cargo_total = d3.scale.linear().domain([1,53298]).range([1,10]);
  //var link_scale_mega_overlap = d3.scale.linear().domain([1,39996]).range([1,10]);

  //scale for degree radius color
  var color_scale = d3.scale.linear().domain([1, 100])
    .interpolate(d3.interpolateHcl)
    .range([d3.rgb("#007AFF"), d3.rgb("#FFF500")]);



  // Scale the range of the data
  v.domain([0, d3.max(links, function (d) {

    var count = 0;
    for (var i = 0; i < edges_radio.length; i++) {
      var code = edges_radio[i];
      count = count + d[code][edge_type];
    }
    return count;
  })]);

  var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height)

  var tip = d3.tip()
    .attr("class", "tip")
    .offset([-10, 0])
    .html(function (d) {
      var count = 0;
      for (var i = 0; i < edges_radio.length; i++) {
        var code = edges_radio[i];
        count = count + d[code][edge_type];
      }

      var text = d.source.name + " - " + d.target.name + ": " + count;
      return text;
    });

  var tip_node = d3.tip()
    .attr("class", "tip")
    .offset([-10, 0])
    .html(function (d) {

      var name = d.name;
      var name_cap = name.charAt(0).toUpperCase() + name.slice(1);
      var text = name_cap + " - " + d.weight + " connections";
      return text;
    });


  var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
    .enter().append("svg:path")
    .filter(function (d) {
      return (d['source']['weight'] >= threshold && d['target']['weight'] >= threshold);
    })
    .attr("class", function (d) { return "link " + d.type; })
    .style("stroke-width", function (d) {

      if (d[edges_radio] == 0) {
        return 0;
      } else {
        var count = 0;
        for (var i = 0; i < edges_radio.length; i++) {
          var code = edges_radio[i];
          count = count + d[code][edge_type];
        }
        if (count == 0) {
          return 0;
        }
        return link_scale(count);
      }
    });

  path.call(tip)
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide);


  function dblclick(d, i) {
    if (!d.fixed) {
      d.fixed = true;
      d.x += d3.event.dx;
      d.y += d3.event.dy;
      d3.select(this).select("circle").classed("fixed", true);
    }
    else {
      d.fixed = false;
      d3.select(this).select("circle").classed("fixed", false);
      force.resume();
    }
  }

  // define the nodes
  var node = svg.selectAll(".node")
    .data(force.nodes())
    .enter().append("g")
    .filter(function (d) {
      return d.weight >= threshold
    })
    .attr("class", "node")
    .call(force.drag)
    .on("click", dblclick); //freeze/unfreeze on dblclick

  // add the nodes
  node.append("circle")
    //scale radius based on degree
    .attr("r", function (d) {
      return radius_scale(d.weight);
    })
    .style("fill", function (d) {
      return color_scale(d.weight);
    });

  node.call(tip_node)
    .on("mouseover", tip_node.show)
    .on("mouseout", tip_node.hide);


  //add node name
  var labels = svg.selectAll(".node")
    .append("text")
    .text(function (d) {
      var name = d.name;
      return name.charAt(0).toUpperCase() + name.slice(1);
    });


  // add the curvy lines
  function tick() {
    path.attr("d", function (d) {
      var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
      return "M" +
        d.source.x + "," +
        d.source.y + "A" +
        dr + "," + dr + " 0 0,1 " +
        d.target.x + "," +
        d.target.y;
    });

    node
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
  };
}