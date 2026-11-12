# Draws the app icons: a solid blue circle, a shaded red triangle and a hollow
# green square on a dark slate background, on a 512-unit canvas scaled to each size.
# Run from anywhere on Windows:  pwsh triplet/tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\icons'
function Color($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
$bg = '#16202e'

function Art($g) {
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (Color $bg)), 0, 0, 512, 512)
  # A white card
  $card = New-Object System.Drawing.Drawing2D.GraphicsPath
  $r = 40; $x = 56; $y = 136; $w = 400; $h = 240
  $card.AddArc($x, $y, $r*2, $r*2, 180, 90); $card.AddArc($x+$w-$r*2, $y, $r*2, $r*2, 270, 90)
  $card.AddArc($x+$w-$r*2, $y+$h-$r*2, $r*2, $r*2, 0, 90); $card.AddArc($x, $y+$h-$r*2, $r*2, $r*2, 90, 90)
  $card.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#f4f6fa')), $card)

  $blue = Color '#0072b2'; $red = Color '#d55e00'; $green = Color '#009e73'
  # Solid circle
  $g.FillEllipse((New-Object System.Drawing.SolidBrush $blue), 86, 211, 90, 90)
  # Shaded triangle
  $tri = [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 256, 206), (New-Object System.Drawing.PointF 306, 300), (New-Object System.Drawing.PointF 206, 300))
  $g.FillPolygon((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(80, $red))), $tri)
  $g.DrawPolygon((New-Object System.Drawing.Pen $red, 10), $tri)
  # Hollow square
  $g.DrawRectangle((New-Object System.Drawing.Pen $green, 10), 340, 213, 86, 86)
}

function Icon($px, $name, $scale) {
  $bmp = New-Object System.Drawing.Bitmap $px, $px
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  $g.Clear((Color $bg))
  $k = $px * $scale / 512
  $g.TranslateTransform($px * (1 - $scale) / 2, $px * (1 - $scale) / 2)
  $g.ScaleTransform($k, $k)
  Art $g
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Icon 512 'icon-512.png' 1
Icon 192 'icon-192.png' 1
Icon 180 'apple-touch-icon.png' 1
Icon 512 'icon-maskable-512.png' 0.8
