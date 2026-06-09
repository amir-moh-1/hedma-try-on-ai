import { useState } from "react";
import { SmartInventoryTab } from "./SmartInventoryTab";
import { MerchantsTab } from "@/components/MerchantsTab";
import { VendorInsightsTab } from "./VendorInsightsTab";
import { InventoryReportsTab } from "./InventoryReportsTab";
import { Package, Store, TrendingUp, FileText } from "lucide-react";

const TABS = [
  { id: "smart-inv", label: "الجرد الذكي", icon: Package },
  { id: "merchants", label: "المحلات والتجار", icon: Store },
  { id: "insights", label: "تحليل الأداء", icon: TrendingUp },
  { id: "reports", label: "تقارير PDF", icon: FileText },
];

export function MergedInventoryMerchantsTab({ profiles }: { profiles: any[] }) {
  const [active, setActive] = useState("smart-inv");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Inner tab bar */}
      <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar border-b">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition ${
                active === tab.id
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {active === "smart-inv" && <SmartInventoryTab />}
      {active === "merchants" && <MerchantsTab profiles={profiles} />}
      {active === "insights" && <VendorInsightsTab />}
      {active === "reports" && <InventoryReportsTab />}
    </div>
  );
}
