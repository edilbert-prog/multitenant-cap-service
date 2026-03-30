using { MessageOnly, ListResponse } from './common';

service ContentMasterService @(path:'/content') {

  // 1) App version info
  action GetAppVersionInfo(
    AppId : String(50)
  ) returns ListResponse;

  // 2) Categories
  action GetContentCategoriesMaster(
    Language : String(30)
  ) returns ListResponse;

  // 3) Content sources (category scoped)
  action GetContentSourceMaster(
    ContentCategoryId : Integer,
    ContentType       : String(50),
    Language          : String(30)
  ) returns ListResponse;

  // 4) Add / Update content
  action AddContentMaster(
    ContentId    : Integer,       // if 0 or '' => insert; else update
    ContentName  : String(255),
    ContentType  : String(50),
    Thumbnail    : String(600),
    Url          : String(600),
    Language     : String(30),
    Description  : LargeString,
    SortKey      : Integer
  ) returns ListResponse;

  // 5) Increment/Set view count on ContentSourceMaster
  action UpdateContentSourceMasterViewCountByContentId(
    ContentId        : Integer,
    ContentCategoryId: Integer,
    Language         : String(30)
  ) returns ListResponse;
}
