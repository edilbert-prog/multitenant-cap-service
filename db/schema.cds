using { managed } from '@sap/cds/common';

entity Orders : managed {
  key ID     : UUID;
      tenant : String;
      title  : String not null;
      amount : Integer;
}

entity Tenants : managed {
  key tenantId : String;
  subdomain    : String;
  status       : String;
  plan         : String;
}