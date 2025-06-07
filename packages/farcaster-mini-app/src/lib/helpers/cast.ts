import { formatInterval } from '@/lib/date';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://potluck.locker.money';

export function generateDegenCast(amount: number, periodSeconds: bigint, potId: bigint): string {
  const interval = formatInterval(periodSeconds);
  return `Everyone's aping into memecoins. I'm aping into saving.

- 💸 Drop ${amount} USDC every ${interval}
- 🤑 One saver wins the pot
- 🛟 Rest get 100% of their $$ back

It’s like a raffle — but you can’t lose.
Onchain. No rug. Just vibes.

👉 ${baseUrl}/pot/${potId}?join

#DeFi #DegenSaving #PotLuck #CryptoRaffle`;
}

export function generateMemeCast(amount: number, periodSeconds: bigint, potId: bigint): string {
  const interval = formatInterval(periodSeconds);
  return `me: I should save money
also me: what if I could win a jackpot instead?

Now you can do both:

💰 Save ${amount} USDC every ${interval}  
🎁 One winner takes the pot  
🔒 Everyone else? Gets their savings back

It’s like group therapy… but for your wallet.

👉 ${baseUrl}/pot/${potId}?join

#MemeFi #OnchainFun #PotLuck #SaveToWin`;
}

export function generateBalancedCast(amount: number, periodSeconds: bigint, potId: bigint): string {
  const interval = formatInterval(periodSeconds);
  return `💸 What if saving money felt like winning?

Drop in ${amount} USDC every ${interval} — just like saving...  
Except one of us wins the whole pot 🎉  
And no one loses — you can always withdraw your savings ✅

A little thrill. A lot of discipline.  
It’s saving, with upside.

👉 ${baseUrl}/pot/${potId}?join

#SaveTogether #OnchainSaving #PotLuck`;
}

export function generateRandomCast(amount: number, periodSeconds: bigint, potId: bigint): string {
    const random = Math.random();
    if (random < 0.33) {
        return generateDegenCast(amount, periodSeconds, potId);
    }
    if (random < 0.66) {
      return generateMemeCast(amount, periodSeconds, potId);
    }
    return generateBalancedCast(amount, periodSeconds, potId);    
}