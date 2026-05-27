import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="VedaAI Logo"
        width={40}
        height={40}
        className="rounded-xl object-contain"
        priority
      />

      <span className="text-xl font-bold tracking-tight text-veda-dark">
        VedaAI
      </span>
    </div>
  );
}
