"use client";
import { DocsSections } from "../sections/docs";

export default function Docs() {
  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold mb-2">📚 Potluck Docs</h1>
      <div className="flex flex-col gap-4">
        {Object.entries(DocsSections).map(([key, Component]) => (
          <Component key={key} />
        ))}
      </div>
    </div>
  );
}
