"use client";
import { atom } from "recoil";
import { useRecoilState } from "recoil";

// Define an atom to hold the isOpen state
export const sidebarState = atom({
  key: "sidebarState", // unique ID (with respect to other atoms/selectors)
  default: true, // default value (aka initial value)
});

export const useSidebar = () => {
  const [isOpen, setIsOpen] = useRecoilState(sidebarState);

  const toggle = () => {
    setIsOpen((prevState) => !prevState);
  };

  return {
    isOpen,
    toggle,
  };
};
