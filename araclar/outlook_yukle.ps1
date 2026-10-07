# Karea Enerji – mail taslaklarını Outlook'ta Karea hesabının Taslaklar klasörüne yükler.
# Klasik Outlook (Microsoft 365 / 2016 / 2019 / 2021) gerekir. Hiçbir mail GÖNDERİLMEZ.
param([string]$Hesap = "onur.topuz@karea.com.tr")
$ErrorActionPreference = "Stop"
$klasor = Split-Path -Parent $MyInvocation.MyCommand.Path
try {
  $mails = Get-Content -Raw -Encoding UTF8 (Join-Path $klasor "mailler.json") | ConvertFrom-Json
  $imza = Join-Path $klasor "imza.jpg"
  $ol = New-Object -ComObject Outlook.Application
  $ns = $ol.GetNamespace("MAPI")
  $acc = $null
  foreach ($a in $ns.Accounts) { if ($a.SmtpAddress -ieq $Hesap) { $acc = $a } }
  if (-not $acc) {
    Write-Host "Outlook'ta $Hesap hesabı bulunamadı. Bulunan hesaplar:" -ForegroundColor Red
    foreach ($a in $ns.Accounts) { Write-Host "  - $($a.SmtpAddress)" }
    Read-Host "Kapatmak için Enter"; exit 1
  }
  $taslak = $null
  try { $taslak = $acc.DeliveryStore.GetDefaultFolder(16) } catch { }
  $n = 0
  foreach ($m in $mails) {
    $item = $ol.CreateItem(0)
    $item.SendUsingAccount = $acc
    $item.To = $m.to
    $item.Subject = $m.subject
    $att = $item.Attachments.Add($imza)
    $att.PropertyAccessor.SetProperty("http://schemas.microsoft.com/mapi/proptag/0x3712001F", "imza.jpg")
    try { $att.PropertyAccessor.SetProperty("http://schemas.microsoft.com/mapi/proptag/0x7FFE000B", $true) } catch { }
    $item.HTMLBody = $m.html
    $item.Save()
    if ($taslak -and $taslak.EntryID -ne $item.Parent.EntryID) { try { $item = $item.Move($taslak); $item.SendUsingAccount = $acc; $item.Save() } catch { $taslak = $null } }
    $n++
    Write-Host ("{0,2}. {1}  ->  {2}" -f $n, $m.company, $m.to)
  }
  Write-Host ""
  if ($taslak) { Write-Host "$n taslak '$Hesap' hesabının '$($taslak.Name)' klasörüne eklendi." -ForegroundColor Green }
  else { Write-Host "$n taslak varsayılan Taslaklar klasörüne eklendi; gönderen hesap Karea olarak ayarlandı." -ForegroundColor Green }
  Write-Host "Outlook'ta Taslaklar klasörünü açın, her maili kontrol edip Gönder'e basın."
} catch {
  Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}
Read-Host "Kapatmak için Enter"
