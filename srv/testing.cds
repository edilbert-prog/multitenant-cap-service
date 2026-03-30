

service TestingTechniques @(path:'/testing') {

   action GetTestingTechniquesMaster(
    SearchString : String
  ) returns {
    ResponseData : array of {
      value             : String;
      label             : String;
      TestingTechniqueId: String;
      TestingTechnique  : String;
      Description       : LargeString;
      SortKey           : Integer;
      Status            : Integer;
      CreatedDate       : Timestamp;
      ModifiedDate      : Timestamp;
    };
};
}
