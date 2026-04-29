import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface AppTransitionLinkProps {
  to: string;
  className?: string;
  children: ReactNode;
}

/**
 * Anchor that plays a brief white-veil + scale-down exit transition
 * on the current page, then navigates. Pairs with the dashboard's
 * `animate-dashboard-enter` for a continuous feel.
 */
export const AppTransitionLink = ({ to, className, children }: AppTransitionLinkProps) => {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!leaving) return;
    document.documentElement.classList.add("is-leaving");
    const t = window.setTimeout(() => navigate(to), 480);
    return () => {
      window.clearTimeout(t);
      document.documentElement.classList.remove("is-leaving");
    };
  }, [leaving, navigate, to]);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setLeaving(true);
  };

  return (
    <>
      <a href={to} onClick={onClick} className={className}>
        {children}
      </a>
      {leaving &&
        createPortal(
          <div
            aria-hidden
            className={cn(
              "fixed inset-0 z-[100] pointer-events-none",
              "bg-[hsl(var(--pearl))]",
              "animate-[veil-in_0.5s_cubic-bezier(0.22,1,0.36,1)_forwards]",
            )}
          />,
          document.body,
        )}
    </>
  );
};
