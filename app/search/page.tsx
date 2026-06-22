import { SearchClient } from "@/components/search/SearchClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Buscar" };

export default function SearchPage() {
  return <SearchClient />;
}
