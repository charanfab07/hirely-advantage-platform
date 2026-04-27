import { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const Reveal = ({ children, delay = 0, className, as: Tag = "div" }: RevealProps) => {
  const { ref, inView } = useInView();
  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("reveal", inView && "in-view", className)}
    >
      {children}
    </Component>
  );
};
