import "babel-polyfill";

import assert from 'assert';
import {tokenize_string} from '../src/tools/text/tokenizer';

describe('IntentBuilder', function() {
  describe('#build()', function() {
    it('should tokenize strings', function() {
      let tokens = tokenize_string("Hello world, I'm a happy camper. I don't have any friends?");
      assert.deepEqual(tokens, ['Hello', 'world', ',', 'I', "'m", 'a', 'happy', 'camper', '.', 'I', 'do', "n't", 'have', 'any', 'friends', '?']); 
    });
  });
});

