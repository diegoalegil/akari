"use client";
import { SearchClient } from "@/components/search/SearchClient";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

export default function SearchPage() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  return <SearchClient />;
}
