import "babel-polyfill";

import assert from 'assert';
import {EntityTagger} from '../src/entity_tagger';
import {EnglishTokenizer} from '../src/tools/text/tokenizer';
import {Trie} from '../src/tools/text/trie';
import XRegExp from 'xregexp';

describe('EntityTagger', function() {
  describe('#tag', function() {
    it('tag utterances without regexes', function() {
      let trie = new Trie()
      let tagger = new EntityTagger(trie, new EnglishTokenizer())

      trie.insert("play", "PlayVerb")
      trie.insert("the big bang theory", "Television Show")
      trie.insert("the big", "Not a Thing")

      let tags = tagger.tag("play season 1 of the big bang theory")
      assert.equal(tags.length, 3);
    });
  });

  describe('#regex_tag', function() {
    it('', function() {
      let regex = XRegExp('the (?<Event>.+?) theory', 'g'); //re.compile(r"the (?P<Event>\w+\s\w+) theory")
      let trie = new Trie()
      trie.insert("play", "PlayVerb")
      trie.insert("the big bang theory", "Television Show")
      trie.insert("the big", "Not a Thing")

      let tagger = new EntityTagger(trie, new EnglishTokenizer(), [regex])
      let tags = tagger.tag("the big bang theory")
      assert.equal(tags.length > 0, true);
    });


    it('#multiregex_tag', function() {
      let regex = XRegExp('season (?<SeasonName>[0-9]+)', 'i'); //re.compile(r"the (?P<Event>\w+\s\w+) theory")
      let trie = new Trie()
      trie.insert("play", "PlayVerb")

      let tagger = new EntityTagger(trie, new EnglishTokenizer(), [regex])
      let tags = tagger.tag("play season 3 of the it crowd")
      // reference output from python
      assert.equal(tags.length > 2, true);


    });


  });
});