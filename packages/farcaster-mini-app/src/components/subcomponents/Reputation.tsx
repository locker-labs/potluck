import React from "react";
import { GradientCard } from "../ui/GradientCard";
const Reputation: React.FC = () => {
  return (
    <GradientCard>
      <p className="text-xs text-gray-400">Reputation</p>

      <div className="text-purple-600 font-semibold text-xl mb-2">
        Coming soon
      </div>
      <p className="text-gray-600 text-sm">
        Reputation is coming soon! Your reputation will be based on your
        activity and positive participation in pots. The more you save and
        engage honestly, the more you’ll earn. Stay tuned for rewards and benefits tied
        to your reputation score.
      </p>
    </GradientCard>
  );
};

export default Reputation;
