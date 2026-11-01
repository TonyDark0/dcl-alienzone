param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$destination = Join-Path $ProjectRoot 'assets/Images/ui/tutorial/v001'
New-Item -ItemType Directory -Path $destination -Force | Out-Null

# Original small vector pictograms, rendered to shared RGBA PNGs for React-ECS.
# Labels and key names stay live UI text, not baked into textures.
function Poly($pairs) {
  return ,([System.Drawing.PointF[]]@($pairs | ForEach-Object { [System.Drawing.PointF]::new($_[0], $_[1]) }))
}
function Brush([string]$hex) {
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($hex))
  $resources.Add($brush)
  return $brush
}
function Stroke([string]$hex, [single]$width = 5) {
  $pen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $resources.Add($pen)
  return $pen
}
function Arrow([single]$x1,[single]$y1,[single]$x2,[single]$y2,$pen) {
  $g.DrawLine($pen,$x1,$y1,$x2,$y2)
  $angle = [Math]::Atan2($y2-$y1,$x2-$x1)
  foreach ($offset in @(-0.65,0.65)) {
    $g.DrawLine($pen,$x2,$y2,[single]($x2-17*[Math]::Cos($angle+$offset)),[single]($y2-17*[Math]::Sin($angle+$offset)))
  }
}
function Astronaut([single]$x,[single]$y,[single]$scale,$suit) {
  $saved = $g.Save()
  $g.TranslateTransform($x,$y); $g.ScaleTransform($scale,$scale)
  $g.FillPolygon($suit,(Poly @(@(-24,0),@(24,0),@(29,43),@(17,61),@(-17,61),@(-29,43))))
  $g.DrawLine($outline,-18,53,-24,85); $g.DrawLine($outline,18,53,24,85)
  $g.DrawLine($outline,-23,12,-37,43); $g.DrawLine($outline,23,12,37,43)
  $g.FillEllipse($suit,-34,-57,68,66)
  $g.FillEllipse($navy,-25,-45,50,35)
  $g.DrawArc($whitePen,-25,-45,50,35,205,85)
  $g.DrawLine($whitePen,-14,20,14,20)
  $g.Restore($saved)
}
function Egg([single]$x,[single]$y,[single]$scale) {
  $saved = $g.Save(); $g.TranslateTransform($x,$y); $g.ScaleTransform($scale,$scale)
  $g.FillEllipse($lime,-27,-37,54,67)
  $g.FillEllipse($navy,-17,-15,12,17); $g.FillEllipse($navy,5,-15,12,17)
  $g.DrawArc($violetPen,-39,9,32,34,5,155); $g.DrawArc($violetPen,7,9,32,34,20,155)
  $g.Restore($saved)
}
foreach ($kind in @('move','throw','deck','coins','danger','contain')) {
  $resources = [System.Collections.Generic.List[System.IDisposable]]::new()
  $bitmap = [System.Drawing.Bitmap]::new(256,256,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $navy = Brush '#081928'; $cyan = Brush '#4DE5EE'; $lime = Brush '#ACFF55'
    $violet = Brush '#AD82FF'; $white = Brush '#EAFBFF'; $gold = Brush '#FFC65C'
    $outline = Stroke '#4DE5EE' 11; $cyanPen = Stroke '#4DE5EE' 6
    $whitePen = Stroke '#EAFBFF' 4; $limePen = Stroke '#ACFF55' 6
    $violetPen = Stroke '#AD82FF' 8; $goldPen = Stroke '#FFC65C' 6
    switch ($kind) {
      'move' {
        Astronaut 128 123 0.78 $cyan
        Arrow 128 59 128 22 $limePen; Arrow 128 210 128 237 $limePen
        Arrow 61 128 22 128 $limePen; Arrow 195 128 234 128 $limePen
      }
      'throw' {
        Astronaut 52 151 0.7 $cyan; Astronaut 204 151 0.7 $violet
        Arrow 80 64 177 64 $limePen
        Egg 128 121 0.8
        $g.DrawLine($whitePen,95,213,161,213)
      }
      'deck' {
        foreach ($card in @(@(34,55,0),@(70,40,1),@(106,25,2))) {
          $x=$card[0]; $y=$card[1]
          $shape = Poly @(@(($x+12),$y),@(($x+91),$y),@(($x+103),($y+12)),@(($x+103),($y+151)),@(($x+91),($y+163)),@($x,($y+163)),@($x,($y+12)))
          $g.FillPolygon($navy,$shape)
          $g.DrawPolygon($cyanPen,$shape)
        }
        $g.FillPolygon($lime,(Poly @(@(163,54),@(137,104),@(159,104),@(147,146),@(186,92),@(166,92))))
        Arrow 50 228 201 228 $violetPen
      }
      'coins' {
        foreach ($coin in @(@(29,117),@(91,55),@(151,117))) {
          $x=$coin[0]; $y=$coin[1]
          $g.FillEllipse($navy,$x,$y,76,94); $g.DrawEllipse($goldPen,$x,$y,76,94)
          $g.DrawEllipse($whitePen,$x+12,$y+12,52,70); $g.FillPolygon($gold,(Poly @(@(($x+38),($y+26)),@(($x+52),($y+47)),@(($x+38),($y+68)),@(($x+24),($y+47)))))
        }
      }
      'danger' {
        $g.FillEllipse($navy,40,44,176,176); $g.DrawEllipse($cyanPen,40,44,176,176)
        $g.DrawLine($whitePen,128,56,128,70); $g.DrawLine($whitePen,201,132,187,132)
        $g.DrawLine($goldPen,128,132,153,77); $g.DrawLine($goldPen,128,132,173,153)
        $g.FillRectangle($cyan,109,20,38,16)
        Egg 79 174 0.9
      }
      'contain' {
        $g.DrawEllipse($cyanPen,66,28,126,126); $g.DrawEllipse($limePen,87,49,84,84)
        $g.FillEllipse($lime,116,78,26,26)
        $g.FillPolygon($navy,(Poly @(@(125,103),@(125,192),@(145,179),@(161,220),@(182,212),@(166,171),@(190,173))))
        $g.DrawPolygon($whitePen,(Poly @(@(125,103),@(125,192),@(145,179),@(161,220),@(182,212),@(166,171),@(190,173))))
        $g.DrawLine($violetPen,38,62,51,68); $g.DrawLine($violetPen,213,62,200,68)
      }
    }
    $bitmap.Save((Join-Path $destination "az_ui_tutorial_${kind}_v001.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  } finally { foreach ($resource in $resources) { $resource.Dispose() }; $g.Dispose(); $bitmap.Dispose() }
}
Write-Output 'Generated six original 256x256 transparent tutorial pictograms.'
