import { redirect } from "next/navigation";

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  // Build query string from search params
  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join("&");
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`;
    })
    .join("&");

  const redirectUrl = queryString
    ? `/assessment/step/1?${queryString}`
    : "/assessment/step/1";

  redirect(redirectUrl);
}
