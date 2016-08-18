import should from 'should';
// load from src instead of ../ because package json refers to transpiled copy in lib/
import {IntentDeterminationEngine, DomainIntentDeterminationEngine, IntentBuilder} from '../'; 

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



    let music_keyword = [ "play" ];
    let music_artists = [ "Daft Punk", "Metallica", "NWA", "System of a Down", "Weird Al Yankovic" ];
    for(let mk of music_keyword){
      this.engine.register_entity(mk, "MusicKeyword", undefined);
    }
    for(let ma of music_artists){
      this.engine.register_entity(ma, "MusicArtist", undefined);
    }
    this.engine.register_regex_entity(" on (?<Service>\\w+)");

    let music_intent = new IntentBuilder("MusicIntent")
      .require("MusicKeyword")
      .require("MusicArtist")
      .optionally("Service")
    .build();
    this.engine.register_intent_parser(music_intent);
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


















describe('DomainIntentDeterminationEngine', function() {
  before(function() {
    this.engine = new DomainIntentDeterminationEngine();

    this.engine.register_domain("weather");
    this.engine.register_domain("music");

    let weather_keyword = [ "weather" ];
    let weather_types = [ "snow", "rain", "wind", "sleet", "sun" ];
    for(let wk of weather_keyword){
      this.engine.register_entity(wk, "WeatherKeyword", undefined, "weather");
    }
    for(let wt of weather_types){
      this.engine.register_entity(wt, "WeatherType", undefined, "weather");
    }
    this.engine.register_regex_entity(" in (?<Location>\\w+)", "weather");

    let weather_intent = new IntentBuilder("WeatherIntent")
      .one_of("WeatherKeyword", "WeatherType")
      .optionally("Location")
    .build();
    this.engine.register_intent_parser(weather_intent, "weather");



    let music_keyword = [ "play" ];
    let music_artists = [ "Daft Punk", "Metallica", "NWA", "System of a Down", "Weird Al Yankovic" ];
    for(let mk of music_keyword){
      this.engine.register_entity(mk, "MusicKeyword", undefined,"music");
    }
    for(let ma of music_artists){
      this.engine.register_entity(ma, "MusicArtist", undefined,"music");
    }
    this.engine.register_regex_entity(" on (?<Service>\\w+)", "music");

    let music_intent = new IntentBuilder("MusicIntent")
      .require("MusicKeyword")
      .require("MusicArtist")
      .optionally("Service")
    .build();
    this.engine.register_intent_parser(music_intent, "music");
  });


  describe('#determine_intent', function() {
    it('should be able to get the intent for the weather domain', function() {
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


    it('should be able to get the intent for the music domain', function() {
      let utterance = "play some Daft Punk";

      let generator = this.engine.determine_intent(utterance);

      let firstIntent = generator.next();
      should(firstIntent.done) .be.false("Intent generator should not be done after first call.");
      should(firstIntent.value.intent_type) .equal("MusicIntent");
      should(firstIntent.value.MusicKeyword) .equal("play");
      should(firstIntent.value.MusicArtist) .equal("Daft Punk");

      let secondIntent = generator.next();
      should(secondIntent.done) .be.true("Intent generator should be done after second call.");
      should(secondIntent.value).be.undefined();
    });
  });



  describe('#domain_determine_intent', function() {


  });
});