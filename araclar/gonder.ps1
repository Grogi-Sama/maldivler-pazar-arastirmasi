# Karea Enerji – Taslaklar klasöründeki bu paketin maillerini Karea hesabından gönderir.
# Gönderen hesap, Outlook'un kendi seçimine bırakılmadan gönderim anında Karea olarak ayarlanır.
param([string]$Hesap = "onur.topuz@karea.com.tr", [int]$MinBekle = 20, [int]$MaxBekle = 60)
$ErrorActionPreference = "Stop"
$klasor = Split-Path -Parent $MyInvocation.MyCommand.Path
try {
  $mails = Get-Content -Raw -Encoding UTF8 (Join-Path $klasor "mailler.json") | ConvertFrom-Json
  $ol = New-Object -ComObject Outlook.Application
  $ns = $ol.GetNamespace("MAPI")
  $acc = $null
  foreach ($a in $ns.Accounts) { if ($a.SmtpAddress -ieq $Hesap) { $acc = $a } }
  if (-not $acc) { Write-Host "Outlook'ta $Hesap hesabı bulunamadı." -ForegroundColor Red; Read-Host "Kapatmak için Enter"; exit 1 }
  $klasorler = @()
  try { $klasorler += $acc.DeliveryStore.GetDefaultFolder(16) } catch { }
  try { $klasorler += $ns.GetDefaultFolder(16) } catch { }
  $bulunan = @(); $eksik = @()
  foreach ($m in $mails) {
    $hit = $null
    foreach ($f in $klasorler) {
      foreach ($it in $f.Items) {
        if ($hit) { break }
        if ($it.Class -ne 43 -or $it.Subject -ne $m.subject) { continue }
        foreach ($r in $it.Recipients) { if ($r.Address -ieq $m.to) { $hit = $it } }
      }
      if ($hit) { break }
    }
    if ($hit) { $bulunan += ,@($m, $hit) } else { $eksik += $m }
  }
  Write-Host "Taslaklarda bulunan ve gönderilecek mailler:" -ForegroundColor Cyan
  $i = 0; foreach ($b in $bulunan) { $i++; Write-Host ("{0,2}. {1}  ->  {2}" -f $i, $b[0].company, $b[0].to) }
  if ($eksik.Count) {
    Write-Host ""; Write-Host "Taslaklarda bulunamayan (zaten gönderilmiş ya da silinmiş olabilir):" -ForegroundColor Yellow
    foreach ($m in $eksik) { Write-Host "  - $($m.company)  ($($m.to))" }
  }
  if (-not $bulunan.Count) { Read-Host "Gönderilecek mail yok. Kapatmak için Enter"; exit 0 }
  Write-Host ""
  Write-Host "Bu $($bulunan.Count) mail $Hesap hesabından, aralarında $MinBekle-$MaxBekle saniye beklenerek gönderilecek."
  $ok = Read-Host "Göndermek için E yazıp Enter'a basın (vazgeçmek için sadece Enter)"
  if ($ok -notmatch '^[eEyY]') { Write-Host "Hiçbir mail gönderilmedi."; Read-Host "Kapatmak için Enter"; exit 0 }
  $i = 0
  foreach ($b in $bulunan) {
    $i++
    $item = $b[1]
    $item.SendUsingAccount = $acc
    $item.Send()
    Write-Host ("{0,2}/{1} gönderildi: {2}" -f $i, $bulunan.Count, $b[0].company) -ForegroundColor Green
    if ($i -lt $bulunan.Count) { Start-Sleep -Seconds (Get-Random -Minimum $MinBekle -Maximum ($MaxBekle + 1)) }
  }
  Write-Host ""
  Write-Host "Bitti. Karea hesabının 'Gönderilmiş Öğeler' klasöründen kontrol edin; ERC'ye hata maili gelmemeli." -ForegroundColor Green
} catch {
  Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}
Read-Host "Kapatmak için Enter"
