"use client";

import { OfferChart } from "./chart-offer";

const HomePage = () => {
  return (
    <div className="flex flex-col items-center p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="flex-1" /> {/* Spacer top */}
      <div className="w-full max-w-2xl">
        {" "}
        {/* Réduit de 3xl à 2xl */}
        <OfferChart />
      </div>
      <div className="flex-1" /> {/* Spacer bottom */}
    </div>
  );
};

export default HomePage;
