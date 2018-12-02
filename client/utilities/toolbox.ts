export function createDictFromContainers(containers: Model.NodeContainer[]):
    Map<string, Model.NodeContainer> {
  const dict = new Map<string, Model.NodeContainer>();
  containers.forEach(container => dict.set(container.node.id, container));
  return dict;
}

export function createDictFromGraph(graph: Model.Graph):
    Map<string, Model.NodeContainer> {
  const dict = new Map<string, Model.NodeContainer>();
  graph.nodes.forEach(container => dict.set(container.node.id, container));
  return dict;
}