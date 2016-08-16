import xrange from 'xrange';


class SimpleGraph{
  constructor(){
    this.adjacency_lists = {};
  }

  add_edge(a, b){
    let neighbors_of_a = this.adjacency_lists[a];
    if(!neighbors_of_a){
      neighbors_of_a = new Set();
      this.adjacency_lists[a] = neighbors_of_a;
    }
    neighbors_of_a.add(b);

    let neighbors_of_b = this.adjacency_lists[b];
    if(!neighbors_of_b){
      neighbors_of_b = new Set();
      this.adjacency_lists[b] = neighbors_of_b;
    }
    neighbors_of_b.add(a);
  }


  get_neighbors_of(a){
    return this.adjacency_lists[a] || new Set();
  }

  vertex_set(){
    return Object.keys(this.adjacency_lists); // TODO check for correctness
  }
}


function *bronk(r, p, x, graph){
  if(p.length == 0 && x.length == 0){
    yield r;
    return;
  }
  for(let vertex of p.slice()){
    let r_new = r.slice();
    r_new.push(vertex);
    let p_new = [];
    for(let val of p){
      if(graph.get_neighbors_of(vertex).has(val)){
        p_new.push(val);
      }
    }
    let x_new = [];
    for(let val of x){
      if(graph.get_neighbors_of(vertex).has(val)){
        x_new.push(val);
      }
    }

    for(let result of bronk(r_new, p_new, x_new, graph)){
      yield result;
    }
    p.splice(p.indexOf(vertex), 1);
    x.push(vertex);
  }
}

function *get_cliques(vertices, graph){
  for(let clique of bronk([], vertices, [], graph)){
    yield clique;
  }
}

function graph_key_from_tag(tag, entity_index){
  let start_token = tag['start_token'];
  let entity = (tag['entities'] || [])[entity_index];
  return start_token + "-" + entity['key'] + '-' + entity['confidence'];
}


class Lattice{
  constructor(){
    this.nodes = [];
  }

  append(data){
    if(Array.isArray(data) && data.length > 0){
      this.nodes.push(data);
    }else{
      this.nodes.push([data]);
    }
  }

  *traverse(index=0){
    if(index < this.nodes.length){
      for(let entity of this.nodes[index]){

        for(let next_result of this.traverse(index+1)){
          if(Array.isArray(entity)){
            yield [ ...entity, ...next_result ]; 
          }else{
            yield [ entity, ...next_result ]; 
          }
        }
      }
    }else{
      yield [];
    }
  }
}

/**
BronKerboschExpander

Given a list of tagged entities (from the existing entity tagger implementation or another), expand out
valid parse results.

A parse result is considered valid if it contains no overlapping spans.

Since total confidence of a parse result is based on the sum of confidences of the entities, there is no sense
in yielding any potential parse results that are a subset/sequence of a larger valid parse result. By comparing
this concept to that of maximal cliques (https://en.wikipedia.org/wiki/Clique_problem), we can use well known
solutions to the maximal clique problem like the Bron/Kerbosch algorithm (https://en.wikipedia.org/wiki/Bron%E2%80%93Kerbosch_algorithm).

By considering tagged entities that do not overlap to be "neighbors", BronKerbosch will yield a set of maximal
cliques that are also valid parse results.
*/
class BronKerboschExpander{
  constructor(tokenizer){
    this.tokenizer = tokenizer;
  }

  _build_graph(tags){
    let graph = new SimpleGraph();
    var that = this;
    xrange(tags.length).each(function(tag_index){
      xrange(tags[tag_index]['entities'].length).each(function(entity_index){
        let a_entity_name = graph_key_from_tag(tags[tag_index], entity_index)
        let tokens = that.tokenizer.tokenize( (tags[tag_index]['entities'] || [] )[entity_index]['match']);
        for(let tag of tags.slice(tag_index+1)){
          let start_token = tag['start_token'];
          if(start_token >= tags[tag_index]['start_token'] + tokens.length){
            xrange(tag['entities'].length).each(function(b_entity_index){
              let b_entity_name = graph_key_from_tag(tag, b_entity_index);
              graph.add_edge(a_entity_name, b_entity_name);
            });
          }
        }

      });
    });
    return graph;
  }

  *_sub_expand(tags){
    let entities = {};
    let graph = this._build_graph(tags);

    for(let tag of tags){
      xrange(tag['entities'].length).each(function(entity_index){
        let node_name = graph_key_from_tag(tag, entity_index);
        if(!entities.hasOwnProperty(node_name)){
          entities[node_name] = [];
        }
        entities[node_name] = [
          ...entities[node_name],
          tag.get('entities', [])[entity_index],
          tag.get('entities', [])[entity_index]['confidence'],
          tag
        ];
        
      });
    }



    for(let clique of get_cliques(Object.keys(entities), graph)){
      let result = [];
      for(let entity_name of clique){
        let start_token = parseInt(entity_name.split('-')[0]);
        let old_tag = entities[entity_name][2];


        let tag = {
          start_token: start_token,
          entities: [entities[entity_name][0]],
          confidence: entities[entity_name][1] * old_tag.get('confidence', 1.0),
          end_token: old_tag['end_token'],
          match: old_tag['entities'][0]['match'],
          key: old_tag['entities'][0]['key']
        };


        result.push(tag);
      }
      result = result.slice().sort(function(a, b){
        if(a['start_token'] < b['start_token']){
          return -1;
        }
        if(a['start_token'] > b['start_token']){
          return 1;
        }

        return 0;
      });
      yield result;
    }
  }

  expand(tags, clique_scoring_func=undefined){
    var that = this;
    let lattice = new Lattice();
    let overlapping_spans = [];

    var end_token_index = function(){
      return overlapping_spans.map(t => t['end_token']).reduce( (max, curr) => Math.max(max, curr), 0 );
    }

    xrange(tags.length).each(function(i){
      let tag = tags[i];

      if(overlapping_spans.length > 0 && end_token_index() >= tag['start_token']){
        overlapping_spans.push(tag);
      }else if(overlapping_spans.length > 1){
        let cliques = that._sub_expand(overlapping_spans);
        if(clique_scoring_func){
          cliques = Array.from(cliques).sort(function(a, b){
            let aval = -1 * clique_scoring_func(a);
            let bval = -1 * clique_scoring_func(b);
            if(aval < bval) return -1;
            if(aval > bval) return 1;
            return 0;
          });
        }
        lattice.append(cliques);
        overlapping_spans = [tag];
      }else{
        lattice.append(overlapping_spans);
        overlapping_spans = [tag];
      }
    });

    if(overlapping_spans.length > 1){
      let cliques = this._sub_expand(overlapping_spans);
      if(clique_scoring_func){
        cliques = Array.from(cliques).sort(function(a, b){
          let aval = -1 * clique_scoring_func(a);
          let bval = -1 * clique_scoring_func(b);
          if(aval < bval) return -1;
          if(aval > bval) return 1;
          return 0;
        });
      }
      lattice.append(cliques);
    }else{
      lattice.append(overlapping_spans);
    }
    return lattice.traverse();
  }
}

export {BronKerboschExpander};