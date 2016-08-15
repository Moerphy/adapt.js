import xrange from 'xrange';
import XRegExp from 'xregexp';

import {Trie} from './tools/text/trie';


class EntityTagger{
  /**
    Known Entity Tagger
    Given an index of known entities, can efficiently search for those entities within a provided utterance.
  */
  constructor(trie, tokenizer, regex_entities=[], max_tokens=20){
    this.trie = trie;
    this.tokenizer = tokenizer;
    this.max_tokens = max_tokens;
    this.regex_entities = regex_entities;
  }

  /**
  Using regex invokes this function, which significantly impacts performance of adapt. it is an N! operation.
  */
  *_iterate_subsequences(tokens){
    let startArray = xrange(tokens.length).toArray();
    for(let start_idx of startArray) {
      let endArray = xrange(start_idx+1, tokens.length+1).toArray();
      for(let end_idx of endArray){
        yield [tokens.slice(start_idx, end_idx).join(' '), start_idx];
      }
    }
  }

  _sort_and_merge_tags(tags){
    tags = tags.slice();
    tags.sort(function(a,b){
      if(a['start_token'] < b['start_token']){
        return -1;
      }
      if(a['start_token'] > b['start_token']){
        return 1;
      }
      if(a['start_token'] == b['start_token']){
        if(a['end_token'] < b['end_token']){
          return -1;
        }
        if(a['end_token'] > b['end_token']){
          return 1;
        }
        if(a['end_token'] == b['end_token']){
          return 0;
        }
      }
    });
    return tags;
  }
  /**
    Tag known entities within the utterance.
    @param utterance: a string of natural language text
    @return: dictionary, with the following keys
    match: str - the proper entity matched
    key: str - the string that was matched to the entity
    start_token: int - 0-based index of the first token matched
    end_token: int - 0-based index of the last token matched
    entities: list - a list of entity kinds as strings (Ex: Artist, Location)
  */
  tag(utterance){
    let tokens = this.tokenizer.tokenize(utterance);
    let entities = [];

    if(this.regex_entities.length > 0){
      for(let [part, idx] of this._iterate_subsequences(tokens)){
        let local_trie = new Trie();
        for(let regex_entity of this.regex_entities){
          let groups = regexGroups(XRegExp.exec(part, regex_entity), regex_entity);
          for(let key in groups){
            let match_str = groups[key];
            local_trie.insert(match_str, [match_str, key]);
          }
        }
        let sub_tagger = new EntityTagger(local_trie, this.tokenizer, [], this.max_tokens);
        for(let sub_entity of sub_tagger.tag(part)){
          sub_entity['start_token'] += idx;
          sub_entity['end_token'] += idx
          for(let e of sub_entity['entities']){
            e['confidence'] = 0.5;
          }
          entities.push(sub_entity);
        }
      }
    }
    let additional_sort = entities.length > 0;
    var that = this;
    xrange(tokens.length).each(function(i){//for(let i of xrange(tokens.length)){
      let part = tokens.slice(i).join(' ');
      
      for( let new_entity of that.trie.gather(part) ){
        new_entity['data'] = Array.from(new_entity['data']);// spread set into array
        entities.push({
          match: new_entity['match'],
          key: new_entity['key'],
          start_token: i,
          entities: [new_entity],
          end_token: i + that.tokenizer.tokenize(new_entity['match']).length - 1,
          get: function(name, defaultVal){
            if(this.hasOwnProperty(name)){
              return this[name];
            }
            return defaultVal;
          }
        });
      }
    });
    if(additional_sort){
      entities = this._sort_and_merge_tags(entities);
    }
    return entities;
  }

}

function regexGroups(match, regex) {
  var o = {};
  
  if(match){
    var x = regex.xregexp;
    (x && x.captureNames || []).forEach(function(name) {
      if (name) {
        o[name] = match[name];
      }
    });
  }
  return o;
}

export {EntityTagger};