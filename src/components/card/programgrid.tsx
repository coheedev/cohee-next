"use client"

import * as React from "react"
import ProgramCard, { ProgramCardProps } from './programcard';

interface ProgramGridProps {
  programs: ProgramCardProps[];
}

const ProgramGrid: React.FC<ProgramGridProps> = ({ programs }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {programs.map((program, index) => (
        <ProgramCard key={index} {...program} />
      ))}
    </div>
  );
};

export default ProgramGrid;
