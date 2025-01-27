import promClient from "prom-client";

const registry = new promClient.Registry();
registry.setDefaultLabels({
    app: 'codeshard',
  });
  
  export default registry;