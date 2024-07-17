"use client";
import React, { useState } from "react";
import ProgramGrid from "@/components/card/programgrid";
import Pagination from "@/components/card/pagination";
import { ProgramCardProps } from "@/components/card/programcard";

// Sample data - replace with your actual data
const programsData: ProgramCardProps[] = [
  {
    logo: "/path/to/michigan-logo.png",
    universityName: "University of Michigan",
    programName: "Master of Applied Data Science",
    additionalInfo: "#미국 내 1위 공립 연구 대학(QS 세계 랭킹, 2022년)",
    applicationDate: "신청 기한: 2024년 11월 14일"
  },
  // Add more program data here...
];

export function HomeLayout() {
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 8;

  const indexOfLastProgram = currentPage * programsPerPage;
  const indexOfFirstProgram = indexOfLastProgram - programsPerPage;
  const currentPrograms = programsData.slice(indexOfFirstProgram, indexOfLastProgram);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">University Programs</h1>
      <ProgramGrid programs={currentPrograms} />
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(programsData.length / programsPerPage)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}