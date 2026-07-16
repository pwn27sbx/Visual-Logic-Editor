// src/app/page.tsx
'use client';

import React, { useState, useCallback, useMemo, createContext, useContext, DragEvent } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  useReactFlow,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ============================================================================
// 1. ARQUITECTURA DE DATOS Y CONTEXTO GLOBAL (EL MOTOR DAG)
// ============================================================================

// El Contexto distribuye los valores evaluados a todos los nodos y cables en tiempo real
const GraphContext = createContext<Record<string, number>>({});

// Generador de IDs únicos para los nodos arrastrados
let idCounter = 0;
const getId = () => `dndnode_${idCounter++}`;

// ============================================================================
// 2. NODOS PERSONALIZADOS (UI INTERACTIVA)
// ============================================================================

const NumberNode = ({ id, data }: NodeProps<Node<{ value: number }>>) => {
  const { updateNodeData } = useReactFlow();

  return (
    <div className="bg-white border-2 border-[#111] rounded-xl shadow-xl w-48 overflow-hidden group hover:shadow-2xl transition-shadow">
      <header className="bg-gray-100 p-2 border-b-2 border-[#111]">
        <h3 className="font-anton text-sm text-[#111] uppercase tracking-wider text-center">Input Numérico</h3>
      </header>
      <div className="p-4 bg-white">
        <label className="text-xs font-mono text-gray-500 block mb-1">Valor:</label>
        {/* nodrag nopan permiten interactuar con el input sin mover el canvas */}
        <input
          type="number"
          value={data.value}
          onChange={(e) => updateNodeData(id, { value: parseFloat(e.target.value) || 0 })}
          className="nodrag nopan w-full border-2 border-gray-200 rounded p-1 font-mono font-bold text-[#111] outline-none focus:border-[#00A889]"
        />
      </div>
      <Handle type="source" position={Position.Right} id="out" className="w-4 h-4 bg-[#00A889] border-2 border-[#111] -right-2.5" />
    </div>
  );
};

const MathNode = ({ id, data }: NodeProps<Node<{ op: string }>>) => {
  const { updateNodeData } = useReactFlow();
  const evaluatedValues = useContext(GraphContext);
  const result = evaluatedValues[id] ?? 0;

  return (
    <div className="bg-white border-2 border-[#111] rounded-xl shadow-xl w-52 overflow-hidden group hover:shadow-2xl transition-shadow">
      <header className="bg-[#111] p-3 border-b-2 border-[#111]">
        <h3 className="font-anton text-lg text-white uppercase tracking-wider text-center">Matemático</h3>
      </header>
      <div className="p-4 bg-gray-50 flex flex-col gap-3">
        <div className="relative">
          <Handle type="target" position={Position.Left} id="a" className="w-4 h-4 bg-blue-400 border-2 border-[#111] -left-6" />
          <span className="text-xs font-mono text-gray-500 font-bold ml-2">Entrada A</span>
        </div>

        <select
          value={data.op}
          onChange={(e) => updateNodeData(id, { op: e.target.value })}
          className="nodrag nopan w-full border-2 border-[#111] bg-white rounded p-1 font-mono font-bold text-center outline-none cursor-pointer hover:bg-gray-100"
        >
          <option value="+">Sumar (+)</option>
          <option value="-">Restar (-)</option>
          <option value="*">Multiplicar (*)</option>
          <option value="/">Dividir (/)</option>
        </select>

        <div className="relative border-b pb-2 border-gray-200">
          <Handle type="target" position={Position.Left} id="b" className="w-4 h-4 bg-yellow-400 border-2 border-[#111] -left-6" />
          <span className="text-xs font-mono text-gray-500 font-bold ml-2">Entrada B</span>
        </div>

        <div className="bg-[#111] rounded-lg p-2 text-center mt-1 relative">
          <span className="font-mono text-xl text-[#00A889] font-bold tabular-nums">
            = {result}
          </span>
          <Handle type="source" position={Position.Right} id="out" className="w-4 h-4 bg-red-500 border-2 border-[#111] -right-6" />
        </div>
      </div>
    </div>
  );
};

const OutputNode = ({ id }: NodeProps<Node>) => {
  const evaluatedValues = useContext(GraphContext);
  const result = evaluatedValues[id] ?? 0;

  return (
    <div className="bg-white border-2 border-[#111] rounded-xl shadow-xl w-48 overflow-hidden group hover:shadow-2xl transition-shadow">
      <header className="bg-[#00A889] p-2 border-b-2 border-[#111]">
        <h3 className="font-anton text-sm text-white uppercase tracking-wider text-center">Resultado Final</h3>
      </header>
      <div className="p-6 bg-white text-center relative">
        <Handle type="target" position={Position.Left} id="in" className="w-4 h-4 bg-red-500 border-2 border-[#111] -left-2.5" />
        <span className="font-mono text-3xl font-black text-[#111] tabular-nums">{result}</span>
      </div>
    </div>
  );
};

// ============================================================================
// 3. CABLE PERSONALIZADO (VISUALIZA EL FLUJO DE DATOS)
// ============================================================================

