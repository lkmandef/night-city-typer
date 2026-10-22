/**
 * Menghitung selisih teks antara prev dan next menggunakan common prefix.
 * Mengembalikan:
 * - removed: jumlah karakter dari ujung prev yang dihapus (prev.length - prefix)
 * - added: substring karakter baru yang ditambahkan di next (next.slice(prefix))
 */
export function diffText(
  prev: string,
  next: string
): { removed: number; added: string } {
  let prefix = 0;
  const minLen = Math.min(prev.length, next.length);
  while (prefix < minLen && prev[prefix] === next[prefix]) {
    prefix++;
  }
  const removed = prev.length - prefix;
  const added = next.slice(prefix);
  return { removed, added };
}
