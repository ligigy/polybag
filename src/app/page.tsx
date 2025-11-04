import Image from "next/image";
import HomeDashboard from "@/app/components/HomeDashboard";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-5xl flex-col items-stretch gap-6 py-12 px-6 bg-white dark:bg-black">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Polymarket 网格交易平台</h1>
        </div>
        <HomeDashboard />
      </main>
    </div>
  );
}
