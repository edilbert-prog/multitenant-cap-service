type BusinessUnitItem {
  value            : String(25);
  label            : String(255);
  BusinessUnitId   : String(25);
  BusinessUnitName : String(255);
  ClientId         : String(50);
  CompanyCodeERP   : String(255);
  CountryId        : String(11);
  StateId          : String(11);
  CityId           : String(11);
  CountryCode      : String(10);
  Contact          : String(50);
  Email            : String(255);
  Address1         : LargeString;
  Address2         : LargeString;
  Zip              : LargeString;
  Description      : LargeString;
  SortKey          : Integer;
  Status           : Integer;
  CreatedDate      : Timestamp;
  ModifiedDate     : Timestamp;
}

type BusinessUnitListEnvelope {
  ResponseData : array of BusinessUnitItem;
}

service BusinessUnitService @(path:'/api') {
  action GetBusinessUnitMasterByClientId(
    ClientId : String(25),
    SearchString : String(255)
  ) returns BusinessUnitListEnvelope;
}