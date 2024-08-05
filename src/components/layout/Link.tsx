"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import NextLink, { LinkProps } from "next/link";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";

interface LinkPropsExtended extends LinkProps {
  href: string;
  children: ReactNode;
}

const Link = ({ href, children, ...props }: LinkPropsExtended) => {
  const pathname = usePathname();
  const isActive = href === pathname;

  return (
    <NavigationMenuLink asChild active={isActive}>
      <NextLink
        href={href}
        className={`${isActive ? "underline" : ""}`}
        {...props}
      >
        {children}
      </NextLink>
    </NavigationMenuLink>
  );
};

export default Link;
