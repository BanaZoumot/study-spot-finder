import React from "react";

export default function Banner() {
  return (
    <div className="
      w-full
      flex
      items-center
      justify-center
      gap-3
      text-white
      text-2xl
      font-bold
      uppercase
      tracking-wide
      text-center
    ">
      <span>LET'S FIND</span>
      <img 
        src="/umiamilogo.png" 
        alt="U" 
        className="h-12 w-auto" 
      />
      <span>YOUR SPOT</span>
    </div>
  );
}
