const cds = require('@sap/cds');
const resolveTenant = require('../srv/util/tenant'); // ensure this file exists

module.exports = cds.service.impl(function () {

  this.on('GetCountriesStatesCities', async (req) => {
    try {
      const tenant = resolveTenant(req);
      if (!tenant) return req.reject(403, 'TenantId is required');

      const { CountryId = '', StateId = '' } = req.data || {};
      const out = { Countries: [], States: [], Cities: [] };

      // --------------------------------------------------------------------
      // 1) COUNTRIES - tenant filtered
      // --------------------------------------------------------------------
      const countries = await cds.run(
        SELECT.from('countries')
          .where({ tenantid: tenant })
          .columns(
            'countryid as CountryId',
            'countryname as CountryName',
            'iso2',
            'iso3',
            'phonecode',
            'capital',
            'currency',
            'currency_symbol',
            'region',
            'subregion'
          )
          .orderBy`countryname asc`
      );
      out.Countries = countries || [];

      // --------------------------------------------------------------------
      // 2) STATES - only when CountryId supplied, also tenant filtered
      // --------------------------------------------------------------------
      if (CountryId && CountryId !== '0') {
        const states = await cds.run(
          SELECT.from('states')
            .where({ tenantid: tenant, countryid: CountryId })
            .columns(
              'stateid as StateId',
              'statename as StateName',
              'countryid as CountryId',
              'iso2',
              'fips_code',
              'latitude',
              'longitude'
            )
            .orderBy`statename asc`
        );
        out.States = states || [];
      }

      // --------------------------------------------------------------------
      // 3) CITIES - only when StateId supplied, also tenant filtered
      // --------------------------------------------------------------------
      if (StateId && StateId !== '0') {
        const cities = await cds.run(
          SELECT.from('cities')
            .where({ tenantid: tenant, stateid: StateId })
            .columns(
              'cityid as CityId',
              'cityname as CityName',
              'stateid as StateId',
              'countryid as CountryId',
              'latitude',
              'longitude'
            )
            .orderBy`cityname asc`
        );
        out.Cities = cities || [];
      }

      return out;

    } catch (err) {
      console.error('Error in GetCountriesStatesCities:', err);
      return {
        Countries: [],
        States: [],
        Cities: [],
        Error: err.message || String(err),
      };
    }
  });

});
