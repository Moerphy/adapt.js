class TrieNode{

  constructor(data=undefined, is_terminal=false){
    this.data = new Set();
    if(data){
      this.data.add(data);
    }
    this.is_terminal = is_terminal;
    this.children = {};
    this.key = undefined;
  }

  *lookup(iterable, index=0, gather=false, edit_distance=0, max_edit_distance=0, match_threshold=0.0, matched_length=0){
    if(this.is_terminal){
      if(index == iterable.length || (gather && index < iterable.length) && iterable[index] == ' '){ // only gather on word break
        let confidence = (this.key.length - edit_distance) / Math.max(this.key.length, index);
        if(confidence > match_threshold){
          yield {
            key: this.key,
            match: iterable.slice(0, index),
            data: this.data,
            confidence: confidence
          };
        }
      }
    }

    if(index < iterable.length && this.children.hasOwnProperty(iterable[index])){
      for(let result of this.children[iterable[index]].lookup(iterable, index+1, gather, edit_distance, max_edit_distance, 0.0, matched_length+1)){
        yield result;
      }
    }

    //if there's edit distance remaining and it's possible to match a word above the confidence threshold
    let potential_confidence =  (index - edit_distance + (max_edit_distance - edit_distance)) / 
      (index + max_edit_distance - edit_distance > 0)?(index + (max_edit_distance - edit_distance)):0;
    if( edit_distance < max_edit_distance && potential_confidence > match_threshold){
      for(let child of this.children){
        if( index >= iterable.length || child != iterable[index]){
          // substitution
          for(let result in this.children[child].lookup(iterable, index+1, gather, edit_distance+1, max_edit_distance, 0.0, matched_length)){
            yield result;
          }
          // delete
          for(let result in this.children[child].lookup(iterable, index+2, gather, edit_distance+1, max_edit_distance, 0.0, matched_length)){
            yield result;
          }
          // insert
          for(let result in this.children[child].lookup(iterable, index, gather, edit_distance+1, max_edit_distance, 0.0, matched_length)){
            yield result;
          }

        }
      }
    }
  }

  insert(iterable, index=0, data=undefined, value=undefined){
    if(index == iterable.length){
      this.is_terminal = true;
      this.key = iterable;
      if(data){
        this.data.add(data);
      }
    }else{
      if(!this.children.hasOwnProperty(iterable[index])){
        this.children[iterable[index]] = new TrieNode();
      }
      this.children[iterable[index]].insert(iterable, index+1, data);
    }
  }

  is_prefix(iterable, index=0){
    if(this.children.hasOwnProperty(iterable[index])){
      return this.children[iterable[index]].is_prefix(iterable, index+1);
    }else{
      return false;
    }
  }

  remove(iterable, data=undefined, index=0){
    if( index == iterable.length ){
      if(this.is_terminal){
        if(data){
          this.data.remove(data);
          if(this.data.size == 0){
            this.is_terminal = false;
          }
        }else{
          this.data.clear();
          this.is_terminal = false;
        }
        return true;
      }else{
        return false;
      }
    }else if( this.children.hasOwnProperty(iterable[index]) ){
      return this.children[iterable[index]].remove(iterable, data, index+1);
    }else{
      return false;
    }
  }

}
class Trie{
  constructor(max_edit_distance=0, match_threshold=0.0){
    this.root = new TrieNode('root');
    this.max_edit_distance = max_edit_distance;
    this.match_threshold = match_threshold;
  }

  *gather(iterable){
    for(let result of this.lookup(iterable, true)){
      yield result;
    }
  }

  *lookup(iterable, gather=false){
    for(let result of this.root.lookup(iterable, 0, gather, 0, this.max_edit_distance, this.match_threshold)){
       yield result;
    }
  }

  insert(iterable, data=undefined){
    this.root.insert(iterable, 0, data);
  }

  remove(iterable, data=undefined){
    return this.root.remove(iterable, data);
  }
}

export {Trie, TrieNode};