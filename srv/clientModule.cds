using { ClientsMaster } from '../db/schema';

service ClientsService @(path:'/clients') {

  entity Clients as projection on ClientsMaster;

  // ---------- TYPES ----------

  type SimpleClient {
    value : String;
    label : String;
  }

  type ClientItem {
    ClientId      : String;
    ClientName    : String;
    IndustryType  : String;
    CompanyIdERP  : String;
    CountryId     : String;
    StateId       : String;
    CityId        : String;
    CountryCode   : String;
    Contact       : String;
    Email         : String;
    Address1      : String;
    Address2      : String;
    Zip           : String;
    Description   : String;
    SortKey       : Integer;
    Status        : Integer;
    CreatedDate   : Timestamp;
    ModifiedDate  : Timestamp;
    CountryName   : String;
    StateName     : String;
    CityName      : String;
  }

  type ClientsPaginationResponse {
    TotalRecords   : Integer;
    RecordsPerPage : Integer;
    TotalPages     : Integer;
    CurrentPage    : Integer;
    ResponseData   : array of ClientItem;
  }

  type ClientResponse {
    status   : String;
    message  : String;
    ClientId : String;
  }

  // ---------- ACTIONS ----------

  action GetClientsMaster(
    SearchString : String
  ) returns array of SimpleClient;

  action GetClientsMasterPaginationFilterSearch(
    PageNo       : Integer,
    PageSize     : Integer,
    SearchString : String,
    StartDate    : String,
    EndDate      : String
  ) returns ClientsPaginationResponse;

  action CheckClientsMaster(
    ClientName : String
  ) returns Boolean;

  action AddUpdateClientsMaster(
    ClientId      : String,
    ClientName    : String,
    IndustryType  : String,
    CompanyIdERP  : String,
    CountryId     : String,
    StateId       : String,
    CityId        : String,
    CountryCode   : String,
    Contact       : String,
    Email         : String,
    Address1      : String,
    Address2      : String,
    Zip           : String,
    Description   : String,
    SortKey       : Integer
  ) returns ClientResponse;

  action UpdateClientsMasterStatus(
    ClientName : String
  ) returns String;

  action DeleteClientsMaster(
    ClientId : String
  ) returns String;
}