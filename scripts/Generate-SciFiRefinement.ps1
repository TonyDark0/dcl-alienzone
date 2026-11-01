param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$destination = Join-Path $ProjectRoot 'assets/Images/ui/scifi/v002'
New-Item -ItemType Directory -Path $destination -Force | Out-Null

function Points($coordinates) {
  $result = foreach ($pair in $coordinates) { [System.Drawing.PointF]::new($pair[0], $pair[1]) }
  return ,([System.Drawing.PointF[]]$result)
}
$panelOutline = Points @(@(4,24),@(20,8),@(30,8),@(30,11),@(482,11),@(488,8),@(496,8),@(508,20),@(508,232),@(492,248),@(482,248),@(482,245),@(30,245),@(24,248),@(16,248),@(4,236))
$cardOutline = Points @(@(4,20),@(20,4),@(236,4),@(252,20),@(252,492),@(236,508),@(20,508),@(4,492))

foreach ($kind in @('fill','primary','frame','card_fill','card_frame','pedestal')) {
  $isCard = $kind.StartsWith('card_')
  $w = if ($isCard) { 256 } elseif ($kind -eq 'pedestal') { 128 } else { 512 }
  $h = if ($isCard) { 512 } elseif ($kind -eq 'pedestal') { 64 } else { 256 }
  $bitmap = [System.Drawing.Bitmap]::new($w,$h,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    if ($kind -eq 'pedestal') {
      foreach ($stroke in @(10,6,2)) {
        $alpha = if ($stroke -eq 2) { 230 } else { 24 }
        $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb($alpha,255,255,255),$stroke)
        $g.DrawEllipse($pen,8,18,112,30)
        $pen.Dispose()
      }
      $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(130,255,255,255),1)
      $g.DrawEllipse($pen,24,24,80,18)
      $g.DrawLine($pen,16,32,22,32); $g.DrawLine($pen,106,32,112,32)
      $pen.Dispose()
    } else {
      $outline = if ($isCard) { $cardOutline } else { $panelOutline }
      $path.AddPolygon($outline)
      if ($kind.EndsWith('frame')) {
        $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(235,255,255,255),1.6)
        $g.DrawPath($pen,$path)
        $pen.Dispose()
        $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(68,255,255,255),1)
        if ($isCard) {
          $g.DrawPolygon($pen,(Points @(@(10,24),@(24,10),@(232,10),@(246,24),@(246,488),@(232,502),@(24,502),@(10,488))))
          $g.DrawLine($pen,17,90,17,422); $g.DrawLine($pen,239,90,239,422)
        } else {
          $g.DrawPolygon($pen,(Points @(@(10,27),@(24,17),@(486,17),@(502,25),@(502,229),@(488,239),@(24,239),@(10,230))))
        }
        $pen.Dispose()
        $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210,255,255,255))
        if ($isCard) {
          $g.FillPolygon($brush,(Points @(@(5,20),@(20,5),@(30,5),@(5,30))))
          $g.FillPolygon($brush,(Points @(@(251,492),@(236,507),@(226,507),@(251,482))))
        } else {
          $g.FillPolygon($brush,(Points @(@(4,24),@(20,8),@(27,8),@(4,31))))
          $g.FillPolygon($brush,(Points @(@(508,232),@(492,248),@(485,248),@(508,225))))
        }
        $brush.Dispose()
      } else {
        $top = if ($kind -eq 'primary') { '#F95A72' } elseif ($isCard) { '#102536' } else { '#112B3D' }
        $bottom = if ($kind -eq 'primary') { '#CE2849' } elseif ($isCard) { '#050E18' } else { '#060F1B' }
        $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Rectangle]::new(0,0,$w,$h),[System.Drawing.ColorTranslator]::FromHtml($top),[System.Drawing.ColorTranslator]::FromHtml($bottom),90.0)
        $g.FillPath($gradient,$path); $gradient.Dispose()
        $g.SetClip($path)
        $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(8,140,218,255),1)
        for ($line = 30; $line -lt $h-20; $line += 8) { $g.DrawLine($pen,12,$line,$w-12,$line) }
        $pen.Dispose()
      }
    }
    $bitmap.Save((Join-Path $destination "az_ui_sf_${kind}_v002.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $path.Dispose(); $g.Dispose(); $bitmap.Dispose() }
}
Write-Output 'Generated original v002 thin-bezel panel/card surfaces and hologram pedestal; no reference pixels copied.'
