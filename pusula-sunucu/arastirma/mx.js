// Ücretsiz adres kontrolü: alan adının mail sunucusu (MX) kaydı var mı?
// Adresin kendisini kanıtlamaz, ama mail kabul etmeyen ya da yanlış yazılmış alan adlarını eler.

import {promises as dns} from "node:dns";

export async function mxVarMi(eposta, {resolveMx = dns.resolveMx} = {}) {
  const alan = String(eposta).split("@")[1];
  if (!alan) return false;
  try { return (await resolveMx(alan)).length > 0; } catch { return false; }
}
