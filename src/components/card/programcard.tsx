"use client"

import * as React from "react"

export interface ProgramCardProps {
  logo: string;
  universityName: string;
  programName: string;
  additionalInfo: string;
  applicationDate: string;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  logo,
  universityName,
  programName,
  additionalInfo,
  applicationDate
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
      <img src={logo} alt={universityName} className="h-12 mb-2" />
      <p className="text-sm text-gray-600">{universityName}</p>
      <h3 className="text-lg font-semibold mb-2">{programName}</h3>
      <p className="text-xs text-gray-500 mb-2">{additionalInfo}</p>
      <p className="text-xs text-gray-400 mt-auto">{applicationDate}</p>
    </div>
  );
};

export default ProgramCard;