const ValueEdge = ({ id, source, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd }: EdgeProps) => {
  const evaluatedValues = useContext(GraphContext);
  const value = evaluatedValues[source] ?? 0;
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  return (
    <>
      <BaseEdge path={edgePath} style={{ ...style, strokeWidth: 3, stroke: '#111' }} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          className="nodrag nopan absolute pointer-events-auto z-50"
        >
          <div className="bg-white border-2 border-[#111] text-[#00A889] font-mono font-bold text-xs px-2 py-0.5 rounded shadow-md">
            {value}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// --- REGISTRO DE COMPONENTES DE REACT FLOW ---
const nodeTypes = { numberNode: NumberNode, mathNode: MathNode, outputNode: OutputNode };
const edgeTypes = { valueEdge: ValueEdge };

// ============================================================================
// 4. COMPONENTES DE UI (SIDEBAR Y GUÍA)
// ============================================================================

const Sidebar = () => {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-white border-r-2 border-[#111] p-4 flex flex-col h-full z-10 shadow-2xl">
      <h2 className="font-anton text-xl uppercase tracking-widest text-[#111] mb-4 border-b-2 border-gray-200 pb-2">Nodos</h2>
      <p className="text-xs text-gray-500 font-mono mb-6">Arrastra un bloque hacia la cuadrícula.</p>

      <div className="flex flex-col gap-4">
        <div onDragStart={(e) => onDragStart(e, 'numberNode')} draggable className="bg-gray-100 border-2 border-[#111] p-3 rounded-lg cursor-grab hover:bg-green-50 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1">
          <span className="font-anton uppercase tracking-wider text-sm text-[#111]">1. Input Numérico</span>
        </div>
        <div onDragStart={(e) => onDragStart(e, 'mathNode')} draggable className="bg-[#111] border-2 border-[#111] p-3 rounded-lg cursor-grab hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_rgba(0,168,137,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1">
          <span className="font-anton uppercase tracking-wider text-sm text-white">2. Op. Matemático</span>
        </div>
        <div onDragStart={(e) => onDragStart(e, 'outputNode')} draggable className="bg-[#00A889] border-2 border-[#111] p-3 rounded-lg cursor-grab hover:bg-green-600 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1">
          <span className="font-anton uppercase tracking-wider text-sm text-white">3. Pantalla de Resultado</span>
        </div>
      </div>
    </aside>
  );
};

const GuideModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
      <header className="bg-[#111] p-6 flex justify-between items-center shrink-0">
        <h2 className="font-anton text-2xl uppercase tracking-widest text-white">Guía del <span className="text-[#00A889]">Arquitecto</span></h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
      </header>
      <div className="p-6 overflow-y-auto flex-1">
        <div className="mb-6 p-5 bg-green-50 rounded-xl border border-green-200">
          <h3 className="font-bold text-green-900 mb-2 uppercase tracking-wide text-sm">💡 ¿Qué demuestra este proyecto?</h3>
          <p className="text-sm text-green-800 leading-relaxed">
            Un Editor Lógico Visual interactivo basado en un <strong>Grafo Dirigido Acíclico (DAG)</strong>. Demuestra capacidad para manejar estados globales complejos, recursividad algorítmica y manipulación de interfaces visuales avanzadas en tiempo real.
          </p>
        </div>
        <h3 className="text-lg font-bold text-[#111] mb-3 font-mono uppercase border-b pb-2">Características Top 99.9%</h3>
        <ul className="space-y-4 text-sm text-gray-700">
          <li><strong className="text-[#111] bg-gray-100 px-2 py-1 rounded">Instanciación Dinámica (Drag & Drop):</strong> Usa el panel izquierdo para crear infinitos nodos. El sistema les asigna IDs dinámicos y los integra al ecosistema de cálculo al instante.</li>
          <li><strong className="text-[#111] bg-gray-100 px-2 py-1 rounded">Visualización de Flujo (Custom Edges):</strong> Los cables no solo conectan, actúan como conductos reales de datos. Mira la etiqueta flotante en cada cable para saber exactamente qué valor está viajando hacia el siguiente nodo.</li>
          <li><strong className="text-[#111] bg-gray-100 px-2 py-1 rounded">Motor Recursivo a 60fps:</strong> Al cambiar un número en un <em>Input</em>, el contexto global rastrea la topología de los cables y actualiza los nodos matemáticos y resultados en cascada sin bloqueos.</li>
          <li><strong className="text-[#111] bg-gray-100 px-2 py-1 rounded">Controles de Canvas:</strong> Usa la rueda del ratón para hacer Zoom. Haz clic y arrastra el fondo para desplazarte. Selecciona un cable o nodo y presiona <strong>Backspace</strong> para eliminarlo.</li>
        </ul>
      </div>
      <footer className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
        <button onClick={onClose} className="font-anton uppercase tracking-widest text-white bg-[#00A889] hover:bg-green-700 px-6 py-2 rounded-lg transition-colors">Comenzar a Crear</button>
      </footer>
    </div>
  </div>
);

// ============================================================================
// 5. COMPONENTE PRINCIPAL (MOTOR DE EVALUACIÓN Y CANVAS)
// ============================================================================

const initialNodes: Node[] = [
  { id: '1', type: 'numberNode', position: { x: 100, y: 150 }, data: { value: 25 } },
  { id: '2', type: 'numberNode', position: { x: 100, y: 350 }, data: { value: 5 } },
  { id: '3', type: 'mathNode', position: { x: 450, y: 200 }, data: { op: '*' } },
  { id: '4', type: 'outputNode', position: { x: 800, y: 250 }, data: {} },
];

const initialEdges: Edge[] = [
  { id: 'e1-3a', source: '1', target: '3', targetHandle: 'a', type: 'valueEdge', animated: true },
  { id: 'e2-3b', source: '2', target: '3', targetHandle: 'b', type: 'valueEdge', animated: true },
  { id: 'e3-4', source: '3', sourceHandle: 'out', target: '4', targetHandle: 'in', type: 'valueEdge', animated: true },
];

function LogicEditorContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  // --- MOTOR DE EVALUACIÓN DEL GRAFO (TOPOLOGÍA) ---
  const evaluatedGraph = useMemo(() => {
    const values: Record<string, number> = {};
    const visited = new Set<string>();

    const evaluate = (nodeId: string): number => {
      // Prevención de Ciclos Infinitos
      if (visited.has(nodeId)) return 0;
      if (values[nodeId] !== undefined) return values[nodeId];

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return 0;

      visited.add(nodeId);

      if (node.type === 'numberNode') {
        values[nodeId] = (node.data as any).value || 0;
      }
      else if (node.type === 'mathNode') {
        const edgeA = edges.find(e => e.target === nodeId && e.targetHandle === 'a');
        const edgeB = edges.find(e => e.target === nodeId && e.targetHandle === 'b');

        const valA = edgeA ? evaluate(edgeA.source) : 0;
        const valB = edgeB ? evaluate(edgeB.source) : 0;
        const op = (node.data as any).op || '+';

        let res = 0;
        if (op === '+') res = valA + valB;
        if (op === '-') res = valA - valB;
        if (op === '*') res = valA * valB;
        if (op === '/') res = valB !== 0 ? valA / valB : 0;

        values[nodeId] = res;
      }
      else if (node.type === 'outputNode') {
        const edge = edges.find(e => e.target === nodeId);
        values[nodeId] = edge ? evaluate(edge.source) : 0;
      }

      visited.delete(nodeId);
      return values[nodeId];
    };

    nodes.forEach(n => evaluate(n.id));
    return values;
  }, [nodes, edges]);

  // --- HANDLERS DE INTERACCIÓN ---
  const onConnect = useCallback((params: Connection) => {
    // Al conectar, forzamos que use nuestro cable personalizado con animación
    setEdges((eds) => addEdge({ ...params, type: 'valueEdge', animated: true }, eds));
  }, [setEdges]);

  const onDrop = useCallback((event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: type === 'numberNode' ? { value: 0 } : type === 'mathNode' ? { op: '+' } : {},
      };

      setNodes((nds) => nds.concat(newNode));
    }, [screenToFlowPosition, setNodes]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      <header className="p-4 bg-white border-b-2 border-[#111] z-20 flex justify-between items-center shadow-md shrink-0">
        <div>
            <h1 className="font-anton text-3xl uppercase tracking-tighter text-[#111]">Visual <span className="text-[#00A889]">Logic</span> Editor</h1>
            <p className="text-gray-500 font-mono text-xs mt-1">Conecta nodos y visualiza el flujo de datos.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setNodes([]); setEdges([]); }} className="font-mono font-bold text-xs bg-red-100 text-red-600 border-2 border-transparent hover:border-red-600 px-4 py-2 rounded-lg transition-all">
            LIMPIAR CANVAS
          </button>
          <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-2 font-mono font-bold text-xs bg-[#111] text-white hover:bg-[#00A889] border-2 border-[#111] px-5 py-2 rounded-lg transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            GUÍA DEL ARQUITECTO
          </button>
        </div>
      </header>

      <div className="flex-1 w-full h-full flex relative">
        <Sidebar />

        {/* Proveemos los datos calculados a todos los componentes internos */}
        <GraphContext.Provider value={evaluatedGraph}>
          <div className="flex-1 h-full" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              className="bg-gray-50"
            >
              <Controls className="!bg-white !border-2 !border-[#111] !rounded-xl !shadow-lg" />
              <MiniMap className="!bg-white !border-2 !border-[#111] !rounded-xl !shadow-lg" zoomable pannable />
              <Background variant={BackgroundVariant.Dots} color="#ccc" gap={20} size={2} />
            </ReactFlow>
          </div>
        </GraphContext.Provider>
      </div>

      {isGuideOpen && <GuideModal onClose={() => setIsGuideOpen(false)} />}
    </div>
  );
}

// ReactFlowProvider es obligatorio envolviendo todo para usar hooks como screenToFlowPosition
export default function VisualEditorPage() {
  return (
    <ReactFlowProvider>
      <LogicEditorContent />
    </ReactFlowProvider>
  );
}
