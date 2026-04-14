import { permanentRedirect } from "next/navigation";

type Params = Promise<{ locale: string; state: string; district: string }>;

export default async function CitizenRedirect({ params }: { params: Params }) {
  const { locale, state, district } = await params;
  permanentRedirect(`/${locale}/${state}/${district}/citizen-corner`);
}
