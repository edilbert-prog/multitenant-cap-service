using { Countries, States, Cities } from '../db/schema';

service GlobalConstantService @(path:'/global-constants') {

  action GetCountriesStatesCities(
    CountryId : String,
    StateId   : String
  ) returns {
    Countries : LargeString;
    States    : LargeString;
    Cities    : LargeString;
  };
}
