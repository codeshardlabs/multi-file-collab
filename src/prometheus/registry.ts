import promClient from "prom-client";

const registry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: registry });
registry.setDefaultLabels({
  app: "codeshard",
});

export default registry;
