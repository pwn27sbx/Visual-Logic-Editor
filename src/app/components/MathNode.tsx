// src/app/components/MathNode.tsx
'use client';

import React, { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

type MathNodeData = {
  numA: number;
  numB: number;
  op: '+' | '-' | '*' | '/';
};

type CustomMathNode = Node<MathNodeData, 'mathNode'>;

const MathNode = ({ data }: NodeProps<CustomMathNode>) => {
  const { numA, numB, op } = data;

  const result = useMemo(() => {
    switch (op) {
      case '+': return numA + numB;
      case '-': return numA - numB;
      case '*': return numA * numB;
      case '/': return numB !== 0 ? numA / numB : '∞';
      default: return 0;
    }
  }, [numA, numB, op]);

  return (
    <div className="bg-white border-2 border-[#111] rounded-xl shadow-xl w-52 overflow-hidden transform transition-all group hover:scale-[1.03]">
      <header className="bg-[#111] p-3 border-b-2 border-[#111]">
        <h3 className="font-anton text-lg text-white uppercase tracking-wider text-center">Matemático</h3>
      </header>

      <div className="p-4 flex flex-col gap-3 relative bg-gray-50">
        <div className="flex justify-between items-center relative">
          <label className="text-xs font-mono text-gray-500">A:</label>
          <span className="font-bold text-gray-800 tabular-nums">{numA}</span>
          <Handle type="target" position={Position.Left} id="a" className="w-3 h-3 bg-green-500 -left-5! border-2 border-[#111]" />
        </div>

        <div className="flex justify-between items-center relative border-t pt-3">
          <label className="text-xs font-mono text-gray-500">B:</label>
          <span className="font-bold text-gray-800 tabular-nums">{numB}</span>
          <Handle type="target" position={Position.Left} id="b" className="w-3 h-3 bg-blue-500 -left-5! border-2 border-[#111]" />
        </div>

        <div className="bg-[#111] rounded-lg p-2 text-center mt-2 relative">
          <span className="font-mono text-xl text-green-400 font-bold tabular-nums">
            {numA} {op} {numB} = {result}
          </span>
          <Handle type="source" position={Position.Right} id="result" className="w-3 h-3 bg-red-500 -right-5! border-2 border-[#111]" />
        </div>
      </div>
    </div>
  );
};

export default memo(MathNode);
