import "babel-polyfill";

import {BronKerboschExpander} from './expander';
import {EventEmitter} from 'events';

class Parser extends EventEmitter {

  constructor(tokenizer, tagger){
    super();
    this.tokenizer = tokenizer;
    this.tagger = tagger;
  }

  *parse(utterance, relevance_store=undefined, N=1){
    let start = Date.now() / 1000 | 0;
    let tagged = this.tagger.tag(utterance.toLowerCase());

    this.emit('tagged_entities', {
      uterrance: utterance,
      tag: tagged,
      time: (Date.now() / 1000 | 0) - start
    });

    start = Date.now() / 1000 | 0;
    let bke = new BronKerboschExpander(this.tokenizer);

    var score_clique = function(clique){
      let score = 0.0;
      for(let tagged_entity of clique){
        let ec = tagged_entity.get('entities', [{confidence: 0}])[0].get('confidence');
        score += ec * tagget_entity.get('entities', [{'match': ''}])[0].get('match').length / (utterance.length + 1);
      }
      return score;
    };
    let parse_results = bke.expand(tagged, score_clique);
    let count = 0;

    for(let result of parse_results){
      count++;
      let parse_confidence = 0.0;
      for(let tag of result){
        let sample_entity = tag['entities'][0];
        let entity_confidence = (sample_entity['confidence']|| 0.0) * sample_entity['match'].length / utterance.length;
        parse_confidence += entity_confidence;
      }

      yield {
        'utterance': utterance,
        'tags': result,
        'time': (Date.now() / 1000 | 0) - start,
        'confidence': parse_confidence
      };

      if(count >= N ){
        break;
      }
    }
  }

}

export {Parser};



/*
import pyee
import time
from adapt.expander import BronKerboschExpander


__author__ = 'seanfitz'


class Parser(pyee.EventEmitter):
    """
    Coordinate a tagger and expander to yield valid parse results.
    """
    def __init__(self, tokenizer, tagger):
        pyee.EventEmitter.__init__(self)
        self._tokenizer = tokenizer
        self._tagger = tagger

    def parse(self, utterance, relevance_store=None, N=1):
        start = time.time()
        tagged = self._tagger.tag(utterance.lower())
        self.emit("tagged_entities",
                  {
                      'utterance': utterance,
                      'tags': list(tagged),
                      'time': time.time() - start
                  })
        start = time.time()
        bke = BronKerboschExpander(self._tokenizer)

        def score_clique(clique):
            score = 0.0
            for tagged_entity in clique:
                ec = tagged_entity.get('entities', [{'confidence': 0.0}])[0].get('confidence')
                score += ec * len(tagged_entity.get('entities', [{'match': ''}])[0].get('match')) / (
                    len(utterance) + 1)
            return score

        parse_results = bke.expand(tagged, clique_scoring_func=score_clique)
        count = 0
        for result in parse_results:
            count += 1
            parse_confidence = 0.0
            for tag in result:
                sample_entity = tag['entities'][0]
                entity_confidence = sample_entity.get('confidence', 0.0) * float(
                    len(sample_entity.get('match'))) / len(utterance)
                parse_confidence += entity_confidence
            yield {
                'utterance': utterance,
                'tags': result,
                'time': time.time() - start,
                'confidence': parse_confidence
            }

            if count >= N:
                break

*/