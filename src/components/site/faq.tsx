"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/controls";
import { FAQ_ITEMS } from "@/lib/content/faq";

export function Faq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem key={item.q} value={`item-${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
