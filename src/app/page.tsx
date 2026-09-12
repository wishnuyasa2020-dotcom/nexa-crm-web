import { redirect } from 'next/navigation';

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  if (params?.sekolahId) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (typeof val === 'string') qs.set(key, val);
      else if (Array.isArray(val)) val.forEach(v => qs.append(key, v));
    });
    redirect(`/public/form-siswa?${qs.toString()}`);
  }

  redirect('/login');
}
