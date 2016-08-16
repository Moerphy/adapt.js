import "babel-polyfill";

import should from 'should';
import {IntentDeterminationEngine, IntentBuilder} from '../'; //

describe('IntentDeterminationEngine', function() {
  before(function() {
    this.engine = new IntentDeterminationEngine();

    let weather_keyword = [ "weather" ];
    let weather_types = [ "snow", "rain", "wind", "sleet", "sun" ];
    for(let wk of weather_keyword){
      this.engine.register_entity(wk, "WeatherKeyword");
    }
    for(let wt of weather_types){
      this.engine.register_entity(wt, "WeatherType");
    }
    this.engine.register_regex_entity(" in (?<Location>\\w+)");

    let weather_intent = new IntentBuilder("WeatherIntent")
      .one_of("WeatherKeyword", "WeatherType")
      .optionally("Location")
    .build();
    this.engine.register_intent_parser(weather_intent);
  });

  describe('#register_intent_parser', function() {
  });

  describe('#determine_intent', function() {
    it('should be able to get a regex intent', function() {
      let utterance = "what is the weather like in tokyo";

      let generator = this.engine.determine_intent(utterance);

      let firstIntent = generator.next();
      should(firstIntent.done) .be.false("Intent generator should not be done after first call.");
      should(firstIntent.value.intent_type) .equal("WeatherIntent");
      should(firstIntent.value.WeatherKeyword) .equal("weather");
      should(firstIntent.value.Location) .equal("tokyo");

      let secondIntent = generator.next();
      should(secondIntent.done) .be.true("Intent generator should be done after second call.");
      should(secondIntent.value).be.undefined();
    });


    it('should be able to get an intent from one_of', function() {
      let utterance = "does it rain?";

      let generator = this.engine.determine_intent(utterance);

      let firstIntent = generator.next();
      should(firstIntent.done) .be.false("Intent generator should not be done after first call.");
      should(firstIntent.value.intent_type) .equal("WeatherIntent");
      should(firstIntent.value.WeatherType) .equal("rain");
      should(firstIntent.value) .not.have.property("WeatherKeyword");
      should(firstIntent.value) .not.have.property("Location");

      let secondIntent = generator.next();
      should(secondIntent.done) .be.true("Intent generator should be done after second call.");
      should(secondIntent.value).be.undefined();
    });


    it('should be able to get an intent from one_of with regex', function() {
      let utterance = "does it rain in tokyo ?";

      let generator = this.engine.determine_intent(utterance);

      let firstIntent = generator.next();
      should(firstIntent.done) .be.false("Intent generator should not be done after first call.");
      should(firstIntent.value.intent_type) .equal("WeatherIntent");
      should(firstIntent.value.WeatherType) .equal("rain");
      should(firstIntent.value) .not.have.property("WeatherKeyword");
      should(firstIntent.value.Location) .equal("tokyo");

      let secondIntent = generator.next();
      should(secondIntent.done) .be.true("Intent generator should be done after second call.");
      should(secondIntent.value).be.undefined();
    });
  });
});