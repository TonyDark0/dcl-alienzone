param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$destination = Join-Path $ProjectRoot 'assets/Images/ui/scifi/v001'
New-Item -ItemType Directory -Path $destination -Force | Out-Null

# Original, deterministic vector construction. No pixels are cut out of the AI review board.
# All notches fit in the 32 px protected caps used by the runtime nine-slice mapping.
$outline = [System.Drawing.PointF[]]@(
  [System.Drawing.PointF]::new(2, 22), [System.Drawing.PointF]::new(22, 2),
  [System.Drawing.PointF]::new(30, 2), [System.Drawing.PointF]::new(30, 8),
  [System.Drawing.PointF]::new(482, 8), [System.Drawing.PointF]::new(488, 2),
  [System.Drawing.PointF]::new(500, 2), [System.Drawing.PointF]::new(510, 12),
  [System.Drawing.PointF]::new(510, 234), [System.Drawing.PointF]::new(490, 254),
  [System.Drawing.PointF]::new(482, 254), [System.Drawing.PointF]::new(482, 248),
  [System.Drawing.PointF]::new(30, 248), [System.Drawing.PointF]::new(24, 254),
  [System.Drawing.PointF]::new(12, 254), [System.Drawing.PointF]::new(2, 244)
)

foreach ($kind in @('fill', 'primary', 'frame')) {
  $bitmap = [System.Drawing.Bitmap]::new(512, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddPolygon($outline)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    if ($kind -eq 'frame') {
      $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, 2)
      $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Miter
      $graphics.DrawPath($pen, $path)
      $pen.Dispose()
      # Localized heavy spine and caps, with an open centre and genuine alpha notches.
      $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
      $graphics.FillPolygon($brush, [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(2, 22), [System.Drawing.PointF]::new(8, 28),
        [System.Drawing.PointF]::new(8, 238), [System.Drawing.PointF]::new(20, 248),
        [System.Drawing.PointF]::new(12, 254), [System.Drawing.PointF]::new(2, 244)))
      $graphics.FillPolygon($brush, [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(482, 8), [System.Drawing.PointF]::new(488, 2),
        [System.Drawing.PointF]::new(500, 2), [System.Drawing.PointF]::new(510, 12),
        [System.Drawing.PointF]::new(504, 18), [System.Drawing.PointF]::new(496, 10)))
      $brush.Dispose()
    } else {
      $top = if ($kind -eq 'primary') { [System.Drawing.ColorTranslator]::FromHtml('#FF6269') } else { [System.Drawing.ColorTranslator]::FromHtml('#183B49') }
      $bottom = if ($kind -eq 'primary') { [System.Drawing.ColorTranslator]::FromHtml('#D92B51') } else { [System.Drawing.ColorTranslator]::FromHtml('#0B1824') }
      $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Rectangle]::new(0, 0, 512, 256), $top, $bottom, 90.0)
      $graphics.FillPath($gradient, $path)
      $gradient.Dispose()
    }
    $bitmap.Save((Join-Path $destination "az_ui_sf_${kind}_v001.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $path.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}
Write-Output 'Generated three original 512x256 RGBA UI skins; protected caps: 32px.'
