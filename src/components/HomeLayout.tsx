"use client";
import React, { useState } from "react";
import ProgramGrid from "@/components/card/programgrid";
import { ProgramCardProps } from "@/components/card/programcard";
import weekly from "@/components/images/Weekly.png";
import yearly from "@/components/images/Yearly.png";
import roadmap from "@/components/images/Roadmap.png";
import certificate from "@/components/images/Certificate.png";
import Image from "next/image";

// Sample data - replace with your actual data
const programsData: ProgramCardProps[] = [
  {
    logo: "@/components/images/cohee-logo.png",
    universityName: "University of Michigan",
    programName: "웹 개발 강의",
    additionalInfo: "#python, #web",
    applicationDate: "수강 기한: 2024년 11월 14일",
  },
  // Add more program data here...
];

export function HomeLayout() {
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 8;

  const indexOfLastProgram = currentPage * programsPerPage;
  const indexOfFirstProgram = indexOfLastProgram - programsPerPage;
  const currentPrograms = programsData.slice(
    indexOfFirstProgram,
    indexOfLastProgram
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">수강중인 강의목록</h1>
      <ProgramGrid programs={currentPrograms} />

      {/* New section for 2x2 image grid */}
      <div>
        <div className="flex flex-wrap justify-center">
          <div className="w-1/2 p-2">
            <Image src={weekly} alt="Weekly" width={5000} height={5000} />
          </div>
          <div className="w-1/2 p-2">
            <Image
              src={certificate}
              alt="Certificate"
              width={300}
              height={300}
            />
          </div>
          <div className="w-1/2 p-2">
            <Image src={yearly} alt="Yearly" width={5000} height={5000} />
          </div>
          <div className="w-1/2 p-2">
            <Image src={roadmap} alt="Roadmap" width={300} height={300} />
          </div>
        </div>
      </div>
    </div>
  );
}
