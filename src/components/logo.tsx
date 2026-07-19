import { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 960 960"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M274,161 L479,398 L685,161 L774,238 L539,511 L539,779 L420,779 L420,511 L185,239 Z" />
    </svg>
  );
}
