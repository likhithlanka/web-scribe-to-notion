import { useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph';

interface Node {
  id: string;
  name: string;
  val: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface KnowledgeGraphProps {
  data: {
    nodes: Node[];
    links: Link[];
  };
}

export function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const graphRef = useRef(null);

  useEffect(() => {
    if (graphRef.current) {
      // Add any graph initialization logic here
    }
  }, []);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={data}
      nodeLabel="name"
      nodeColor={() => "#8884d8"}
      linkColor={() => "#999"}
      width={800}
      height={400}
      backgroundColor="#ffffff"
    />
  );
}