import "babel-polyfill";


/*
def is_entity(tag, entity_name):
    for entity in tag.get('entities'):
        for v, t in entity.get('data'):
            if t.lower() == entity_name.lower():
                return True
    return False

def find_next_tag(tags, end_index=0):
    for tag in tags:
        if tag.get('start_token') > end_index:
            return tag
    return None

*/

function find_first_tag(tags, entity_type, after_index=-1){
  for(let tag of tags){
    for(let entity of tag['entities']){
      for(let [v, t] of entity['data']){ // for v, t in entity.get('data'):
        //let t = entity['data'][v];
        if( t.toLowerCase() == entity_type.toLowerCase() && tag['start_token'] > after_index){
          return [tag, v];
        }
      }
    }
  }
  return [undefined, undefined];
}

function* choose_1_from_each(lists){
  if(lists.length == 0){
    yield [];
  }else{
    for(let el of lists[0]){
      for(let next_list of choose_1_from_each(lists.slice(1))){
        yield [el, ...next_list];
      }
    }
  }
}


function resolve_one_of(tags, at_least_one){
  if(tags.length < at_least_one.length){
    return undefined;
  }
  for(let possible_resolution of choose_1_from_each(at_least_one)){
    let resolution = {};
    let pr = possible_resolution.slice();
    for(let entity_type of pr){
      let last_end_index = -1;
      if(resolution.hasOwnProperty(entity_type)){
        last_end_index = resolution[entity_type][resolution[entity_type].length-1].get('end_token');
      }
      let [tag,  value] = find_first_tag(tags, entity_type, last_end_index);
      if(!tag){
        break;
      }else{
        if(!resolution.hasOwnProperty(entity_type)){
          resolution[entity_type] = [];
        }
        resolution[entity_type].push(tag);
      }
    }
    if(Object.keys(resolution).length == possible_resolution.length){
      return resolution;
    }
  }
  return undefined;
}

class IntentBuilder{

  /**
        Constructor
        @param intent_name the name of the intents that this parser parses/validates
        @return an instance of IntentBuilder
   */
  constructor(intent_name){
    this.at_least_one = [];
    this.requires = [];
    this.optional = [];
    this.name = intent_name;
  }

  /**
  The intent parser should require one of the provided entity types to validate this clause.
  @param args: *args notation list of entity names
  @return: this
  */
  one_of(){
    
    //Array.push.apply(this.at_least_one, Array.prototype.slice.call(arguments));
    this.at_least_one.push( Array.prototype.slice.call(arguments));
    return this;
  }
  /**
  The intent parser should require an entity of the provided type.
  @param entity_type: string, an entity type
  @param attribute_name: string, the name of the attribute on the parsed intent. Defaults to match entity_type.
  @return: this
  */
  require(entity_type, attribute_name=undefined){
    if(!attribute_name){
      attribute_name = entity_type
    }
    this.requires.push( [entity_type, attribute_name] );
    return this;
  }

  /**
  Parsed intents from this parser can optionally include an entity of the provided type.
  @param entity_type: string, an entity type
  @param attribute_name: string, the name of the attribute on the parsed intent. Defaults to match entity_type.
  @return: this
  */
  optionally(entity_type, attribute_name=undefined){
    if(!attribute_name){
      attribute_name = entity_type
    }
    this.optional.push( [entity_type, attribute_name] );
    return this;
  }

  /**
  Constructs an intent from the builder's specifications.
  @return: an Intent instance.
  */
  build(){
    return new Intent(this.name, this.requires, this.at_least_one, this.optional);
  }

};


class Intent{
  constructor(name, requires, at_least_one, optional){
    this.name = name;
    this.requires = requires;
    this.at_least_one = at_least_one;
    this.optional = optional;
  }

  validate(tags, confidence){
    let result = {
      'intent_type': this.name, 
      get: function(name, defaultVal){
        if(this.hasOwnProperty(name)){
          return this[name];
        }
        return defaultVal;
      }
    };
    let intent_confidence = 0.0
    let local_tags = tags.slice();
    for( let [require_type, attribute_name] of this.requires ){
      let [required_tag, canonical_form] = find_first_tag(local_tags, require_type)
      if(!required_tag){
        result['confidence'] = 0.0;
        return result;
      }

      result[attribute_name] = canonical_form;
      let localTagIndex = local_tags.indexOf(required_tag);
      if(localTagIndex >= 0){
        local_tags.splice(localTagIndex, 1);
      }
            
      intent_confidence += 1.0;
    }


    if(this.at_least_one.length > 0){
      let best_resolution = resolve_one_of(tags, this.at_least_one)
      if(!best_resolution){
        result['confidence'] = 0.0;
        return result;
      }else{
        for(let key in best_resolution){
          result[key] = best_resolution[key][0].get('key'); // TODO: at least one must support aliases
          intent_confidence += 1.0;
        }
      }
    }

    for(let [optional_type, attribute_name] of this.optional){
      let [optional_tag, canonical_form] = find_first_tag(local_tags, optional_type);
      if(!optional_tag ||  result.hasOwnProperty(attribute_name) ){
        continue;
      }
      result[attribute_name] = canonical_form;
      let localTagIndex = local_tags.indexOf(optional_tag);
      if(localTagIndex >= 0){
        local_tags.splice(localTagIndex, 1);
      }
      intent_confidence += 1.0;
    }

    let total_confidence = intent_confidence / tags.length * confidence;

    let [target_client, canonical_form] = find_first_tag(local_tags, 'Client');

    result['target'] = target_client?target_client.get('key'):undefined;
    result['confidence'] = total_confidence;

    return result
  }
};


export { IntentBuilder, Intent };






























/*


__author__ = 'seanfitz'

CLIENT_ENTITY_NAME = ''






*/