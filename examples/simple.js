var adapt = require("node-adapt");

var IntentDeterminationEngine = adapt.IntentDeterminationEngine;
var IntentBuilder = adapt.IntentBuilder;

var engine = new IntentDeterminationEngine();

var weather_keyword = [ "weather" ];
var weather_types = [ "snow", "rain", "wind", "sleet", "sun", "hot" ];
for(var wk of weather_keyword){
  engine.register_entity(wk, "WeatherKeyword");
}
for(var wt of weather_types){
  engine.register_entity(wt, "WeatherType");
}
// NOTE: this only matches locations that are one word. "New York" would not work for example
engine.register_regex_entity(" in (?<Location>\\w+)"); 

var weather_intent = new IntentBuilder("WeatherIntent")
  .one_of("WeatherKeyword", "WeatherType")
  .optionally("Location")
.build();
engine.register_intent_parser(weather_intent);

var utterance = "what is the weather like in tokyo"; // other possible utterances: "is it raining?", "does it snow in Berlin?", "How hot is it in Rome?"
var generator = engine.determine_intent(utterance);

var intent1 = generator.next(); 
var intent2 = generator.next();

console.log(intent1.value); // {"intent_type":"WeatherIntent","WeatherKeyword":"weather","Location":"tokyo","confidence":0.2878787878787879}
console.log(intent2.value);