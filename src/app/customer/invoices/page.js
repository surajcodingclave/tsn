"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, ReceiptText } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, FullLoader, EmptyState, Modal, StatusBadge, Th, Td } from "@/components/ui";
import { useSession } from "@/components/SessionProvider";

export default function Invoices() {
  const { tenant } = useSession();
  const [invoice, setInvoice] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["my-invoices"],
    queryFn: async () => (await fetch("/api/customer/shipments")).json(),
  });
  const trips = data?.shipments || [];

  return (
    <MainShell role="customer">
      <div className="mb-6"><h1 className="flex items-center gap-2 text-2xl font-bold"><ReceiptText className="h-6 w-6" /> Invoices</h1><p className="text-muted-foreground">Payment is settled offline — view and print your invoices here.</p></div>

      <Card>
        {isLoading ? <FullLoader /> : !trips.length ? (
          <CardContent><EmptyState icon={ReceiptText} title="No invoices" description="Invoices are generated from your shipments." /></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border"><tr><Th>Tracking</Th><Th>Route</Th><Th>Freight</Th><Th>Payment</Th><Th className="text-right">Invoice</Th></tr></thead>
              <tbody className="divide-y divide-border">
                {trips.map((s) => (
                  <tr key={s.trackingNumber}>
                    <Td><span className="font-mono text-xs font-medium">{s.trackingNumber}</span></Td>
                    <Td className="max-w-[220px] truncate text-xs">{s.origin.address} → {s.destination.address}</Td>
                    <Td>₹{s.freightCharge}</Td>
                    <Td><StatusBadge status={s.paymentStatus} /></Td>
                    <Td className="text-right"><Button variant="outline" size="sm" onClick={() => setInvoice(s)}>View & print</Button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!invoice} onClose={() => setInvoice(null)} title="Invoice" footer={<Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>}>
        {invoice && (
          <div id="printable" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                {tenant?.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tenant.logoUrl} alt="logo" className="mb-1 h-10 w-10 rounded object-contain bg-white" />
                )}
                <p className="text-lg font-bold">{tenant?.name || "Transport"}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p className="font-mono text-sm text-foreground font-medium">{invoice.trackingNumber}</p>
                <p>Invoice #{invoice.trackingNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Bill to</p>
                <p className="font-medium">Transporter</p>
                {tenant?.city && <p>{tenant.city}</p>}
                {tenant?.gstin && <p>GSTIN: {tenant.gstin}</p>}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">From</p>
                <p className="font-medium">{invoice.origin.address}</p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">To</p>
                <p>{invoice.destination.address}</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left"><th className="py-1">Item</th><th className="py-1">Qty</th><th className="py-1 text-right">Wt</th></tr></thead>
              <tbody>
                {(invoice.items || []).filter((i) => i.name).map((it, i) => (
                  <tr key={i} className="border-b border-border"><td className="py-1">{it.name}</td><td className="py-1">{it.qty}</td><td className="py-1 text-right">{it.weight} kg</td></tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-48 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><span>{invoice.weight} kg</span></div>
                <div className="flex justify-between font-semibold"><span>Freight</span><span>₹{invoice.freightCharge}</span></div>
                <div className="flex justify-between border-t border-border pt-1 font-bold"><span>Total</span><span>₹{invoice.freightCharge}</span></div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">This is a computer-generated invoice. Payment is handled offline.</p>
          </div>
        )}
      </Modal>
    </MainShell>
  );
}