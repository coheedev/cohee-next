// @/components/MainLayout.tsx

import React from "react";
import Image from "next/image";
import logo from "@/components/images/cohee-logo.png";
import back_logo from "@/components/images/logo-background.png";
import korean_text from "@/components/images/korean-text.png";

const MainLayout: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#F3F7FA] rounded-[24px] overflow-hidden">
      {/* Background logo */}

      <Image
        src={back_logo}
        alt="Logo Background"
        layout="fill"
        className="absolute left-0 bottom-0"
        objectFit="contain"
      />

      {/* Center content */}
      <div className="absolute top-1/4 right-1/4 transform -translate-y-1/4 flex flex-col items-center space-y-8">
        {/* Cohee logo */}
        <div>
          <Image src={logo} alt="Cohee Logo" width={301} height={73} />
        </div>

        {/* Korean text */}
        <div className="mt-4">
          <Image src={korean_text} alt="Korean Text" width={351} height={30} />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
