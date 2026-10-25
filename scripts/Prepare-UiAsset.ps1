param(
  [Parameter(Mandatory)][string]$SourcePath,
  [Parameter(Mandatory)][string]$DestinationPath,
  [Parameter(Mandatory)][int]$Width,
  [Parameter(Mandatory)][int]$Height
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$sourceImage = [System.Drawing.Image]::FromFile($SourcePath)
$bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($sourceImage, [System.Drawing.Rectangle]::new(0, 0, $Width, $Height))
  $directory = Split-Path -Parent $DestinationPath
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  $bitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "$DestinationPath - ${Width}x${Height}; corner alpha=$($bitmap.GetPixel(0, 0).A)"
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
  $sourceImage.Dispose()
}
