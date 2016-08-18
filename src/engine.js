import {EventEmitter} from 'events';

import XRegExp from 'xregexp';
import Heap from 'heap';

import {EnglishTokenizer} from './tools/text/tokenizer';
import {Trie} from './tools/text/trie';
import {EntityTagger} from './entity_tagger';
import {Parser} from './parser';
import {BronKerboschExpander} from './expander';


class IntentDeterminationEngine  extends EventEmitter {
  /**
    IntentDeterminationEngine

    The IntentDeterminationEngine is a greedy and naive implementation of intent determination. Given an utterance,
    it uses the Adapt parsing tools to come up with a sorted collection of tagged parses. A valid parse result contains
    no overlapping tagged entities, and it's confidence is the sum of the tagged entity confidences, which are
    weighted based on the percentage of the utterance (per character) that the entity match represents.

    This system makes heavy use of generators to enable greedy algorithms to short circuit large portions of
    computation.
  */
  constructor(tokenizer=undefined, trie=undefined){
    super();
    this.tokenizer = tokenizer || new EnglishTokenizer();
    this.trie = trie || new Trie();
    this.regular_expressions_entities = [];
    this._regex_strings = new Set();
    this.tagger = new EntityTagger(this.trie, this.tokenizer, this.regular_expressions_entities);
    this.intent_parsers = [];
  }

  __best_intent(parse_result){
    let best_intent = undefined;
    for(let intent of this.intent_parsers){
      let i = intent.validate(parse_result['tags'], parse_result['confidence']);

      if(!best_intent || (i && i['confidence'] > best_intent['confidence'])){
        best_intent = i;
      }
    }
    return best_intent;
  }
  /**
  Given an utterance, provide a valid intent.
  :param utterance: an ascii or unicode string representing natural language speech
  :param num_results: a maximum number of results to be returned.
  :return: A generator the yields dictionaries.
  */
  *determine_intent(utterance, num_results=1){
    var that = this;
    let p = new Parser(this.tokenizer, this.tagger);
    
    p.on('tagged_entities', function(result){
      that.emit('tagged_entities', result);
    });

    for(let result of p.parse(utterance, undefined, num_results)){
      this.emit('parse_result', result);
      let best_intent = this.__best_intent(result);
      if(best_intent && best_intent.get('confidence', 0.0) > 0){
        yield best_intent;
      }
    }
    
  }
  /**
    Register an entity to be tagged in potential parse results
    :param entity_value: the value/proper name of an entity instance (Ex: "The Big Bang Theory")
    :param entity_type: the type/tag of an entity instance (Ex: "Television Show")
    :return: None
  */
  register_entity(entity_value, entity_type, alias_of=undefined){
    if(alias_of){
      this.trie.insert(entity_value, [alias_of, entity_type]);
    }else{
      this.trie.insert(entity_value.toLowerCase(), [entity_value, entity_type]);
      this.trie.insert(entity_type.toLowerCase(), [entity_type, 'Concept']);
    }
  }

  /**
  A regular expression making use of python named group expressions.
  Example: (?P<Artist>.*)
  :param regex_str: a string representing a regular expression as defined above
  :return: None
  */
  register_regex_entity(regex_str){
    if(regex_str && !this._regex_strings.has(regex_str)){
      this._regex_strings.add(regex_str);
      this.regular_expressions_entities.push( XRegExp(regex_str, 'i') );
    }

  }
  /**
  "Enforce" the intent parser interface at registration time.
  :param intent_parser:
  :return: None
  :raises ValueError on invalid intent
  */
  register_intent_parser(intent_parser){
    if(intent_parser.validate && typeof intent_parser.validate == 'function'){
      this.intent_parsers.push(intent_parser);
    }else{
      throw Error("Not an intent parser!");
    }
  }
};



class DomainIntentDeterminationEngine{
  constructor(){
    this.domains = {};
  }

  register_domain(domain="", tokenizer=undefined, trie=undefined){

    this.domains[domain] = new IntentDeterminationEngine(tokenizer, trie);
  }

  register_entity(entity_value, entity_type, alias_of=undefined, domain=""){
    if(!(domain in this.domains)){
      this.register_domain(domain);
    }
    this.domains[domain].register_entity(entity_value, entity_type, alias_of);
  }

  register_regex_entity(regex_str, domain=""){
    if(!domain in this.domains){
      this.register_domain(domain);
    }
    this.domains[domain].register_regex_entity(regex_str);
  }

  register_intent_parser(intent_parser, domain=""){
    if(!domain in this.domains){
      this.register_domain(domain);
    }
    this.domains[domain].register_intent_parser(intent_parser);
  }

  *determine_intent(utterance, num_results=1){
    let intents = [];
    for(let domain in this.domains){
      let gen = this.domains[domain].determine_intent(utterance, 1);
      
      for(let intent of gen){
        intents.push(intent);
      }
    }

    intents = Heap.nlargest(intents, num_results, (a, b) => a['confidence'] - b['confidence']); 
    for(let intent of intents){
      yield intent;
    }
  }

};

export {IntentDeterminationEngine, DomainIntentDeterminationEngine};