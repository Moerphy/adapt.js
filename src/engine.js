import {EventEmitter} from 'events';

import XRegExp from 'xregexp';
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



class DomainIntentDeterminationEngine{}

export {IntentDeterminationEngine, DomainIntentDeterminationEngine};
/*
class DomainIntentDeterminationEngine(object):
    """
    DomainIntentDeterminationEngine.

    The DomainIntentDeterminationEngine is a greedy and naive implementation of intent
    determination. Given an utterance, it uses the Adapt parsing tools to come up with a
    sorted collection of tagged parses. A valid parse result contains no overlapping
    tagged entities in a single domain, and it's confidence is the sum of the tagged
    entity confidences, which are weighted based on the percentage of the utterance
    (per character) that the entity match represents.

    This system makes heavy use of generators to enable greedy algorithms to short circuit
    large portions of computation.
    """

    def __init__(self):
        """
        Initialize DomainIntentDeterminationEngine.

        :param tokenizer: The tokenizer you wish to use.

        :param trie: the Trie() you wish to use.

        :param domain: a string representing the domain you wish to add
        """
        self.domains = {}

    @property
    def tokenizer(self):
        """
        A property to link into IntentEngine's tokenizer.

        warning:: this is only for backwards compatiblility and should not be used if you
        intend on using domains.

        :return: the domains tokenizer from its IntentEngine
        """
        domain = 0
        if domain not in self.domains:
            self.register_domain(domain=domain)
        return self.domains[domain].tokenizer

    @property
    def trie(self):
        """
        A property to link into IntentEngine's trie.

        warning:: this is only for backwards compatiblility and should not be used if you
        intend on using domains.

        :return: the domains trie from its IntentEngine
        """
        domain = 0
        if domain not in self.domains:
            self.register_domain(domain=domain)
        return self.domains[domain].trie

    @property
    def tagger(self):
        """
        A property to link into IntentEngine's intent_parsers.

        warning:: this is only for backwards compatiblility and should not be used if you
        intend on using domains.

        :return: the domains intent_parsers from its IntentEngine
        """
        domain = 0
        if domain not in self.domains:
            self.register_domain(domain=domain)
        return self.domains[domain].tagger

    @property
    def intent_parsers(self):
        """
        A property to link into IntentEngine's intent_parsers.

        warning:: this is only for backwards compatiblility and should not be used if you
        intend on using domains.

        :return: the domains intent_parsers from its IntentEngine
        """
        domain = 0
        if domain not in self.domains:
            self.register_domain(domain=domain)
        return self.domains[domain].intent_parsers

    @property
    def _regex_strings(self):
        """
        A property to link into IntentEngine's _regex_strings.

        warning:: this is only for backwards compatiblility and should not be used if you
        intend on using domains.

        :return: the domains _regex_strings from its IntentEngine
        """
        domain = 0
        if domain not in self.domains:
            self.register_domain(domain=domain)
        return self.domains[domain]._regex_strings

    @property
    def regular_expressions_entities(self):
        """
        A property to link into IntentEngine's regular_expressions_entities.

        warning:: this is only for backwards compatiblility and should not be used if you
        intend on using domains.

        :return: the domains regular_expression_entities from its IntentEngine
        """
        domain = 0
        if domain not in self.domains:
            self.register_domain(domain=domain)
        return self.domains[domain].regular_expressions_entities

    def register_domain(self, domain=0, tokenizer=None, trie=None):
        """
        Register a domain with the intent engine.

        :param tokenizer: The tokenizer you wish to use.

        :param trie: the Trie() you wish to use.

        :param domain: a string representing the domain you wish to add
        """
        self.domains[domain] = IntentDeterminationEngine(
            tokenizer=tokenizer, trie=trie)

    def register_entity(self, entity_value, entity_type, alias_of=None, domain=0):
        """
        Register an entity to be tagged in potential parse results.

        :param entity_value: the value/proper name of an entity instance
        (Ex: "The Big Bang Theory")

        :param entity_type: the type/tag of an entity instance (Ex: "Television Show")

        :param domain: a string representing the domain you wish to add the entity to

        :return: None
        """
        if domain not in self.domains:
            self.register_domain(domain=domain)
        self.domains[domain].register_entity(entity_value=entity_value,
                                             entity_type=entity_type,
                                             alias_of=alias_of)

    def register_regex_entity(self, regex_str, domain=0):
        """
        A regular expression making use of python named group expressions.

        Example: (?P<Artist>.*)

        :param regex_str: a string representing a regular expression as defined above

        :param domain: a string representing the domain you wish to add the entity to

        :return: None
        """
        if domain not in self.domains:
            self.register_domain(domain=domain)
        self.domains[domain].register_regex_entity(regex_str=regex_str)

    def determine_intent(self, utterance, num_results=1):
        """
        Given an utterance, provide a valid intent.

        :param utterance: an ascii or unicode string representing natural language speech

        :param num_results: a maximum number of results to be returned.

        :return: A generator the yields dictionaries.
        """
        intents = []
        for domain in self.domains:
            gen = self.domains[domain].determine_intent(utterance=utterance,
                                                        num_results=1)
            for intent in gen:
                intents.append(intent)

        heapq.nlargest(
            num_results, intents, key=lambda domain: domain['confidence'])
        for intent in intents:
            yield intent

    def register_intent_parser(self, intent_parser, domain=0):
        """
        Register a intent parser with a domain.

        :param intent_parser: The intent parser you wish to register.

        :param domain: a string representing the domain you wish register the intent
        parser to.
        """
        if domain not in self.domains:
            self.register_domain(domain=domain)
        self.domains[domain].register_intent_parser(
            intent_parser=intent_parser)

*/


