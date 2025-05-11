module.exports = function override(config, env) {
  config.module.rules = config.module.rules.map(rule => {
    if (Array.isArray(rule.oneOf)) {
      rule.oneOf = rule.oneOf.filter(
        r => !(r.loader && r.loader.includes("source-map-loader"))
      );
    }
    return rule;
  });
  return config;
};
