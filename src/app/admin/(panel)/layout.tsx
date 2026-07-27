import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel Twenty Club" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
