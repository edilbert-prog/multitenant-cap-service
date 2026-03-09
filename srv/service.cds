using { Orders as DBOrders, Tenants as DBTenants } from '../db/schema';

service OrdersService {

  entity Orders  as projection on DBOrders;
  entity Tenants as projection on DBTenants;

  function Welcome() returns String;

}