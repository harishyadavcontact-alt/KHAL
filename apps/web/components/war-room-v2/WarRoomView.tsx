import React from "react";
import { Domain } from "./types";
import { DomainCard } from "./DomainCard";

export function WarRoomView({
  domains,
  onDomainClick
}: {
  domains: Domain[];
  onDomainClick: (domain: Domain) => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-3 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Macro Domains</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map((domain) => (
          <DomainCard key={domain.id} domain={domain} onClick={() => onDomainClick(domain)} />
        ))}
      </div>
    </div>
  );
}

