module.exports = function resolveTenant(req) {
  return (
    req.tenant ||             // ✅ CAP standard (BEST)
    req.user?.tenant ||       // fallback
    req.headers['x-saas-tenant'] ||
    null
  );
};