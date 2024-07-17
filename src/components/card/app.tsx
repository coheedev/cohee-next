"use client"


import React, { useState } from 'react';
import ProgramGrid from './programgrid';
import Pagination from './pagination';

const programsData = [
  {
    logo: 'path/to/michigan-logo.png',
    universityName: 'University of Michigan',
    programName: 'Master of Applied Data Science',
    additionalInfo: '#미국 내 1위 공립 연구 대학(QS 세계 랭킹, 2022년)',
    applicationDate: '신청 기한: 2024년 11월 14일'
  },
  // ... 더 많은 프로그램 데이터 추가
];

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 8;

  const indexOfLastProgram = currentPage * programsPerPage;
  const indexOfFirstProgram = indexOfLastProgram - programsPerPage;
  const currentPrograms = programsData.slice(indexOfFirstProgram, indexOfLastProgram);

  return (
    <div className="container mx-auto p-4">
      <ProgramGrid programs={currentPrograms} />
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(programsData.length / programsPerPage)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default App;